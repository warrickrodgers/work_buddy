import { ChromaClient, Collection } from 'chromadb';
import { logger } from '../utils/logger';

class ChromaService {
  private client: ChromaClient;
  private conversationCollection: Collection | null = null;
  private insightsCollection: Collection | null = null;

  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000'
    });
  }

  async initialize() {
    try {
      // Conversation collection for chat history
      this.conversationCollection = await this.client.getOrCreateCollection({
        name: 'conversations',
        metadata: { 
          description: 'User conversations for WorkBuddy',
          hnsw_space: 'cosine'
        }
      });

      // Insights collection for leadership insights and recommendations
      this.insightsCollection = await this.client.getOrCreateCollection({
        name: 'insights',
        metadata: {
          description: 'Leadership insights and recommendations',
          hnsw_space: 'cosine'
        }
      });
      
      logger.info('ChromaDB initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ChromaDB:', error);
      throw error;
    }
  }

  // Store conversation message
  async storeMessage(
    messageId: string,
    userId: number,
    conversationId: number,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ) {
    if (!this.conversationCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      await this.conversationCollection.add({
        ids: [messageId],
        documents: [content],
        metadatas: [{
          userId,
          conversationId,
          role,
          timestamp: new Date().toISOString(),
          ...metadata
        }]
      });
      logger.info(`Stored message ${messageId} in ChromaDB`);
    } catch (error) {
      logger.error('Error storing message in ChromaDB:', error);
      throw error;
    }
  }

  // Store insight/recommendation
  async storeInsight(
    insightId: string,
    userId: number,
    problemRequestId: number,
    insight: string,
    category: string,
    metadata?: Record<string, any>
  ) {
    if (!this.insightsCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      await this.insightsCollection.add({
        ids: [insightId],
        documents: [insight],
        metadatas: [{
          userId,
          problemRequestId,
          category,
          timestamp: new Date().toISOString(),
          ...metadata
        }]
      });
      logger.info(`Stored insight ${insightId} in ChromaDB`);
    } catch (error) {
      logger.error('Error storing insight in ChromaDB:', error);
      throw error;
    }
  }

  // Search for similar conversations
  async searchSimilarMessages(
    query: string,
    userId: number,
    limit: number = 5
  ) {
    if (!this.conversationCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      const results = await this.conversationCollection.query({
        queryTexts: [query],
        nResults: limit,
        where: { userId }
      });

      return results;
    } catch (error) {
      logger.error('Error searching ChromaDB:', error);
      throw error;
    }
  }

  // Search for similar insights
  async searchSimilarInsights(
    query: string,
    userId: number,
    limit: number = 5
  ) {
    if (!this.insightsCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      const results = await this.insightsCollection.query({
        queryTexts: [query],
        nResults: limit,
        where: { userId }
      });

      return results;
    } catch (error) {
      logger.error('Error searching insights:', error);
      throw error;
    }
  }

  // Get conversation context
  async getConversationContext(conversationId: number, limit: number = 10) {
    if (!this.conversationCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      const results = await this.conversationCollection.get({
        where: { conversationId },
        limit
      });

      return results;
    } catch (error) {
      logger.error('Error fetching conversation context:', error);
      throw error;
    }
  }
}

export const chromaService = new ChromaService();