import { jest } from '@jest/globals';
import * as deepseekService from '../../services/deepseekService.js';
import OpenAI from 'openai';

jest.mock('openai');

describe('deepseekService', () => {
  let mockCreate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate = jest.fn();
    OpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));
  });

  describe('callDeepSeek - Unit Tests', () => {
    test('should successfully call DeepSeek API', async () => {
      const expectedResponse = 'AI response';
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: expectedResponse } }]
      });

      const result = await deepseekService.callDeepSeek('system', 'user', 0.7, 'Test');
      expect(result).toBe(expectedResponse);
    });

    test('should throw error when API call fails', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));
      await expect(
        deepseekService.callDeepSeek('system', 'user', 0.7, 'Test')
      ).rejects.toThrow('AI分析服务暂时不可用，请稍后重试');
    });
  });

  describe('analyzeJobDescription - Unit Tests', () => {
    test('should analyze job description successfully', async () => {
      const mockAnalysis = {
        core_competencies: ['Java', 'Spring Boot'],
        skill_weights: { 'Java': 50, 'Spring Boot': 50 }
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockAnalysis) } }]
      });

      const result = await deepseekService.analyzeJobDescription('company', 'job');
      expect(result).toEqual(mockAnalysis);
    });

    test('should handle invalid JSON response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Invalid JSON' } }]
      });

      await expect(
        deepseekService.analyzeJobDescription('company', 'job')
      ).rejects.toThrow();
    });
  });

  describe('parseResume - Unit Tests', () => {
    test('should parse resume and extract structured data', async () => {
      const mockData = {
        basic_info: { name: 'Test', years_of_experience: 5 }
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockData) } }]
      });

      const result = await deepseekService.parseResume('resume text');
      expect(result.basic_info.name).toBe('Test');
    });
  });

  describe('Boundary Tests', () => {
    test('should handle extremely long input', async () => {
      const longText = 'A'.repeat(10000);
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({}) } }]
      });

      const result = await deepseekService.analyzeJobDescription('c', longText);
      expect(result).toBeDefined();
    });

    test('should handle empty input', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ basic_info: {} }) } }]
      });

      const result = await deepseekService.parseResume('');
      expect(result).toBeDefined();
    });
  });
});
