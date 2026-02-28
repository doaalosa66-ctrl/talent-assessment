import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

/**
 * API通用速率限制
 * 15分钟内最多100个请求
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15分钟
  max: config.rateLimit.maxRequests, // 限制100个请求
  message: {
    success: false,
    error: '请求过于频繁，请15分钟后再试'
  },
  standardHeaders: true, // 返回 RateLimit-* 头部
  legacyHeaders: false, // 禁用 X-RateLimit-* 头部
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60) + '分钟'
    });
  }
});

/**
 * 认证接口速率限制（更严格）
 * 15分钟内最多5次尝试
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 只允许5次尝试
  message: {
    success: false,
    error: '登录尝试过于频繁，请15分钟后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功的请求不计入限制
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: '登录尝试过于频繁，请15分钟后再试',
      retryAfter: '15分钟'
    });
  }
});

/**
 * 文件上传速率限制
 * 1小时内最多20次上传
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 最多20次上传
  message: {
    success: false,
    error: '上传次数过多，请1小时后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: '上传次数过多，请1小时后再试',
      retryAfter: '1小时'
    });
  }
});

/**
 * AI评估接口速率限制
 * 1小时内最多30次评估
 */
export const assessmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 30, // 最多30次评估
  message: {
    success: false,
    error: '评估次数过多，请1小时后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: '评估次数过多，请1小时后再试',
      retryAfter: '1小时'
    });
  }
});

/**
 * 严格的速率限制（用于敏感操作）
 * 1小时内最多3次
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次
  message: {
    success: false,
    error: '操作过于频繁，请1小时后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: '操作过于频繁，请1小时后再试',
      retryAfter: '1小时'
    });
  }
});

export default {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  assessmentLimiter,
  strictLimiter
};
