import express from 'express';
import {
  internalCreateDocument,
  internalUpdateDocument,
  internalDeleteDocument,
  internalListDocuments,
} from '../../controllers/ingestionController';
import {
  getInsightChallenges,
  getInsightCheckIns,
  getInsightHabits,
  getInsightPastInsights,
} from '../../controllers/insightsDataController';
import { authenticateServiceToken } from '../../middleware/internalAuthMiddleware';

const router = express.Router();

// Ingestion document endpoints
router.post(  '/ingestion-documents',      authenticateServiceToken, internalCreateDocument);
router.patch( '/ingestion-documents/:id',  authenticateServiceToken, internalUpdateDocument);
router.delete('/ingestion-documents/:id',  authenticateServiceToken, internalDeleteDocument);
router.get(   '/ingestion-documents',      authenticateServiceToken, internalListDocuments);

// Insights data endpoints — read-only, called by agent-server as function-calling tools
router.get('/insights-data/challenges',    authenticateServiceToken, getInsightChallenges);
router.get('/insights-data/check-ins',     authenticateServiceToken, getInsightCheckIns);
router.get('/insights-data/habits',        authenticateServiceToken, getInsightHabits);
router.get('/insights-data/past-insights', authenticateServiceToken, getInsightPastInsights);

export default router;
