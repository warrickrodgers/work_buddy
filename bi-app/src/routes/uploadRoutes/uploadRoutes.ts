import express, { Request, Response } from 'express';
import { getUploadById, createUpload } from '../../controllers/uploadController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.get('/:id', authenticateToken, getUploadById);
router.post('/', authenticateToken, createUpload);

export default router;