import { ChromaClient, Collection } from 'chromadb';
import { logger } from '../utils/logger';

class ChromaService {
  private client: ChromaClient;
  private conversationCollection: Collection | null = null;
  private insightsCollection: Collection | null = null;
  private knowledgeCollection: Collection | null = null;

  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000'
    });
  }

  async initialize() {
    try {
      // Conversation collection
      this.conversationCollection = await this.client.getOrCreateCollection({
        name: 'conversations',
        metadata: { 
          description: 'User conversations for WorkBuddy',
          hnsw_space: 'cosine'
        }
      });

      // Insights collection
      this.insightsCollection = await this.client.getOrCreateCollection({
        name: 'insights',
        metadata: {
          description: 'Leadership insights and recommendations',
          hnsw_space: 'cosine'
        }
      });

      // Knowledge base collection
      this.knowledgeCollection = await this.client.getOrCreateCollection({
        name: 'knowledge',
        metadata: {
          description: 'Simon Sinek principles and leadership knowledge',
          hnsw_space: 'cosine'
        }
      });
      
      logger.info('ChromaDB collections initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ChromaDB:', error);
      throw error;
    }
  }

  // ============================================
  // CONVERSATION METHODS
  // ============================================

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
    }
  }

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
      return { documents: [], metadatas: [], distances: [] };
    }
  }

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
      return { documents: [], metadatas: [], ids: [] };
    }
  }

  // ============================================
  // INSIGHTS METHODS
  // ============================================

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
    }
  }

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
      return { documents: [], metadatas: [], distances: [] };
    }
  }

  async getInsightsByProblem(problemRequestId: number, limit: number = 10) {
    if (!this.insightsCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      const results = await this.insightsCollection.get({
        where: { problemRequestId },
        limit
      });

      return results;
    } catch (error) {
      logger.error('Error fetching insights:', error);
      return { documents: [], metadatas: [], ids: [] };
    }
  }

  // ============================================
  // KNOWLEDGE BASE METHODS
  // ============================================

  async storeKnowledgeDocuments(documents: Array<{
    id: string;
    content: string;
    source: string;
    category: string;
    metadata?: Record<string, any>;
  }>) {
    if (!this.knowledgeCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      await this.knowledgeCollection.add({
        ids: documents.map(d => d.id),
        documents: documents.map(d => d.content),
        metadatas: documents.map(d => ({
          source: d.source,
          category: d.category,
          timestamp: new Date().toISOString(),
          ...d.metadata
        }))
      });
      logger.info(`Stored ${documents.length} knowledge documents in ChromaDB`);
    } catch (error) {
      logger.error('Error storing knowledge documents:', error);
      throw error;
    }
  }

  async searchKnowledge(
    query: string,
    category?: string,
    limit: number = 5
  ) {
    if (!this.knowledgeCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      const results = await this.knowledgeCollection.query({
        queryTexts: [query],
        nResults: limit,
        ...(category && { where: { category } })
      });

      return results;
    } catch (error) {
      logger.error('Error searching knowledge base:', error);
      return { documents: [], metadatas: [], distances: [] };
    }
  }

  async getAllKnowledge() {
    if (!this.knowledgeCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      const results = await this.knowledgeCollection.get({});
      return results;
    } catch (error) {
      logger.error('Error fetching all knowledge:', error);
      return { documents: [], metadatas: [], ids: [] };
    }
  }

  async clearKnowledgeCollection() {
    if (!this.knowledgeCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      await this.client.deleteCollection({ name: 'knowledge' });
      this.knowledgeCollection = await this.client.createCollection({
        name: 'knowledge',
        metadata: {
          description: 'Simon Sinek principles and leadership knowledge',
          hnsw_space: 'cosine'
        }
      });
      logger.info('Knowledge collection cleared and recreated');
    } catch (error) {
      logger.error('Error clearing knowledge collection:', error);
      throw error;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async deleteConversation(conversationId: number) {
    if (!this.conversationCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      await this.conversationCollection.delete({
        where: { conversationId }
      });
      logger.info(`Deleted conversation ${conversationId} from ChromaDB`);
    } catch (error) {
      logger.error('Error deleting conversation:', error);
    }
  }

  async deleteInsight(insightId: string) {
    if (!this.insightsCollection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      await this.insightsCollection.delete({
        ids: [insightId]
      });
      logger.info(`Deleted insight ${insightId} from ChromaDB`);
    } catch (error) {
      logger.error('Error deleting insight:', error);
    }
  }

  async healthCheck() {
    try {
      await this.client.heartbeat();
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('ChromaDB health check failed:', error);
      return { status: 'unhealthy', error: String(error) };
    }
  }
}

export const chromaService = new ChromaService();