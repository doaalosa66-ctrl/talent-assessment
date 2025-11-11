import OpenAI from 'openai';
import { safeJSONParse } from '../utils/jsonParser.js';

// DeepSeek API配置
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: 'sk-518a4fd49a4445c688e163f286abd2bf'
});

/**
 * 通用DeepSeek调用函数
 */
export async function callDeepSeek(systemPrompt, userPrompt, temperature = 0.7) {
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      max_tokens: 4000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    throw new Error('AI分析服务暂时不可用，请稍后重试');
  }
}

/**
 * 岗位JD深度分析
 */
export async function analyzeJobDescription(companyBackground, jobDescription) {
  const systemPrompt = `你是一位资深的人力资源专家和岗位分析专家。你需要深度分析岗位JD，提取核心能力要求。`;

  const userPrompt = `
公司背景：
${companyBackground}

岗位JD：
${jobDescription}

请深度分析这个岗位，输出JSON格式的分析结果，包含：
1. core_competencies: 核心能力维度列表（技术栈、业务能力、软技能等）
2. skill_weights: 各能力维度的权重（总和为100）
3. critical_requirements: 关键硬性要求（一票否决项）
4. preferred_skills: 加分项技能
5. cultural_fit_factors: 文化契合要素
6. hidden_requirements: 从职责描述中推断的隐性要求

只输出JSON，不要包含任何其他文字说明或markdown标记。
`;

  const result = await callDeepSeek(systemPrompt, userPrompt, 0.5);
  return safeJSONParse(result, '岗位分析结果格式错误');
}

/**
 * 简历深度解析和结构化
 */
export async function parseResume(resumeText) {
  const systemPrompt = `你是一位专业的简历分析专家。你需要从简历文本中提取关键信息并结构化。`;

  const userPrompt = `
简历原文：
${resumeText}

请分析这份简历，输出JSON格式的结构化数据，包含：
1. basic_info: 基本信息（姓名、联系方式、工作年限、当前职位等）
2. education: 教育背景（学历、专业、学校、毕业时间）
3. work_experience: 工作经历数组（公司、职位、时间、职责、项目、技术栈）
4. technical_skills: 技术技能列表（按熟练度分类）
5. project_highlights: 重点项目经验（项目名称、规模、技术难度、业务价值）
6. soft_skills: 软技能提取（从经历中推断）
7. career_trajectory: 职业发展轨迹分析（技术深度、管理广度）
8. expected_salary: 期望薪资（如果有）

只输出JSON，不要包含任何其他文字说明或markdown标记。
`;

  const result = await callDeepSeek(systemPrompt, userPrompt, 0.3);
  return safeJSONParse(result, '简历解析结果格式错误');
}

/**
 * 候选人多维评估
 */
export async function assessCandidate(jobAnalysis, candidateData) {
  const systemPrompt = `你是一位资深的人才评估专家。你需要基于岗位要求，对候选人进行多维度深度评估。`;

  const userPrompt = `
岗位能力要求：
${JSON.stringify(jobAnalysis, null, 2)}

候选人简历数据：
${JSON.stringify(candidateData, null, 2)}

请对候选人进行深度评估，输出JSON格式，包含：
1. assessment: 多维评估
   - technical_match: 技术匹配度（0-100分，详细说明每个技能点的匹配情况）
   - experience_match: 经验匹配度（0-100分，项目规模、行业经验等）
   - cultural_fit: 文化契合度（0-100分，工作风格、团队协作等）
   - growth_potential: 成长潜力（0-100分，学习能力、技术更新等）
   - stability: 职业稳定性（0-100分，工作连续性分析）

2. strengths: 核心优势（3-5个关键优势点，每个要详细说明）

3. weaknesses: 潜在风险与短板（具体指出与岗位要求的gap）

4. gap_analysis: 与岗位要求的详细差距分析

5. overall_score: 综合评分（0-100分，基于上述维度加权计算）

只输出JSON，不要包含任何其他文字说明或markdown标记。
`;

  const result = await callDeepSeek(systemPrompt, userPrompt, 0.6);
  return safeJSONParse(result, '候选人评估结果格式错误');
}

/**
 * 智能邀约决策
 */
export async function generateInvitationDecision(jobAnalysis, candidateData, assessment) {
  const systemPrompt = `你是一位资深的招聘决策专家。基于候选人的评估结果，给出科学的面试邀约建议。`;

  const userPrompt = `
岗位要求：
${JSON.stringify(jobAnalysis, null, 2)}

候选人信息：
${JSON.stringify(candidateData.basic_info, null, 2)}

评估结果：
${JSON.stringify(assessment, null, 2)}

请生成邀约决策，输出JSON格式：
1. recommendation: 推荐等级（strong_recommend/recommend/consider/not_recommend）
2. confidence_score: 决策置信度（0-1）
3. rationale: 决策理由（3-5条，基于量化数据和定性分析）
4. expected_success_rate: 预期面试通过率（0-1）
5. salary_match: 薪资期望匹配度分析
6. risk_factors: 需要关注的风险点

决策逻辑：
- overall_score > 85 → strong_recommend
- overall_score 70-85 → recommend
- overall_score 60-70 → consider
- overall_score < 60 → not_recommend

只输出JSON，不要包含任何其他文字说明或markdown标记。
`;

  const result = await callDeepSeek(systemPrompt, userPrompt, 0.5);
  return safeJSONParse(result, '邀约决策结果格式错误');
}

/**
 * 生成个性化测评题目
 */
export async function generateCustomAssessment(jobAnalysis, candidateData, assessment) {
  const systemPrompt = `你是一位资深的面试官和测评专家。你需要为候选人设计个性化的深度测评题目。`;

  const userPrompt = `
岗位要求：
${JSON.stringify(jobAnalysis, null, 2)}

候选人信息：
${JSON.stringify(candidateData, null, 2)}

评估结果（特别关注短板和gap）：
${JSON.stringify(assessment, null, 2)}

请生成个性化测评方案，输出JSON格式：
1. technical_questions: 技术深度测评题（3-5道）
   - 针对候选人的技术短板或需要验证的技能点
   - 每道题包含：question, reference_answer, scoring_criteria, competency_assessed, red_flags

2. behavioral_questions: 行为面试题（2-3道）
   - 考察软技能和文化匹配
   - 每道题包含：question, expected_points, scoring_criteria, competency_assessed, red_flags

3. situational_questions: 情景模拟题（1-2道）
   - 基于实际工作场景
   - 每道题包含：scenario, question, reference_answer, scoring_criteria, competency_assessed, red_flags

只输出JSON，不要包含任何其他文字说明或markdown标记。
`;

  const result = await callDeepSeek(systemPrompt, userPrompt, 0.7);
  return safeJSONParse(result, '测评方案生成结果格式错误');
}

/**
 * 快速综合评估（合并多个AI调用为一次）
 */
export async function quickComprehensiveAssessment(jobAnalysis, candidateData) {
  const systemPrompt = `你是资深的人才评估和招聘决策专家。快速、准确地评估候选人。`;

  const userPrompt = `
岗位要求：
${JSON.stringify(jobAnalysis, null, 2)}

候选人信息：
${JSON.stringify(candidateData, null, 2)}

请快速完成综合评估，输出JSON格式：
{
  "assessment": {
    "technical_match": 分数0-100,
    "experience_match": 分数0-100,
    "cultural_fit": 分数0-100,
    "growth_potential": 分数0-100,
    "stability": 分数0-100
  },
  "overall_score": 综合分0-100,
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["短板1", "短板2"],
  "gap_analysis": "简要gap分析",
  "recommendation": "strong_recommend/recommend/consider/not_recommend",
  "confidence_score": 0-1,
  "rationale": ["理由1", "理由2", "理由3"],
  "expected_success_rate": 0-1,
  "salary_match": "薪资匹配分析",
  "risk_factors": ["风险1", "风险2"],
  "technical_questions": [{"question":"问题","reference_answer":"答案","scoring_criteria":"标准","competency_assessed":"维度","red_flags":"警告"}],
  "behavioral_questions": [{"question":"问题","expected_points":"要点","scoring_criteria":"标准","competency_assessed":"维度","red_flags":"警告"}],
  "situational_questions": [{"scenario":"场景","question":"问题","reference_answer":"答案","scoring_criteria":"标准","competency_assessed":"维度","red_flags":"警告"}]
}

只输出JSON，不要其他文字。`;

  const result = await callDeepSeek(systemPrompt, userPrompt, 0.7);
  return safeJSONParse(result, '综合评估结果格式错误');
}

export default {
  callDeepSeek,
  analyzeJobDescription,
  parseResume,
  assessCandidate,
  generateInvitationDecision,
  generateCustomAssessment,
  quickComprehensiveAssessment
};
