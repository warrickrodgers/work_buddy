import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware';
import {
  getMyOrg,
  createOrg,
  joinOrg,
  skipOrg,
  updateOrg,
  getOrgMembers,
  regenerateInviteToken,
} from '../../controllers/orgController';

const router = express.Router();

router.use(authenticateToken);

router.get('/me', getMyOrg);
router.patch('/me', updateOrg);
router.get('/members', getOrgMembers);
router.post('/create', createOrg);
router.post('/join', joinOrg);
router.post('/skip', skipOrg);
router.post('/regenerate-token', regenerateInviteToken);

export default router;
