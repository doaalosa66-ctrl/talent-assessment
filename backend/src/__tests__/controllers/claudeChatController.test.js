import { jest } from '@jest/globals';
import { handleClaudeChat } from '../../controllers/claudeChatController.js';
import claudeService from '../../services/claudeService.js';
import fs from 'fs';

jest.mock('../../services/claudeService.js');
jest.mock('fs');

describe('claudeChatController - handleClaudeChat', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('[]');
  });

  describe('Unit Tests - Input Validation', () => {
    test('should return 400 error when messages is undefined', async () => {
      req.body = { apiKey: 'sk-ant-test-key' };
      await handleClaudeChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'messages 必须为字符串数组'
      });
    });

    test('should return 400 error when messages is null', async () => {
      req.body = { messages: null, apiKey: 'sk-ant-test-key' };
      await handleClaudeChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 400 error when messages is not an array', async () => {
      req.body = { messages: 'not an array', apiKey: 'sk-ant-test-key' };
      await handleClaudeChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 400 error when messages is empty array', async () => {
      req.body = { messages: [], apiKey: 'sk-ant-test-key' };
      await handleClaudeChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Unit Tests - API Key Handling', () => {
    test('should return 400 when no apiKey and no saved accounts', async () => {
      req.body = { messages: [{ role: 'user', content: 'Hello' }] };
      fs.existsSync.mockReturnValue(false);
      await handleClaudeChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should read apiKey from file when not provided', async () => {
      const savedApiKey = 'sk-ant-saved-key-12345678';
      req.body = { messages: [{ role: 'user', content: 'Hello' }] };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify([{ apiKey: savedApiKey }]));
      claudeService.sendChat.mockResolvedValue('Response');
      await handleClaudeChat(req, res);
      expect(claudeService.sendChat).toHaveBeenCalledWith(
        [{ role: 'user', content: 'Hello' }],
        savedApiKey
      );
    });
  });

  describe('Boundary Tests - Extreme Inputs', () => {
    test('should handle extremely long message (10000 chars)', async () => {
      const apiKey = 'sk-ant-test-key-12345678';
      const longContent = 'A'.repeat(10000);
      req.body = { messages: [{ role: 'user', content: longContent }], apiKey };
      claudeService.sendChat.mockResolvedValue('Processed');
      await handleClaudeChat(req, res);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { reply: 'Processed' }
      });
    });

    test('should handle XSS attempts safely', async () => {
      const apiKey = 'sk-ant-test-key-12345678';
      const xssContent = '<script>alert("XSS")</script>';
      req.body = { messages: [{ role: 'user', content: xssContent }], apiKey };
      claudeService.sendChat.mockResolvedValue('Safe');
      await handleClaudeChat(req, res);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { reply: 'Safe' }
      });
    });
  });

  describe('Integration Tests - Real Scenarios', () => {
    test('Scenario: New user first time usage', async () => {
      const apiKey = 'sk-ant-api03-new-user-key-12345678';
      const messages = [{ role: 'user', content: 'Hello' }];
      req.body = { messages, apiKey };
      claudeService.sendChat.mockResolvedValue('Welcome!');
      await handleClaudeChat(req, res);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { reply: 'Welcome!' }
      });
    });
  });
});
