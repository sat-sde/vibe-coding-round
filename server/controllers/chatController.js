import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import { streamChatResponse } from '../services/openaiService.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const VALID_TONES = ['professional', 'casual', 'concise'];

export const streamChat = async (req, res) => {
  const { conversationId, message, tone } = req.body;

  // Validate required fields
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
  }

  const selectedTone = VALID_TONES.includes(tone) ? tone : 'professional';

  let conversation;

  // Check Mistral key early
  if (!process.env.MISTRAL_API_KEY) {
    return res.status(503).json({
      error: 'Configuration error',
      message: 'MISTRAL_API_KEY is not configured. Please set it in your .env file.',
    });
  }

  // Check DB connection
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Configuration error',
      message: 'MongoDB is not connected. Please check your MONGODB_URI in your .env file.',
    });
  }

  try {
    if (conversationId) {
      if (!isValidObjectId(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID format.' });
      }
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found.' });
      }
    } else {
      // Create a new conversation with a title derived from the first message
      const title = message.trim().substring(0, 60) + (message.length > 60 ? '…' : '');
      conversation = new Conversation({ title });
      await conversation.save();
    }

    // Build history for OpenAI (exclude the new message)
    const history = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add user message to conversation immediately
    conversation.messages.push({ role: 'user', content: message.trim() });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ type: 'conversationId', conversationId: conversation._id })}\n\n`);

    // Stream AI response
    let aiResponse = '';
    try {
      aiResponse = await streamChatResponse(res, history, message.trim(), selectedTone);
    } catch (openaiErr) {
      // If SSE headers already sent we can't send a JSON error
      if (!res.headersSent) {
        return res.status(502).json({
          error: 'OpenAI API error',
          message: openaiErr.message,
          conversationId: conversation._id,
        });
      }
      // SSE already started — send error event
      res.write(`data: ${JSON.stringify({ type: 'error', message: openaiErr.message })}\n\n`);
      res.end();
      return;
    }

    // Persist both messages after streaming completes
    conversation.messages.push({ role: 'assistant', content: aiResponse });
    await conversation.save();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', message: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  }
};
