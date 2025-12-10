import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chromaService } from '../services/chromaService';
import { buildContextualPrompt } from '../llm/promptBuilder';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Make sure this is EXPORTED
export const generateAIResponse = async (req: Request, res: Response) => {
  try {
    console.log('Gemini API Key loaded:', !!process.env.GEMINI_API_KEY);
    console.log('First 10 chars:', process.env.GEMINI_API_KEY?.slice(0, 10));
    const { userId, conversationId, userMessage, history } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'User message is required' });
    }

    logger.info(`Generating AI response for user ${userId}, conversation ${conversationId}`);

    // Retrieve relevant knowledge from ChromaDB
    const knowledgeContext = await chromaService.searchKnowledge(
      userMessage,
      undefined,
      3
    );

    // Retrieve similar past conversations
    const conversationContext = await chromaService.searchSimilarMessages(
      userMessage,
      userId,
      2
    );

    // Build the system prompt with retrieved context
    const systemPrompt = buildContextualPrompt(
      userMessage,
      knowledgeContext,
      history || [],
      conversationContext
    );

    // Build conversation history for Gemini
    const geminiHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I am Simon, and I will respond according to these principles.' }] },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    ];

    // Initialize Gemini chat
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    // Generate response
    const result = await chat.sendMessage(userMessage);
    const rawResponse = result.response.text();

    // Store messages in ChromaDB for future context
    const timestamp = Date.now();
    await chromaService.storeMessage(
      `msg_${conversationId}_${timestamp}_user`,
      userId,
      conversationId,
      'user',
      userMessage
    );

    await chromaService.storeMessage(
      `msg_${conversationId}_${timestamp}_assistant`,
      userId,
      conversationId,
      'assistant',
      rawResponse
    );

    logger.info(`Generated and stored AI response for conversation ${conversationId}`);
    
    res.json({ response: rawResponse });
  } catch (error) {
    logger.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
};

// Make sure this is EXPORTED too
export const searchContext = async (req: Request, res: Response) => {
  try {
    const { query, userId, limit = 5 } = req.body;
    
    if (!query || !userId) {
      return res.status(400).json({ error: 'Query and userId are required' });
    }

    logger.info(`Searching context for user ${userId}: ${query}`);
    
    const results = await chromaService.searchSimilarMessages(query, userId, limit);
    
    res.json(results);
  } catch (error) {
    logger.error('Error searching context:', error);
    res.status(500).json({ error: 'Failed to search context' });
  }
};