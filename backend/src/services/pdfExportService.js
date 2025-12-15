import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中文字体路径（使用Windows系统自带的微软雅黑）
const FONT_PATH = 'C:/Windows/Fonts/msyh.ttc';

/**
 * 生成PDF评估报告
 */
export async function generatePDFReport(reportData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // 注册中文字体
      doc.registerFont('MicrosoftYaHei', FONT_PATH);

      // 标题
      doc.font('MicrosoftYaHei')
        .fontSize(24)
        .fillColor('#1890ff')
        .text('路之音智能人才评估报告', { align: 'center' });

      doc.moveDown(0.5);
      doc.font('MicrosoftYaHei')
        .fontSize(12)
        .fillColor('#666')
        .text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, { align: 'center' });

      doc.moveDown(2);

      // 1. 岗位能力分析
      addSection(doc, '一、岗位能力分析');
      doc.font('MicrosoftYaHei').fontSize(10).fillColor('#333');

      doc.font('MicrosoftYaHei').text('核心能力维度:', { continued: false });
      doc.font('MicrosoftYaHei');
      reportData.job_analysis.core_competencies?.forEach((comp, index) => {
        const name = typeof comp === 'string' ? comp : (comp.dimension || comp.name);
        const weight = reportData.job_analysis.skill_weights?.[name] || 0;
        doc.text(`  ${index + 1}. ${name} (权重: ${weight}%)`, { indent: 20 });
      });

      doc.moveDown();
      doc.font('MicrosoftYaHei').text('硬性要求:', { continued: false });
      doc.font('MicrosoftYaHei');
      reportData.job_analysis.critical_requirements?.forEach((req, index) => {
        const text = typeof req === 'string' ? req : (req.requirement || req.description);
        doc.text(`  ${index + 1}. ${text}`, { indent: 20 });
      });

      doc.addPage();

      // 2. 候选人综合对比
      addSection(doc, '二、候选人综合对比');

      // 绘制对比表格
      const sortedCandidates = [...reportData.candidates_overview].sort((a, b) => b.overall_score - a.overall_score);

      let tableY = doc.y;
      const colWidths = [150, 90, 90, 90, 90];
      const headers = ['候选人', '技术匹配', '经验匹配', '文化契合', '综合评分'];

      // 表头
      doc.font('MicrosoftYaHei').fontSize(9);
      let currentX = 50;
      headers.forEach((header, i) => {
        doc.rect(currentX, tableY, colWidths[i], 25).stroke();
        doc.text(header, currentX + 5, tableY + 8, { width: colWidths[i] - 10 });
        currentX += colWidths[i];
      });

      // 表格数据
      doc.font('MicrosoftYaHei');
      tableY += 25;
      sortedCandidates.forEach((candidate) => {
        currentX = 50;
        const rowData = [
          candidate.name,
          `${candidate.technical_match}%`,
          `${candidate.experience_match}%`,
          `${candidate.cultural_fit}%`,
          candidate.overall_score.toString()
        ];

        rowData.forEach((data, i) => {
          doc.rect(currentX, tableY, colWidths[i], 20).stroke();
          doc.text(data, currentX + 5, tableY + 5, { width: colWidths[i] - 10 });
          currentX += colWidths[i];
        });

        tableY += 20;

        if (tableY > 700) {
          doc.addPage();
          tableY = 50;
        }
      });

      doc.addPage();

      // 3. 候选人详细分析
      reportData.candidates_detail?.forEach((candidate, index) => {
        if (index > 0) doc.addPage();

        addSection(doc, `三、候选人详细分析 (${index + 1}/${reportData.candidates_detail.length})`);

        doc.font('MicrosoftYaHei').fontSize(14).fillColor('#1890ff')
          .text(candidate.candidate_info.name, { underline: true });

        doc.moveDown(0.5);
        doc.font('MicrosoftYaHei').fontSize(10).fillColor('#333');
        doc.text(`工作年限: ${candidate.candidate_info.years_of_experience || '未知'}`);
        doc.text(`当前职位: ${candidate.candidate_info.current_position || '未知'}`);
        doc.text(`联系方式: ${candidate.candidate_info.contact || '未提供'}`);

        doc.moveDown();
        doc.font('MicrosoftYaHei').text('核心优势:');
        doc.font('MicrosoftYaHei');
        candidate.assessment.strengths?.forEach((strength, idx) => {
          doc.text(`  ✓ ${strength}`, { indent: 20 });
        });

        doc.moveDown();
        doc.font('MicrosoftYaHei').text('潜在风险:');
        doc.font('MicrosoftYaHei');
        candidate.assessment.weaknesses?.forEach((weakness, idx) => {
          doc.text(`  ⚠ ${weakness}`, { indent: 20 });
        });

        doc.moveDown();
        doc.font('MicrosoftYaHei').text('差距分析:');
        doc.font('MicrosoftYaHei');
        doc.text(candidate.assessment.gap_analysis, { indent: 20 });

        doc.moveDown();
        doc.font('MicrosoftYaHei').text('邀约建议:');
        doc.font('MicrosoftYaHei');
        const recMap = {
          strong_recommend: '强烈推荐',
          recommend: '推荐',
          consider: '待定',
          not_recommend: '不推荐'
        };
        doc.text(`  推荐等级: ${recMap[candidate.decision.recommendation] || '未知'}`, { indent: 20 });
        doc.text(`  置信度: ${Math.round(candidate.decision.confidence_score * 100)}%`, { indent: 20 });
        doc.text(`  预期通过率: ${Math.round(candidate.decision.expected_success_rate * 100)}%`, { indent: 20 });

        doc.moveDown();
        doc.font('MicrosoftYaHei').text('决策理由:');
        doc.font('MicrosoftYaHei');
        candidate.decision.rationale?.forEach((reason, idx) => {
          doc.text(`  ${idx + 1}. ${reason}`, { indent: 20 });
        });

        // 添加测评题（如果有）
        if (candidate.custom_assessment) {
          doc.addPage();
          addSection(doc, '四、定制化测评题目');

          doc.font('MicrosoftYaHei').fontSize(11).text('技术深度测评题:');
          doc.font('MicrosoftYaHei').fontSize(9);
          candidate.custom_assessment.technical_questions?.forEach((q, idx) => {
            doc.moveDown(0.5);
            doc.font('MicrosoftYaHei').text(`题目 ${idx + 1}:`, { indent: 20 });
            doc.font('MicrosoftYaHei').text(q.question, { indent: 30 });
            doc.text(`考察维度: ${q.competency_assessed}`, { indent: 30 });
          });
        }
      });

      // 页脚
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(pages.start + i);
        doc.font('MicrosoftYaHei')
          .fontSize(8)
          .fillColor('#999')
          .text(
            `第 ${i + 1} 页 / 共 ${pages.count} 页`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
      }

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 添加章节标题
 */
function addSection(doc, title) {
  doc.font('MicrosoftYaHei')
    .fontSize(16)
    .fillColor('#1890ff')
    .text(title);
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke('#1890ff');
  doc.moveDown();
}

export default {
  generatePDFReport
};
