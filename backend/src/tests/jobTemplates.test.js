import { describe, test, expect } from '@jest/globals';
import { jobTemplates, searchTemplates, getCategories } from '../data/jobTemplates.js';

describe('Job Templates Tests', () => {
  describe('jobTemplates数据结构', () => {
    test('应该包含模板数组', () => {
      expect(Array.isArray(jobTemplates)).toBe(true);
      expect(jobTemplates.length).toBeGreaterThan(0);
    });

    test('每个模板应该有必需字段', () => {
      jobTemplates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('companyBackground');
        expect(template).toHaveProperty('jobDescription');

        // 字段类型检查
        expect(typeof template.id).toBe('string');
        expect(typeof template.name).toBe('string');
        expect(typeof template.category).toBe('string');
        expect(typeof template.companyBackground).toBe('string');
        expect(typeof template.jobDescription).toBe('string');

        // 内容不应为空
        expect(template.name.length).toBeGreaterThan(0);
        expect(template.companyBackground.length).toBeGreaterThan(0);
        expect(template.jobDescription.length).toBeGreaterThan(0);
      });
    });

    test('模板ID应该是唯一的', () => {
      const ids = jobTemplates.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('应该包含预期的岗位类型', () => {
      const names = jobTemplates.map(t => t.name);
      expect(names).toContain('全栈工程师');
      expect(names).toContain('前端工程师');
      expect(names).toContain('后端工程师');
    });
  });

  describe('searchTemplates()', () => {
    test('应该能搜索岗位名称', () => {
      const results = searchTemplates('全栈');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.name.includes('全栈'))).toBe(true);
    });

    test('应该能搜索关键词', () => {
      const results = searchTemplates('React');
      expect(results.length).toBeGreaterThan(0);
    });

    test('搜索应该不区分大小写', () => {
      const lower = searchTemplates('react');
      const upper = searchTemplates('REACT');
      expect(lower.length).toBeGreaterThan(0);
      expect(upper.length).toBeGreaterThan(0);
    });

    test('空关键词应该返回所有模板', () => {
      const results = searchTemplates('');
      expect(results.length).toBe(jobTemplates.length);
    });

    test('不存在的关键词应该返回空数组', () => {
      const results = searchTemplates('不存在的关键词xyz123');
      expect(results.length).toBe(0);
    });

    test('应该在描述中搜索', () => {
      const results = searchTemplates('AI');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getCategories()', () => {
    test('应该返回分类数组', () => {
      const categories = getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    test('分类应该是唯一的', () => {
      const categories = getCategories();
      const uniqueCategories = new Set(categories);
      expect(uniqueCategories.size).toBe(categories.length);
    });

    test('应该包含预期的分类', () => {
      const categories = getCategories();
      expect(categories).toContain('技术');
    });

    test('每个分类都应该有对应的模板', () => {
      const categories = getCategories();
      categories.forEach(category => {
        const templatesInCategory = jobTemplates.filter(t => t.category === category);
        expect(templatesInCategory.length).toBeGreaterThan(0);
      });
    });
  });

  describe('模板内容质量检查', () => {
    test('公司背景应该有足够的描述', () => {
      jobTemplates.forEach(template => {
        expect(template.companyBackground.length).toBeGreaterThan(50);
      });
    });

    test('岗位描述应该包含职责和要求', () => {
      jobTemplates.forEach(template => {
        const jd = template.jobDescription;
        // 应该包含一些关键字
        const hasResponsibility = jd.includes('职责') || jd.includes('负责') || jd.includes('工作');
        const hasRequirement = jd.includes('要求') || jd.includes('能力') || jd.includes('经验');
        expect(hasResponsibility || hasRequirement).toBe(true);
      });
    });
  });
});
