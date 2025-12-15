import pg from 'pg';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const { Pool } = pg;

// 创建数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'talent_assessment',
  user: process.env.DB_USER || 'talent_user',
  password: process.env.DB_PASSWORD || 'talent_password_2024',
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 监听连接事件
pool.on('connect', () => {
  console.log('✅ 数据库连接成功');
});

pool.on('error', (err) => {
  console.error('❌ 数据库连接错误:', err);
  process.exit(-1);
});

// 测试数据库连接
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('🔍 数据库连接测试成功:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
}

// 执行查询的辅助函数
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 执行查询', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ 查询错误:', error.message);
    throw error;
  }
}

// 获取客户端连接(用于事务)
export async function getClient() {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // 设置超时释放
  const timeout = setTimeout(() => {
    console.error('⚠️ 客户端超时未释放,强制释放');
    release();
  }, 5000);

  client.release = () => {
    clearTimeout(timeout);
    client.release();
  };

  return { query, release };
}

// 导出连接池
export default pool;
