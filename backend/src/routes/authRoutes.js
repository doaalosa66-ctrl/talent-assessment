import express from 'express';
import { register, login, subscribeClaude } from '../controllers/authController.js';

const router = express.Router();

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

// Claude 订阅验证
router.post('/claude', subscribeClaude);

export default router;
