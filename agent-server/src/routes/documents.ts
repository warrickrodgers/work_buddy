import { Router } from 'express';
import { handleIngest, handleDelete } from '../controllers/documentController';

const router = Router();

router.post('/ingest',      handleIngest);
router.delete('/:documentId', handleDelete);

export default router;
