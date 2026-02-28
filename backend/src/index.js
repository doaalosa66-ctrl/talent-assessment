import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { performAssessment, exportPDF, exportWord } from './controllers/assessmentController.js';
import dataRoutes from './routes/dataRoutes.js';
import authRoutes from './routes/authRoutes.js';
import claudeChatRoutes from './routes/claudeChatRoutes.js';
import { testConnection } from './config/database.js';
import { authMiddleware } from './middleware/auth.js';
import { authLimiter, assessmentLimiter, apiLimiter } from './middleware/rateLimit.js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';

// 加载环境变量 - 确保从项目根目录加载
const __dirname_root = dirname(dirname(fileURLToPath(import.meta.url)));
dotenv.config({ path: join(__dirname_root, '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/bmp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，请上传PDF、Word、TXT或图片文件（JPG/PNG/BMP）'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

// 中间件
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 创建uploads目录
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 路由
app.post('/api/assess', authMiddleware, assessmentLimiter, upload.array('resumes', 20), async (req, res) => {
  try {
    // 将文件信息和表单数据合并
    req.body.resumeFiles = req.files;
    await performAssessment(req, res);
  } catch (error) {
    console.error('请求处理失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误'
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '智能人才评估系统运行中' });
});

// PDF导出
import { generatePDFReport } from './services/pdfExportService.js';
import { jobTemplates, searchTemplates, getCategories } from './data/jobTemplates.js';

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

// 导出PDF
app.post('/api/export-pdf', express.json(), exportPDF);

// 导出Word
app.post('/api/export-word', express.json(), exportWord);

// 数据库相关API路由（需要认证）
app.use('/api/data', authMiddleware, dataRoutes);
// 认证路由（带速率限制，不需要认证）
app.use('/api/auth', authLimiter, authRoutes);
// Claude 聊天代理（需要认证）
app.use('/api/claude', authMiddleware, claudeChatRoutes);

// WebSocket连接管理
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = Date.now() + Math.random();
  clients.set(clientId, ws);
  console.log(`✅ WebSocket客户端连接: ${clientId}`);

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`❌ WebSocket客户端断开: ${clientId}`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket错误:`, error);
  });

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    message: '已连接到评估服务器'
  }));
});

// 导出广播函数供Controller使用
export function broadcastProgress(data) {
  clients.forEach((ws) => {
    if (ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify(data));
    }
  });
}

// 启动服务器
server.listen(PORT, async () => {
  console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
  console.log(`📊 API端点: http://localhost:${PORT}/api/assess`);
  console.log(`🔌 WebSocket端点: ws://localhost:${PORT}`);
  console.log(`💾 数据库API: http://localhost:${PORT}/api/data`);

  // 测试数据库连接
  console.log('\n📡 正在连接数据库...');
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('✅ 数据库连接成功，系统已就绪!\n');
  } else {
    console.log('⚠️ 数据库连接失败，请检查配置或启动 Docker 容器:\n   docker-compose up -d\n');
  }
});
