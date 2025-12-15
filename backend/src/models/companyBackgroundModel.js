import { query } from '../config/database.js';

/**
 * 公司背景模型
 */

// 获取当前激活的公司背景
export async function getActiveCompanyBackground() {
  const sql = `
    SELECT * FROM company_backgrounds
    WHERE is_active = true
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  const result = await query(sql);
  return result.rows[0] || null;
}

// 保存或更新公司背景
export async function saveCompanyBackground(content) {
  // 先将所有记录设为非激活
  await query('UPDATE company_backgrounds SET is_active = false');

  // 插入新记录
  const sql = `
    INSERT INTO company_backgrounds (content, is_active)
    VALUES ($1, true)
    RETURNING *
  `;
  const result = await query(sql, [content]);
  return result.rows[0];
}

// 获取公司背景历史
export async function getCompanyBackgroundHistory(limit = 10) {
  const sql = `
    SELECT * FROM company_backgrounds
    ORDER BY created_at DESC
    LIMIT $1
  `;
  const result = await query(sql, [limit]);
  return result.rows;
}

export default {
  getActiveCompanyBackground,
  saveCompanyBackground,
  getCompanyBackgroundHistory
};
