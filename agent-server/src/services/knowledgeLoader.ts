import { chromaService } from './chromaService';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface KnowledgeDocument {
  id: string;
  content: string;
  source: string;
  category: string;
  metadata?: Record<string, any>;
}

/**
 * Load all knowledge documents from context and knowledge directories
 */
export async function loadKnowledgeBase() {
  logger.info('Loading knowledge base into ChromaDB...');

  const documents: KnowledgeDocument[] = [];

  // Load context files
  const contextDir = path.join(__dirname, '../context');
  const contextFiles = [
    { file: 'purpose.md', category: 'purpose' },
    { file: 'role.md', category: 'role' },
    { file: 'objectives.md', category: 'objectives' },
    { file: 'goals.json', category: 'goals' }
  ];

  for (const { file, category } of contextFiles) {
    const filePath = path.join(contextDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      documents.push({
        id: `context_${category}`,
        content,
        source: `context/${file}`,
        category: 'context',
        metadata: { subcategory: category }
      });
    }
  }

  // Load knowledge files
  const knowledgeDir = path.join(__dirname, '../knowledge');
  const knowledgeFiles = [
    { file: 'leadership_models.md', category: 'leadership' },
    { file: 'improvement_frameworks.md', category: 'frameworks' },
    { file: 'example_insights.md', category: 'insights' }
  ];

  for (const { file, category } of knowledgeFiles) {
    const filePath = path.join(knowledgeDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      documents.push({
        id: `knowledge_${category}`,
        content,
        source: `knowledge/${file}`,
        category: 'knowledge',
        metadata: { subcategory: category }
      });
    }
  }

  // Store in ChromaDB
  await chromaService.storeKnowledgeDocuments(documents);

  logger.info(`Loaded ${documents.length} knowledge documents into ChromaDB`);
}

/**
 * Reload knowledge base (for updates)
 */
export async function reloadKnowledgeBase() {
  logger.info('Reloading knowledge base...');
  await chromaService.clearKnowledgeCollection();
  await loadKnowledgeBase();
}