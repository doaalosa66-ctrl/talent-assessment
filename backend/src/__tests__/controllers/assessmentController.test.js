/**
 * assessmentController.test.js
 * 评估控制器单元测试
 * 
 * 测试覆盖:
 * - performAssessment() - 完整评估流程
 * - exportPDF() - PDF导出
 * - exportWord() - Word导出
 * - 边界条件测试
 */

import { jest } from '@jest/globals';
import { performAssessment, exportPDF, exportWord } from '../../controllers/assessmentController.js';

// Mock所有外部依赖
jest.mock('../../services/resumeParserService.js');
jest.mock('../../services/deepseekService.js');
jest.mock('../../services/pdfExportService.js');
jest.mock('../../index.js');
jest.mock('fs');
jest.mock('path');

import { parseResumeFile } from '../../services/resumeParserService.js';
import { analyzeJobDescription, quickComprehensiveAssessment } from '../../services/deepseekService.js';
import { generatePDFReport } from '../../services/pdfExportService.js';
import { broadcastProgress } from '../../index.js';
import fs from 'fs';
import path from 'path';

// ==================== Mock数据 - 真实业务场景 ====================

/**
 * 真实岗位JD分析结果
 */
const mockJobAnalysis = {
  core_competencies: ['React', 'Node.js', 'PostgreSQL', '微服务架构', 'AWS云服务'],
  skill_weights: {
    'React': 30,
    'Node.js': 25,
    'PostgreSQL': 20,
    '微服务架构': 15,
    'AWS云服务': 10
  },
  critical_requirements: [
    '3年以上全栈开发经验',
    '精通React和Node.js技术栈',
    '有大型互联网项目经验',
    '具备独立解决问题的能力'
  ],
  preferred_skills: ['TypeScript', 'Docker', 'Kubernetes', 'Redis'],
  cultural_fit_factors: ['技术驱动', '快速迭代', '团队协作', '结果导向'],
  hidden_requirements: ['需要有创业公司经验', '能承受高强度工作']
};

/**
 * 真实候选人结构化数据
 */
const mockCandidateData = {
  basic_info: {
    name: '张三',
    contact: {
      phone: '13800138000',
      email: 'zhangsan@example.com'
    },
    current_position: '高级全栈工程师',
    graduation_date: '2018-06',
    years_of_experience: 6
  },
  education: [{
    degree: '本科',
    major: '计算机科学与技术',
    school: '清华大学',
    graduation_time: '2018-06'
  }],
  work_experience: [{
    company: '字节跳动',
    position: '高级全栈工程师',
    duration: '2020-01 至 2024-01',
    responsibilities: '负责抖音商城前后端开发',
    projects: ['抖音商城', '直播带货系统'],
    tech_stack: ['React', 'Node.js', 'Redis', 'MySQL']
  }],
  technical_skills: ['React', 'Vue', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
  project_highlights: [{
    name: '抖音商城',
    scale: '日活1000万',
    difficulty: '高并发、分布式系统',
    value: '提升转化率30%'
  }],
  soft_skills: ['团队协作', '问题解决', '技术分享'],
  career_trajectory: {
    depth: '技术深度强',
    breadth: '具备一定管理经验'
  },
  expected_salary: '30-40K'
};

/**
 * 真实综合评估结果
 */
const mockComprehensiveAssessment = {
  assessment: {
    technical_match: 88,
    experience_match: 85,
    cultural_fit: 82,
    growth_potential: 90,
    stability: 78
  },
  overall_score: 85,
  strengths: [
    '扎实的全栈开发能力,React和Node.js经验丰富',
    '有大型互联网项目经验,参与过日活千万级系统开发',
    '技术栈与岗位要求高度匹配,掌握AWS云服务',
    '成长潜力强,持续学习新技术'
  ],
  weaknesses: [
    '微服务架构经验相对较少,需要进一步深入',
    '团队管理经验不足'
  ],
  gap_analysis: '候选人在核心技术栈方面表现优秀,但在微服务架构和团队管理方面需要进一步提升',
  recommendation: 'strong_recommend',
  confidence_score: 0.88,
  rationale: [
    '技术能力与岗位要求高度匹配',
    '有大厂背景和大型项目经验',
    '成长潜力强,学习能力突出'
  ],
  expected_success_rate: 0.85,
  salary_match: '期望薪资30-40K与岗位预算匹配',
  risk_factors: ['跳槽频率略高,需关注稳定性'],
  technical_questions: [
    {
      question: '请描述你在抖音商城项目中如何处理高并发场景?',
      competency_assessed: '高并发处理能力',
      reference_answer: '应提到缓存策略、数据库优化、负载均衡等',
      scoring_criteria: '技术深度、实战经验、问题解决思路',
      red_flags: ['无法说清具体技术方案', '缺乏实际经验']
    }
  ],
  behavioral_questions: [
    {
      question: '描述一次你在团队中解决技术难题的经历',
      competency_assessed: '问题解决能力和团队协作',
      reference_answer: '应包含问题背景、解决方案、团队协作、最终结果',
      scoring_criteria: '逻辑清晰、主动性、团队意识',
      red_flags: ['推卸责任', '缺乏主动性']
    }
  ],
  situational_questions: [
    {
      question: '如果线上系统突然出现性能问题,你会如何快速定位和解决?',
      competency_assessed: '应急处理能力',
      reference_answer: '应包含监控、日志分析、快速回滚、根因分析等步骤',
      scoring_criteria: '应急反应、系统思维、经验积累',
      red_flags: ['慌乱无序', '缺乏系统性思考']
    }
  ]
};


// ==================== 测试套件开始 ====================

describe('assessmentController - 评估控制器测试', () => {

  let mockReq, mockRes;

  beforeEach(() => {
    // 清除所有mock
    jest.clearAllMocks();

    // 创建mock的req和res对象
    mockReq = {
      body: {},
      files: []
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      download: jest.fn()
    };

    // 默认mock实现
    broadcastProgress.mockImplementation(() => {});
    path.join.mockImplementation((...args) => args.join('/'));
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    fs.unlinkSync.mockImplementation(() => {});
  });

  // ==================== performAssessment 测试 ====================

  describe('performAssessment - 完整评估流程', () => {

    test('应该成功完成完整的评估流程并返回报告', async () => {
      // Arrange
      const mockResumeFile = {
        path: '/uploads/resume_zhangsan.pdf',
        originalname: '张三_简历.pdf'
      };

      mockReq.body = {
        companyBackground: '字节跳动是一家领先的互联网科技公司',
        jobDescription: '招聘高级全栈工程师,负责核心业务系统开发',
        resumeFiles: [mockResumeFile]
      };

      // Mock依赖函数
      analyzeJobDescription.mockResolvedValue(mockJobAnalysis);
      parseResumeFile.mockResolvedValue({
        structured_data: mockCandidateData
      });
      quickComprehensiveAssessment.mockResolvedValue(mockComprehensiveAssessment);

      // Act
      await performAssessment(mockReq, mockRes);

      // Assert
      expect(analyzeJobDescription).toHaveBeenCalledWith(
        '字节跳动是一家领先的互联网科技公司',
        '招聘高级全栈工程师,负责核心业务系统开发'
      );
      expect(parseResumeFile).toHaveBeenCalledWith('/uploads/resume_zhangsan.pdf', 'pdf');
      expect(quickComprehensiveAssessment).toHaveBeenCalledWith(mockJobAnalysis, mockCandidateData);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          job_analysis: mockJobAnalysis,
          candidates_overview: expect.any(Array),
          candidates_detail: expect.any(Array)
        })
      });

      // 验证返回的数据结构
      const responseData = mockRes.json.mock.calls[0][0].data;
      expect(responseData.candidates_overview).toHaveLength(1);
      expect(responseData.candidates_overview[0].name).toBe('张三');
      expect(responseData.candidates_overview[0].overall_score).toBe(85);
      expect(responseData.candidates_detail[0].candidate_info.name).toBe('张三');
    });

    test('应该能够并行处理多个候选人简历', async () => {
      // Arrange
      const mockResumeFiles = [
        { path: '/uploads/resume1.pdf', originalname: '张三.pdf' },
        { path: '/uploads/resume2.docx', originalname: '李四.docx' },
        { path: '/uploads/resume3.txt', originalname: '王五.txt' }
      ];

      const mockCandidate2 = {
        ...mockCandidateData,
        basic_info: { ...mockCandidateData.basic_info, name: '李四' }
      };

      const mockCandidate3 = {
        ...mockCandidateData,
        basic_info: { ...mockCandidateData.basic_info, name: '王五' }
      };

      mockReq.body = {
        companyBackground: '测试公司背景',
        jobDescription: '测试岗位JD',
        resumeFiles: mockResumeFiles
      };

      analyzeJobDescription.mockResolvedValue(mockJobAnalysis);
      parseResumeFile
        .mockResolvedValueOnce({ structured_data: mockCandidateData })
        .mockResolvedValueOnce({ structured_data: mockCandidate2 })
        .mockResolvedValueOnce({ structured_data: mockCandidate3 });
      
      quickComprehensiveAssessment.mockResolvedValue(mockComprehensiveAssessment);

      // Act
      await performAssessment(mockReq, mockRes);

      // Assert
      expect(parseResumeFile).toHaveBeenCalledTimes(3);
      expect(quickComprehensiveAssessment).toHaveBeenCalledTimes(3);

      const responseData = mockRes.json.mock.calls[0][0].data;
      expect(responseData.candidates_overview).toHaveLength(3);
      expect(responseData.candidates_detail).toHaveLength(3);
    });

    test('应该正确推送评估进度消息', async () => {
      // Arrange
      mockReq.body = {
        companyBackground: '公司背景',
        jobDescription: '岗位JD',
        resumeFiles: [{ path: '/uploads/test.pdf', originalname: 'test.pdf' }]
      };

      analyzeJobDescription.mockResolvedValue(mockJobAnalysis);
      parseResumeFile.mockResolvedValue({ structured_data: mockCandidateData });
      quickComprehensiveAssessment.mockResolvedValue(mockComprehensiveAssessment);

      // Act
      await performAssessment(mockReq, mockRes);

      // Assert
      expect(broadcastProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'progress',
          stage: 'start',
          progress: 0
        })
      );

      expect(broadcastProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'job_analysis',
          progress: 10
        })
      );

      expect(broadcastProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'complete',
          stage: 'complete',
          progress: 100
        })
      );
    });
  });

  // ==================== 边界条件测试 ====================

  describe('performAssessment - 边界条件测试', () => {

    test('边界条件: 应该拒绝缺少公司背景的请求', async () => {
      // Arrange
      mockReq.body = {
        jobDescription: '岗位JD',
        resumeFiles: [{ path: '/test.pdf', originalname: 'test.pdf' }]
      };

      // Act
      await performAssessment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '请提供公司背景和岗位JD'
      });
      expect(analyzeJobDescription).not.toHaveBeenCalled();
    });

    test('边界条件: 应该拒绝缺少岗位JD的请求', async () => {
      // Arrange
      mockReq.body = {
        companyBackground: '公司背景',
        resumeFiles: [{ path: '/test.pdf', originalname: 'test.pdf' }]
      };

      // Act
      await performAssessment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '请提供公司背景和岗位JD'
      });
    });

    test('边界条件: 应该拒绝空简历数组的请求', async () => {
      // Arrange
      mockReq.body = {
        companyBackground: '公司背景',
        jobDescription: '岗位JD',
        resumeFiles: []
      };

      // Act
      await performAssessment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '请至少上传一份简历'
      });
    });

    test('边界条件: 应该处理简历解析失败的情况', async () => {
      // Arrange
      mockReq.body = {
        companyBackground: '公司背景',
        jobDescription: '岗位JD',
        resumeFiles: [{ path: '/corrupted.pdf', originalname: '损坏的简历.pdf' }]
      };

      analyzeJobDescription.mockResolvedValue(mockJobAnalysis);
      parseResumeFile.mockRejectedValue(new Error('PDF文件损坏'));

      // Act
      await performAssessment(mockReq, mockRes);

      // Assert
      const responseData = mockRes.json.mock.calls[0][0].data;
      expect(responseData.candidates_detail[0].parse_status.success).toBe(false);
      expect(responseData.candidates_detail[0].parse_status.error).toBe('PDF文件损坏');
      expect(responseData.candidates_detail[0].assessment.overall_score).toBe(0);
      expect(responseData.candidates_detail[0].decision.recommendation).toBe('parse_failed');
    });

    test('边界条件: 应该处理批量简历(20份)', async () => {
      // Arrange
      const mockResumeFiles = [];
      for (let i = 0; i < 20; i++) {
        mockResumeFiles.push({
          path: `/uploads/resume${i + 1}.pdf`,
          originalname: `候选人${i + 1}.pdf`
        });
      }

      mockReq.body = {
        companyBackground: '公司背景',
        jobDescription: '岗位JD',
        resumeFiles: mockResumeFiles
      };

      analyzeJobDescription.mockResolvedValue(mockJobAnalysis);
      parseResumeFile.mockResolvedValue({ structured_data: mockCandidateData });
      quickComprehensiveAssessment.mockResolvedValue(mockComprehensiveAssessment);

      // Act
      await performAssessment(mockReq, mockRes);

      // Assert
      expect(parseResumeFile).toHaveBeenCalledTimes(20);
      expect(quickComprehensiveAssessment).toHaveBeenCalledTimes(20);

      const responseData = mockRes.json.mock.calls[0][0].data;
      expect(responseData.candidates_overview).toHaveLength(20);
      expect(responseData.candidates_detail).toHaveLength(20);
    });

    test('边界条件: 应该处理评估流程中的异常错误', async () => {
      // Arrange
      mockReq.body = {
        companyBackground: '公司背景',
        jobDescription: '岗位JD',
        resumeFiles: [{ path: '/test.pdf', originalname: 'test.pdf' }]
      };

      analyzeJobDescription.mockRejectedValue(new Error('DeepSeek API调用失败'));

      // Act
      await performAssessment(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'DeepSeek API调用失败'
      });
    });
  });

  // ==================== exportPDF 测试 ====================

  describe('exportPDF - PDF导出功能', () => {

    test('应该成功生成并下载PDF报告', async () => {
      // Arrange
      const mockReportData = {
        job_analysis: mockJobAnalysis,
        candidates_detail: [{
          candidate_info: mockCandidateData.basic_info,
          assessment: mockComprehensiveAssessment,
          decision: {
            recommendation: 'strong_recommend',
            confidence_score: 0.88
          }
        }]
      };

      mockReq.body = mockReportData;
      generatePDFReport.mockResolvedValue();

      // Act
      await exportPDF(mockReq, mockRes);

      // Assert
      expect(generatePDFReport).toHaveBeenCalled();
      expect(mockRes.download).toHaveBeenCalled();

      const downloadCall = mockRes.download.mock.calls[0];
      expect(downloadCall[0]).toContain('temp');
      expect(downloadCall[1]).toMatch(/评估报告_\d+\.pdf/);
    });

    test('边界条件: 应该拒绝缺少报告数据的请求', async () => {
      // Arrange
      mockReq.body = {};

      // Act
      await exportPDF(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '缺少报告数据'
      });
      expect(generatePDFReport).not.toHaveBeenCalled();
    });

    test('边界条件: 应该处理PDF生成失败的情况', async () => {
      // Arrange
      mockReq.body = {
        job_analysis: mockJobAnalysis,
        candidates_detail: []
      };

      generatePDFReport.mockRejectedValue(new Error('PDF生成失败'));

      // Act
      await exportPDF(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'PDF生成失败'
      });
    });
  });

  // ==================== exportWord 测试 ====================

  describe('exportWord - Word导出功能', () => {

    test('应该成功生成并下载Word报告', async () => {
      // Arrange
      const mockReportData = {
        job_analysis: mockJobAnalysis,
        candidates_overview: [{
          name: '张三',
          technical_match: 88,
          overall_score: 85
        }],
        candidates_detail: [{
          candidate_info: mockCandidateData.basic_info,
          assessment: {
            strengths: ['优势1'],
            weaknesses: ['短板1'],
            gap_analysis: '差距分析'
          },
          decision: {
            recommendation: 'strong_recommend',
            confidence_score: 0.88,
            rationale: ['理由1']
          }
        }]
      };

      mockReq.body = mockReportData;

      // Act
      await exportWord(mockReq, mockRes);

      // Assert
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(mockRes.download).toHaveBeenCalled();
    });

    test('边界条件: 应该拒绝缺少报告数据的请求', async () => {
      // Arrange
      mockReq.body = {};

      // Act
      await exportWord(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '缺少报告数据'
      });
    });
  });
});
