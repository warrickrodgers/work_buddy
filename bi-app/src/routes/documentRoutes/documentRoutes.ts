import express from 'express';
import multer from 'multer';
import {
  getUserDocuments,
  getUserDocumentById,
  deleteUserDocument,
  uploadUserDocument,
} from '../../controllers/ingestionController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// POST /api/documents
router.post('/',    authenticateToken, upload.single('file'), uploadUserDocument);
// GET  /api/documents
router.get('/',    authenticateToken, getUserDocuments);
// GET  /api/documents/:id
router.get('/:id', authenticateToken, getUserDocumentById);
// DELETE /api/documents/:id
router.delete('/:id', authenticateToken, deleteUserDocument);

export default router;
