import { QueryResult, Metadata } from 'chromadb';
import { IntentClassification } from '../services/intentClassifier';
import { SearchResult } from '../services/vectorStoreAdapter';

/**
 * Normalized context structure from ChromaDB
 */
interface RetrievedContext {
  documents: string[][];
  metadatas: Metadata[][];
  distances: number[][];
}

/**
 * Normalize ChromaDB query results to consistent format
 */
function normalizeQueryResult(
  result: QueryResult<Metadata> | { documents: never[]; metadatas: never[]; distances: never[] }
): RetrievedContext {
  // Handle the documents array, filtering out nulls
  const documents = result.documents 
    ? result.documents.map(docArray => 
        (docArray || []).filter((doc): doc is string => doc !== null)
      )
    : [[]];

  // Handle the metadatas array, filtering out nulls
  const metadatas = result.metadatas
    ? result.metadatas.map(metaArray =>
        (metaArray || []).filter((meta): meta is Metadata => meta !== null)
      )
    : [[]];

  // Handle the distances array, filtering out nulls
  const distances = result.distances
    ? result.distances.map(distArray =>
        (distArray || []).filter((dist): dist is number => dist !== null)
      )
    : [[]];

  return {
    documents,
    metadatas,
    distances
  };
}

/**
 * Build a context-aware prompt for the LLM
 */
export function buildContextualPrompt(
  userMessage: string,
  knowledgeContext: QueryResult<Metadata> | { documents: never[]; metadatas: never[]; distances: never[] },
  conversationHistory: Array<{ role: string; content: string }>,
  userInsights?: QueryResult<Metadata> | { documents: never[]; metadatas: never[]; distances: never[] },
  intent?: IntentClassification,
  userDocChunks?: SearchResult[]
): string {
  const knowledge = normalizeQueryResult(knowledgeContext);
  const insights = userInsights ? normalizeQueryResult(userInsights) : null;

  const knowledgeSections = formatContext(knowledge, 'Simon\'s Core Principles');
  const insightSections = insights
    ? formatContext(insights, 'Relevant Past Insights')
    : '';
  const userDocSection = userDocChunks && userDocChunks.length > 0
    ? formatUserDocChunks(userDocChunks)
    : '';

  const outputModeSection = intent ? buildOutputModeSection(intent) : '';

  const systemPrompt = `You are Simon, a purpose-driven leadership coach inspired by Simon Sinek's "Start With Why" philosophy.

${knowledgeSections}

${insightSections}

${userDocSection}

Your responses should:
1. Always start with "why" - connect to purpose and meaning
2. Lead with empathy and assume good intent
3. Ask reflective questions to help users discover their own insights
4. Provide actionable guidance grounded in the principles above
5. Be conversational, warm, and encouraging

Remember: You're not just solving problems - you're helping people rediscover meaning in their work.
${outputModeSection}`;

  return systemPrompt;
}

function formatUserDocChunks(chunks: SearchResult[]): string {
  const formatted = chunks
    .map(chunk => {
      const relevance = (chunk.score * 100).toFixed(1);
      return `### From your uploaded document: ${chunk.metadata.source} (${relevance}% relevant)\n${chunk.content.trim()}`;
    })
    .join('\n\n');

  return `## User-Provided Context\n\nThe following excerpts are from documents your organisation has uploaded. Use them to inform your response where relevant.\n\n${formatted}`;
}

function buildOutputModeSection(intent: IntentClassification): string {
  return `
## Output Mode
Intent signal: ${intent.signal} (score: ${intent.score.toFixed(3)}). This is a weak classifier — it is frequently wrong. Treat it as background context only.

YOUR DEFAULT IS TO RESPOND CONVERSATIONALLY AS SIMON THE COACH. That is the right response for the vast majority of messages.

Only generate a structured outline if the user's message contains explicit, unambiguous language — for example: "give me a plan", "create an outline", "break this into steps", "make me a checklist", "build me a roadmap". General coaching questions ("how do I fix this?", "what should I do?", "what's your advice?") are conversational — answer them as you normally would, even if the intent signal says plan_likely.

If — and ONLY IF — the request is clearly and explicitly for a structured plan, respond with a single valid JSON object in this exact shape (no markdown fences, no text outside the JSON):

{
  "type": "solution_outline",
  "preamble": "<1-2 sentences in your voice acknowledging the request>",
  "outline": {
    "title": "<short descriptive title>",
    "why": "<overarching purpose anchor>",
    "phases": [
      {
        "order_index": 0,
        "title": "<phase name>",
        "timeframe": "<e.g. Days 1-15>",
        "purpose": "<why this phase matters>",
        "checklist_items": [
          { "order_index": 0, "description": "...", "why_it_matters": "..." }
        ],
        "habits": [
          { "order_index": 0, "description": "...", "cadence": "DAILY", "why_it_matters": "..." }
        ],
        "check_in_prompts": [
          { "order_index": 0, "question": "...", "scheduled_for": null }
        ]
      }
    ]
  }
}

Validation rules:
- phases must not be empty; every phase must have at least one item
- cadence must be exactly "DAILY" or "WEEKLY"
- why and every phase purpose must be non-empty
- no more than 10 phases; no more than 15 items per phase

When in doubt, respond conversationally. You can always offer to create a structured outline at the end of a coaching response if it seems useful.`;
}

/**
 * Format retrieved context into readable sections
 */
function formatContext(context: RetrievedContext, sectionTitle: string): string {
  if (!context.documents || context.documents.length === 0 || context.documents[0].length === 0) {
    return '';
  }

  const formattedDocs = context.documents[0]
    .map((doc, idx) => {
      const metadata = context.metadatas[0]?.[idx] || {};
      const distance = context.distances[0]?.[idx] || 1;
      const relevance = ((1 - distance) * 100).toFixed(1);
      
      return `### ${metadata.fileName || 'Document'} (${relevance}% relevant)
${doc.trim()}`;
    })
    .join('\n\n');

  return `## ${sectionTitle}

${formattedDocs}`;
}

/**
 * Build a prompt specifically for data analysis
 */
export function buildAnalysisPrompt(
  dataDescription: string,
  knowledgeContext: QueryResult<Metadata> | { documents: never[]; metadatas: never[]; distances: never[] },
  previousInsights?: QueryResult<Metadata> | { documents: never[]; metadatas: never[]; distances: never[] }
): string {
  const knowledge = normalizeQueryResult(knowledgeContext);
  const insights = previousInsights ? normalizeQueryResult(previousInsights) : null;

  const knowledgeSections = formatContext(knowledge, 'Relevant Leadership Frameworks');
  const insightSections = insights
    ? formatContext(insights, 'Similar Past Analyses')
    : '';

  return `You are Simon, a purpose-driven leadership analyst inspired by Simon Sinek's "Start With Why" philosophy.

${knowledgeSections}

${insightSections}

## Your Task
Analyze the following workplace data through the lens of purpose-driven leadership.

Data to Analyze:
${dataDescription}

## CRITICAL INSTRUCTIONS FOR OUTPUT FORMAT:
1. You MUST respond with ONLY valid JSON
2. Do NOT wrap your response in markdown code blocks
3. Do NOT include any text before or after the JSON
4. Do NOT add explanations outside the JSON structure
5. The JSON must be parseable by JSON.parse()

## Required JSON Structure:
{
  "insight": "A clear, human-centered insight about what this data reveals. Connect it to purpose, meaning, and the 'why' behind the behavior. 2-3 sentences.",
  "category": "Communication|Process|Culture|Skills|Resources|Leadership",
  "recommendations": [
    "First specific, actionable recommendation that addresses root causes",
    "Second recommendation that empowers people and builds trust",
    "Third recommendation that aligns with the team's deeper purpose"
  ],
  "confidence": 0.85
}

## Guidelines for Your Analysis:
- Lead with empathy: assume positive intent
- Start with "why": connect behavior to underlying beliefs and motivations
- Focus on human needs: autonomy, competence, relatedness
- Recommend servant leadership approaches
- Ground advice in the leadership frameworks provided above

RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.`;
}