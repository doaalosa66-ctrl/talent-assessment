import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { recognizeImage, isScannedPDF, isImageFile, SUPPORTED_IMAGE_FORMATS } from '../services/ocrService.js';

describe('OCR Service Tests', () => {
  const testDir = path.join(process.cwd(), 'test-files');

  beforeAll(() => {
    // 创建测试目录
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // 清理测试文件
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('isScannedPDF()', () => {
    test('应该识别扫描版PDF（文本很少）', () => {
      const result = isScannedPDF('abc');
      expect(result).toBe(true);
    });

    test('应该识别正常PDF（文本充足）', () => {
      const normalText = '这是一份正常的简历，包含了足够的文本内容。姓名：张三，年龄：28岁，工作经验：5年...这是更多的内容确保超过50个字符让测试通过';
      const result = isScannedPDF(normalText);
      expect(result).toBe(false);
    });

    test('应该处理空字符串', () => {
      const result = isScannedPDF('');
      expect(result).toBe(true);
    });

    test('应该处理只有空格的字符串', () => {
      const result = isScannedPDF('   \n\t  ');
      expect(result).toBe(true);
    });
  });

  describe('isImageFile()', () => {
    test('应该识别JPG图片', () => {
      expect(isImageFile('resume.jpg')).toBe(true);
      expect(isImageFile('resume.jpeg')).toBe(true);
      expect(isImageFile('RESUME.JPG')).toBe(true);
    });

    test('应该识别PNG图片', () => {
      expect(isImageFile('resume.png')).toBe(true);
      expect(isImageFile('RESUME.PNG')).toBe(true);
    });

    test('应该识别BMP图片', () => {
      expect(isImageFile('resume.bmp')).toBe(true);
    });

    test('应该拒绝非图片文件', () => {
      expect(isImageFile('resume.pdf')).toBe(false);
      expect(isImageFile('resume.docx')).toBe(false);
      expect(isImageFile('resume.txt')).toBe(false);
    });
  });

  describe('SUPPORTED_IMAGE_FORMATS', () => {
    test('应该包含常见图片格式', () => {
      expect(SUPPORTED_IMAGE_FORMATS).toContain('.jpg');
      expect(SUPPORTED_IMAGE_FORMATS).toContain('.jpeg');
      expect(SUPPORTED_IMAGE_FORMATS).toContain('.png');
      expect(SUPPORTED_IMAGE_FORMATS).toContain('.bmp');
    });

    test('格式应该都是小写', () => {
      SUPPORTED_IMAGE_FORMATS.forEach(format => {
        expect(format).toBe(format.toLowerCase());
      });
    });
  });

  describe('recognizeImage() - 边界条件', () => {
    test('不存在的文件应该抛出错误', async () => {
      await expect(recognizeImage('/non-existent-file.jpg')).rejects.toThrow();
    });

    test('无效的文件路径应该抛出错误', async () => {
      await expect(recognizeImage('')).rejects.toThrow();
    });
  });
});
