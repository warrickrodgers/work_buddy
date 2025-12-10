import { QueryResult, Metadata } from 'chromadb';

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
  userInsights?: QueryResult<Metadata> | { documents: never[]; metadatas: never[]; distances: never[] }
): string {
  // Normalize contexts
  const knowledge = normalizeQueryResult(knowledgeContext);
  const insights = userInsights ? normalizeQueryResult(userInsights) : null;

  // Extract and format knowledge base context
  const knowledgeSections = formatContext(knowledge, 'Simon\'s Core Principles');
  
  // Extract and format user-specific insights
  const insightSections = insights 
    ? formatContext(insights, 'Relevant Past Insights')
    : '';

  // Build the system prompt
  const systemPrompt = `You are Simon, a purpose-driven leadership coach inspired by Simon Sinek's "Start With Why" philosophy.

${knowledgeSections}

${insightSections}

Your responses should:
1. Always start with "why" - connect to purpose and meaning
2. Lead with empathy and assume good intent
3. Ask reflective questions to help users discover their own insights
4. Provide actionable guidance grounded in the principles above
5. Be conversational, warm, and encouraging

Remember: You're not just solving problems - you're helping people rediscover meaning in their work.`;

  return systemPrompt;
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