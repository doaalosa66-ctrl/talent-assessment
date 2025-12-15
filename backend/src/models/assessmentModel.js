import { query, getClient } from '../config/database.js';

/**
 * 评估报告模型
 */

// 创建评估报告
export async function createAssessmentReport(data) {
  const {
    jobPositionId,
    companyBackground,
    jobTitle,
    jobDescription,
    totalCandidates,
    assessmentSummary
  } = data;

  const sql = `
    INSERT INTO assessment_reports
      (job_position_id, company_background, job_title, job_description, total_candidates, assessment_summary)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const result = await query(sql, [
    jobPositionId,
    companyBackground,
    jobTitle,
    jobDescription,
    totalCandidates,
    assessmentSummary
  ]);

  return result.rows[0];
}

// 保存候选人评估结果
export async function saveCandidateResume(reportId, candidateData) {
  const {
    candidateName,
    resumeFileName,
    resumeFilePath,
    resumeText,
    overallScore,
    technicalMatch,
    experienceMatch,
    cultureFit,
    recommendationLevel,
    confidenceScore,
    expectedSuccessRate,
    strengths,
    weaknesses,
    gapAnalysis,
    riskFactors,
    aiEvaluationDetail
  } = candidateData;

  const sql = `
    INSERT INTO candidate_resumes (
      assessment_report_id, candidate_name, resume_file_name, resume_file_path,
      resume_text, overall_score, technical_match, experience_match, culture_fit,
      recommendation_level, confidence_score, expected_success_rate,
      strengths, weaknesses, gap_analysis, risk_factors, ai_evaluation_detail
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;

  const result = await query(sql, [
    reportId,
    candidateName,
    resumeFileName,
    resumeFilePath,
    resumeText,
    overallScore,
    technicalMatch,
    experienceMatch,
    cultureFit,
    recommendationLevel,
    confidenceScore,
    expectedSuccessRate,
    JSON.stringify(strengths),
    JSON.stringify(weaknesses),
    gapAnalysis,
    riskFactors,
    JSON.stringify(aiEvaluationDetail)
  ]);

  return result.rows[0];
}

// 完整保存评估报告(带事务)
export async function saveCompleteAssessment(reportData, candidatesData) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. 创建评估报告
    const reportResult = await client.query(`
      INSERT INTO assessment_reports
        (job_position_id, company_background, job_title, job_description, total_candidates, assessment_summary)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      reportData.jobPositionId,
      reportData.companyBackground,
      reportData.jobTitle,
      reportData.jobDescription,
      candidatesData.length,
      reportData.assessmentSummary
    ]);

    const report = reportResult.rows[0];

    // 2. 保存所有候选人数据
    const savedCandidates = [];
    for (const candidate of candidatesData) {
      const candidateResult = await client.query(`
        INSERT INTO candidate_resumes (
          assessment_report_id, candidate_name, resume_file_name, resume_file_path,
          resume_text, overall_score, technical_match, experience_match, culture_fit,
          recommendation_level, confidence_score, expected_success_rate,
          strengths, weaknesses, gap_analysis, risk_factors, ai_evaluation_detail
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `, [
        report.id,
        candidate.candidateName,
        candidate.resumeFileName,
        candidate.resumeFilePath,
        candidate.resumeText,
        candidate.overallScore,
        candidate.technicalMatch,
        candidate.experienceMatch,
        candidate.cultureFit,
        candidate.recommendationLevel,
        candidate.confidenceScore,
        candidate.expectedSuccessRate,
        JSON.stringify(candidate.strengths),
        JSON.stringify(candidate.weaknesses),
        candidate.gapAnalysis,
        candidate.riskFactors,
        JSON.stringify(candidate.aiEvaluationDetail)
      ]);
      savedCandidates.push(candidateResult.rows[0]);
    }

    // 3. 创建评估历史记录
    const topCandidate = savedCandidates.reduce((max, c) =>
      (c.overall_score || 0) > (max.overall_score || 0) ? c : max
    , savedCandidates[0]);

    await client.query(`
      INSERT INTO assessment_history
        (assessment_report_id, job_title, candidate_count, top_candidate_name, top_candidate_score)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      report.id,
      reportData.jobTitle,
      savedCandidates.length,
      topCandidate.candidate_name,
      topCandidate.overall_score
    ]);

    await client.query('COMMIT');

    return {
      report,
      candidates: savedCandidates
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 获取评估报告详情
export async function getAssessmentReportById(reportId) {
  const sql = `
    SELECT
      r.*,
      json_agg(
        json_build_object(
          'id', c.id,
          'candidateName', c.candidate_name,
          'resumeFileName', c.resume_file_name,
          'overallScore', c.overall_score,
          'technicalMatch', c.technical_match,
          'experienceMatch', c.experience_match,
          'cultureFit', c.culture_fit,
          'recommendationLevel', c.recommendation_level,
          'confidenceScore', c.confidence_score,
          'expectedSuccessRate', c.expected_success_rate,
          'strengths', c.strengths,
          'weaknesses', c.weaknesses,
          'gapAnalysis', c.gap_analysis,
          'riskFactors', c.risk_factors,
          'aiEvaluationDetail', c.ai_evaluation_detail
        ) ORDER BY c.overall_score DESC
      ) as candidates
    FROM assessment_reports r
    LEFT JOIN candidate_resumes c ON c.assessment_report_id = r.id
    WHERE r.id = $1
    GROUP BY r.id
  `;

  const result = await query(sql, [reportId]);
  return result.rows[0] || null;
}

// 获取评估历史列表
export async function getAssessmentHistory(limit = 20) {
  const sql = `
    SELECT * FROM assessment_history
    ORDER BY created_at DESC
    LIMIT $1
  `;
  const result = await query(sql, [limit]);
  return result.rows;
}

export default {
  createAssessmentReport,
  saveCandidateResume,
  saveCompleteAssessment,
  getAssessmentReportById,
  getAssessmentHistory
};
