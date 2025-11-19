import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';

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

// Start server
async function startServer() {
  try {
    app.listen(PORT, () => {
      logger.info(`Agent server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;