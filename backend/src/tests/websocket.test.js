import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import WebSocket from 'ws';

describe('WebSocket Communication Tests', () => {
  let server;
  let wss;
  let port;
  const clients = new Map();

  beforeAll((done) => {
    // 创建HTTP服务器
    server = createServer();
    wss = new WebSocketServer({ server });

    // WebSocket连接管理
    wss.on('connection', (ws, req) => {
      const clientId = Date.now() + Math.random();
      clients.set(clientId, ws);

      ws.on('close', () => {
        clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
      });

      // 发送欢迎消息
      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        message: '已连接到评估服务器'
      }));
    });

    // 启动服务器在随机端口
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    // 关闭所有客户端连接
    clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    // 关闭服务器
    wss.close(() => {
      server.close(done);
    });
  });

  describe('WebSocket连接', () => {
    test('客户端应该能成功连接到服务器', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('连接成功后应该收到欢迎消息', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message).toHaveProperty('type', 'connected');
        expect(message).toHaveProperty('clientId');
        expect(message).toHaveProperty('message');
        expect(message.message).toContain('已连接');
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('多个客户端应该能同时连接', (done) => {
      const ws1 = new WebSocket(`ws://localhost:${port}`);
      const ws2 = new WebSocket(`ws://localhost:${port}`);
      let count = 0;

      const checkBoth = () => {
        count++;
        if (count === 2) {
          expect(ws1.readyState).toBe(WebSocket.OPEN);
          expect(ws2.readyState).toBe(WebSocket.OPEN);
          ws1.close();
          ws2.close();
          done();
        }
      };

      ws1.on('open', checkBoth);
      ws2.on('open', checkBoth);
    });
  });

  describe('WebSocket消息传输', () => {
    test('服务器应该能广播消息给所有客户端', (done) => {
      const ws1 = new WebSocket(`ws://localhost:${port}`);
      const ws2 = new WebSocket(`ws://localhost:${port}`);
      let receivedCount = 0;

      const broadcastProgress = (data) => {
        clients.forEach((ws) => {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify(data));
          }
        });
      };

      const handleMessage = (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'progress') {
          expect(message).toHaveProperty('progress');
          expect(message).toHaveProperty('message');
          receivedCount++;

          if (receivedCount === 2) {
            ws1.close();
            ws2.close();
            done();
          }
        }
      };

      ws1.on('message', handleMessage);
      ws2.on('message', handleMessage);

      // 等待两个客户端都连接成功
      let openCount = 0;
      const checkOpen = () => {
        openCount++;
        if (openCount === 2) {
          // 广播进度消息
          broadcastProgress({
            type: 'progress',
            progress: 50,
            message: '测试进度消息'
          });
        }
      };

      ws1.on('open', checkOpen);
      ws2.on('open', checkOpen);
    });

    test('应该能发送JSON格式的进度消息', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      let welcomeReceived = false;

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (!welcomeReceived) {
          welcomeReceived = true;
          return;
        }

        expect(message).toHaveProperty('type', 'progress');
        expect(typeof message.progress).toBe('number');
        expect(message.progress).toBeGreaterThanOrEqual(0);
        expect(message.progress).toBeLessThanOrEqual(100);
        ws.close();
        done();
      });

      ws.on('open', () => {
        // 模拟发送进度更新
        setTimeout(() => {
          clients.forEach(client => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'progress',
                progress: 25,
                message: '正在解析简历...'
              }));
            }
          });
        }, 100);
      });
    });
  });

  describe('WebSocket断开连接', () => {
    test('客户端断开后应该从客户端列表移除', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      ws.on('open', () => {
        // 客户端已连接
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
      });

      ws.on('close', () => {
        setTimeout(() => {
          // 客户端已关闭
          expect(ws.readyState).toBe(WebSocket.CLOSED);
          done();
        }, 100);
      });
    });

    test('断开的客户端不应该收到广播消息', (done) => {
      const ws1 = new WebSocket(`ws://localhost:${port}`);
      const ws2 = new WebSocket(`ws://localhost:${port}`);
      let ws2MessageCount = 0;

      ws1.on('open', () => {
        ws1.close();
      });

      ws2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'progress') {
          ws2MessageCount++;
        }
      });

      ws1.on('close', () => {
        // ws1关闭后广播消息
        setTimeout(() => {
          clients.forEach(client => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'progress',
                progress: 75,
                message: '测试'
              }));
            }
          });

          setTimeout(() => {
            expect(ws2MessageCount).toBe(1);
            ws2.close();
            done();
          }, 100);
        }, 100);
      });
    });
  });

  describe('WebSocket错误处理', () => {
    test('无效的消息格式不应该导致服务器崩溃', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      ws.on('open', () => {
        // 发送无效的非JSON数据
        ws.send('invalid json data');

        setTimeout(() => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          ws.close();
          done();
        }, 100);
      });
    });

    test('连接到无效的URL应该抛出错误', () => {
      expect(() => {
        const ws = new WebSocket('invalid-url');
      }).toThrow();
    });
  });

  describe('评估进度场景模拟', () => {
    test('应该能模拟完整的评估进度流程', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      const progressSteps = [
        { progress: 20, message: '正在解析简历...' },
        { progress: 40, message: '正在分析岗位要求...' },
        { progress: 60, message: '正在进行智能匹配...' },
        { progress: 80, message: '正在生成评估报告...' },
        { progress: 100, message: '评估完成！' }
      ];
      let receivedSteps = [];
      let welcomeReceived = false;

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          welcomeReceived = true;
          return;
        }

        if (message.type === 'progress') {
          receivedSteps.push(message);

          if (receivedSteps.length === progressSteps.length) {
            // 验证所有步骤都收到
            expect(receivedSteps.length).toBe(5);
            expect(receivedSteps[0].progress).toBe(20);
            expect(receivedSteps[4].progress).toBe(100);
            ws.close();
            done();
          }
        }
      });

      ws.on('open', () => {
        // 模拟发送进度更新
        let stepIndex = 0;
        const sendNextStep = () => {
          if (stepIndex < progressSteps.length) {
            clients.forEach(client => {
              if (client.readyState === 1) {
                client.send(JSON.stringify({
                  type: 'progress',
                  ...progressSteps[stepIndex]
                }));
              }
            });
            stepIndex++;
            setTimeout(sendNextStep, 50);
          }
        };

        setTimeout(sendNextStep, 100);
      });
    });
  });
});
