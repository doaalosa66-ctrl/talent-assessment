import Tesseract from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

/**
 * OCR服务 - 用于识别图片和扫描PDF中的文字
 */

/**
 * 使用OCR识别单张图片
 * @param {string} imagePath - 图片路径
 * @param {string} lang - 语言（默认：chi_sim+eng 中英文）
 * @returns {Promise<string>} - 识别出的文本
 */
export async function recognizeImage(imagePath, lang = 'chi_sim+eng') {
  try {
    console.log(`🔍 开始OCR识别图片: ${imagePath}`);

    // 使用sharp预处理图片以提高识别率
    const processedImagePath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_processed.png');
    await sharp(imagePath)
      .resize(3000, 4000, { // 增大分辨率以提高识别率
        fit: 'inside',
        withoutEnlargement: false
      })
      .grayscale() // 转灰度
      .normalize() // 归一化
      .threshold(128) // 二值化处理
      .sharpen({ sigma: 2 }) // 增强锐化
      .toFile(processedImagePath);

    console.log(`📐 图片预处理完成: ${processedImagePath}`);

    // OCR识别 - 优化参数
    const { data: { text } } = await Tesseract.recognize(
      processedImagePath,
      lang,
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR进度: ${Math.round(m.progress * 100)}%`);
          }
        },
        tessedit_pageseg_mode: Tesseract.PSM.AUTO, // 自动页面分割
        tessedit_char_whitelist: '', // 不限制字符集
        preserve_interword_spaces: '1' // 保留单词间空格
      }
    );

    // 清理临时文件
    if (fs.existsSync(processedImagePath)) {
      fs.unlinkSync(processedImagePath);
    }

    console.log(`✅ OCR识别完成，文本长度: ${text.length}`);
    console.log(`📝 OCR识别前100字符预览: ${text.substring(0, 100)}`);

    // 清理OCR识别结果中的噪声
    const cleanedText = text
      .replace(/\s+/g, ' ') // 多个空白字符替换为单个空格
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
      .trim();

    console.log(`🧹 清理后文本长度: ${cleanedText.length}`);
    return cleanedText;
  } catch (error) {
    console.error('OCR识别失败:', error);
    throw new Error(`OCR识别失败: ${error.message}`);
  }
}

/**
 * 将PDF转换为图片并进行OCR识别
 * @param {string} pdfPath - PDF文件路径
 * @returns {Promise<string>} - 识别出的全部文本
 */
export async function recognizePDFWithOCR(pdfPath) {
  try {
    console.log(`📄 开始OCR识别PDF: ${pdfPath}`);

    const outputDir = path.join(path.dirname(pdfPath), 'temp_pdf_images');

    // 创建临时目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // PDF转图片配置
    const options = {
      density: 200, // DPI
      saveFilename: path.basename(pdfPath, '.pdf'),
      savePath: outputDir,
      format: 'png',
      width: 2000,
      height: 3000
    };

    const convert = fromPath(pdfPath, options);

    // 获取PDF总页数
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pageCount = await getPageCount(pdfBuffer);

    console.log(`PDF总页数: ${pageCount}`);

    let allText = '';

    // 逐页转换并识别
    for (let pageNum = 1; pageNum <= Math.min(pageCount, 10); pageNum++) { // 最多处理10页
      try {
        console.log(`处理第 ${pageNum}/${pageCount} 页`);

        const page = await convert(pageNum, { responseType: 'image' });
        const imagePath = page.path;

        // OCR识别该页
        const pageText = await recognizeImage(imagePath);
        allText += `\n--- 第${pageNum}页 ---\n${pageText}\n`;

        // 删除临时图片
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (pageError) {
        console.warn(`第${pageNum}页处理失败:`, pageError.message);
      }
    }

    // 清理临时目录
    if (fs.existsSync(outputDir)) {
      fs.rmdirSync(outputDir, { recursive: true });
    }

    console.log(`✅ PDF OCR识别完成，总文本长度: ${allText.length}`);
    return allText;
  } catch (error) {
    console.error('PDF OCR识别失败:', error);
    throw new Error(`PDF OCR识别失败: ${error.message}`);
  }
}

/**
 * 获取PDF页数（简单实现）
 */
async function getPageCount(pdfBuffer) {
  try {
    // 简单的页数检测，通过查找 /Count 字段
    const pdfString = pdfBuffer.toString('latin1');
    const match = pdfString.match(/\/Count\s+(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }

    // 备选方法：统计 /Page 出现次数
    const pageMatches = pdfString.match(/\/Page[^s]/g);
    return pageMatches ? pageMatches.length : 1;
  } catch (error) {
    console.warn('无法获取页数，默认为1页');
    return 1;
  }
}

/**
 * 检测PDF是否为扫描件（基于文本内容）
 * @param {string} text - PDF提取的文本
 * @returns {boolean} - 是否为扫描件
 */
export function isScannedPDF(text) {
  // 如果提取的文本很少（少于50个字符），很可能是扫描件
  const trimmedText = text.trim();
  const hasLittleText = trimmedText.length < 50;

  // 或者文本中全是乱码
  const hasGarbledText = /^[\x00-\x1F\x7F-\xFF]{10,}/.test(trimmedText);

  return hasLittleText || hasGarbledText;
}

/**
 * 支持的图片格式
 */
export const SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif'];

/**
 * 检查文件是否为图片
 */
export function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_IMAGE_FORMATS.includes(ext);
}

export default {
  recognizeImage,
  recognizePDFWithOCR,
  isScannedPDF,
  isImageFile,
  SUPPORTED_IMAGE_FORMATS
};
