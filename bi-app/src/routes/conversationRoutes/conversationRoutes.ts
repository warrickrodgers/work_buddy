import express from 'express';
import { 
    getConversationsByUserId,
    getConversationById,
    createConversation,
    getMessagesByConversationId,
    addMessageToConversation,
    updateConversationTitle
} from '../../controllers/conversationController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = express.Router();

// Conversation routes
router.get('/user/:user_id', authenticateToken, getConversationsByUserId);
router.get('/:id', authenticateToken, getConversationById);
router.post('/', authenticateToken, createConversation);
router.patch('/:id/title', authenticateToken, updateConversationTitle);

// Message routes
router.get('/:id/messages', authenticateToken, getMessagesByConversationId);
router.post('/:id/messages', authenticateToken, addMessageToConversation);

export default router;