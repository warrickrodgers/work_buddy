import express from 'express';
import analyzeRoutes from './routes/analyze';
import generatePlanRoutes from './routes/generatePlan';
import healthRoutes from './routes/health';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use('/analyze', analyzeRoutes);
app.use('/generate-plan', generatePlanRoutes);
app.use('/health', healthRoutes);

app.listen(PORT, () => {
  console.log(`Agent server running on port ${PORT}`);
});
