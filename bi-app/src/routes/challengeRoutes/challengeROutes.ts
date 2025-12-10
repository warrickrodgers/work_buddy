import express from 'express';
import { 
    createChallenge,
    getChallengesByUserId,
    getChallengeById,
    updateChallenge,
    deleteChallenge
} from '../../controllers/challengeController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.post('/', authenticateToken, createChallenge);
router.get('/user/:user_id', authenticateToken, getChallengesByUserId);
router.get('/:id', authenticateToken, getChallengeById);
router.patch('/:id', authenticateToken, updateChallenge);
router.delete('/:id', authenticateToken, deleteChallenge);

export default router;