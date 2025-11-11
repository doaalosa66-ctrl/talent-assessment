/**
 * 安全的JSON解析工具
 * 处理AI返回结果可能包含markdown代码块或额外文本的情况
 */
export function safeJSONParse(text, errorMessage = 'JSON解析失败') {
  try {
    // 先尝试直接解析
    return JSON.parse(text);
  } catch (error) {
    // 尝试提取JSON部分
    // 移除可能的markdown代码块标记
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // 尝试提取第一个完整的JSON对象
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        // 继续尝试其他方法
      }
    }

    // 尝试提取数组
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (e) {
        // 继续尝试其他方法
      }
    }

    console.error('JSON解析失败，原始文本:', text);
    throw new Error(errorMessage);
  }
}

export default {
  safeJSONParse
};
