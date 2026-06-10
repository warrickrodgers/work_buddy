import crypto from 'crypto';
import { fileTypeFromMime, fileTypeFromExtension, parseDocument, FileType } from './documentParser';
import { chunkDocument } from './documentChunker';
import { vectorStore, StoredChunk, ChunkMetadata } from './vectorStoreAdapter';
import { logger } from '../utils/logger';

const COLLECTION    = 'user_documents';
const BI_APP_URL    = () => process.env.BI_APP_URL    || 'http://localhost:3000';
const SERVICE_TOKEN = () => process.env.INTERNAL_SERVICE_TOKEN || '';

type DocumentType    = 'survey' | 'turnover' | 'policy' | 'report' | 'custom';
type IngestionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';

// ── Internal bi-app API calls ─────────────────────────────────────────────────

async function biAppPost(path: string, body: object): Promise<any> {
  const res = await fetch(`${BI_APP_URL()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-service-token': SERVICE_TOKEN(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`bi-app ${path} failed: ${res.status}`);
  return res.json();
}

async function biAppPatch(path: string, body: object): Promise<void> {
  const res = await fetch(`${BI_APP_URL()}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-service-token': SERVICE_TOKEN(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`bi-app ${path} PATCH failed: ${res.status}`);
}

async function biAppDelete(path: string): Promise<void> {
  const res = await fetch(`${BI_APP_URL()}${path}`, {
    method: 'DELETE',
    headers: { 'x-service-token': SERVICE_TOKEN() },
  });
  if (!res.ok && res.status !== 404) throw new Error(`bi-app ${path} DELETE failed: ${res.status}`);
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

async function runPipeline(
  documentId: string,
  buffer: Buffer,
  fileType: FileType,
  meta: Omit<ChunkMetadata, 'chunkIndex' | 'totalChunks'>
): Promise<void> {
  await biAppPatch(`/internal/ingestion-documents/${documentId}`, { status: 'PROCESSING' });

  try {
    const parsed = await parseDocument(buffer, fileType);
    const chunks = chunkDocument(parsed);

    const storedChunks: StoredChunk[] = chunks.map(chunk => ({
      id:       `${documentId}_${chunk.chunkIndex}`,
      content:  chunk.content,
      metadata: { ...meta, chunkIndex: chunk.chunkIndex, totalChunks: chunk.totalChunks },
    }));

    await vectorStore.store(COLLECTION, storedChunks);

    await biAppPatch(`/internal/ingestion-documents/${documentId}`, {
      status:      'COMPLETE',
      chunk_count: chunks.length,
    });

    logger.info(`Ingestion complete: ${documentId} (${chunks.length} chunks)`);
  } catch (err: any) {
    logger.error(`Ingestion failed: ${documentId}:`, err);
    await biAppPatch(`/internal/ingestion-documents/${documentId}`, {
      status:        'FAILED',
      error_message: err?.message ?? 'Unknown error',
    }).catch(() => {});
  }
}

// ── Public interface ──────────────────────────────────────────────────────────

export async function ingestDocument(
  file: { buffer: Buffer; filename: string; mimeType: string },
  userId: number,
  organisationId: number,
  documentType: DocumentType,
  tags: string[] = []
): Promise<{ documentId: string; status: IngestionStatus }> {
  const fileType =
    fileTypeFromMime(file.mimeType) ?? fileTypeFromExtension(file.filename);

  if (!fileType) {
    throw new Error(`Unsupported file type: ${file.mimeType} / ${file.filename}`);
  }

  const documentId = crypto.randomUUID();

  await biAppPost('/internal/ingestion-documents', {
    id:             documentId,
    organisation_id: organisationId,
    uploaded_by_id: userId,
    filename:       file.filename,
    file_type:      fileType.toUpperCase(),
    document_type:  documentType.toUpperCase(),
    tags,
  });

  const baseMeta: Omit<ChunkMetadata, 'chunkIndex' | 'totalChunks'> = {
    documentId,
    organisationId,
    uploadedBy:   userId,
    documentType,
    fileType,
    uploadedAt:   new Date().toISOString(),
    source:       file.filename,
    tagsCsv:      tags.join(','),
  };

  // Fire-and-forget — caller gets documentId + PENDING immediately
  setImmediate(() => runPipeline(documentId, file.buffer, fileType, baseMeta));

  return { documentId, status: 'PENDING' };
}

export async function deleteDocument(
  documentId: string
): Promise<void> {
  await vectorStore.delete(COLLECTION, { documentId });
  await biAppDelete(`/internal/ingestion-documents/${documentId}`);
  logger.info(`Deleted document ${documentId} from ChromaDB and Postgres`);
}

export async function rechunkDocument(
  documentId: string,
  file: { buffer: Buffer; filename: string; mimeType: string },
  userId: number,
  organisationId: number,
  documentType: DocumentType,
  tags: string[] = []
): Promise<void> {
  const fileType =
    fileTypeFromMime(file.mimeType) ?? fileTypeFromExtension(file.filename);

  if (!fileType) throw new Error(`Unsupported file type: ${file.mimeType}`);

  await vectorStore.delete(COLLECTION, { documentId });

  const baseMeta: Omit<ChunkMetadata, 'chunkIndex' | 'totalChunks'> = {
    documentId,
    organisationId,
    uploadedBy:   userId,
    documentType,
    fileType,
    uploadedAt:   new Date().toISOString(),
    source:       file.filename,
    tagsCsv:      tags.join(','),
  };

  setImmediate(() => runPipeline(documentId, file.buffer, fileType, baseMeta));
}
