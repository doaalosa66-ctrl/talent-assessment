import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 必需的环境变量列表
const requiredEnvVars = [
  'DEEPSEEK_API_KEY',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET'
];

// 验证必需的环境变量
function validateEnv() {
  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ 缺少必需的环境变量:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n请检查 .env 文件配置');
    process.exit(1);
  }
  
  console.log('✅ 环境变量验证通过');
}

// 导出配置对象
export const config = {
  // 服务器配置
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3001,
  
  // DeepSeek API配置
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  
  // JWT配置
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // 数据库配置
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
    poolMax: parseInt(process.env.DB_POOL_MAX) || 10
  },
  
  // Redis配置
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // CORS配置
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // 文件上传配置
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
  
  // 日志配置
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || './logs',
  
  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  }
};

// 执行验证
validateEnv();

export default config;
