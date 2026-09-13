import { GoogleGenerativeAI } from '@google/generative-ai';
import { vectorStore } from './vectorStoreAdapter';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const BI_APP_URL    = () => process.env.BI_APP_URL    || 'http://localhost:3000';
const SERVICE_TOKEN = () => process.env.INTERNAL_SERVICE_TOKEN || '';

async function biAppGet(path: string): Promise<any> {
  const res = await fetch(`${BI_APP_URL()}${path}`, {
    headers: { 'x-service-token': SERVICE_TOKEN() },
  });
  if (!res.ok) throw new Error(`bi-app GET ${path} failed: ${res.status}`);
  return res.json();
}

export interface InsightCard {
  title:   string;
  body:    string;
  tag:     'Progress' | 'Pattern' | 'Risk' | 'Win';
  forward: string;
}

// ── Tool implementations ──────────────────────────────────────────────────────

async function getChallenges(userId: number) {
  return biAppGet(`/api/internal/insights-data/challenges?userId=${userId}`);
}

async function getCheckIns(userId: number, days = 14) {
  return biAppGet(`/api/internal/insights-data/check-ins?userId=${userId}&days=${days}`);
}

async function getHabits(userId: number) {
  return biAppGet(`/api/internal/insights-data/habits?userId=${userId}`);
}

async function getPastInsights(userId: number) {
  return biAppGet(`/api/internal/insights-data/past-insights?userId=${userId}`);
}

async function searchDocuments(query: string, organisationId: number) {
  const results = await vectorStore.search('user_documents', query, { organisationId }, 3);
  return {
    results: results.map(r => ({ content: r.content, source: (r.metadata as any).source })),
  };
}

async function executeTool(name: string, args: any, userId: number, organisationId: number): Promise<any> {
  switch (name) {
    case 'get_challenges':    return getChallenges(userId);
    case 'get_check_ins':     return getCheckIns(userId, args?.days ?? 14);
    case 'get_habits':        return getHabits(userId);
    case 'get_past_insights': return getPastInsights(userId);
    case 'search_documents':  return searchDocuments(args?.query ?? '', organisationId);
    default: return { error: `Unknown tool: ${name}` };
  }
}

// ── Tool declarations (Gemini function schema) ────────────────────────────────

const TOOL_DECLARATIONS = [
  {
    name: 'get_challenges',
    description: "Get the user's active challenges with current progress and check-ins from the past 7 days.",
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'get_check_ins',
    description: "Get the user's recent challenge check-in notes and progress updates.",
    parameters: {
      type: 'OBJECT',
      properties: {
        days: { type: 'NUMBER', description: 'Days to look back. Default 14.' },
      },
      required: [],
    },
  },
  {
    name: 'get_habits',
    description: "Get the user's active habits from solution outlines with recent logs and streak data.",
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'get_past_insights',
    description: "Get the user's previous coaching insight summary for detecting longitudinal patterns.",
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'search_documents',
    description: "Search the user's uploaded organisational documents for context relevant to a challenge theme.",
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Search query — use challenge themes or specific topics.' },
      },
      required: ['query'],
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Simon, an expert leadership coach conducting a weekly coaching analysis.

Your task: generate 3–5 insight cards that surface patterns, progress signals, risks, and wins from the user's challenge data.

Use your tools to gather the data you need. Be strategic:
1. Start with get_challenges to understand what's active
2. Call get_check_ins to read the user's own words about their progress
3. Call get_habits if habit data would add depth
4. Call search_documents if a challenge theme warrants grounding in org context
5. Call get_past_insights to detect patterns over time

After gathering data, respond with ONLY a JSON array of insight cards. Each card must have exactly these fields:
- "title": concise and specific — reference actual challenge names or data points, never generic
- "body": 2–3 sentences in Simon's coaching voice, grounded in a specific data point from your tools
- "tag": one of exactly "Progress", "Pattern", "Risk", or "Win"
- "forward": one forward-looking sentence — what to watch for or do this week

Tag rules:
- "Risk": only for genuine blockers (overdue, stalling trend, zero check-ins)
- "Win": only for real achievements (streak maintained, milestone hit, completed challenge)
- "Pattern": observations that span multiple challenges or repeat across time
- "Progress": factual updates grounded in numbers

Do not fabricate data. Only reference what your tools returned.
If there are no active challenges, return a single card with tag "Progress" acknowledging this and prompting the user to create their first challenge.

Respond with ONLY the JSON array — no preamble, no markdown fences.`;

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateInsights(
  userId: number,
  organisationId: number,
): Promise<{ insights: InsightCard[] }> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    tools: [{ functionDeclarations: TOOL_DECLARATIONS as any }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  });

  const chat   = model.startChat();
  let   result = await chat.sendMessage(SYSTEM_PROMPT);

  // Tool-use loop — max 10 rounds as a safety ceiling
  for (let round = 0; round < 10; round++) {
    const calls = result.response.functionCalls();
    if (!calls || calls.length === 0) break;

    logger.info(`Insights tool round ${round + 1}: ${calls.map(c => c.name).join(', ')}`);

    const responses = await Promise.all(
      calls.map(async (call) => {
        try {
          const output = await executeTool(call.name, call.args, userId, organisationId);
          return {
            functionResponse: {
              name:     call.name,
              response: { output: JSON.stringify(output) },
            },
          };
        } catch (err) {
          logger.error(`Tool ${call.name} failed:`, err);
          return {
            functionResponse: {
              name:     call.name,
              response: { output: JSON.stringify({ error: 'Tool call failed' }) },
            },
          };
        }
      }),
    );

    result = await chat.sendMessage(responses as any);
  }

  const raw = result.response.text().trim();

  try {
    // Strip accidental markdown fences if present
    const clean   = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const parsed  = JSON.parse(clean);
    const insights: InsightCard[] = Array.isArray(parsed) ? parsed : (parsed.insights ?? []);
    logger.info(`Insights generated: ${insights.length} cards`);
    return { insights };
  } catch {
    logger.error('Failed to parse insights JSON', { raw });
    return {
      insights: [{
        title:   'Check back soon',
        body:    'Simon wasn\'t able to generate insights right now. Try refreshing after logging some challenge progress.',
        tag:     'Progress',
        forward: 'Log a check-in on an active challenge to give Simon more to work with.',
      }],
    };
  }
}
