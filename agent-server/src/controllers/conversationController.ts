import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chromaService } from '../services/chromaService';
import { vectorStore } from '../services/vectorStoreAdapter';
import { intentClassifier } from '../services/intentClassifier';
import { buildContextualPrompt } from '../llm/promptBuilder';
import { cleanJsonResponse } from '../llm/jsonUtils';
import { validateOutlinePayload } from '../llm/outlineValidation';
import { logger } from '../utils/logger';

const SNIFF_CHARS = 15; // chars to buffer before deciding stream vs. buffer mode

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

export const streamAIResponse = async (req: Request, res: Response) => {
  const { userId, organisationId, conversationId, userMessage, history } = req.body;

  if (!userMessage) return res.status(400).json({ error: 'User message is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const userDocSearch = organisationId
      ? vectorStore.search('user_documents', userMessage, { organisationId }, 3)
      : Promise.resolve([]);

    const [intent, knowledgeContext, conversationContext, userDocChunks] = await Promise.all([
      intentClassifier.classify(userMessage),
      chromaService.searchKnowledge(userMessage, undefined, 3),
      chromaService.searchSimilarMessages(userMessage, userId, 2),
      userDocSearch,
    ]);

    const systemPrompt = buildContextualPrompt(
      userMessage, knowledgeContext, history || [], conversationContext, intent, userDocChunks
    );

    const geminiHistory = [
      { role: 'user',  parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I am Simon, and I will respond according to these principles.' }] },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    ];

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    });

    const streamResult = await model.startChat({ history: geminiHistory }).sendMessageStream(userMessage);

    let fullText = '';
    let mode: 'undecided' | 'streaming' | 'buffering' = 'undecided';
    let pending: string[] = [];

    // Detect JSON outline — a solution_outline response always contains this key.
    // We sniff early, but also check if we're about to encounter a JSON block mid-stream.
    const looksLikeOutline = (s: string) => {
      const t = s.trimStart();
      return t.startsWith('{') || t.startsWith('```json') || t.startsWith('```\n{') || t.includes('"solution_outline"');
    };

    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (!text) continue;
      fullText += text;

      if (mode === 'undecided') {
        pending.push(text);
        const snip = fullText.trimStart();
        if (snip.length >= SNIFF_CHARS) {
          if (looksLikeOutline(snip)) {
            mode = 'buffering';
          } else {
            mode = 'streaming';
            for (const c of pending) send({ type: 'delta', text: c });
            pending = [];
          }
        }
      } else if (mode === 'streaming') {
        // Switch to buffering mid-stream if outline signature detected
        if (looksLikeOutline(fullText)) {
          mode = 'buffering';
        } else {
          send({ type: 'delta', text });
        }
      }
    }

    // Flush pending if response was too short to trigger sniff decision
    if (mode === 'undecided') {
      if (!looksLikeOutline(fullText)) {
        for (const c of pending) send({ type: 'delta', text: c });
      }
    }

    // Store in ChromaDB
    const ts = Date.now();
    await chromaService.storeMessage(`msg_${conversationId}_${ts}_user`, userId, conversationId, 'user', userMessage);
    await chromaService.storeMessage(`msg_${conversationId}_${ts}_assistant`, userId, conversationId, 'assistant', fullText);

    // Outline detection — always include fullText so bi-app can save correct DB content
    let doneEvent: any = { type: 'done', kind: 'message', fullText };
    try {
      const clean  = fullText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(clean);
      const validation = validateOutlinePayload(parsed.outline);
      if (parsed.type === 'solution_outline' && validation.valid) {
        doneEvent = { type: 'done', kind: 'outline', preamble: parsed.preamble, outline: parsed.outline, fullText };
      }
    } catch { /* conversational */ }

    send(doneEvent);
    res.end();
  } catch (err: any) {
    logger.error('Stream error:', err);
    try { send({ type: 'error', message: 'Stream failed' }); res.end(); } catch { /* already ended */ }
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
