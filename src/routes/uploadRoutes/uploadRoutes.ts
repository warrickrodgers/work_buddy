import express, { Request, Response } from 'express';
import { getUploadById, createUpload } from '../../controllers/uploadController';

const router = express.Router();

router.get('/:id', getUploadById);
router.post('/', createUpload);

export default router;