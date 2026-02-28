import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * JWT认证中间件
 */
export function authMiddleware(req, res, next) {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: '未授权访问，请提供有效的令牌'
      });
    }
    
    // 验证Bearer格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: '令牌格式错误，应为: Bearer <token>'
      });
    }
    
    const token = parts[1];
    
    // 验证token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // 将用户信息附加到请求对象
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        error: '令牌已过期，请重新登录'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: '令牌无效'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: '认证失败'
    });
  }
}

/**
 * 生成JWT令牌
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn
    }
  );
}

/**
 * 验证JWT令牌
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
}

/**
 * 可选的认证中间件（不强制要求token）
 */
export function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败不阻止请求
    next();
  }
}

export default {
  authMiddleware,
  generateToken,
  verifyToken,
  optionalAuthMiddleware
};
