import express, { Request, Response } from 'express';
import { generateAIResponse, searchContext } from '../controllers/conversationController';
import { logger } from '../utils/logger';

const router = express.Router();

// Generate AI response
router.post('/generate', generateAIResponse);

// Search context (will be enhanced with ChromaDB later)
router.post('/search', searchContext);

export default router;