import express from 'express';
import uploadRoutes from './uploadRoutes/uploadRoutes';
import problemRequestRoutes from './problemRequestRoutes/problemRequestsRoutes';
import authRoutes from './authRoutes/authRoutes';
import conversationRoutes from './conversationRoutes/conversationRoutes';
import challengeRoutes from './challengeRoutes/challengeRoutes'

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/uploads', uploadRoutes);
router.use('/problemRequests', problemRequestRoutes);
router.use('/conversations', conversationRoutes);
router.use('/challenges', challengeRoutes);

export default router;