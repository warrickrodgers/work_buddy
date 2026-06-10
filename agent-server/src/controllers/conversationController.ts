import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chromaService } from '../services/chromaService';
import { vectorStore } from '../services/vectorStoreAdapter';
import { intentClassifier } from '../services/intentClassifier';
import { buildContextualPrompt } from '../llm/promptBuilder';
import { cleanJsonResponse } from '../llm/jsonUtils';
import { validateOutlinePayload } from '../llm/outlineValidation';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateAIResponse = async (req: Request, res: Response) => {
  try {
    const { userId, organisationId, conversationId, userMessage, history } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'User message is required' });
    }

    logger.info(`Generating AI response for user ${userId}, conversation ${conversationId}`);

    // Stage 1 — intent classification (runs in parallel with context retrieval)
    const userDocSearch = organisationId
      ? vectorStore.search('user_documents', userMessage, { organisationId }, 3)
      : Promise.resolve([]);

    const [intent, knowledgeContext, conversationContext, userDocChunks] = await Promise.all([
      intentClassifier.classify(userMessage),
      chromaService.searchKnowledge(userMessage, undefined, 3),
      chromaService.searchSimilarMessages(userMessage, userId, 2),
      userDocSearch,
    ]);

    logger.info(`Intent: ${intent.signal} (${intent.score.toFixed(3)})`);
    if (userDocChunks.length > 0) {
      logger.info(`User document chunks retrieved: ${userDocChunks.length}`);
    }

    // Stage 2 — build prompt with intent signal injected
    const systemPrompt = buildContextualPrompt(
      userMessage,
      knowledgeContext,
      history || [],
      conversationContext,
      intent,
      userDocChunks
    );

    const geminiHistory = [
      { role: 'user',  parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I am Simon, and I will respond according to these principles.' }] },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    ];

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    });
    const chat  = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(userMessage);
    const rawResponse = result.response.text();

    // Try to parse as outline
    let parsed: any = null;
    try {
      parsed = JSON.parse(cleanJsonResponse(rawResponse));
    } catch {
      // Not JSON — treat as conversational
    }

    if (parsed?.type === 'solution_outline') {
      const validation = validateOutlinePayload(parsed.outline);

      if (validation.valid) {
        logger.info(`Outline validated for conversation ${conversationId}`);

        // Store preamble in ChromaDB as the assistant turn
        const timestamp = Date.now();
        await chromaService.storeMessage(
          `msg_${conversationId}_${timestamp}_user`,
          userId, conversationId, 'user', userMessage
        );
        await chromaService.storeMessage(
          `msg_${conversationId}_${timestamp}_assistant`,
          userId, conversationId, 'assistant', parsed.preamble
        );

        return res.json({
          kind:     'outline',
          preamble: parsed.preamble,
          outline:  parsed.outline,
        });
      }

      logger.warn('Outline validation failed — falling back to conversational', validation.errors);
    }

    // Conversational path (also handles failed outline validation)
    const timestamp = Date.now();
    await chromaService.storeMessage(
      `msg_${conversationId}_${timestamp}_user`,
      userId, conversationId, 'user', userMessage
    );
    await chromaService.storeMessage(
      `msg_${conversationId}_${timestamp}_assistant`,
      userId, conversationId, 'assistant', rawResponse
    );

    logger.info(`Conversational response generated for conversation ${conversationId}`);
    return res.json({ kind: 'message', content: rawResponse });

  } catch (error: any) {
    logger.error('Error generating AI response:', error);

    if (error?.status === 503 || error?.statusText === 'Service Unavailable') {
      return res.status(503).json({
        error: 'AI service is currently experiencing high demand. Please try again shortly.',
        retryable: true,
      });
    }

    res.status(500).json({ error: 'Failed to generate response' });
  }
};

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
