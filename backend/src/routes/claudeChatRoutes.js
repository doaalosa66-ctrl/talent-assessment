import express from 'express';
import { handleClaudeChat } from '../controllers/claudeChatController.js';

const router = express.Router();

router.post('/chat', handleClaudeChat);

export default router;
