import express from 'express';
import {
  internalCreateDocument,
  internalUpdateDocument,
  internalDeleteDocument,
  internalListDocuments,
} from '../../controllers/ingestionController';
import { authenticateServiceToken } from '../../middleware/internalAuthMiddleware';

const router = express.Router();

// POST   /internal/ingestion-documents
router.post(  '/ingestion-documents',      authenticateServiceToken, internalCreateDocument);
// PATCH  /internal/ingestion-documents/:id
router.patch( '/ingestion-documents/:id',  authenticateServiceToken, internalUpdateDocument);
// DELETE /internal/ingestion-documents/:id
router.delete('/ingestion-documents/:id',  authenticateServiceToken, internalDeleteDocument);
// GET    /internal/ingestion-documents
router.get(   '/ingestion-documents',      authenticateServiceToken, internalListDocuments);

export default router;
