import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Papa from 'papaparse';

export type FileType = 'pdf' | 'csv' | 'docx' | 'md' | 'txt';

export interface ParsedText {
  kind: 'text';
  content: string;
}

export interface ParsedCsv {
  kind: 'csv';
  headers: string[];
  rows: string[][];
}

export type ParsedDocument = ParsedText | ParsedCsv;

const MIME_TO_FILE_TYPE: Record<string, FileType> = {
  'application/pdf':                                                      'pdf',
  'text/csv':                                                             'csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/markdown':                                                        'md',
  'text/plain':                                                           'txt',
};

export function fileTypeFromMime(mimeType: string): FileType | null {
  return MIME_TO_FILE_TYPE[mimeType] ?? null;
}

export function fileTypeFromExtension(filename: string): FileType | null {
  const ext = path.extname(filename).toLowerCase().slice(1);
  if (['pdf', 'csv', 'docx', 'md', 'txt'].includes(ext)) return ext as FileType;
  return null;
}

export async function parseDocument(
  buffer: Buffer,
  fileType: FileType
): Promise<ParsedDocument> {
  switch (fileType) {
    case 'pdf': {
      const data = await pdfParse(buffer);
      return { kind: 'text', content: data.text.trim() };
    }

    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return { kind: 'text', content: result.value.trim() };
    }

    case 'md':
    case 'txt': {
      return { kind: 'text', content: buffer.toString('utf-8').trim() };
    }

    case 'csv': {
      const text = buffer.toString('utf-8');
      const parsed = Papa.parse<string[]>(text, {
        skipEmptyLines: true,
        header: false,
      });

      if (parsed.errors.length > 0) {
        throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
      }

      const allRows = parsed.data as string[][];
      if (allRows.length === 0) return { kind: 'csv', headers: [], rows: [] };

      const [headers, ...rows] = allRows;
      return { kind: 'csv', headers, rows };
    }
  }
}
