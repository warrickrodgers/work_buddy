import express, { Request, Response } from 'express';
import { getUploadById, createUpload } from '../../controllers/uploadController';
import { authenticateToken } from '../../middleware/authMiddleware';
import { uploadMiddleware } from '../../middleware/uploadMiddleware';

const router = express.Router();

router.get('/:id', authenticateToken, getUploadById);
router.post('/file-upload', authenticateToken, uploadMiddleware.array('files', 10), createUpload);

export default router;