import { Request, Response } from 'express';
import { ingestDocument, deleteDocument } from '../services/documentIngestionService';
import { logger } from '../utils/logger';

export const handleIngest = async (req: Request, res: Response) => {
  try {
    const { userId, organisationId, documentType, tags, filename, mimeType, bufferBase64 } = req.body;

    if (!userId || !organisationId || !documentType || !filename || !mimeType || !bufferBase64) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const buffer = Buffer.from(bufferBase64, 'base64');

    const result = await ingestDocument(
      { buffer, filename, mimeType },
      userId,
      organisationId,
      documentType,
      tags ?? []
    );

    logger.info(`Ingest started: ${result.documentId} by user ${userId}`);
    res.status(202).json(result);
  } catch (err: any) {
    logger.error('Ingest error:', err);
    if (err.message?.startsWith('Unsupported file type')) {
      return res.status(422).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to start ingestion' });
  }
};

export const handleDelete = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    await deleteDocument(documentId);
    res.status(204).send();
  } catch (err: any) {
    logger.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
