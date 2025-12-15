import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { jobTemplates, searchTemplates, getCategories } from '../data/jobTemplates.js';

// 创建测试服务器
function createTestServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // 健康检查
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '路之音智能人才评估系统运行中' });
  });

  // 岗位模板API
  app.get('/api/job-templates', (req, res) => {
    try {
      const { keyword, category } = req.query;
      let templates = jobTemplates;

      if (keyword) {
        templates = searchTemplates(keyword);
      }

      if (category) {
        templates = templates.filter(t => t.category === category);
      }

      res.json({
        success: true,
        data: {
          templates,
          categories: getCategories()
        }
      });
    } catch (error) {
      console.error('获取模板失败:', error);
      res.status(500).json({ error: '获取模板失败' });
    }
  });

  // 获取单个模板
  app.get('/api/job-templates/:id', (req, res) => {
    try {
      const template = jobTemplates.find(t => t.id === req.params.id);
      if (!template) {
        return res.status(404).json({ error: '模板不存在' });
      }
      res.json({ success: true, data: template });
    } catch (error) {
      console.error('获取模板失败:', error);
      res.status(500).json({ error: '获取模板失败' });
    }
  });

  return app;
}

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestServer();
  });

  describe('GET /api/health', () => {
    test('应该返回健康状态', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('路之音');
    });
  });

  describe('GET /api/job-templates', () => {
    test('应该返回所有模板', async () => {
      const response = await request(app)
        .get('/api/job-templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('templates');
      expect(response.body.data).toHaveProperty('categories');
      expect(Array.isArray(response.body.data.templates)).toBe(true);
      expect(response.body.data.templates.length).toBeGreaterThan(0);
    });

    test('应该支持关键词搜索', async () => {
      const response = await request(app)
        .get('/api/job-templates?keyword=全栈')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates.length).toBeGreaterThan(0);
      expect(response.body.data.templates.some(t =>
        t.name.includes('全栈') || t.jobDescription.includes('全栈')
      )).toBe(true);
    });

    test('应该支持分类筛选', async () => {
      const response = await request(app)
        .get('/api/job-templates?category=技术')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates.every(t =>
        t.category === '技术'
      )).toBe(true);
    });

    test('应该支持关键词+分类组合搜索', async () => {
      const response = await request(app)
        .get('/api/job-templates?keyword=React&category=技术')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.templates.length > 0) {
        expect(response.body.data.templates.every(t =>
          t.category === '技术'
        )).toBe(true);
      }
    });

    test('不存在的关键词应该返回空数组', async () => {
      const response = await request(app)
        .get('/api/job-templates?keyword=不存在的关键词xyz123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates.length).toBe(0);
    });

    test('应该返回分类列表', async () => {
      const response = await request(app)
        .get('/api/job-templates')
        .expect(200);

      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/job-templates/:id', () => {
    test('应该返回指定模板', async () => {
      const firstTemplate = jobTemplates[0];
      const response = await request(app)
        .get(`/api/job-templates/${firstTemplate.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', firstTemplate.id);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('companyBackground');
      expect(response.body.data).toHaveProperty('jobDescription');
    });

    test('不存在的ID应该返回404', async () => {
      const response = await request(app)
        .get('/api/job-templates/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('不存在');
    });

    test('返回的模板应该包含完整信息', async () => {
      const template = jobTemplates[0];
      const response = await request(app)
        .get(`/api/job-templates/${template.id}`)
        .expect(200);

      const data = response.body.data;
      expect(data.companyBackground.length).toBeGreaterThan(0);
      expect(data.jobDescription.length).toBeGreaterThan(0);
    });
  });

  describe('API错误处理', () => {
    test('无效的端点应该返回404', async () => {
      await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);
    });

    test('API应该支持CORS', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // CORS头应该存在（由于使用了cors()中间件）
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('响应格式验证', () => {
    test('成功响应应该有统一格式', async () => {
      const response = await request(app)
        .get('/api/job-templates')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    test('错误响应应该有统一格式', async () => {
      const response = await request(app)
        .get('/api/job-templates/invalid-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });
});
