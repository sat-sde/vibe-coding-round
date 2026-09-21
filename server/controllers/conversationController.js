import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const requireDB = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      error: 'Database not connected',
      message: 'MongoDB is not connected. Check your MONGODB_URI in .env',
    });
    return false;
  }
  return true;
};

export const getAllConversations = async (req, res) => {
  if (!requireDB(res)) return;
  try {
    const conversations = await Conversation.find()
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations', message: err.message });
  }
};

export const getConversationById = async (req, res) => {
  if (!requireDB(res)) return;
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }
  try {
    const conversation = await Conversation.findById(id).lean();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation', message: err.message });
  }
};

export const createConversation = async (req, res) => {
  if (!requireDB(res)) return;
  try {
    const { title } = req.body;
    const conversation = new Conversation({ title: title || 'New Conversation' });
    await conversation.save();
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create conversation', message: err.message });
  }
};

export const deleteConversation = async (req, res) => {
  if (!requireDB(res)) return;
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }
  try {
    const conversation = await Conversation.findByIdAndDelete(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation', message: err.message });
  }
};
