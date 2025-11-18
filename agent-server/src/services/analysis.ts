import { chromaService } from './';
import { logger } from '../utils/logger';

export async function analyzeDataWithContext(
  userId: number,
  problemRequestId: number,
  dataDescription: string
) {
  try {
    // Search for similar past insights
    const similarInsights = await chromaService.searchSimilarInsights(
      dataDescription,
      userId,
      3
    );

    // Use similar insights as context for better analysis
    const context = similarInsights.documents?.[0]?.join('\n') || '';
    
    // Your existing analysis logic here
    const analysis = await performAnalysis(dataDescription, context);
    
    // Store the new insight in ChromaDB
    await chromaService.storeInsight(
      `insight_${problemRequestId}_${Date.now()}`,
      userId,
      problemRequestId,
      analysis.insight,
      analysis.category
    );

    return analysis;
  } catch (error) {
    logger.error('Error in analysis with context:', error);
    throw error;
  }
}