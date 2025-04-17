import express, { Request, Response } from 'express';
import { 
    getProblemRequestById,
    getProblemRequestsByUserId,
    createProblemRequest 
} from '../../controllers/problemRequestController';

const router = express.Router();

router.get('/:id', getProblemRequestById);
router.get('?user_id=:user_id', getProblemRequestsByUserId);
router.post('/', createProblemRequest);

export default router;