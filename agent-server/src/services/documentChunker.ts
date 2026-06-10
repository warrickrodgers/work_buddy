import { ParsedDocument, ParsedCsv, ParsedText } from './documentParser';

export interface Chunk {
  content: string;
  chunkIndex: number;
  totalChunks: number;
}

const CHUNK_SIZE = 800;  // target chars (~200 tokens)
const OVERLAP    = 120;  // ~15% overlap

function splitText(text: string, size: number, overlap: number): string[] {
  if (text.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + size;

    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }

    // prefer splitting on paragraph boundary
    let boundary = text.lastIndexOf('\n\n', end);
    if (boundary > start + size * 0.5) {
      end = boundary;
    } else {
      // fall back to sentence boundary
      boundary = text.lastIndexOf('. ', end);
      if (boundary > start + size * 0.5) {
        end = boundary + 1;
      } else {
        // fall back to word boundary
        boundary = text.lastIndexOf(' ', end);
        if (boundary > start) end = boundary;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

function chunkText(parsed: ParsedText): Chunk[] {
  const raw = splitText(parsed.content, CHUNK_SIZE, OVERLAP);
  return raw.map((content, i) => ({ content, chunkIndex: i, totalChunks: raw.length }));
}

function chunkCsv(parsed: ParsedCsv): Chunk[] {
  const { headers, rows } = parsed;
  if (rows.length === 0) return [];

  const headerLine = headers.join('\t');
  const chunks: Chunk[] = [];

  // Group rows into chunks that fit within CHUNK_SIZE when serialised
  let group: string[][] = [];
  let groupChars = 0;

  const flush = () => {
    if (group.length === 0) return;
    const lines = [headerLine, ...group.map(r => r.join('\t'))].join('\n');
    chunks.push({ content: lines, chunkIndex: 0, totalChunks: 0 });
    group = [];
    groupChars = 0;
  };

  for (const row of rows) {
    const line = row.join('\t');
    if (group.length > 0 && groupChars + line.length + 1 > CHUNK_SIZE) flush();
    group.push(row);
    groupChars += line.length + 1;
  }
  flush();

  return chunks.map((c, i) => ({ ...c, chunkIndex: i, totalChunks: chunks.length }));
}

export function chunkDocument(parsed: ParsedDocument): Chunk[] {
  if (parsed.kind === 'csv') return chunkCsv(parsed);
  return chunkText(parsed);
}
