import express from 'express';
import {
    createChallenge,
    getChallengesByUserId,
    getChallengeById,
    updateChallenge,
    deleteChallenge
} from '../../controllers/challengeController';
import { recomputeProgressForChallenge } from '../../controllers/outlineController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.post('/', authenticateToken, createChallenge);
router.get('/user/:user_id', authenticateToken, getChallengesByUserId);
router.get('/:id', authenticateToken, getChallengeById);
router.patch('/:id', authenticateToken, updateChallenge);
router.delete('/:id', authenticateToken, deleteChallenge);
router.post('/:id/sync-progress', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid challenge id' });
  await recomputeProgressForChallenge(id);
  res.json({ ok: true });
});

export default router;