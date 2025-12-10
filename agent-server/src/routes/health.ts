import express from 'express';
import { Router } from 'express';

const router: Router = express.Router();

// GET /health - Server status checks
router.get('/', (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
