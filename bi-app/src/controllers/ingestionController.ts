import { Request, Response } from 'express';
import { PrismaClient, FileType, DocumentType, IngestionStatus } from '@prisma/client';
import { agentClient } from '../services/agentClient';

const prisma = new PrismaClient();

// ── Internal endpoints (called by agent-server, not user JWT) ─────────────────

export const internalCreateDocument = async (req: Request, res: Response) => {
  try {
    const { id, organisation_id, uploaded_by_id, filename, file_type, document_type, tags } = req.body;

    const doc = await prisma.ingestionDocument.create({
      data: {
        id,
        organisation_id,
        uploaded_by_id,
        filename,
        file_type: file_type as FileType,
        document_type: document_type as DocumentType,
        tags: tags ?? [],
        status: 'PENDING',
      },
    });

    res.status(201).json({ document: doc });
  } catch (error) {
    console.error('Error creating ingestion document:', error);
    res.status(500).json({ error: 'Failed to create ingestion document' });
  }
};

export const internalUpdateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, chunk_count, error_message } = req.body;

    const doc = await prisma.ingestionDocument.update({
      where: { id },
      data: {
        ...(status        !== undefined && { status: status as IngestionStatus }),
        ...(chunk_count   !== undefined && { chunk_count }),
        ...(error_message !== undefined && { error_message }),
      },
    });

    res.json({ document: doc });
  } catch (error) {
    console.error('Error updating ingestion document:', error);
    res.status(500).json({ error: 'Failed to update ingestion document' });
  }
};

export const internalDeleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.ingestionDocument.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ingestion document:', error);
    res.status(500).json({ error: 'Failed to delete ingestion document' });
  }
};

export const internalListDocuments = async (req: Request, res: Response) => {
  try {
    const organisationId = parseInt(req.query.organisation_id as string);
    const documentType   = req.query.document_type as DocumentType | undefined;
    const status         = req.query.status as IngestionStatus | undefined;

    if (isNaN(organisationId)) {
      return res.status(400).json({ error: 'organisation_id is required' });
    }

    const documents = await prisma.ingestionDocument.findMany({
      where: {
        organisation_id: organisationId,
        ...(documentType && { document_type: documentType }),
        ...(status       && { status }),
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ documents });
  } catch (error) {
    console.error('Error listing ingestion documents:', error);
    res.status(500).json({ error: 'Failed to list ingestion documents' });
  }
};

// ── User-facing endpoints ─────────────────────────────────────────────────────

export const getUserDocuments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user   = await prisma.user.findUnique({ where: { id: userId }, select: { organisation_id: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const documentType = req.query.document_type as DocumentType | undefined;
    const status       = req.query.status as IngestionStatus | undefined;

    const documents = await prisma.ingestionDocument.findMany({
      where: {
        organisation_id: user.organisation_id,
        ...(documentType && { document_type: documentType }),
        ...(status       && { status }),
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ documents });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const getUserDocumentById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user   = await prisma.user.findUnique({ where: { id: userId }, select: { organisation_id: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const doc = await prisma.ingestionDocument.findUnique({ where: { id: req.params.id } });
    if (!doc)                                return res.status(404).json({ error: 'Document not found' });
    if (doc.organisation_id !== user.organisation_id) return res.status(403).json({ error: 'Forbidden' });

    res.json({ document: doc });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export const deleteUserDocument = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user   = await prisma.user.findUnique({ where: { id: userId }, select: { organisation_id: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const doc = await prisma.ingestionDocument.findUnique({ where: { id: req.params.id } });
    if (!doc)                                return res.status(404).json({ error: 'Document not found' });
    if (doc.organisation_id !== user.organisation_id) return res.status(403).json({ error: 'Forbidden' });

    // Delegate to agent-server: it removes ChromaDB chunks then calls our internal endpoint to drop the Postgres row
    await agentClient.deleteDocument(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

export const uploadUserDocument = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { organisation_id: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const documentType = (req.body.document_type ?? 'custom') as string;
    const tags: string[] = req.body.tags
      ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map((t: string) => t.trim()))
      : [];

    const validTypes = ['survey', 'turnover', 'policy', 'report', 'custom'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ error: `document_type must be one of: ${validTypes.join(', ')}` });
    }

    const result = await agentClient.ingestDocument(
      file.buffer,
      file.originalname,
      file.mimetype,
      userId,
      user.organisation_id,
      documentType,
      tags
    );

    res.status(202).json(result);
  } catch (error: any) {
    console.error('Error uploading document:', error);
    if (error?.message?.startsWith('Unsupported file type')) {
      return res.status(422).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to upload document' });
  }
};
