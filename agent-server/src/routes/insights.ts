import { Router, Request, Response } from 'express';
import { generateInsights } from '../services/insightsService';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/insights/generate
// Called by bi-app agentClient — not directly by the frontend
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { userId, organisationId } = req.body;

    if (!userId || organisationId === undefined) {
      return res.status(400).json({ error: 'userId and organisationId are required' });
    }

    logger.info(`Generating insights for user ${userId}`);
    const result = await generateInsights(userId, organisationId);
    res.json(result);
  } catch (err) {
    logger.error('Insights generation failed:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;
