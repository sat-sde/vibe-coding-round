import express from 'express';
import { streamChat } from '../controllers/chatController.js';

const router = express.Router();

// POST /api/chat/stream
// Body: { conversationId?: string, message: string, tone?: string }
router.post('/stream', streamChat);

export default router;
