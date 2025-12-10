import { GoogleGenerativeAI } from '@google/generative-ai';
import { QueryResult, Metadata } from 'chromadb';
import { chromaService } from './chromaService';
import { buildAnalysisPrompt } from '../llm/promptBuilder';
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
    
    // Perform analysis with AI - pass QueryResult objects
    const analysis = await performAnalysis(
      dataDescription,
      relevantKnowledge,      // QueryResult type
      similarInsights         // QueryResult type
    );
    
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
  knowledgeContext: QueryResult<Metadata> | { documents: never[]; metadatas: never[]; distances: never[] },
  previousInsights?: QueryResult<Metadata> | { documents: never[]; metadatas: never[]; distances: never[] }
): Promise<AnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });

    // Build the prompt with QueryResult contexts
    const prompt = buildAnalysisPrompt(
      dataDescription,
      knowledgeContext,
      previousInsights
    );

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    logger.info('Raw LLM response:', response.substring(0, 200));

    // Clean the response
    const cleanedResponse = cleanJsonResponse(response);

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate required fields
      if (!parsed.insight || !parsed.category || !parsed.recommendations) {
        throw new Error('Missing required fields in JSON response');
      }

      return {
        insight: parsed.insight,
        category: parsed.category,
        recommendations: Array.isArray(parsed.recommendations) 
          ? parsed.recommendations 
          : [parsed.recommendations],
        confidence: parsed.confidence || 0.7
      };
    } catch (parseError) {
      logger.error('JSON parse error:', parseError);
      logger.error('Cleaned response:', cleanedResponse);
      
      // Fallback: extract manually
      return extractAnalysisFromText(response);
    }
  } catch (error) {
    logger.error('Error performing analysis:', error);
    throw new Error('Failed to analyze data');
  }
}

/**
 * Clean JSON response from markdown and extra text
 */
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  
  // Remove markdown code blocks with language identifier
  cleaned = cleaned.replace(/```json\s*\n/g, '');
  cleaned = cleaned.replace(/```\s*\n/g, '');
  cleaned = cleaned.replace(/\n```$/g, '');
  cleaned = cleaned.replace(/```$/g, '');
  
  // Find JSON object if there's text before/after
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  return cleaned.trim();
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

/**
 * Fallback: extract analysis from non-JSON text
 */
function extractAnalysisFromText(text: string): AnalysisResult {
  logger.warn('Falling back to text extraction');
  
  return {
    insight: text.substring(0, 500),
    category: 'General',
    recommendations: extractRecommendations(text),
    confidence: 0.5
  };
}

/**
 * Simple analysis without context (fallback)
 */
export async function analyzeData(
  dataDescription: string
): Promise<AnalysisResult> {
  const emptyContext = { documents: [], metadatas: [], distances: [] };
  return performAnalysis(dataDescription, emptyContext);
}