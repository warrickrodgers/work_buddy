import express from 'express';
import uploadRoutes from './uploadRoutes/uploadRoutes';
import problemRequestRoutes from './problemRequestRoutes/problemRequestsRoutes';
import authRoutes from './authRoutes/authRoutes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/uploads',uploadRoutes);
router.use('/problemRequests', problemRequestRoutes);

export default router;