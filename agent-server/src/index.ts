import express from 'express';
import cors from 'cors';
import { chromaService } from './services/chromaService';
import { logger } from './utils/logger';

// Import your existing routes
import healthRoute from './routes/health';
import analyzeRoute from './routes/analyze';
import generatePlanRoute from './routes/generatePlan';
// Add new conversation routes (you'll need to create these)
import conversationRoutes from './routes/conversations';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/health', healthRoute);
app.use('/analyze', analyzeRoute);
app.use('/generate-plan', generatePlanRoute);
app.use('/api/conversations', conversationRoutes);

// Initialize server with ChromaDB
async function startServer() {
  try {
    // Initialize ChromaDB
    await chromaService.initialize();
    logger.info('ChromaDB initialized');
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();