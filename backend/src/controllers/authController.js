import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import claudeService from '../services/claudeService.js';

// 用户数据文件路径
const USERS_FILE = path.resolve(process.cwd(), 'users.json');

// 确保用户文件存在
function ensureUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]), 'utf8');
  }
}

// 读取用户数据
function readUsers() {
  ensureUsersFile();
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('读取用户数据失败:', error);
    return [];
  }
}

// 写入用户数据
function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('写入用户数据失败:', error);
    return false;
  }
}

// 密码加密
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 生成 JWT Token
function generateToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET 未配置');
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

/**
 * 用户注册
 */
export async function register(req, res) {
  const { username, email, phone, password } = req.body;

  // 验证必填字段
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: '用户名、邮箱和密码为必填项'
    });
  }

  // 验证用户名格式
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({
      success: false,
      error: '用户名长度必须在3-20个字符之间'
    });
  }

  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
    return res.status(400).json({
      success: false,
      error: '用户名只能包含字母、数字、下划线和中文'
    });
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: '请输入有效的邮箱地址'
    });
  }

  // 验证密码强度
  if (password.length < 6 || password.length > 20) {
    return res.status(400).json({
      success: false,
      error: '密码长度必须在6-20个字符之间'
    });
  }

  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return res.status(400).json({
      success: false,
      error: '密码必须包含字母和数字'
    });
  }

  // 验证手机号（如果提供）
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      error: '请输入有效的手机号码'
    });
  }

  try {
    const users = readUsers();

    // 检查用户名是否已存在
    if (users.some(u => u.username === username)) {
      return res.status(400).json({
        success: false,
        error: '用户名已被注册'
      });
    }

    // 检查邮箱是否已存在
    if (users.some(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        error: '邮箱已被注册'
      });
    }

    // 检查手机号是否已存在（如果提供）
    if (phone && users.some(u => u.phone === phone)) {
      return res.status(400).json({
        success: false,
        error: '手机号已被注册'
      });
    }

    // 创建新用户
    const newUser = {
      id: Date.now(),
      username,
      email,
      phone: phone || null,
      password: hashPassword(password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);

    if (!writeUsers(users)) {
      throw new Error('保存用户数据失败');
    }

    console.log(`✅ 新用户注册成功: ${username} (${email})`);

    // 返回成功响应（不包含密码）
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '注册失败，请稍后重试'
    });
  }
}

/**
 * 用户登录
 */
export async function login(req, res) {
  const { username, password } = req.body;

  // 验证必填字段
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: '用户名和密码为必填项'
    });
  }

  try {
    const users = readUsers();

    // 查找用户（支持用户名或邮箱登录）
    const user = users.find(u =>
      u.username === username || u.email === username
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }

    // 验证密码
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }

    // 生成 Token
    const token = generateToken(user);

    console.log(`✅ 用户登录成功: ${user.username}`);

    // 返回成功响应（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '登录失败，请稍后重试'
    });
  }
}

/**
 * Claude 订阅验证
 */
export async function subscribeClaude(req, res) {
  const { apiKey, name } = req.body || {};
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'apiKey 为必填项' });
  }

  try {
    const valid = await claudeService.validateApiKey(apiKey);

    const accountsPath = path.resolve('backend', 'claude_accounts.json');
    let accounts = [];
    if (fs.existsSync(accountsPath)) {
      try {
        accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8') || '[]');
      } catch (e) {
        accounts = [];
      }
    }

    const maskedKey = apiKey.length > 4 ? '****' + apiKey.slice(-4) : '****';
    const account = {
      id: Date.now(),
      name: name || 'Claude User',
      apiKey,
      maskedKey,
      validated: !!valid,
      createdAt: new Date().toISOString()
    };

    accounts.push(account);
    fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2), 'utf8');

    res.json({ success: true, data: { id: account.id, maskedKey: account.maskedKey, validated: account.validated } });
  } catch (err) {
    console.error('subscribeClaude error:', err);
    res.status(500).json({ success: false, error: err.message || '验证失败' });
  }
}
