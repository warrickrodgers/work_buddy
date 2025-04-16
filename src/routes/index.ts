import express from 'express';
import uploadRoutes from './uploadRoutes/uploadRoutes';
import problemRequestRoutes from './problemRequestRoutes/problemRequestsRoutes';

const router = express.Router();

router.use('/uploads',uploadRoutes);
router.use('/problemRequests', problemRequestRoutes);

export default router;