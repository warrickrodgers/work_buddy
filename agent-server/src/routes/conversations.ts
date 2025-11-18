import express, { Request, Response } from 'express';
import { chromaService } from '../services/chromaService';
import { logger } from '../utils/logger';

const router = express.Router();

// Search conversations endpoint
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, userId, limit = 5 } = req.body;
    
    if (!query || !userId) {
      return res.status(400).json({ error: 'Query and userId are required' });
    }

    const results = await chromaService.searchSimilarMessages(query, userId, limit);
    res.json(results);
  } catch (error) {
    logger.error('Error searching conversations:', error);
    res.status(500).json({ error: 'Failed to search conversations' });
  }
});

// Store message endpoint
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const { messageId, userId, conversationId, role, content, metadata } = req.body;
    
    if (!messageId || !userId || !conversationId || !role || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await chromaService.storeMessage(
      messageId,
      userId,
      conversationId,
      role,
      content,
      metadata
    );
    
    res.status(201).json({ success: true });
  } catch (error) {
    logger.error('Error storing message:', error);
    res.status(500).json({ error: 'Failed to store message' });
  }
});

export default router;