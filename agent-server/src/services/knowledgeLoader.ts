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
 * Recursively load all markdown files from a directory
 */
function loadMarkdownFiles(dir: string, category: string): KnowledgeDocument[] {
  const documents: KnowledgeDocument[] = [];
  
  if (!fs.existsSync(dir)) {
    logger.warn(`Directory not found: ${dir}`);
    return documents;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively load subdirectories
      documents.push(...loadMarkdownFiles(filePath, category));
    } else if (file.endsWith('.md')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(file, '.md');
      
      documents.push({
        id: `${category}_${fileName}_${Date.now()}`,
        content,
        source: path.relative(path.join(__dirname, '..'), filePath),
        category,
        metadata: { 
          fileName,
          subcategory: path.basename(path.dirname(filePath))
        }
      });
    }
  }

  return documents;
}

/**
 * Load all knowledge documents from context and knowledge directories
 */
export async function loadKnowledgeBase() {
  logger.info('Loading knowledge base into ChromaDB...');

  const documents: KnowledgeDocument[] = [];

  // Load context files
  const contextDir = path.join(__dirname, '../context');
  documents.push(...loadMarkdownFiles(contextDir, 'context'));

  // Load knowledge files
  const knowledgeDir = path.join(__dirname, '../knowledge');
  documents.push(...loadMarkdownFiles(knowledgeDir, 'knowledge'));

  // Store in ChromaDB
  if (documents.length > 0) {
    await chromaService.storeKnowledgeDocuments(documents);
    logger.info(`Loaded ${documents.length} knowledge documents into ChromaDB`);
  } else {
    logger.warn('No knowledge documents found to load');
  }
}

/**
 * Reload knowledge base (for updates)
 */
export async function reloadKnowledgeBase() {
  logger.info('Reloading knowledge base...');
  await chromaService.clearKnowledgeCollection();
  await loadKnowledgeBase();
}