import express from 'express';
import {
  listOutlines,
  getOutline,
  toggleChecklistItem,
  logHabit,
  respondToCheckIn,
} from '../../controllers/outlineController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.get('/challenges/:challengeId/outlines', authenticateToken, listOutlines);
router.get('/outlines/:id',                     authenticateToken, getOutline);
router.patch('/checklist-items/:id',            authenticateToken, toggleChecklistItem);
router.post('/habits/:id/log',                  authenticateToken, logHabit);
router.patch('/check-in-prompts/:id/respond',   authenticateToken, respondToCheckIn);

export default router;
