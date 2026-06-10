import { ChromaClient, Collection } from 'chromadb';
import { logger } from '../utils/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChunkMetadata {
  documentId: string;
  organisationId: number;
  uploadedBy: number;
  documentType: 'survey' | 'turnover' | 'policy' | 'report' | 'custom';
  fileType: 'pdf' | 'csv' | 'docx' | 'md' | 'txt';
  uploadedAt: string;
  chunkIndex: number;
  totalChunks: number;
  source: string;
  tagsCsv: string;
}

export interface StoredChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

export interface SearchResult {
  content: string;
  metadata: ChunkMetadata;
  score: number;
}

// ── Interface ─────────────────────────────────────────────────────────────────

export interface VectorStoreAdapter {
  store(collection: string, chunks: StoredChunk[]): Promise<void>;
  search(
    collection: string,
    query: string,
    filters: Record<string, string | number | boolean>,
    limit?: number
  ): Promise<SearchResult[]>;
  delete(
    collection: string,
    filters: Record<string, string | number | boolean>
  ): Promise<void>;
}

// ── ChromaDB implementation ───────────────────────────────────────────────────

export class ChromaVectorStoreAdapter implements VectorStoreAdapter {
  private client: ChromaClient;
  private collections: Map<string, Collection> = new Map();

  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000',
    });
  }

  private async getCollection(name: string): Promise<Collection> {
    if (!this.collections.has(name)) {
      const col = await this.client.getOrCreateCollection({
        name,
        metadata: { hnsw_space: 'cosine' },
      });
      this.collections.set(name, col);
    }
    return this.collections.get(name)!;
  }

  async store(collection: string, chunks: StoredChunk[]): Promise<void> {
    if (chunks.length === 0) return;
    const col = await this.getCollection(collection);
    await col.add({
      ids:       chunks.map(c => c.id),
      documents: chunks.map(c => c.content),
      metadatas: chunks.map(c => c.metadata as Record<string, any>),
    });
    logger.info(`VectorStore: stored ${chunks.length} chunks in "${collection}"`);
  }

  async search(
    collection: string,
    query: string,
    filters: Record<string, string | number | boolean>,
    limit = 3
  ): Promise<SearchResult[]> {
    try {
      const col = await this.getCollection(collection);
      const results = await col.query({
        queryTexts: [query],
        nResults: limit,
        ...(Object.keys(filters).length > 0 && { where: filters as any }),
      });

      const docs      = results.documents?.[0]      ?? [];
      const metas     = results.metadatas?.[0]      ?? [];
      const distances = results.distances?.[0]      ?? [];

      return docs.map((doc, i) => ({
        content:  doc ?? '',
        metadata: (metas[i] ?? {}) as unknown as ChunkMetadata,
        score:    1 - (distances[i] ?? 1),
      }));
    } catch (error) {
      logger.error(`VectorStore: search error in "${collection}":`, error);
      return [];
    }
  }

  async delete(
    collection: string,
    filters: Record<string, string | number | boolean>
  ): Promise<void> {
    try {
      const col = await this.getCollection(collection);
      await col.delete({ where: filters as any });
      logger.info(`VectorStore: deleted chunks from "${collection}" where`, filters);
    } catch (error) {
      logger.error(`VectorStore: delete error in "${collection}":`, error);
      throw error;
    }
  }
}

export const vectorStore = new ChromaVectorStoreAdapter();
