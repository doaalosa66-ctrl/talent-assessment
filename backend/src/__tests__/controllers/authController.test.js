import { jest } from '@jest/globals';
import { subscribeClaude } from '../../controllers/authController.js';
import claudeService from '../../services/claudeService.js';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('../../services/claudeService.js');
jest.mock('fs');

describe('authController - subscribeClaude', () => {
  let req, res;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();

    // 模拟request和response对象
    req = {
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // 默认mock文件系统
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('[]');
    fs.writeFileSync.mockReturnValue(undefined);
  });

  describe('单元测试 - 输入验证', () => {
    test('应该在缺少apiKey时返回400错误', async () => {
      req.body = { name: 'Test User' };

      await subscribeClaude(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'apiKey 为必填项'
      });
    });

    test('应该在apiKey为空字符串时返回400错误', async () => {
      req.body = { apiKey: '', name: 'Test User' };

      await subscribeClaude(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'apiKey 为必填项'
      });
    });

    test('应该在apiKey为null时返回400错误', async () => {
      req.body = { apiKey: null, name: 'Test User' };

      await subscribeClaude(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'apiKey 为必填项'
      });
    });

    test('应该在apiKey为undefined时返回400错误', async () => {
      req.body = { apiKey: undefined, name: 'Test User' };

      await subscribeClaude(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'apiKey 为必填项'
      });
    });

    test('应该在req.body为空对象时返回400错误', async () => {
      req.body = {};

      await subscribeClaude(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'apiKey 为必填项'
      });
    });

    test('应该在req.body为null时返回400错误', async () => {
      req.body = null;

      await subscribeClaude(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'apiKey 为必填项'
      });
    });
  });

  describe('单元测试 - API Key验证', () => {
    test('应该成功验证有效的API Key并保存账户信息', async () => {
      const validApiKey = 'sk-ant-api03-valid-key-12345678';
      req.body = { apiKey: validApiKey, name: 'John Doe' };

      // Mock API Key验证成功
      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      expect(claudeService.validateApiKey).toHaveBeenCalledWith(validApiKey);
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: expect.any(Number),
          maskedKey: '****5678',
          validated: true
        })
      });
    });

    test('应该在API Key验证失败时仍然保存账户但标记为未验证', async () => {
      const invalidApiKey = 'sk-ant-api03-invalid-key-87654321';
      req.body = { apiKey: invalidApiKey, name: 'Jane Smith' };

      // Mock API Key验证失败
      claudeService.validateApiKey.mockResolvedValue(false);

      await subscribeClaude(req, res);

      expect(claudeService.validateApiKey).toHaveBeenCalledWith(invalidApiKey);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          maskedKey: '****4321',
          validated: false
        })
      });
    });

    test('应该在API Key验证抛出异常时返回500错误', async () => {
      const apiKey = 'sk-ant-api03-error-key-99999999';
      req.body = { apiKey, name: 'Error User' };

      // Mock API Key验证抛出异常
      claudeService.validateApiKey.mockRejectedValue(new Error('Network timeout'));

      await subscribeClaude(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Network timeout'
      });
    });

    test('应该在API Key验证抛出无消息的异常时返回默认错误消息', async () => {
      const apiKey = 'sk-ant-api03-unknown-error';
      req.body = { apiKey, name: 'Unknown Error User' };

      // Mock API Key验证抛出无消息的异常
      claudeService.validateApiKey.mockRejectedValue(new Error());

      await subscribeClaude(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '验证失败'
      });
    });
  });

  describe('单元测试 - API Key掩码处理', () => {
    test('应该正确掩码标准长度的API Key', async () => {
      const apiKey = 'sk-ant-api03-1234567890abcdef';
      req.body = { apiKey, name: 'Test User' };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          maskedKey: '****cdef'
        })
      });
    });

    test('应该正确掩码短API Key（少于4个字符）', async () => {
      const apiKey = 'abc';
      req.body = { apiKey, name: 'Short Key User' };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          maskedKey: '****'
        })
      });
    });

    test('应该正确掩码极长的API Key', async () => {
      const apiKey = 'sk-ant-api03-' + 'a'.repeat(1000) + 'xyz9';
      req.body = { apiKey, name: 'Long Key User' };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          maskedKey: '****xyz9'
        })
      });
    });
  });

  describe('单元测试 - 用户名处理', () => {
    test('应该使用提供的用户名', async () => {
      const apiKey = 'sk-ant-api03-test-key-12345678';
      req.body = { apiKey, name: '张三' };

      claudeService.validateApiKey.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(false);

      await subscribeClaude(req, res);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData[0].name).toBe('张三');
    });

    test('应该在未提供用户名时使用默认名称', async () => {
      const apiKey = 'sk-ant-api03-test-key-12345678';
      req.body = { apiKey };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData[0].name).toBe('Claude User');
    });

    test('应该在用户名为空字符串时使用默认名称', async () => {
      const apiKey = 'sk-ant-api03-test-key-12345678';
      req.body = { apiKey, name: '' };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData[0].name).toBe('Claude User');
    });

    test('应该正确处理包含特殊字符的用户名', async () => {
      const apiKey = 'sk-ant-api03-test-key-12345678';
      req.body = { apiKey, name: '<script>alert("XSS")</script>' };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData[0].name).toBe('<script>alert("XSS")</script>');
    });

    test('应该正确处理包含Emoji的用户名', async () => {
      const apiKey = 'sk-ant-api03-test-key-12345678';
      req.body = { apiKey, name: '用户😀🎉' };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData[0].name).toBe('用户😀🎉');
    });

    test('应该正确处理极长的用户名（1000字符）', async () => {
      const apiKey = 'sk-ant-api03-test-key-12345678';
      const longName = 'A'.repeat(1000);
      req.body = { apiKey, name: longName };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData[0].name).toBe(longName);
      expect(savedData[0].name.length).toBe(1000);
    });
  });

  describe('单元测试 - 文件系统操作', () => {
    test('应该在文件不存在时创建新的账户列表', async () => {
      const apiKey = 'sk-ant-api03-new-file-key';
      req.body = { apiKey, name: 'New File User' };

      claudeService.validateApiKey.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(false);

      await subscribeClaude(req, res);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].name).toBe('New File User');
    });

    test('应该在文件存在时追加新账户到现有列表', async () => {
      const apiKey = 'sk-ant-api03-append-key';
      req.body = { apiKey, name: 'Append User' };

      claudeService.validateApiKey.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(true);

      // Mock现有账户数据
      const existingAccounts = [
        {
          id: 1234567890,
          name: 'Existing User',
          apiKey: 'sk-ant-api03-existing-key',
          maskedKey: '****gkey',
          validated: true,
          createdAt: '2026-01-01T00:00:00.000Z'
        }
      ];
      fs.readFileSync.mockReturnValue(JSON.stringify(existingAccounts));

      await subscribeClaude(req, res);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData).toHaveLength(2);
      expect(savedData[0].name).toBe('Existing User');
      expect(savedData[1].name).toBe('Append User');
    });

    test('应该在文件内容为空时创建新的账户列表', async () => {
      const apiKey = 'sk-ant-api03-empty-file-key';
      req.body = { apiKey, name: 'Empty File User' };

      claudeService.validateApiKey.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('');

      await subscribeClaude(req, res);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].name).toBe('Empty File User');
    });

    test('应该在文件内容为无效JSON时创建新的账户列表', async () => {
      const apiKey = 'sk-ant-api03-invalid-json-key';
      req.body = { apiKey, name: 'Invalid JSON User' };

      claudeService.validateApiKey.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{ invalid json }');

      await subscribeClaude(req, res);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].name).toBe('Invalid JSON User');
    });

    test('应该正确保存账户的所有必需字段', async () => {
      const apiKey = 'sk-ant-api03-complete-data-key-12345678';
      req.body = { apiKey, name: 'Complete Data User' };

      claudeService.validateApiKey.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(false);

      const beforeTime = Date.now();
      await subscribeClaude(req, res);
      const afterTime = Date.now();

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      const account = savedData[0];

      expect(account).toHaveProperty('id');
      expect(account.id).toBeGreaterThanOrEqual(beforeTime);
      expect(account.id).toBeLessThanOrEqual(afterTime);
      expect(account).toHaveProperty('name', 'Complete Data User');
      expect(account).toHaveProperty('apiKey', apiKey);
      expect(account).toHaveProperty('maskedKey', '****5678');
      expect(account).toHaveProperty('validated', true);
      expect(account).toHaveProperty('createdAt');
      expect(new Date(account.createdAt).getTime()).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('边界条件测试 - 极端输入', () => {
    test('应该处理包含所有特殊字符的API Key', async () => {
      const apiKey = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~1234';
      req.body = { apiKey, name: 'Special Chars User' };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          maskedKey: '****1234',
          validated: true
        })
      });
    });

    test('应该处理包含Unicode字符的API Key', async () => {
      const apiKey = 'sk-中文-日本語-한국어-мир-1234';
      req.body = { apiKey, name: 'Unicode User' };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          maskedKey: '****1234',
          validated: true
        })
      });
    });

    test('应该处理极长的API Key（10000字符）', async () => {
      const apiKey = 'sk-' + 'a'.repeat(9996) + 'xyz9';
      req.body = { apiKey, name: 'Very Long Key User' };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      expect(claudeService.validateApiKey).toHaveBeenCalledWith(apiKey);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          maskedKey: '****xyz9',
          validated: true
        })
      });
    });

    test('应该处理只有空格的API Key', async () => {
      const apiKey = '    ';
      req.body = { apiKey, name: 'Whitespace Key User' };

      claudeService.validateApiKey.mockResolvedValue(false);

      await subscribeClaude(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          maskedKey: '****',
          validated: false
        })
      });
    });

    test('应该处理包含换行符的API Key', async () => {
      const apiKey = 'sk-ant-api03\nwith\nnewlines\n1234';
      req.body = { apiKey, name: 'Newline Key User' };

      claudeService.validateApiKey.mockResolvedValue(true);

      await subscribeClaude(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          maskedKey: '****1234',
          validated: true
        })
      });
    });
  });

  describe('边界条件测试 - 并发和性能', () => {
    test('应该正确处理多个账户的批量添加', async () => {
      const accounts = [
        { apiKey: 'sk-ant-api03-key1-12345678', name: 'User 1' },
        { apiKey: 'sk-ant-api03-key2-87654321', name: 'User 2' },
        { apiKey: 'sk-ant-api03-key3-11111111', name: 'User 3' }
      ];

      claudeService.validateApiKey.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(false);

      for (const account of accounts) {
        req.body = account;
        await subscribeClaude(req, res);
      }

      expect(fs.writeFileSync).toHaveBeenCalledTimes(3);
    });

    test('应该在大量现有账户时正确追加新账户', async () => {
      const apiKey = 'sk-ant-api03-new-account-key';
      req.body = { apiKey, name: 'New Account' };

      claudeService.validateApiKey.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(true);

      // Mock 100个现有账户
      const existingAccounts = Array.from({ length: 100 }, (_, i) => ({
        id: 1000000000 + i,
        name: `User ${i}`,
        apiKey: `sk-ant-api03-key-${i}`,
        maskedKey: `****${i}`,
        validated: true,
        createdAt: new Date().toISOString()
      }));
      fs.readFileSync.mockReturnValue(JSON.stringify(existingAccounts));

      await subscribeClaude(req, res);

      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData).toHaveLength(101);
      expect(savedData[100].name).toBe('New Account');
    });
  });

  describe('边界条件测试 - 错误恢复', () => {
    test('应该在文件写入失败时返回500错误', async () => {
      const apiKey = 'sk-ant-api03-write-error-key';
      req.body = { apiKey, name: 'Write Error User' };

      claudeService.validateApiKey.mockResolvedValue(true);
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      await subscribeClaude(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'EACCES: permission denied'
      });
    });

    test('应该在文件读取失败时仍能创建新账户', async () => {
      const apiKey = 'sk-ant-api03-read-error-key';
      req.body = { apiKey, name: 'Read Error User' };

      claudeService.validateApiKey.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: file not found');
      });

      await subscribeClaude(req, res);

      // 应该捕获错误并创建新的账户列表
      const writeCall = fs.writeFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].name).toBe('Read Error User');
    });
  });

  describe('集成测试 - 完整流程', () => {
    test('应该完成从验证到保存的完整流程', async () => {
      const apiKey = 'sk-ant-api03-integration-test-key-12345678';
      const userName = '集成测试用户';
      req.body = { apiKey, name: userName };

      claudeService.validateApiKey.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(false);

      await subscribeClaude(req, res);

      // 验证API Key被调用
      expect(claudeService.validateApiKey).toHaveBeenCalledWith(apiKey);
      expect(claudeService.validateApiKey).toHaveBeenCalledTimes(1);

      // 验证文件系统操作
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();

      // 验证响应
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: expect.any(Number),
          maskedKey: '****5678',
          validated: true
        })
      });

      // 验证保存的数据
      const writeCall = fs.writeFileSync.mock.calls[0];
      const [filePath, fileContent, encoding] = writeCall;
      expect(filePath).toContain('claude_accounts.json');
      expect(encoding).toBe('utf8');

      const savedData = JSON.parse(fileContent);
      expect(savedData).toHaveLength(1);
      expect(savedData[0]).toMatchObject({
        name: userName,
        apiKey: apiKey,
        maskedKey: '****5678',
        validated: true
      });
    });

    test('应该在真实业务场景中正确处理多个用户订阅', async () => {
      // 场景：公司内3个员工依次订阅Claude服务
      const employees = [
        { apiKey: 'sk-ant-api03-employee1-key-11111111', name: '张三 - 产品经理' },
        { apiKey: 'sk-ant-api03-employee2-key-22222222', name: '李四 - 技术总监' },
        { apiKey: 'sk-ant-api03-employee3-key-33333333', name: '王五 - HR主管' }
      ];

      claudeService.validateApiKey.mockResolvedValue(true);

      let currentAccounts = [];

      for (let i = 0; i < employees.length; i++) {
        req.body = employees[i];

        if (i === 0) {
          fs.existsSync.mockReturnValue(false);
        } else {
          fs.existsSync.mockReturnValue(true);
          fs.readFileSync.mockReturnValue(JSON.stringify(currentAccounts));
        }

        await subscribeClaude(req, res);

        const writeCall = fs.writeFileSync.mock.calls[i];
        currentAccounts = JSON.parse(writeCall[1]);
      }

      // 验证最终保存了3个账户
      expect(currentAccounts).toHaveLength(3);
      expect(currentAccounts[0].name).toBe('张三 - 产品经理');
      expect(currentAccounts[1].name).toBe('李四 - 技术总监');
      expect(currentAccounts[2].name).toBe('王五 - HR主管');
    });
  });
});
