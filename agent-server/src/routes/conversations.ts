import express, { Request, Response } from 'express';
import { generateAIResponse, searchContext } from '../controllers/conversationController';
import { logger } from '../utils/logger';
import { chromaService } from '../services/chromaService';

const router = express.Router();

// Generate AI response
router.post('/generate', generateAIResponse);

// Search context (will be enhanced with ChromaDB later)
router.post('/search', searchContext);

// In agent-server/src/routes/conversations.ts

router.post('/test-knowledge', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const results = await chromaService.searchKnowledge(query, undefined, 3);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search knowledge' });
  }
});

export default router;