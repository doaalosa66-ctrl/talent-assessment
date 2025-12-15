import { query } from '../config/database.js';

/**
 * 岗位信息模型
 */

// 创建或更新岗位
export async function createOrUpdateJobPosition(jobTitle, jobDescription, companyBackgroundId = null) {
  // 检查是否已存在相同的岗位
  const checkSql = `
    SELECT * FROM job_positions
    WHERE job_title = $1 AND md5(job_description) = md5($2)
    LIMIT 1
  `;
  const existing = await query(checkSql, [jobTitle, jobDescription]);

  if (existing.rows.length > 0) {
    // 更新现有记录的时间
    const updateSql = `
      UPDATE job_positions
      SET updated_at = CURRENT_TIMESTAMP, company_background_id = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(updateSql, [companyBackgroundId, existing.rows[0].id]);
    return result.rows[0];
  } else {
    // 创建新记录
    const insertSql = `
      INSERT INTO job_positions (job_title, job_description, company_background_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await query(insertSql, [jobTitle, jobDescription, companyBackgroundId]);
    return result.rows[0];
  }
}

// 获取岗位历史列表
export async function getJobPositionHistory(limit = 20) {
  const sql = `
    SELECT
      id,
      job_title,
      job_description,
      created_at,
      updated_at
    FROM job_positions
    ORDER BY updated_at DESC
    LIMIT $1
  `;
  const result = await query(sql, [limit]);
  return result.rows;
}

// 根据ID获取岗位详情
export async function getJobPositionById(id) {
  const sql = `
    SELECT * FROM job_positions
    WHERE id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

// 根据岗位名称搜索
export async function searchJobPositionsByTitle(searchTerm, limit = 10) {
  const sql = `
    SELECT
      id,
      job_title,
      job_description,
      created_at
    FROM job_positions
    WHERE job_title ILIKE $1
    ORDER BY updated_at DESC
    LIMIT $2
  `;
  const result = await query(sql, [`%${searchTerm}%`, limit]);
  return result.rows;
}

export default {
  createOrUpdateJobPosition,
  getJobPositionHistory,
  getJobPositionById,
  searchJobPositionsByTitle
};
