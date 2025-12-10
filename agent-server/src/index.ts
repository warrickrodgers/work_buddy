import 'dotenv/config'; // Must be first import!
import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { chromaService } from './services/chromaService';
import { loadKnowledgeBase } from './services/knowledgeLoader';

// Import routes
import healthRoute from './routes/health';
import analyzeRoute from './routes/analyze';
import generatePlanRoute from './routes/generatePlan';
import conversationRoutes from './routes/conversations';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.BI_APP_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/health', healthRoute);
app.use('/analyze', analyzeRoute);
app.use('/generate-plan', generatePlanRoute);
app.use('/api/conversations', conversationRoutes);

// Start server with ChromaDB and knowledge base
async function startServer() {
  try {
    // Initialize ChromaDB
    await chromaService.initialize();
    logger.info('ChromaDB initialized');
    
    // Load knowledge base into ChromaDB
    await loadKnowledgeBase();
    logger.info('Knowledge base loaded');
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Agent server running on port ${PORT}`);
      logger.info(`Knowledge base primed with context and frameworks`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;