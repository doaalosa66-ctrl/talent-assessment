import { parseResumeFile } from '../services/resumeParserService.js';
import {
  analyzeJobDescription,
  quickComprehensiveAssessment
} from '../services/deepseekService.js';
import { broadcastProgress } from '../index.js';
import { generatePDFReport } from '../services/pdfExportService.js';
import path from 'path';
import fs from 'fs';

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

    // 推送进度：开始评估
    broadcastProgress({
      type: 'progress',
      stage: 'start',
      message: '开始评估流程...',
      progress: 0
    });

    // 并行执行：岗位分析 + 简历解析
    console.log('1. 并行处理岗位分析和简历解析...');
    broadcastProgress({
      type: 'progress',
      stage: 'job_analysis',
      message: '正在分析岗位要求...',
      progress: 10
    });

    const [jobAnalysis, candidatesData] = await Promise.all([
      // 岗位分析
      analyzeJobDescription(companyBackground, jobDescription),

      // 批量解析简历（捕获每个简历的解析错误）
      Promise.all(
        resumeFiles.map(async (file, index) => {
          try {
            // 从文件扩展名获取文件类型
            const fileExt = file.originalname.split('.').pop().toLowerCase();
            const resumeData = await parseResumeFile(file.path, fileExt);
            return {
              success: true,
              data: resumeData.structured_data,
              rawText: resumeData.raw_text,
              filename: file.originalname
            };
          } catch (error) {
            console.error(`简历解析失败 [${file.originalname}]:`, error.message);
            return {
              success: false,
              error: error.message,
              filename: file.originalname,
              data: {
                basic_info: {
                  name: file.originalname.replace(/\.[^/.]+$/, ''), // 使用文件名作为候选人名称
                  contact: '未解析',
                  email: '未解析'
                },
                parse_failed: true,
                parse_error: error.message
              }
            };
          }
        })
      )
    ]);

    console.log(`步骤1完成，耗时: ${Date.now() - startTime}ms`);

    broadcastProgress({
      type: 'progress',
      stage: 'resume_parsed',
      message: `已解析 ${candidatesData.length} 份简历`,
      progress: 30
    });

    // 并行执行所有候选人的综合评估（合并评估+决策+测评为一次AI调用）
    console.log('2. 并行评估所有候选人...');
    broadcastProgress({
      type: 'progress',
      stage: 'assessing',
      message: `开始评估 ${candidatesData.length} 位候选人...`,
      progress: 40
    });

    const step2Start = Date.now();
    const totalCandidates = candidatesData.length;
    let completedCandidates = 0;

    const finalResults = await Promise.all(
      candidatesData.map(async (candidateResult, index) => {
        const candidateData = candidateResult.data;

        // 如果简历解析失败，直接返回未解析状态
        if (!candidateResult.success || candidateData.parse_failed) {
          completedCandidates++;
          const candidateProgress = 40 + Math.floor((completedCandidates / totalCandidates) * 50);
          broadcastProgress({
            type: 'progress',
            stage: 'parse_failed',
            message: `简历解析失败: ${candidateResult.filename} (${completedCandidates}/${totalCandidates})`,
            progress: candidateProgress,
            candidateName: candidateResult.filename
          });

          return {
            candidate_info: candidateData.basic_info,
            parse_status: {
              success: false,
              error: candidateResult.error || candidateData.parse_error || '简历解析失败',
              filename: candidateResult.filename
            },
            assessment: {
              assessment: {},
              overall_score: 0,
              strengths: [],
              weaknesses: [],
              gap_analysis: '由于简历解析失败，无法进行评估'
            },
            decision: {
              recommendation: 'parse_failed',
              confidence_score: 0,
              rationale: [`简历解析失败: ${candidateResult.error || candidateData.parse_error}`],
              expected_success_rate: 0,
              salary_match: '无法评估',
              risk_factors: []
            },
            custom_assessment: null
          };
        }

        // 使用快速综合评估（一次AI调用完成所有分析）
        const result = await quickComprehensiveAssessment(jobAnalysis, candidateData, candidateResult.rawText);

        // 更新进度
        completedCandidates++;
        const candidateProgress = 40 + Math.floor((completedCandidates / totalCandidates) * 50);
        broadcastProgress({
          type: 'progress',
          stage: 'assessing_candidate',
          message: `正在评估候选人 ${candidateData.basic_info.name} (${completedCandidates}/${totalCandidates})`,
          progress: candidateProgress,
          candidateName: candidateData.basic_info.name
        });

        return {
          candidate_info: candidateData.basic_info,
          parse_status: {
            success: true
          },
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
    broadcastProgress({
      type: 'progress',
      stage: 'generating_report',
      message: '生成完整评估报告...',
      progress: 95
    });

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
    console.log('📊 job_analysis 数据结构:', JSON.stringify({
      core_competencies: jobAnalysis.core_competencies,
      skill_weights: jobAnalysis.skill_weights
    }, null, 2));

    // 推送完成消息
    broadcastProgress({
      type: 'complete',
      stage: 'complete',
      message: '评估完成！',
      progress: 100,
      data: report
    });

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

/**
 * 导出PDF报告
 */
export async function exportPDF(req, res) {
  try {
    const reportData = req.body;

    if (!reportData || !reportData.job_analysis || !reportData.candidates_detail) {
      return res.status(400).json({ error: '缺少报告数据' });
    }

    // 创建临时目录
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 生成唯一文件名
    const filename = `评估报告_${Date.now()}.pdf`;
    const outputPath = path.join(tempDir, filename);

    // 生成PDF
    console.log('📄 开始生成PDF报告...');
    await generatePDFReport(reportData, outputPath);
    console.log('✅ PDF报告生成成功:', filename);

    // 发送文件
    res.download(outputPath, filename, (err) => {
      // 删除临时文件
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      if (err) {
        console.error('❌ PDF下载失败:', err);
      }
    });
  } catch (error) {
    console.error('❌ 导出PDF失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '导出PDF失败'
    });
  }
}

/**
 * 导出Word报告
 */
export async function exportWord(req, res) {
  try {
    const reportData = req.body;

    if (!reportData || !reportData.job_analysis || !reportData.candidates_detail) {
      return res.status(400).json({ error: '缺少报告数据' });
    }

    // 创建临时目录
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 生成唯一文件名
    const filename = `评估报告_${Date.now()}.docx`;
    const outputPath = path.join(tempDir, filename);

    // 生成Word文档（简单的HTML转Word）
    console.log('📄 开始生成Word报告...');

    // 生成HTML格式的报告内容
    const htmlContent = generateHTMLReport(reportData);

    // 保存为.doc格式（实际上是HTML，但使用.docx扩展名Word可以打开）
    fs.writeFileSync(outputPath, htmlContent, 'utf8');
    console.log('✅ Word报告生成成功:', filename);

    // 发送文件
    res.download(outputPath, filename, (err) => {
      // 删除临时文件
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      if (err) {
        console.error('❌ Word下载失败:', err);
      }
    });
  } catch (error) {
    console.error('❌ 导出Word失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '导出Word失败'
    });
  }
}

/**
 * 生成HTML格式的报告（Word可以打开）
 */
function generateHTMLReport(reportData) {
  const recMap = {
    strong_recommend: '强烈推荐',
    recommend: '推荐',
    consider: '待定',
    not_recommend: '不推荐'
  };

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>智能人才评估报告</title>
  <style>
    body { font-family: "微软雅黑", Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #1890ff; text-align: center; border-bottom: 3px solid #1890ff; padding-bottom: 10px; }
    h2 { color: #1890ff; margin-top: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
    h3 { color: #333; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #1890ff; color: white; }
    .candidate-section { page-break-before: always; margin-top: 40px; }
    ul { list-style-type: none; padding-left: 0; }
    li { margin: 8px 0; padding-left: 20px; }
    .strength::before { content: "✓ "; color: #52c41a; font-weight: bold; }
    .weakness::before { content: "⚠ "; color: #faad14; font-weight: bold; }
  </style>
</head>
<body>
  <h1>智能人才评估报告</h1>
  <p style="text-align: center; color: #666;">生成时间: ${new Date().toLocaleString('zh-CN')}</p>

  <h2>一、岗位能力分析</h2>
  <h3>核心能力维度</h3>
  <ul>
    ${reportData.job_analysis.core_competencies?.map((comp, index) => {
      const name = typeof comp === 'string' ? comp : (comp.dimension || comp.name || `能力${index + 1}`);
      const weight = reportData.job_analysis.skill_weights?.[name] || 0;
      return `<li>${index + 1}. ${name} (权重: ${weight}%)</li>`;
    }).join('') || ''}
  </ul>

  <h3>硬性要求</h3>
  <ul>
    ${reportData.job_analysis.critical_requirements?.map((req, index) => {
      const text = typeof req === 'string' ? req : (req.requirement || req.description || '');
      return `<li>${index + 1}. ${text}</li>`;
    }).join('') || ''}
  </ul>

  <h2>二、候选人综合对比</h2>
  <table>
    <tr>
      <th>候选人</th>
      <th>技术匹配</th>
      <th>经验匹配</th>
      <th>文化契合</th>
      <th>综合评分</th>
    </tr>
    ${reportData.candidates_overview?.sort((a, b) => b.overall_score - a.overall_score).map(candidate => `
    <tr>
      <td>${candidate.name}</td>
      <td>${candidate.technical_match}%</td>
      <td>${candidate.experience_match}%</td>
      <td>${candidate.cultural_fit}%</td>
      <td><strong>${candidate.overall_score}</strong></td>
    </tr>
    `).join('') || ''}
  </table>

  ${reportData.candidates_detail?.map((candidate, index) => `
  <div class="candidate-section">
    <h2>三、候选人详细分析 (${index + 1}/${reportData.candidates_detail.length})</h2>
    <h3 style="color: #1890ff;">${candidate.candidate_info.name}</h3>
    <p><strong>工作年限:</strong> ${candidate.candidate_info.years_of_experience || '未知'}</p>
    <p><strong>当前职位:</strong> ${candidate.candidate_info.current_position || '未知'}</p>
    <p><strong>联系方式:</strong> ${typeof candidate.candidate_info.contact === 'object'
      ? Object.entries(candidate.candidate_info.contact).map(([k, v]) => `${k}: ${v}`).join(' | ')
      : (candidate.candidate_info.contact || '未提供')}</p>

    <h3>核心优势</h3>
    <ul>
      ${candidate.assessment.strengths?.map(s => `<li class="strength">${s}</li>`).join('') || ''}
    </ul>

    <h3>潜在风险</h3>
    <ul>
      ${candidate.assessment.weaknesses?.map(w => `<li class="weakness">${w}</li>`).join('') || ''}
    </ul>

    <h3>差距分析</h3>
    <p>${candidate.assessment.gap_analysis || '暂无'}</p>

    <h3>邀约建议</h3>
    <p><strong>推荐等级:</strong> ${recMap[candidate.decision.recommendation] || '未知'}</p>
    <p><strong>置信度:</strong> ${Math.round(candidate.decision.confidence_score * 100)}%</p>
    <p><strong>预期通过率:</strong> ${Math.round(candidate.decision.expected_success_rate * 100)}%</p>

    <h3>决策理由</h3>
    <ul>
      ${candidate.decision.rationale?.map((r, i) => `<li>${i + 1}. ${r}</li>`).join('') || ''}
    </ul>

    ${candidate.custom_assessment ? `
    <h3>定制化测评题目</h3>
    <h4>技术深度测评题:</h4>
    ${candidate.custom_assessment.technical_questions?.map((q, i) => `
      <div style="margin: 15px 0; padding: 15px; background: #f5f5f5; border-left: 3px solid #1890ff;">
        <p><strong>题目 ${i + 1}:</strong> ${q.question}</p>
        <p><em>考察维度: ${q.competency_assessed}</em></p>
      </div>
    `).join('') || ''}
    ` : ''}
  </div>
  `).join('') || ''}

</body>
</html>
  `;

  return html;
}

export default {
  performAssessment,
  exportPDF,
  exportWord
};
