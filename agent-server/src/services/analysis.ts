import { GoogleGenerativeAI } from '@google/generative-ai';
import { chromaService } from './chromaService';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface AnalysisResult {
  insight: string;
  category: string;
  recommendations: string[];
  confidence: number;
}

/**
 * Analyze data with context from ChromaDB and knowledge base
 */
export async function analyzeDataWithContext(
  userId: number,
  problemRequestId: number,
  dataDescription: string
): Promise<AnalysisResult> {
  try {
    logger.info(`Analyzing data for user ${userId}, problem ${problemRequestId}`);

    // Search for similar past insights
    const similarInsights = await chromaService.searchSimilarInsights(
      dataDescription,
      userId,
      3
    );

    // Search knowledge base for relevant frameworks/principles
    const relevantKnowledge = await chromaService.searchKnowledge(
      dataDescription,
      undefined,
      3
    );

    // Combine contexts
    const insightContext = similarInsights.documents?.[0]?.join('\n\n') || '';
    const knowledgeContext = relevantKnowledge.documents?.[0]?.join('\n\n') || '';
    
    // Perform analysis with AI
    const analysis = await performAnalysis(dataDescription, insightContext, knowledgeContext);
    
    // Store the new insight in ChromaDB
    await chromaService.storeInsight(
      `insight_${problemRequestId}_${Date.now()}`,
      userId,
      problemRequestId,
      analysis.insight,
      analysis.category
    );

    logger.info(`Analysis completed for problem ${problemRequestId}`);
    return analysis;
  } catch (error) {
    logger.error('Error in analysis with context:', error);
    throw error;
  }
}

/**
 * Perform AI-powered analysis using Gemini with knowledge base
 */
async function performAnalysis(
  dataDescription: string, 
  insightContext: string,
  knowledgeContext: string
): Promise<AnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are Simon, a workplace efficiency expert inspired by Simon Sinek's "Start With Why" philosophy.

${knowledgeContext ? `Core Principles and Frameworks:\n${knowledgeContext}\n\n` : ''}

${insightContext ? `Previous Relevant Insights:\n${insightContext}\n\n` : ''}

Current Problem/Data to Analyze:
${dataDescription}

Using the principles above, analyze this situation and provide:
1. A clear insight about what this reveals (rooted in purpose and meaning)
2. The category (Communication, Process, Culture, Skills, Resources, Leadership)
3. Specific, actionable recommendations that align with "Start With Why" thinking

Format as JSON:
{
  "insight": "your insight here",
  "category": "category name",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "confidence": 0.85
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(cleanJsonResponse(response));
      return {
        insight: parsed.insight || 'Unable to generate insight',
        category: parsed.category || 'General',
        recommendations: parsed.recommendations || [],
        confidence: parsed.confidence || 0.5
      };
    } catch (parseError) {
      logger.warn('Failed to parse JSON response, extracting manually');
      return {
        insight: response,
        category: 'General',
        recommendations: extractRecommendations(response),
        confidence: 0.6
      };
    }
  } catch (error) {
    logger.error('Error performing analysis:', error);
    throw new Error('Failed to analyze data');
  }
}

/**
 * Clean JSON response from markdown code blocks
 */
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  
  // Remove markdown code blocks
  const jsonPattern = /```json\s*\n([\s\S]*?)\n```/;
  const match = cleaned.match(jsonPattern);
  if (match) {
    return match[1].trim();
  }
  
  const codePattern = /```\s*\n([\s\S]*?)\n```/;
  const codeMatch = cleaned.match(codePattern);
  if (codeMatch) {
    return codeMatch[1].trim();
  }
  
  return cleaned;
}

/**
 * Extract recommendations from text if JSON parsing fails
 */
function extractRecommendations(text: string): string[] {
  const recommendations: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[\d•\-*]/.test(trimmed)) {
      const cleaned = trimmed.replace(/^[\d•\-*]\s*\.?\s*/, '');
      if (cleaned.length > 10) {
        recommendations.push(cleaned);
      }
    }
  }
  
  return recommendations.slice(0, 5);
}

// ... rest of existing functions ...