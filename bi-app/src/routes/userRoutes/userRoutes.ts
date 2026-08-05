import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware';
import { getMyProfile, updateMyProfile } from '../../controllers/userController';

const router = express.Router();

router.use(authenticateToken);

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);

export default router;
