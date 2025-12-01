import express, { Request, Response } from 'express';
import { analyzeDataWithContext } from '../services/analysis';
import { logger } from '../utils/logger';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, problemRequestId, dataDescription } = req.body;

    if (!dataDescription) {
      return res.status(400).json({ error: 'dataDescription is required' });
    }

    logger.info(`Analyzing data for user ${userId}`);

    const analysis = await analyzeDataWithContext(
      userId || 1,
      problemRequestId || 1,
      dataDescription
    );

    res.json(analysis);
  } catch (error) {
    logger.error('Error in analyze endpoint:', error);
    res.status(500).json({ error: 'Failed to analyze data' });
  }
});

export default router;