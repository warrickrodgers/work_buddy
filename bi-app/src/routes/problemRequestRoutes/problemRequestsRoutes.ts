import express, { Request, Response } from 'express';
import { 
    getProblemRequestById,
    getProblemRequestsByUserId,
    createProblemRequest 
} from '../../controllers/problemRequestController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.get('/:id', authenticateToken, getProblemRequestById);
router.get('/:user_id', authenticateToken, getProblemRequestsByUserId);
router.post('/', authenticateToken, createProblemRequest);

export default router;