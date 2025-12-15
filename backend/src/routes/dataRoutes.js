import express from 'express';
import * as companyBgModel from '../models/companyBackgroundModel.js';
import * as jobPositionModel from '../models/jobPositionModel.js';
import * as assessmentModel from '../models/assessmentModel.js';

const router = express.Router();

/**
 * =====================================
 * 公司背景相关 API
 * =====================================
 */

// 获取当前激活的公司背景
router.get('/company-background', async (req, res) => {
  try {
    const background = await companyBgModel.getActiveCompanyBackground();
    res.json({ success: true, data: background });
  } catch (error) {
    console.error('获取公司背景失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 保存公司背景
router.post('/company-background', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: '公司背景内容不能为空' });
    }

    const background = await companyBgModel.saveCompanyBackground(content);
    res.json({ success: true, data: background });
  } catch (error) {
    console.error('保存公司背景失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取公司背景历史
router.get('/company-background/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await companyBgModel.getCompanyBackgroundHistory(limit);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('获取公司背景历史失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * =====================================
 * 岗位相关 API
 * =====================================
 */

// 获取岗位历史列表
router.get('/job-positions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    console.log('📖 [API] 获取岗位历史列表, limit:', limit);

    const positions = await jobPositionModel.getJobPositionHistory(limit);
    console.log('📊 [API] 查询到岗位数量:', positions.length);

    if (positions.length > 0) {
      console.log('📋 [API] 第一条岗位数据:', JSON.stringify(positions[0], null, 2));
    } else {
      console.log('⚠️  [API] 数据库中暂无岗位历史记录');
    }

    res.json({ success: true, data: positions });
  } catch (error) {
    console.error('❌ [API] 获取岗位历史失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建或更新岗位
router.post('/job-positions', async (req, res) => {
  try {
    const { jobTitle, jobDescription, companyBackgroundId } = req.body;

    if (!jobTitle || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: '岗位名称和岗位描述不能为空'
      });
    }

    const position = await jobPositionModel.createOrUpdateJobPosition(
      jobTitle,
      jobDescription,
      companyBackgroundId
    );

    res.json({ success: true, data: position });
  } catch (error) {
    console.error('保存岗位失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 根据ID获取岗位详情
router.get('/job-positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const position = await jobPositionModel.getJobPositionById(id);

    if (!position) {
      return res.status(404).json({ success: false, error: '岗位不存在' });
    }

    res.json({ success: true, data: position });
  } catch (error) {
    console.error('获取岗位详情失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 搜索岗位
router.get('/job-positions/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const positions = await jobPositionModel.searchJobPositionsByTitle(term, limit);
    res.json({ success: true, data: positions });
  } catch (error) {
    console.error('搜索岗位失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * =====================================
 * 评估报告相关 API
 * =====================================
 */

// 保存完整的评估报告
router.post('/assessment-reports', async (req, res) => {
  try {
    const { reportData, candidatesData } = req.body;

    if (!reportData || !candidatesData || candidatesData.length === 0) {
      return res.status(400).json({
        success: false,
        error: '报告数据和候选人数据不能为空'
      });
    }

    const result = await assessmentModel.saveCompleteAssessment(reportData, candidatesData);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('保存评估报告失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取评估报告详情
router.get('/assessment-reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await assessmentModel.getAssessmentReportById(id);

    if (!report) {
      return res.status(404).json({ success: false, error: '评估报告不存在' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('获取评估报告失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取评估历史列表
router.get('/assessment-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await assessmentModel.getAssessmentHistory(limit);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('获取评估历史失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * =====================================
 * 数据库健康检查
 * =====================================
 */
router.get('/health', async (req, res) => {
  try {
    const { query } = await import('../config/database.js');
    const result = await query('SELECT NOW() as time, version() as version');

    res.json({
      success: true,
      database: 'PostgreSQL',
      connected: true,
      time: result.rows[0].time,
      version: result.rows[0].version
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      database: 'PostgreSQL',
      connected: false,
      error: error.message
    });
  }
});

export default router;
