import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Clean markdown from LLM responses
function cleanMarkdown(text: string): string {
  let cleaned = text.trim();
  
  const markdownPattern = /^```markdown\s*\n([\s\S]*?)\n```$/;
  const markdownMatch = cleaned.match(markdownPattern);
  if (markdownMatch) {
    return markdownMatch[1].trim();
  }
  
  const codeBlockPattern = /^```\s*\n([\s\S]*?)\n```$/;
  const codeMatch = cleaned.match(codeBlockPattern);
  if (codeMatch) {
    return codeMatch[1].trim();
  }
  
  return cleaned;
}

export const generateAIResponse = async (req: Request, res: Response) => {
  try {
    const { userId, conversationId, userMessage, history } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'User message is required' });
    }

    logger.info(`Generating AI response for user ${userId}, conversation ${conversationId}`);

    // Build conversation history for Gemini
    const geminiHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Initialize Gemini chat
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Generate response
    const result = await chat.sendMessage(userMessage);
    const rawResponse = result.response.text();
    const cleanedResponse = cleanMarkdown(rawResponse);

    logger.info(`Generated AI response for conversation ${conversationId}`);
    
    res.json({ response: cleanedResponse });
  } catch (error) {
    logger.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
};

export const searchContext = async (req: Request, res: Response) => {
  try {
    const { query, userId, limit = 5 } = req.body;
    
    if (!query || !userId) {
      return res.status(400).json({ error: 'Query and userId are required' });
    }

    // For now, return empty results (we'll add ChromaDB next)
    logger.info(`Searching context for user ${userId}: ${query}`);
    
    res.json({
      documents: [],
      metadatas: [],
      distances: []
    });
  } catch (error) {
    logger.error('Error searching context:', error);
    res.status(500).json({ error: 'Failed to search context' });
  }
};