import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware';
import { generateInsights, getLatestInsight } from '../../controllers/insightsController';

const router = express.Router();

router.use(authenticateToken);

router.post('/generate', generateInsights);
router.get('/latest',    getLatestInsight);

export default router;
