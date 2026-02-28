import OpenAI from 'openai';
import { createHash } from 'crypto';
import { safeJSONParse } from '../utils/jsonParser.js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// 确保环境变量已加载
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __dirname_root = dirname(dirname(__dirname));
dotenv.config({ path: join(__dirname_root, '.env') });

// DeepSeek API配置
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY
});

// ── 结果缓存（内存，进程级别）──
// key: MD5(jobDescription + candidateJSON)，value: { result, cachedAt }
// TTL: 24小时，防止简历内容更新后拿到旧结果
const assessmentCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24小时

function getCacheKey(jobAnalysis, rawResumeText) {
  // 使用原始简历文本（而非解析后的结构化数据）计算 key，
  // 避免同一份简历因 AI 解析结果细微差异导致缓存 miss
  const content = JSON.stringify(jobAnalysis) + (rawResumeText || '');
  return createHash('md5').update(content).digest('hex');
}

function getFromCache(key) {
  const entry = assessmentCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    assessmentCache.delete(key);
    return null;
  }
  return entry.result;
}

function setToCache(key, result) {
  assessmentCache.set(key, { result, cachedAt: Date.now() });
}

/**
 * 通用DeepSeek调用函数
 */
export async function callDeepSeek(systemPrompt, userPrompt, temperature = 0.7, taskName = 'Unknown') {
  const startTime = Date.now();
  console.log(`🤖 [${taskName}] 开始调用DeepSeek API...`);

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

    const duration = Date.now() - startTime;
    console.log(`✅ [${taskName}] DeepSeek API调用完成，耗时: ${duration}ms (${(duration/1000).toFixed(1)}秒)`);

    return response.choices[0].message.content;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${taskName}] DeepSeek API调用失败，耗时: ${duration}ms`, error);
    throw new Error('AI分析服务暂时不可用，请稍后重试');
  }
}

/**
 * 岗位JD深度分析
 */
export async function analyzeJobDescription(companyBackground, jobDescription) {
  const systemPrompt = `你是一位资深的人力资源专家和岗位分析专家。你需要深度分析岗位JD，提取核心能力要求。
输出必须严格遵循指定的JSON结构，不得增减字段，不得更改维度名称。`;

  const userPrompt = `
公司背景：
${companyBackground}

岗位JD：
${jobDescription}

请深度分析这个岗位，输出JSON格式的分析结果。

【强制要求】skill_weights 必须且只能包含以下4个维度，名称完全一致，权重总和为100：
- "技术栈"
- "业务能力"
- "项目经验与工程能力"
- "软技能"

输出格式：
{
  "core_competencies": [
    { "dimension": "技术栈", "description": "该维度的具体说明" },
    { "dimension": "业务能力", "description": "该维度的具体说明" },
    { "dimension": "项目经验与工程能力", "description": "该维度的具体说明" },
    { "dimension": "软技能", "description": "该维度的具体说明" }
  ],
  "skill_weights": {
    "技术栈": 权重数字,
    "业务能力": 权重数字,
    "项目经验与工程能力": 权重数字,
    "软技能": 权重数字
  },
  "critical_requirements": ["硬性要求1", "硬性要求2"],
  "preferred_skills": ["加分项1", "加分项2"],
  "cultural_fit_factors": ["文化要素1", "文化要素2"],
  "hidden_requirements": ["隐性要求1", "隐性要求2"]
}

只输出JSON，不要包含任何其他文字说明或markdown标记。
`;

  const result = await callDeepSeek(systemPrompt, userPrompt, 0, '岗位JD分析');
  return safeJSONParse(result, '岗位分析结果格式错误');
}

/**
 * 简历深度解析和结构化
 */
export async function parseResume(resumeText) {
  const systemPrompt = `你是一位专业的简历分析专家。你需要从简历文本中提取关键信息并结构化。
特别注意：这份简历可能是通过OCR识别的，文本中可能存在识别错误、格式混乱、换行不规范等问题。
你需要智能推断和修正这些错误，提取出真实有效的信息。`;

  // 获取当前北京时间
  const currentDate = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const currentYear = new Date().getFullYear();

  const userPrompt = `
简历原文（可能含OCR识别噪声）：
${resumeText}

当前时间：${currentDate}
当前年份：${currentYear}

⚠️ 重要提示：
- 这份简历可能是OCR识别的结果，可能存在文字识别错误、格式混乱
- 请智能推断真实内容，忽略明显的识别错误
- 如果某些字段无法提取，请填写"未提供"或null，不要猜测

请分析这份简历，输出JSON格式的结构化数据，包含：
1. basic_info: 基本信息，其中：
   - name: 姓名
   - contact: 联系方式
   - current_position: 当前职位
   - graduation_date: 毕业时间（提取格式：YYYY-MM 或 YYYY）
   - years_of_experience: 工作年限（从毕业时间计算到当前年份${currentYear}，例如2020年毕业则为${currentYear - 2020}年经验）
2. education: 教育背景（学历、专业、学校、毕业时间）
3. work_experience: 工作经历数组（公司、职位、时间、职责、项目、技术栈）
4. technical_skills: 技术技能列表（按熟练度分类）
5. project_highlights: 重点项目经验（项目名称、规模、技术难度、业务价值）
6. soft_skills: 软技能提取（从经历中推断）
7. career_trajectory: 职业发展轨迹分析（技术深度、管理广度）
8. expected_salary: 期望薪资（如果有）

重要提示：
- years_of_experience 必须根据毕业时间自动计算，从毕业年份到${currentYear}年的实际年数
- 如果简历中有明确的毕业时间（如2020年6月），则计算 ${currentYear} - 2020 = ${currentYear - 2020}年
- 如果简历中只说"3年经验"但有毕业时间2020年，则以计算结果${currentYear - 2020}年为准，而不是简历自述的3年
- graduation_date 字段必须提取，格式为 YYYY-MM 或 YYYY

只输出JSON，不要包含任何其他文字说明或markdown标记。
`;

  const result = await callDeepSeek(systemPrompt, userPrompt, 0, '简历解析');
  return safeJSONParse(result, '简历解析结果格式错误');
}

/**
 * 候选人多维评估
 */
export async function assessCandidate(jobAnalysis, candidateData) {
  const systemPrompt = `你是一位资深的人才评估专家。你需要基于岗位要求，对候选人进行多维度深度评估。
评分必须严格遵循以下Rubric标准，确保每次评估结果客观一致。`;

  const userPrompt = `
岗位能力要求：
${JSON.stringify(jobAnalysis, null, 2)}

候选人简历数据：
${JSON.stringify(candidateData, null, 2)}

【评分Rubric标准 - 必须严格遵守】

technical_match（技术匹配度）：
- 90-100：完全满足所有技术要求，且有超出要求的技术深度或广度
- 70-89：满足全部核心技术要求，少数次要技术有欠缺
- 50-69：满足大部分核心技术要求，存在1-2个明显技术短板
- 30-49：仅满足部分技术要求，核心技术存在较大gap
- 0-29：基本不满足岗位技术要求，需大量培训

experience_match（经验匹配度）：
- 90-100：工作年限、行业背景、项目规模完全匹配
- 70-89：工作年限和主要行业经验匹配，项目规模略有差距
- 50-69：工作年限基本达标，行业经验或项目规模有明显差距
- 30-49：工作年限不足或行业经验严重不符
- 0-29：经验严重不足，与岗位要求差距极大

cultural_fit（文化契合度）：
- 90-100：工作风格、价值观与公司文化高度吻合
- 70-89：整体契合，个别方面存在小差异
- 50-69：基本契合，需要一定适应期
- 30-49：存在明显文化差异，适应风险较高
- 0-29：文化差异显著，不建议录用

growth_potential（成长潜力）：
- 90-100：有明确的持续学习记录，技术迭代快，有自驱力证明
- 70-89：有一定学习成长记录，技术栈有更新
- 50-69：成长迹象一般，技术栈较为固定
- 30-49：缺乏成长证据，技术栈老旧
- 0-29：无成长迹象，技术停滞

stability（职业稳定性）：
- 90-100：平均在职时间>3年，无频繁跳槽
- 70-89：平均在职时间2-3年，跳槽有合理原因
- 50-69：平均在职时间1-2年，有1-2次短期经历
- 30-49：平均在职时间<1年，跳槽频繁
- 0-29：极度不稳定，多次短期跳槽

overall_score 计算规则（加权平均）：
overall_score = technical_match × 0.35 + experience_match × 0.25 + cultural_fit × 0.15 + growth_potential × 0.15 + stability × 0.10
计算后四舍五入取整数。

请对候选人进行深度评估，输出JSON格式：
{
  "assessment": {
    "technical_match": 按Rubric评分,
    "experience_match": 按Rubric评分,
    "cultural_fit": 按Rubric评分,
    "growth_potential": 按Rubric评分,
    "stability": 按Rubric评分
  },
  "strengths": ["优势1（具体说明）", "优势2（具体说明）", "优势3（具体说明）"],
  "weaknesses": ["短板1（具体说明）", "短板2（具体说明）"],
  "gap_analysis": "与岗位要求的详细差距分析",
  "overall_score": 按公式计算的加权分
}

只输出JSON，不要包含任何其他文字说明或markdown标记。
`;

  const parsed = safeJSONParse(await callDeepSeek(systemPrompt, userPrompt, 0, '候选人评估'), '候选人评估结果格式错误');

  // 后端强制重算 overall_score，不依赖模型的数学计算
  if (parsed.assessment) {
    const a = parsed.assessment;
    parsed.overall_score = Math.round(
      (a.technical_match || 0) * 0.35 +
      (a.experience_match || 0) * 0.25 +
      (a.cultural_fit || 0) * 0.15 +
      (a.growth_potential || 0) * 0.15 +
      (a.stability || 0) * 0.10
    );
  }

  return parsed;
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

  const result = await callDeepSeek(systemPrompt, userPrompt, 0, '邀约决策');
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

  const result = await callDeepSeek(systemPrompt, userPrompt, 0, '测评方案生成');
  return safeJSONParse(result, '测评方案生成结果格式错误');
}

/**
 * 两阶段评估辅助：从简历中提取客观事实
 * 只做信息提取，不做任何主观评价，消除"理解"和"评判"混在一起的误差
 */
async function extractObjectiveFacts(jobAnalysis, candidateData) {
  const systemPrompt = `你是一位专业的信息提取专家。你的唯一任务是从简历中提取客观事实，不做任何评价或判断。
只提取简历中明确存在的信息，不推断、不猜测、不评价。`;

  const userPrompt = `
岗位要求的核心技术栈：
${JSON.stringify(jobAnalysis.critical_requirements || [], null, 2)}
岗位要求的技能权重维度：
${JSON.stringify(Object.keys(jobAnalysis.skill_weights || {}), null, 2)}

候选人简历：
${JSON.stringify(candidateData, null, 2)}

请从简历中提取以下客观事实，只提取明确存在的信息，输出JSON：
{
  "tech_facts": {
    "confirmed_skills": ["简历中明确提到的技术，与岗位要求有交集的"],
    "missing_skills": ["岗位要求有但简历中未提及的技术"],
    "extra_skills": ["简历有但岗位未要求的额外技术"]
  },
  "experience_facts": {
    "total_years": 工作年限数字,
    "required_years": 岗位要求年限数字（从JD中提取，没有则填null）,
    "job_count": 工作经历数量,
    "avg_tenure_months": 平均在职时长（月），按各段经历计算平均值,
    "industries": ["曾就职的行业列表"],
    "max_team_size": 带过的最大团队规模（没有则填null）,
    "project_scales": ["各项目规模描述，如'DAU 500万'、'日均交易额10亿'等"]
  },
  "stability_facts": {
    "tenures_months": [每段工作的在职月数列表，按时间顺序],
    "has_short_tenure": 是否有在职不足12个月的经历（true/false）,
    "short_tenure_count": 在职不足12个月的经历数量
  },
  "growth_facts": {
    "tech_updates": ["简历中体现技术更新迭代的证据，如'从React16升级到React18'"],
    "certifications": ["证书或培训记录"],
    "promotion_evidence": ["晋升或职责扩大的证据"]
  },
  "culture_facts": {
    "collaboration_signal": {
      "evidence": ["跨团队协作、带人、mentor等具体描述，逐条列出"],
      "score": 协作信号强度评分（0-100，无证据给50，有1条给65，有2条以上给80+）
    },
    "ownership_signal": {
      "evidence": ["主动推动改进、提出方案、从0到1主导等具体描述，逐条列出"],
      "score": 主人翁信号强度评分（0-100，无证据给50，有1条给65，有2条以上给80+）
    },
    "communication_signal": {
      "evidence": ["对外汇报、客户沟通、技术分享、写文档等具体描述，逐条列出"],
      "score": 沟通信号强度评分（0-100，无证据给50，有1条给65，有2条以上给80+）
    }
  }
}

只输出JSON，不要包含任何评价性语言或markdown标记。`;

  const raw = await callDeepSeek(systemPrompt, userPrompt, 0, '客观事实提取');
  return safeJSONParse(raw, '事实提取结果格式错误');
}

/**
 * 快速综合评估（两阶段：先提取事实，再基于事实评分）
 * 带缓存：相同 jobAnalysis + candidateData 直接返回缓存结果，跳过所有 AI 调用
 */
export async function quickComprehensiveAssessment(jobAnalysis, candidateData, rawResumeText) {
  // ── 缓存检查 ──
  // 使用原始简历文本计算 key，确保相同文件内容命中同一缓存条目
  const cacheKey = getCacheKey(jobAnalysis, rawResumeText);
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`⚡ [缓存命中] 候选人: ${candidateData.basic_info?.name || '未知'}，跳过 AI 调用`);
    return cached;
  }

  // ── 第一阶段：提取客观事实 ──
  const facts = await extractObjectiveFacts(jobAnalysis, candidateData);

  // ── 第二阶段：基于客观事实 + Rubric 评分 ──
  const systemPrompt = `你是资深的人才评估和招聘决策专家。
你将基于已提取的客观事实进行评分，不得重新解读原始简历。
评分必须严格对照Rubric标准，每个分数都要能从客观事实中找到依据。`;

  const userPrompt = `
岗位要求：
${JSON.stringify(jobAnalysis, null, 2)}

候选人客观事实（已从简历提取，请基于此评分，不得自行重新解读简历）：
${JSON.stringify(facts, null, 2)}

候选人基本信息（补充参考）：
姓名：${candidateData.basic_info?.name || '未知'}
当前职位：${candidateData.basic_info?.current_position || '未知'}
工作年限：${candidateData.basic_info?.years_of_experience || '未知'}年

【评分Rubric标准 - 必须严格遵守，每项评分必须引用上方客观事实作为依据】

technical_match（技术匹配度）：
- 90-100：confirmed_skills 覆盖岗位全部核心技术，且有 extra_skills 体现深度
- 70-89：confirmed_skills 覆盖岗位核心技术，missing_skills 仅为次要技术
- 50-69：confirmed_skills 覆盖大部分核心技术，missing_skills 中有1-2项核心技术
- 30-49：confirmed_skills 覆盖不足一半核心技术
- 0-29：confirmed_skills 与岗位核心技术基本无交集

experience_match（经验匹配度）：
- 90-100：total_years ≥ required_years，project_scales 体现大型项目，行业匹配
- 70-89：total_years ≥ required_years，项目规模略小或行业略有差距
- 50-69：total_years 接近 required_years（差距≤2年），项目规模或行业有明显差距
- 30-49：total_years 比 required_years 少2年以上
- 0-29：total_years 严重不足

cultural_fit（文化契合度）— 由3个子指标加权合成，必须分别输出：
子指标评分规则（每项均基于 culture_facts 中对应 signal 的 evidence 条数和 score）：

collaboration_score（协作信号，权重40%）：
- 直接使用 culture_facts.collaboration_signal.score
- 有2条以上跨团队/带人/mentor证据 → 80-100
- 有1条明确协作证据 → 60-79
- 无明确证据 → 50（中间分，不得低于40）

ownership_score（主人翁信号，权重40%）：
- 直接使用 culture_facts.ownership_signal.score
- 有2条以上"主导/从0到1/提出方案"证据 → 80-100
- 有1条相关证据 → 60-79
- 无明确证据 → 50（中间分，不得低于40）

communication_score（沟通信号，权重20%）：
- 直接使用 culture_facts.communication_signal.score
- 有对外汇报/客户沟通/技术分享证据 → 70-100
- 无明确证据 → 50（中间分，不得低于40）

cultural_fit 合成公式：
cultural_fit = collaboration_score × 0.4 + ownership_score × 0.4 + communication_score × 0.2
（后端会重算，此处仍需填写）

growth_potential（成长潜力）：
- 90-100：tech_updates 有3条以上，有 promotion_evidence
- 70-89：tech_updates 有1-2条，或有 promotion_evidence
- 50-69：tech_updates 较少，promotion_evidence 不明显
- 30-49：tech_updates 为空，无成长证据
- 0-29：无任何成长迹象

stability（职业稳定性）：
- 90-100：avg_tenure_months ≥ 36，short_tenure_count = 0
- 70-89：avg_tenure_months 24-35，short_tenure_count ≤ 1 且有合理原因
- 50-69：avg_tenure_months 12-23，short_tenure_count ≤ 2
- 30-49：avg_tenure_months < 12，或 short_tenure_count ≥ 3
- 0-29：short_tenure_count ≥ 4，极度不稳定

overall_score 计算规则（后端会重算，此处仍需填写）：
overall_score = technical_match × 0.35 + experience_match × 0.25 + cultural_fit × 0.15 + growth_potential × 0.15 + stability × 0.10

recommendation 判断规则：
- overall_score > 85 → strong_recommend
- overall_score 70-85 → recommend
- overall_score 60-70 → consider
- overall_score < 60 → not_recommend

输出JSON格式：
{
  "assessment": {
    "technical_match": 评分,
    "experience_match": 评分,
    "cultural_fit": 合成分（collaboration×0.4 + ownership×0.4 + communication×0.2），
    "cultural_fit_detail": {
      "collaboration_score": 协作信号评分,
      "ownership_score": 主人翁信号评分,
      "communication_score": 沟通信号评分,
      "collaboration_evidence": ["引用的具体证据"],
      "ownership_evidence": ["引用的具体证据"],
      "communication_evidence": ["引用的具体证据"]
    },
    "growth_potential": 评分,
    "stability": 评分
  },
  "overall_score": 加权分,
  "strengths": ["优势1（引用具体事实）", "优势2（引用具体事实）", "优势3（引用具体事实）"],
  "weaknesses": ["短板1（引用具体事实）", "短板2（引用具体事实）"],
  "gap_analysis": "基于客观事实的gap分析",
  "recommendation": "按规则判断",
  "confidence_score": 0-1,
  "rationale": ["理由1（引用具体数据）", "理由2", "理由3"],
  "expected_success_rate": 0-1,
  "salary_match": "薪资匹配分析",
  "risk_factors": ["风险1", "风险2"],
  "technical_questions": [{"question":"问题","reference_answer":"答案","scoring_criteria":"标准","competency_assessed":"维度","red_flags":"警告"}],
  "behavioral_questions": [{"question":"问题","expected_points":"要点","scoring_criteria":"标准","competency_assessed":"维度","red_flags":"警告"}],
  "situational_questions": [{"scenario":"场景","question":"问题","reference_answer":"答案","scoring_criteria":"标准","competency_assessed":"维度","red_flags":"警告"}]
}

只输出JSON，不要其他文字。`;

  const parsed = safeJSONParse(await callDeepSeek(systemPrompt, userPrompt, 0, '基于事实评分'), '综合评估结果格式错误');

  // 后端强制重算 overall_score 和 recommendation
  if (parsed.assessment) {
    const a = parsed.assessment;

    // cultural_fit 由3个子指标重算，有证据支撑；无子指标则回退到 AI 给的合成分
    if (a.cultural_fit_detail) {
      const d = a.cultural_fit_detail;
      a.cultural_fit = Math.round(
        (d.collaboration_score || 50) * 0.4 +
        (d.ownership_score || 50) * 0.4 +
        (d.communication_score || 50) * 0.2
      );
    }

    parsed.overall_score = Math.round(
      (a.technical_match || 0) * 0.35 +
      (a.experience_match || 0) * 0.25 +
      (a.cultural_fit || 0) * 0.15 +
      (a.growth_potential || 0) * 0.15 +
      (a.stability || 0) * 0.10
    );
    const s = parsed.overall_score;
    parsed.recommendation = s > 85 ? 'strong_recommend'
      : s >= 70 ? 'recommend'
      : s >= 60 ? 'consider'
      : 'not_recommend';
  }

  // ── 写入缓存 ──
  setToCache(cacheKey, parsed);
  console.log(`💾 [缓存写入] 候选人: ${candidateData.basic_info?.name || '未知'}`);

  return parsed;
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
