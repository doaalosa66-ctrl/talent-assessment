import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { parseResume } from './deepseekService.js';

/**
 * 解析PDF简历
 */
async function parsePDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF解析失败:', error);
    throw new Error('PDF文件解析失败');
  }
}

/**
 * 解析Word简历
 */
async function parseWord(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Word解析失败:', error);
    throw new Error('Word文件解析失败');
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
 * 主简历解析函数
 */
export async function parseResumeFile(filePath, fileType) {
  let resumeText = '';

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
      throw new Error('不支持的文件格式，请上传PDF、Word或TXT文件');
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
