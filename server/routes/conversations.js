import express from 'express';
import {
  getAllConversations,
  getConversationById,
  createConversation,
  deleteConversation,
} from '../controllers/conversationController.js';

const router = express.Router();

router.get('/', getAllConversations);
router.get('/:id', getConversationById);
router.post('/', createConversation);
router.delete('/:id', deleteConversation);

export default router;
