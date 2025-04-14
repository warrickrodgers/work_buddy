import express, { Request, Response } from 'express';
import { getProblemRequestsById, createProblemRequest } from '../../controllers/problemRequestController';

const router = express.Router();

router.get('/:id', getProblemRequestsById);
router.post('/', createProblemRequest);

export default router;