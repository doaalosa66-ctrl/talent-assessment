import { parseResumeFile } from '../services/resumeParserService.js';
import {
  analyzeJobDescription,
  quickComprehensiveAssessment
} from '../services/deepseekService.js';

/**
 * 主评估流程控制器
 */
export async function performAssessment(req, res) {
  try {
    const { companyBackground, jobDescription, resumeFiles } = req.body;

    // 验证输入
    if (!companyBackground || !jobDescription) {
      return res.status(400).json({ error: '请提供公司背景和岗位JD' });
    }

    if (!resumeFiles || resumeFiles.length === 0) {
      return res.status(400).json({ error: '请至少上传一份简历' });
    }

    console.log('开始快速评估流程...');
    const startTime = Date.now();

    // 并行执行：岗位分析 + 简历解析
    console.log('1. 并行处理岗位分析和简历解析...');
    const [jobAnalysis, candidatesData] = await Promise.all([
      // 岗位分析
      analyzeJobDescription(companyBackground, jobDescription),

      // 批量解析简历
      Promise.all(
        resumeFiles.map(async (file) => {
          const resumeData = await parseResumeFile(file.path, file.mimetype.split('/')[1]);
          return resumeData.structured_data;
        })
      )
    ]);

    console.log(`步骤1完成，耗时: ${Date.now() - startTime}ms`);

    // 并行执行所有候选人的综合评估（合并评估+决策+测评为一次AI调用）
    console.log('2. 并行评估所有候选人...');
    const step2Start = Date.now();

    const finalResults = await Promise.all(
      candidatesData.map(async (candidateData) => {
        // 使用快速综合评估（一次AI调用完成所有分析）
        const result = await quickComprehensiveAssessment(jobAnalysis, candidateData);

        return {
          candidate_info: candidateData.basic_info,
          assessment: {
            assessment: result.assessment,
            overall_score: result.overall_score,
            strengths: result.strengths,
            weaknesses: result.weaknesses,
            gap_analysis: result.gap_analysis
          },
          decision: {
            recommendation: result.recommendation,
            confidence_score: result.confidence_score,
            rationale: result.rationale,
            expected_success_rate: result.expected_success_rate,
            salary_match: result.salary_match,
            risk_factors: result.risk_factors
          },
          custom_assessment: (result.recommendation === 'strong_recommend' || result.recommendation === 'recommend') ? {
            technical_questions: result.technical_questions || [],
            behavioral_questions: result.behavioral_questions || [],
            situational_questions: result.situational_questions || []
          } : null
        };
      })
    );

    console.log(`步骤2完成，耗时: ${Date.now() - step2Start}ms`);

    // 构建完整报告
    console.log('3. 生成完整评估报告...');
    const totalTime = Date.now() - startTime;
    console.log(`✅ 评估完成！总耗时: ${totalTime}ms (${(totalTime/1000).toFixed(1)}秒)`);

    const report = {
      // 1. 岗位能力分析报告
      job_analysis: jobAnalysis,

      // 2. 候选人综合评估看板
      candidates_overview: finalResults.map(result => ({
        name: result.candidate_info.name,
        technical_match: result.assessment.assessment.technical_match,
        experience_match: result.assessment.assessment.experience_match,
        cultural_fit: result.assessment.assessment.cultural_fit,
        overall_score: result.assessment.overall_score,
        recommendation: result.decision.recommendation
      })),

      // 3-5. 每个候选人的详细分析
      candidates_detail: finalResults
    };

    console.log('📤 发送响应给前端...');
    res.json({
      success: true,
      data: report
    });
    console.log('✅ 响应已发送！');

  } catch (error) {
    console.error('评估流程失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '评估失败，请稍后重试'
    });
  }
}

export default {
  performAssessment
};
