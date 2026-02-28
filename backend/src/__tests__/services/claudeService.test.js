import { jest } from '@jest/globals';
import claudeService from '../../services/claudeService.js';

// Mock fetch和https模块
global.fetch = jest.fn();
const mockHttpsRequest = jest.fn();

jest.unstable_mockModule('https', () => ({
  default: {
    request: mockHttpsRequest
  }
}));

describe('claudeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete global.fetch;
  });

  describe('单元测试 - validateApiKey', () => {
    test('应该在API Key有效时返回true (使用fetch)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await claudeService.validateApiKey('sk-ant-api03-valid-key-12345678');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('anthropic.com/v1/models'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'sk-ant-api03-valid-key-12345678'
          })
        })
      );
    });

    test('应该在API Key无效时返回false (401错误)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401
      });

      const result = await claudeService.validateApiKey('sk-ant-api03-invalid-key');

      expect(result).toBe(false);
    });

    test('应该在API Key无效时返回false (403错误)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403
      });

      const result = await claudeService.validateApiKey('sk-ant-api03-forbidden-key');

      expect(result).toBe(false);
    });

    test('应该在服务器错误时返回false (500错误)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await claudeService.validateApiKey('sk-ant-api03-server-error-key');

      expect(result).toBe(false);
    });

    test('应该在网络错误时返回false', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await claudeService.validateApiKey('sk-ant-api03-network-error-key');

      expect(result).toBe(false);
    });

    test('应该在fetch超时时返回false', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Request timeout'));

      const result = await claudeService.validateApiKey('sk-ant-api03-timeout-key');

      expect(result).toBe(false);
    });

    test('应该正确处理空API Key', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401
      });

      const result = await claudeService.validateApiKey('');

      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': ''
          })
        })
      );
    });

    test('应该正确处理极长的API Key (10000字符)', async () => {
      const longApiKey = 'sk-' + 'a'.repeat(9997);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await claudeService.validateApiKey(longApiKey);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': longApiKey
          })
        })
      );
    });

    test('应该正确处理包含特殊字符的API Key', async () => {
      const specialKey = 'sk-ant-api03-!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await claudeService.validateApiKey(specialKey);

      expect(result).toBe(true);
    });

    test('应该正确处理包含Unicode字符的API Key', async () => {
      const unicodeKey = 'sk-中文-日本語-한국어-мир';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await claudeService.validateApiKey(unicodeKey);

      expect(result).toBe(true);
    });
  });

  describe('单元测试 - validateApiKey (https fallback)', () => {
    test('应该在没有fetch时使用https模块验证API Key', async () => {
      // 不设置global.fetch，模拟没有fetch的环境
      const mockReq = {
        on: jest.fn(),
        end: jest.fn()
      };

      const mockRes = {
        statusCode: 200
      };

      mockHttpsRequest.mockImplementation((options, callback) => {
        callback(mockRes);
        return mockReq;
      });

      const result = await claudeService.validateApiKey('sk-ant-api03-https-key');

      expect(result).toBe(true);
      expect(mockReq.end).toHaveBeenCalled();
    });

    test('应该在https请求失败时返回false', async () => {
      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('HTTPS error'));
          }
        }),
        end: jest.fn()
      };

      mockHttpsRequest.mockReturnValue(mockReq);

      const result = await claudeService.validateApiKey('sk-ant-api03-https-error-key');

      expect(result).toBe(false);
    });

    test('应该在https返回非200状态码时返回false', async () => {
      const mockReq = {
        on: jest.fn(),
        end: jest.fn()
      };

      const mockRes = {
        statusCode: 401
      };

      mockHttpsRequest.mockImplementation((options, callback) => {
        callback(mockRes);
        return mockReq;
      });

      const result = await claudeService.validateApiKey('sk-ant-api03-https-401-key');

      expect(result).toBe(false);
    });
  });

  describe('单元测试 - sendChat', () => {
    test('应该成功发送聊天消息并返回响应', async () => {
      const messages = [
        { role: 'user', content: '你好，请介绍一下Claude' }
      ];
      const apiKey = 'sk-ant-api03-chat-key-12345678';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          completion: 'Claude是Anthropic开发的AI助手，专注于安全和有用的对话。'
        })
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBe('Claude是Anthropic开发的AI助手，专注于安全和有用的对话。');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          })
        })
      );
    });

    test('应该正确处理多轮对话消息', async () => {
      const messages = [
        { role: 'user', content: '什么是React?' },
        { role: 'assistant', content: 'React是一个用于构建用户界面的JavaScript库。' },
        { role: 'user', content: '它有什么优势?' }
      ];
      const apiKey = 'sk-ant-api03-multi-turn-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          completion: 'React的主要优势包括：组件化、虚拟DOM、单向数据流等。'
        })
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toContain('React的主要优势');

      // 验证消息被正确格式化
      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.prompt).toContain('USER: 什么是React?');
      expect(requestBody.prompt).toContain('ASSISTANT: React是一个用于构建用户界面的JavaScript库。');
      expect(requestBody.prompt).toContain('USER: 它有什么优势?');
    });

    test('应该使用默认temperature参数', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-default-temp-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '响应' })
      });

      await claudeService.sendChat(messages, apiKey);

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.temperature).toBe(0.2);
    });

    test('应该允许自定义temperature参数', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-custom-temp-key';
      const opts = { temperature: 0.8 };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '响应' })
      });

      await claudeService.sendChat(messages, apiKey, opts);

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.temperature).toBe(0.8);
    });

    test('应该允许自定义max_tokens参数', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-custom-tokens-key';
      const opts = { max_tokens: 1000 };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '响应' })
      });

      await claudeService.sendChat(messages, apiKey, opts);

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.max_tokens).toBe(1000);
    });

    test('应该允许自定义model参数', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-custom-model-key';
      const opts = { model: 'claude-3-opus' };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '响应' })
      });

      await claudeService.sendChat(messages, apiKey, opts);

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.model).toBe('claude-3-opus');
    });

    test('应该在API返回错误时返回null', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-error-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBeNull();
    });

    test('应该在网络错误时返回null', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-network-error-key';

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBeNull();
    });

    test('应该正确处理不同的响应格式 (completion字段)', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-completion-format-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          completion: '这是completion格式的响应'
        })
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBe('这是completion格式的响应');
    });

    test('应该正确处理不同的响应格式 (output字段)', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-output-format-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          output: '这是output格式的响应'
        })
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBe('这是output格式的响应');
    });

    test('应该正确处理不同的响应格式 (choices数组)', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-choices-format-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            { text: '这是choices格式的响应' }
          ]
        })
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBe('这是choices格式的响应');
    });

    test('应该正确处理不同的响应格式 (choices.content)', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-choices-content-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            { content: '这是choices.content格式的响应' }
          ]
        })
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBe('这是choices.content格式的响应');
    });

    test('应该在无法识别响应格式时返回JSON字符串', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-unknown-format-key';

      const unknownResponse = { unknown_field: '未知格式' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => unknownResponse
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBe(JSON.stringify(unknownResponse));
    });
  });

  describe('边界条件测试 - 极端输入', () => {
    test('应该处理空消息数组', async () => {
      const messages = [];
      const apiKey = 'sk-ant-api03-empty-messages-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '响应' })
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBe('响应');
    });

    test('应该处理极长的消息内容 (50000字符)', async () => {
      const longContent = 'A'.repeat(50000);
      const messages = [{ role: 'user', content: longContent }];
      const apiKey = 'sk-ant-api03-long-message-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '已处理长消息' })
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBe('已处理长消息');

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.prompt).toContain(longContent);
    });

    test('应该处理包含特殊字符的消息', async () => {
      const messages = [
        { role: 'user', content: '<script>alert("XSS")</script>' },
        { role: 'user', content: '\'"; DROP TABLE users; --' },
        { role: 'user', content: '\\n\\r\\t\\0' }
      ];
      const apiKey = 'sk-ant-api03-special-chars-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '已处理特殊字符' })
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBe('已处理特殊字符');
    });

    test('应该处理包含Emoji和Unicode的消息', async () => {
      const messages = [
        { role: 'user', content: '你好世界 😀🎉🚀' },
        { role: 'user', content: 'こんにちは 안녕하세요 Привет' }
      ];
      const apiKey = 'sk-ant-api03-unicode-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '已处理Unicode' })
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBe('已处理Unicode');
    });

    test('应该处理没有role字段的消息', async () => {
      const messages = [
        { content: '没有role字段的消息' },
        '纯字符串消息'
      ];
      const apiKey = 'sk-ant-api03-no-role-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '已处理' })
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBe('已处理');
    });

    test('应该处理temperature为0的情况', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-zero-temp-key';
      const opts = { temperature: 0 };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '响应' })
      });

      await claudeService.sendChat(messages, apiKey, opts);

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.temperature).toBe(0);
    });

    test('应该处理temperature为1的情况', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-max-temp-key';
      const opts = { temperature: 1 };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '响应' })
      });

      await claudeService.sendChat(messages, apiKey, opts);

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.temperature).toBe(1);
    });

    test('应该处理max_tokens为极小值的情况', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-min-tokens-key';
      const opts = { max_tokens: 1 };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '响' })
      });

      const result = await claudeService.sendChat(messages, apiKey, opts);

      expect(result).toBe('响');
    });

    test('应该处理max_tokens为极大值的情况', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-max-tokens-key';
      const opts = { max_tokens: 100000 };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ completion: '极长响应' })
      });

      await claudeService.sendChat(messages, apiKey, opts);

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.max_tokens).toBe(100000);
    });
  });

  describe('边界条件测试 - 错误场景', () => {
    test('应该处理API返回401未授权错误', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-unauthorized-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBeNull();
    });

    test('应该处理API返回429限流错误', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-rate-limit-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBeNull();
    });

    test('应该处理API返回503服务不可用错误', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-unavailable-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service Unavailable'
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBeNull();
    });

    test('应该处理JSON解析错误', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-json-error-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBeNull();
    });

    test('应该处理连接超时错误', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-timeout-key';

      global.fetch = jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('ETIMEDOUT')), 100);
        });
      });

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBeNull();
    });

    test('应该处理DNS解析错误', async () => {
      const messages = [{ role: 'user', content: '测试' }];
      const apiKey = 'sk-ant-api03-dns-error-key';

      global.fetch = jest.fn().mockRejectedValue(new Error('ENOTFOUND'));

      const result = await claudeService.sendChat(messages, apiKey);

      expect(result).toBeNull();
    });
  });

  describe('集成测试 - 真实业务场景', () => {
    test('应该完成完整的聊天对话流程', async () => {
      const apiKey = 'sk-ant-api03-integration-key-12345678';

      // 第一轮对话
      const messages1 = [
        { role: 'user', content: '你好，我想了解React Hooks' }
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          completion: 'React Hooks是React 16.8引入的新特性，允许你在函数组件中使用state和其他React特性。'
        })
      });

      const response1 = await claudeService.sendChat(messages1, apiKey);
      expect(response1).toContain('React Hooks');

      // 第二轮对话
      const messages2 = [
        { role: 'user', content: '你好，我想了解React Hooks' },
        { role: 'assistant', content: response1 },
        { role: 'user', content: '能举个useState的例子吗?' }
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          completion: '当然可以！这是一个useState的例子：\nconst [count, setCount] = useState(0);'
        })
      });

      const response2 = await claudeService.sendChat(messages2, apiKey);
      expect(response2).toContain('useState');
    });

    test('应该处理HR面试场景的多轮对话', async () => {
      const apiKey = 'sk-ant-api03-hr-interview-key';

      const conversation = [
        { role: 'user', content: '请介绍一下你自己' },
        { role: 'assistant', content: '我是一名全栈工程师，有5年开发经验...' },
        { role: 'user', content: '你最擅长的技术栈是什么?' },
        { role: 'assistant', content: '我最擅长React、Node.js和PostgreSQL...' },
        { role: 'user', content: '能描述一个你解决过的技术难题吗?' }
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          completion: '在之前的项目中，我们遇到了高并发场景下的性能瓶颈...'
        })
      });

      const result = await claudeService.sendChat(conversation, apiKey);

      expect(result).toContain('项目');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('应该处理技术咨询场景', async () => {
      const apiKey = 'sk-ant-api03-tech-consult-key';

      const messages = [
        { role: 'user', content: '我们公司想要构建一个高并发的电商系统，应该选择什么技术栈?' }
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          completion: '对于高并发电商系统，我建议：\n1. 前端：React + Next.js\n2. 后端：Node.js + Express\n3. 数据库：PostgreSQL + Redis\n4. 消息队列：RabbitMQ\n5. 容器化：Docker + Kubernetes'
        })
      });

      const result = await claudeService.sendChat(messages, apiKey, { temperature: 0.3 });

      expect(result).toContain('高并发');
      expect(result).toContain('Redis');
    });
  });
});
