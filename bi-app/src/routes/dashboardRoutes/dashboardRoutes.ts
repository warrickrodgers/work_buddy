import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware';
import { getActionItems } from '../../controllers/dashboardController';

const router = express.Router();

router.use(authenticateToken);

router.get('/action-items', getActionItems);

export default router;
