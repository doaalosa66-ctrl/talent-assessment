import { jest } from '@jest/globals';
import { parseResumeFile } from '../../services/resumeParserService.js';
import * as deepseekService from '../../services/deepseekService.js';
import * as ocrService from '../../services/ocrService.js';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';

// Mock dependencies
jest.mock('pdf-parse');
jest.mock('mammoth');
jest.mock('fs');
jest.mock('../../services/deepseekService.js');
jest.mock('../../services/ocrService.js');

describe('简历解析服务 - 单元测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('parseResumeFile - PDF文件解析', () => {
    test('应该成功解析普通PDF简历', async () => {
      const mockPDFText = `
        张三的简历
        联系电话: 13800138000
        邮箱: zhangsan@example.com
        教育背景: 清华大学 计算机科学 2018年毕业
        工作经历: 字节跳动 全栈工程师 2020-2024
        技术能力: React, Node.js, PostgreSQL, Docker
      `;

      const mockStructuredData = {
        basic_info: {
          name: '张三',
          contact: { phone: '13800138000', email: 'zhangsan@example.com' },
          current_position: '全栈工程师',
          graduation_date: '2018-06',
          years_of_experience: 6
        },
        technical_skills: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
        work_experience: [{
          company: '字节跳动',
          position: '全栈工程师',
          duration: '2020-2024'
        }]
      };

      fs.readFileSync.mockReturnValue(Buffer.from('PDF content'));
      pdf.mockResolvedValue({ text: mockPDFText });
      ocrService.isScannedPDF.mockReturnValue(false);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/resume.pdf', 'pdf');

      expect(result.raw_text).toBe(mockPDFText);
      expect(result.structured_data).toEqual(mockStructuredData);
      expect(result.structured_data.basic_info.name).toBe('张三');
      expect(pdf).toHaveBeenCalled();
      expect(deepseekService.parseResume).toHaveBeenCalledWith(mockPDFText);
    });

    test('应该识别并处理扫描版PDF(OCR)', async () => {
      const mockScannedText = '少量无意义文字';
      const mockOCRText = `
        李四简历
        手机: 13900139000
        工作经验: 腾讯 后端工程师 3年
      `;

      const mockStructuredData = {
        basic_info: {
          name: '李四',
          contact: { phone: '13900139000' },
          years_of_experience: 3
        }
      };

      fs.readFileSync.mockReturnValue(Buffer.from('PDF content'));
      pdf.mockResolvedValue({ text: mockScannedText });
      ocrService.isScannedPDF.mockReturnValue(true);
      ocrService.recognizePDFWithOCR.mockResolvedValue(mockOCRText);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/scanned.pdf', 'pdf');

      expect(ocrService.isScannedPDF).toHaveBeenCalledWith(mockScannedText);
      expect(ocrService.recognizePDFWithOCR).toHaveBeenCalled();
      expect(result.raw_text).toBe(mockOCRText);
      expect(result.structured_data.basic_info.name).toBe('李四');
    });

    test('边界条件:应该处理PDF解析失败并尝试OCR', async () => {
      const mockOCRText = '通过OCR恢复的文本内容';
      const mockStructuredData = {
        basic_info: { name: 'OCR恢复', years_of_experience: 2 }
      };

      fs.readFileSync.mockReturnValue(Buffer.from('corrupt PDF'));
      pdf.mockRejectedValue(new Error('PDF parse failed'));
      ocrService.recognizePDFWithOCR.mockResolvedValue(mockOCRText);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/corrupt.pdf', 'pdf');

      expect(ocrService.recognizePDFWithOCR).toHaveBeenCalled();
      expect(result.raw_text).toBe(mockOCRText);
    });

    test('边界条件:应该处理PDF和OCR都失败的情况', async () => {
      fs.readFileSync.mockReturnValue(Buffer.from('corrupt'));
      pdf.mockRejectedValue(new Error('PDF failed'));
      ocrService.recognizePDFWithOCR.mockRejectedValue(new Error('OCR failed'));

      await expect(
        parseResumeFile('/path/to/bad.pdf', 'pdf')
      ).rejects.toThrow('PDF文件解析失败');
    });
  });

  describe('parseResumeFile - Word文件解析', () => {
    test('应该成功解析Word文档(.docx)', async () => {
      const mockWordText = `
        王五个人简历
        联系方式: wangwu@example.com
        毕业院校: 北京大学 软件工程 2019年
        工作单位: 阿里巴巴 前端工程师
        技术栈: Vue.js, React, TypeScript
      `;

      const mockStructuredData = {
        basic_info: {
          name: '王五',
          contact: { email: 'wangwu@example.com' },
          graduation_date: '2019',
          years_of_experience: 5
        },
        education: [{
          school: '北京大学',
          major: '软件工程',
          graduation_time: '2019'
        }],
        technical_skills: ['Vue.js', 'React', 'TypeScript']
      };

      mammoth.extractRawText.mockResolvedValue({ value: mockWordText });
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/resume.docx', 'docx');

      expect(result.raw_text).toBe(mockWordText);
      expect(result.structured_data.basic_info.name).toBe('王五');
      expect(result.structured_data.technical_skills).toContain('React');
      expect(mammoth.extractRawText).toHaveBeenCalledWith({
        path: '/path/to/resume.docx'
      });
    });

    test('边界条件:应该处理扫描版Word文档(文本极少)', async () => {
      const mockShortText = '少量文字';

      mammoth.extractRawText.mockResolvedValue({ value: mockShortText });
      deepseekService.parseResume.mockResolvedValue({
        basic_info: { name: '未知', years_of_experience: 0 }
      });

      const result = await parseResumeFile('/path/to/scanned.docx', 'docx');

      expect(result.raw_text).toBe(mockShortText);
      // 应该有警告日志提示Word扫描件OCR未实现
    });

    test('应该处理Word文档解析失败', async () => {
      mammoth.extractRawText.mockRejectedValue(new Error('Word parse error'));

      await expect(
        parseResumeFile('/path/to/bad.docx', 'docx')
      ).rejects.toThrow('Word文件解析失败');
    });

    test('边界条件:应该处理.doc格式(旧版Word)', async () => {
      const mockText = '旧版Word文档内容';
      const mockStructuredData = {
        basic_info: { name: '测试', years_of_experience: 1 }
      };

      mammoth.extractRawText.mockResolvedValue({ value: mockText });
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/old.doc', 'doc');

      expect(result.raw_text).toBe(mockText);
    });
  });

  describe('parseResumeFile - 图片文件解析(OCR)', () => {
    test('应该成功识别JPG图片简历', async () => {
      const mockOCRText = `
        赵六
        手机号: 13700137000
        邮箱: zhaoliu@qq.com
        学历: 复旦大学 数据科学 2020届
        现任: 美团 数据工程师
        技能: Python, SQL, Spark, Kafka
      `;

      const mockStructuredData = {
        basic_info: {
          name: '赵六',
          contact: { phone: '13700137000', email: 'zhaoliu@qq.com' },
          current_position: '数据工程师',
          graduation_date: '2020',
          years_of_experience: 4
        },
        education: [{
          school: '复旦大学',
          major: '数据科学',
          graduation_time: '2020'
        }],
        technical_skills: ['Python', 'SQL', 'Spark', 'Kafka']
      };

      ocrService.isImageFile.mockReturnValue(true);
      ocrService.recognizeImage.mockResolvedValue(mockOCRText);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/resume.jpg', 'jpg');

      expect(ocrService.recognizeImage).toHaveBeenCalledWith('/path/to/resume.jpg');
      expect(result.raw_text).toBe(mockOCRText);
      expect(result.structured_data.basic_info.name).toBe('赵六');
      expect(result.structured_data.technical_skills).toContain('Python');
    });

    test('应该成功识别PNG图片简历', async () => {
      const mockOCRText = '简历内容(PNG)';
      const mockStructuredData = {
        basic_info: { name: 'PNG测试', years_of_experience: 2 }
      };

      ocrService.isImageFile.mockReturnValue(true);
      ocrService.recognizeImage.mockResolvedValue(mockOCRText);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/resume.png', 'png');

      expect(result.structured_data.basic_info.name).toBe('PNG测试');
    });

    test('应该成功识别BMP图片简历', async () => {
      const mockOCRText = '简历内容(BMP)';
      const mockStructuredData = {
        basic_info: { name: 'BMP测试', years_of_experience: 1 }
      };

      ocrService.isImageFile.mockReturnValue(true);
      ocrService.recognizeImage.mockResolvedValue(mockOCRText);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/resume.bmp', 'bmp');

      expect(result.structured_data.basic_info.name).toBe('BMP测试');
    });

    test('边界条件:应该处理图片OCR识别失败', async () => {
      ocrService.isImageFile.mockReturnValue(true);
      ocrService.recognizeImage.mockRejectedValue(new Error('OCR recognition failed'));

      await expect(
        parseResumeFile('/path/to/bad.jpg', 'jpg')
      ).rejects.toThrow('图片文件识别失败');
    });

    test('边界条件:应该处理低质量图片(OCR结果混乱)', async () => {
      const messyOCRText = `
        姓 名 ： 张  三
        电  话 ：1 3 8 0 0 1 3 8 0 0 0
        学  校 ：清  华  大  学
        专  业 ：计 算 机
      `;

      const mockStructuredData = {
        basic_info: {
          name: '张三',
          contact: { phone: '13800138000' },
          years_of_experience: 5
        },
        education: [{
          school: '清华大学',
          major: '计算机'
        }]
      };

      ocrService.isImageFile.mockReturnValue(true);
      ocrService.recognizeImage.mockResolvedValue(messyOCRText);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/lowquality.jpg', 'jpg');

      expect(result.structured_data.basic_info.name).toBe('张三');
      expect(result.structured_data.basic_info.contact.phone).toBe('13800138000');
    });
  });

  describe('parseResumeFile - TXT文件解析', () => {
    test('应该成功解析纯文本简历', async () => {
      const mockTxtContent = `
        个人简历
        姓名: 孙七
        联系方式: 13600136000
        教育背景: 上海交通大学 电子工程 2017年毕业
        工作经历:
        - 华为 硬件工程师 2017-2020
        - 小米 IoT工程师 2020-2024
        技术能力: 嵌入式开发, C/C++, Linux, RTOS
      `;

      const mockStructuredData = {
        basic_info: {
          name: '孙七',
          contact: { phone: '13600136000' },
          graduation_date: '2017',
          years_of_experience: 7
        },
        education: [{
          school: '上海交通大学',
          major: '电子工程',
          graduation_time: '2017'
        }],
        work_experience: [
          { company: '华为', position: '硬件工程师', duration: '2017-2020' },
          { company: '小米', position: 'IoT工程师', duration: '2020-2024' }
        ],
        technical_skills: ['嵌入式开发', 'C/C++', 'Linux', 'RTOS']
      };

      fs.readFileSync.mockReturnValue(mockTxtContent);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/resume.txt', 'txt');

      expect(result.raw_text).toBe(mockTxtContent);
      expect(result.structured_data.basic_info.name).toBe('孙七');
      expect(result.structured_data.work_experience).toHaveLength(2);
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/resume.txt', 'utf-8');
    });

    test('边界条件:应该处理空的TXT文件', async () => {
      fs.readFileSync.mockReturnValue('   \n\n  ');

      await expect(
        parseResumeFile('/path/to/empty.txt', 'txt')
      ).rejects.toThrow('无法从文件中提取有效文本内容');
    });

    test('应该处理TXT文件读取失败', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      await expect(
        parseResumeFile('/path/to/notfound.txt', 'txt')
      ).rejects.toThrow('文本文件解析失败');
    });
  });

  describe('parseResumeFile - 通用边界条件', () => {
    test('边界条件:应该拒绝不支持的文件格式', async () => {
      await expect(
        parseResumeFile('/path/to/resume.exe', 'exe')
      ).rejects.toThrow('不支持的文件格式');
    });

    test('边界条件:应该处理提取文本内容过短的情况', async () => {
      fs.readFileSync.mockReturnValue('test');
      pdf.mockResolvedValue({ text: 'test' });
      ocrService.isScannedPDF.mockReturnValue(false);

      await expect(
        parseResumeFile('/path/to/short.pdf', 'pdf')
      ).rejects.toThrow('无法从文件中提取有效文本内容');
    });

    test('边界条件:应该处理DeepSeek解析失败', async () => {
      const mockText = '有效的简历文本内容,足够长度';

      fs.readFileSync.mockReturnValue(mockText);
      deepseekService.parseResume.mockRejectedValue(
        new Error('DeepSeek API failed')
      );

      await expect(
        parseResumeFile('/path/to/resume.txt', 'txt')
      ).rejects.toThrow('DeepSeek API failed');
    });

    test('边界条件:应该处理包含特殊字符的文件路径', async () => {
      const specialPath = '/path/to/简历 <张三> (2024).pdf';
      const mockText = '简历内容足够长,可以正常解析';
      const mockStructuredData = {
        basic_info: { name: '张三', years_of_experience: 3 }
      };

      fs.readFileSync.mockReturnValue(Buffer.from('PDF'));
      pdf.mockResolvedValue({ text: mockText });
      ocrService.isScannedPDF.mockReturnValue(false);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile(specialPath, 'pdf');

      expect(result.structured_data.basic_info.name).toBe('张三');
    });

    test('边界条件:应该处理超大文件(10MB+)', async () => {
      const hugeContent = 'a'.repeat(11 * 1024 * 1024); // 11MB
      const mockStructuredData = {
        basic_info: { name: '大文件测试', years_of_experience: 1 }
      };

      fs.readFileSync.mockReturnValue(hugeContent);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/huge.txt', 'txt');

      expect(result.structured_data).toBeDefined();
    });

    test('应该返回完整的解析结果结构', async () => {
      const mockText = '完整的简历文本内容';
      const mockStructuredData = {
        basic_info: { name: '周八', years_of_experience: 4 },
        education: [],
        work_experience: [],
        technical_skills: ['Java', 'Spring'],
        project_highlights: [],
        soft_skills: [],
        career_trajectory: {},
        expected_salary: '25K'
      };

      fs.readFileSync.mockReturnValue(mockText);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile('/path/to/complete.txt', 'txt');

      expect(result).toHaveProperty('raw_text');
      expect(result).toHaveProperty('structured_data');
      expect(result.raw_text).toBe(mockText);
      expect(result.structured_data).toEqual(mockStructuredData);
      expect(result.structured_data.expected_salary).toBe('25K');
    });

    test('边界条件:应该处理文件扩展名大小写混合', async () => {
      const mockText = '简历内容测试';
      const mockStructuredData = {
        basic_info: { name: '大小写测试', years_of_experience: 2 }
      };

      fs.readFileSync.mockReturnValue(Buffer.from('PDF'));
      pdf.mockResolvedValue({ text: mockText });
      ocrService.isScannedPDF.mockReturnValue(false);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      // 测试大写扩展名
      const result = await parseResumeFile('/path/to/resume.PDF', 'PDF');
      expect(result.structured_data.basic_info.name).toBe('大小写测试');
    });

    test('边界条件:应该处理文件名包含多个点号的情况', async () => {
      const mockText = '简历内容足够长度用于测试';
      const mockStructuredData = {
        basic_info: { name: '多点测试', years_of_experience: 1 }
      };

      fs.readFileSync.mockReturnValue(mockText);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const result = await parseResumeFile(
        '/path/to/resume.backup.v2.final.txt',
        'txt'
      );

      expect(result.structured_data).toBeDefined();
    });
  });

  describe('集成场景 - 多种文件类型混合', () => {
    test('应该能够连续解析不同类型的简历文件', async () => {
      const mockStructuredData = {
        basic_info: { name: 'Test', years_of_experience: 3 }
      };

      // PDF文件
      fs.readFileSync.mockReturnValue(Buffer.from('PDF'));
      pdf.mockResolvedValue({ text: 'PDF简历内容足够长' });
      ocrService.isScannedPDF.mockReturnValue(false);
      deepseekService.parseResume.mockResolvedValue(mockStructuredData);

      const pdfResult = await parseResumeFile('/path/to/resume1.pdf', 'pdf');
      expect(pdfResult.structured_data).toBeDefined();

      // Word文件
      mammoth.extractRawText.mockResolvedValue({ value: 'Word简历内容足够长' });
      const wordResult = await parseResumeFile('/path/to/resume2.docx', 'docx');
      expect(wordResult.structured_data).toBeDefined();

      // TXT文件
      fs.readFileSync.mockReturnValue('TXT简历内容足够长');
      const txtResult = await parseResumeFile('/path/to/resume3.txt', 'txt');
      expect(txtResult.structured_data).toBeDefined();

      // 图片文件
      ocrService.isImageFile.mockReturnValue(true);
      ocrService.recognizeImage.mockResolvedValue('图片简历内容足够长');
      const imgResult = await parseResumeFile('/path/to/resume4.jpg', 'jpg');
      expect(imgResult.structured_data).toBeDefined();
    });
  });
});
