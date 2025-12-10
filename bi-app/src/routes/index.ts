import express from 'express';
import uploadRoutes from './uploadRoutes/uploadRoutes';
import problemRequestRoutes from './problemRequestRoutes/problemRequestsRoutes';
import authRoutes from './authRoutes/authRoutes';
import conversationRoutes from './conversationRoutes/conversationRoutes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/uploads', uploadRoutes);
router.use('/problemRequests', problemRequestRoutes);
router.use('/conversations', conversationRoutes);

export default router;