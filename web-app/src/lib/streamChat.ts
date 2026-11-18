export interface StreamInit  { type: 'init';  userMessageId: number }
export interface StreamDelta { type: 'delta'; text: string }
export interface StreamDone  {
  type: 'done';
  kind: 'message' | 'outline';
  messageId: number;
  createdAt: string;
  preamble?: string;
  outline?: any;
  outlineId?: number;
}
export interface StreamError { type: 'error'; message: string }
export type StreamEvent = StreamInit | StreamDelta | StreamDone | StreamError;

const BASE_URL = () => (import.meta as any).env?.VITE_NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export async function streamChatMessage(
  conversationId: number,
  content: string,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem('authToken');

  const response = await fetch(`${BASE_URL()}/conversations/${conversationId}/messages/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ role: 'USER', content }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed: ${response.status}`);
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const raw of events) {
      if (!raw.trim()) continue;
      const dataLine = raw.split('\n').find(l => l.startsWith('data: '));
      if (!dataLine) continue;
      try {
        onEvent(JSON.parse(dataLine.slice(6)) as StreamEvent);
      } catch { /* skip malformed */ }
    }
  }
}
