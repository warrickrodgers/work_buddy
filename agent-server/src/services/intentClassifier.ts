import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export type IntentSignal = 'plan_likely' | 'plan_possible' | 'plan_unlikely';

export interface IntentClassification {
  signal: IntentSignal;
  score: number;
}

// Hardcoded — do NOT move these to ChromaDB (causes RAG poisoning)
const EXEMPLAR_PHRASES = [
  'generate a solution outline',
  'give me a plan',
  'outline the steps',
  'what should I do',
  'help me build a roadmap',
  'walk me through how to approach this',
  'break this down into steps',
  'make me a checklist',
  'how do I tackle this',
  'turn this into actionable steps'
];

const THRESHOLDS = { likely: 0.85, possible: 0.70 };

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

class IntentClassifier {
  private exemplarEmbeddings: number[][] = [];
  private ready = false;

  async initialize(): Promise<void> {
    if (this.ready) return;

    logger.info('IntentClassifier: embedding exemplar phrases...');
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004' });

    this.exemplarEmbeddings = await Promise.all(
      EXEMPLAR_PHRASES.map(async (phrase) => {
        const result = await model.embedContent(phrase);
        return result.embedding.values;
      })
    );

    this.ready = true;
    logger.info('IntentClassifier: ready');
  }

  async classify(userMessage: string): Promise<IntentClassification> {
    if (!this.ready) await this.initialize();

    try {
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004' });
      const result = await model.embedContent(userMessage);
      const msgEmbedding = result.embedding.values;

      const score = Math.max(
        ...this.exemplarEmbeddings.map(e => cosineSimilarity(msgEmbedding, e))
      );

      const signal: IntentSignal =
        score >= THRESHOLDS.likely  ? 'plan_likely'   :
        score >= THRESHOLDS.possible ? 'plan_possible' :
                                       'plan_unlikely';

      logger.info(`IntentClassifier: signal=${signal} score=${score.toFixed(3)} message="${userMessage.slice(0, 60)}"`);

      return { signal, score };
    } catch (error) {
      logger.error('IntentClassifier: classification error, defaulting to plan_unlikely', error);
      return { signal: 'plan_unlikely', score: 0 };
    }
  }
}

export const intentClassifier = new IntentClassifier();
