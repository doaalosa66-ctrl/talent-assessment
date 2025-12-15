import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { parseResume } from './deepseekService.js';
import { recognizeImage, recognizePDFWithOCR, isScannedPDF, isImageFile } from './ocrService.js';

/**
 * 解析PDF简历（支持OCR）
 */
async function parsePDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const extractedText = data.text;

    // 检测是否为扫描件
    if (isScannedPDF(extractedText)) {
      console.log('⚠️  检测到扫描版PDF，启用OCR识别...');
      const ocrText = await recognizePDFWithOCR(filePath);
      return ocrText;
    }

    return extractedText;
  } catch (error) {
    console.error('PDF解析失败:', error);

    // 如果常规解析失败，尝试OCR
    try {
      console.log('📷 常规PDF解析失败，尝试OCR识别...');
      const ocrText = await recognizePDFWithOCR(filePath);
      return ocrText;
    } catch (ocrError) {
      console.error('OCR识别也失败:', ocrError);
      throw new Error('PDF文件解析失败（包括OCR尝试）');
    }
  }
}

/**
 * 解析Word简历（支持OCR）
 */
async function parseWord(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const extractedText = result.value;

    // 检测是否为扫描件（文本内容很少）
    if (extractedText.trim().length < 50) {
      console.log('⚠️  检测到扫描版Word文档，尝试OCR识别...');
      try {
        // Word扫描件通常需要先转换为图片，这里先返回提示
        // 实际OCR实现需要先将Word转换为图片
        console.warn('Word扫描件OCR功能暂未实现，建议使用PDF或图片格式');
      } catch (ocrError) {
        console.error('Word OCR识别失败:', ocrError);
      }
    }

    return extractedText;
  } catch (error) {
    console.error('Word解析失败:', error);
    throw new Error('Word文件解析失败');
  }
}

/**
 * 解析图片简历（OCR）
 */
async function parseImage(filePath) {
  try {
    console.log('🖼️  检测到图片简历，使用OCR识别...');
    const text = await recognizeImage(filePath);
    return text;
  } catch (error) {
    console.error('图片OCR识别失败:', error);
    throw new Error('图片文件识别失败');
  }
}

/**
 * 解析文本简历
 */
async function parseText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('文本解析失败:', error);
    throw new Error('文本文件解析失败');
  }
}

/**
 * 主简历解析函数（增强版，支持OCR）
 */
export async function parseResumeFile(filePath, fileType) {
  let resumeText = '';

  // 检查是否为图片文件
  if (isImageFile(filePath)) {
    resumeText = await parseImage(filePath);
  } else {
    // 根据文件类型选择解析方法
    switch (fileType.toLowerCase()) {
      case 'pdf':
        resumeText = await parsePDF(filePath);
        break;
      case 'docx':
      case 'doc':
        resumeText = await parseWord(filePath);
        break;
      case 'txt':
        resumeText = await parseText(filePath);
        break;
      default:
        throw new Error('不支持的文件格式，请上传PDF、Word、TXT或图片文件（JPG/PNG/BMP）');
    }
  }

  // 检查是否成功提取文本
  if (!resumeText || resumeText.trim().length < 10) {
    throw new Error('无法从文件中提取有效文本内容');
  }

  // 使用DeepSeek进行智能解析和结构化
  const structuredData = await parseResume(resumeText);

  return {
    raw_text: resumeText,
    structured_data: structuredData
  };
}

export default {
  parseResumeFile
};
