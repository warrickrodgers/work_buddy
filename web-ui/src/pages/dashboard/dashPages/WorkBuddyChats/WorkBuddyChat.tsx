import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/ChatMessage';
import { Bot, User, ArrowUp, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { streamChatMessage, type StreamEvent } from '@/lib/streamChat';
import api from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

interface ConversationCache {
  conversationId: number;
  messages: Message[];
  lastFetched: number;
}

const CACHE_DURATION = 5 * 60 * 1000;

export function WorkBuddyChat() {
  const { user } = useAuth();
  const userId = user?.id;
  const [messages, setMessages]           = useState<Message[]>([]);
  const [input, setInput]                 = useState('');
  const [isStreaming, setIsStreaming]      = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);
  const abortRef        = useRef<AbortController | null>(null);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const getCachedConversation = (): ConversationCache | null => {
    try {
      const cached = localStorage.getItem(`conversation_${userId}`);
      if (!cached) return null;
      const data: ConversationCache = JSON.parse(cached);
      return Date.now() - data.lastFetched < CACHE_DURATION ? data : null;
    } catch { return null; }
  };

  const setCachedConversation = (convId: number, msgs: Message[]) => {
    localStorage.setItem(`conversation_${userId}`, JSON.stringify({
      conversationId: convId,
      messages: msgs,
      lastFetched: Date.now(),
    }));
  };

  const fetchOrCreateConversation = async () => {
    try {
      setIsLoading(true);

      const cached = getCachedConversation();
      if (cached) {
        try {
          const v = await api.get(`/conversations/${cached.conversationId}`);
          if (v.data.conversation_type === 'GENERAL') {
            setConversationId(cached.conversationId);
            setMessages(cached.messages);
            return cached.conversationId;
          }
        } catch { /* stale cache */ }
        localStorage.removeItem(`conversation_${userId}`);
      }

      const response  = await api.get(`/conversations/user/${user.id}`);
      const generals  = (response.data as any[]).filter(c => c.conversation_type === 'GENERAL');

      if (generals.length > 0) {
        const latest   = generals[0];
        const msgResp  = await api.get(`/conversations/${latest.id}/messages`);
        const formatted: Message[] = msgResp.data.messages.map((m: any) => ({
          id:        m.id.toString(),
          role:      m.role.toLowerCase() as 'user' | 'assistant',
          content:   m.content,
          timestamp: new Date(m.created_at),
        }));
        setConversationId(latest.id);
        setMessages(formatted);
        setCachedConversation(latest.id, formatted);
        return latest.id;
      }

      const created = await api.post('/conversations', {
        user_id: user.id, title: 'New Conversation', conversation_type: 'GENERAL',
      });
      setConversationId(created.data.id);
      setCachedConversation(created.data.id, []);
      return created.data.id;
    } catch (err) {
      console.error('Error loading conversation:', err);
      setConversationId(-1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrCreateConversation(); }, [userId]);

  useEffect(() => {
    if (conversationId && conversationId > 0 && messages.length > 0) {
      setCachedConversation(conversationId, messages);
    }
  }, [messages, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const STREAMING_ID = 'streaming-assistant';

  const handleSend = useCallback(async () => {
    if (!input.trim() || !conversationId || isStreaming) return;

    const text = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: Message = {
      id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date(),
    };

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: STREAMING_ID, role: 'assistant', content: '', timestamp: new Date(), streaming: true },
    ]);
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      await streamChatMessage(
        conversationId,
        text,
        (event: StreamEvent) => {
          if (event.type === 'delta') {
            setMessages(prev => prev.map(m =>
              m.id === STREAMING_ID ? { ...m, content: m.content + event.text } : m
            ));
          } else if (event.type === 'done') {
            const finalContent = event.kind === 'outline' ? (event.preamble ?? '') : undefined;
            setMessages(prev => prev.map(m =>
              m.id === STREAMING_ID
                ? { ...m, id: event.messageId.toString(), streaming: false, timestamp: new Date(event.createdAt), ...(finalContent !== undefined ? { content: finalContent } : {}) }
                : m
            ));
          } else if (event.type === 'error') {
            setMessages(prev => prev.map(m =>
              m.id === STREAMING_ID
                ? { ...m, id: `err-${Date.now()}`, streaming: false, content: 'Sorry, something went wrong. Please try again.' }
                : m
            ));
          }
        },
        abortRef.current.signal,
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === STREAMING_ID
            ? { ...m, id: `err-${Date.now()}`, streaming: false, content: 'Sorry, I encountered an error. Please try again.' }
            : m
        ));
      }
    } finally {
      setIsStreaming(false);
    }
  }, [input, conversationId, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading conversation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">Simon</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your leadership coaching partner</p>
        </div>
      </div>

      {/* ── Message list ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Start a conversation</h2>
              <p className="text-sm text-muted-foreground">Ask Simon about leadership, team challenges, or workplace productivity</p>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              {message.role === 'assistant' ? (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}

              {/* Bubble / text */}
              {message.role === 'user' ? (
                <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary">
                  <ChatMessage content={message.content} role="user" />
                </div>
              ) : (
                <div className="flex-1 pt-0.5 min-w-0">
                  {message.content === '' && message.streaming ? (
                    <span
                      aria-label="Simon is typing"
                      className="inline-block w-[2px] h-[0.9em] bg-foreground/50 rounded-sm align-middle animate-[caret_1s_ease-in-out_infinite]"
                    />
                  ) : (
                    <ChatMessage
                      content={message.content}
                      role="assistant"
                      streaming={message.streaming}
                    />
                  )}
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input ──────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-border bg-card shadow-sm transition-shadow focus-within:shadow-md focus-within:border-primary/40">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Simon anything…"
              className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3.5 pr-14 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground"
              rows={1}
              disabled={!conversationId || isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming || !conversationId}
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8 rounded-xl disabled:opacity-30 bg-primary text-primary-foreground"
            >
              {isStreaming
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <ArrowUp className="w-3.5 h-3.5" />
              }
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground/50 mt-2">
            Simon can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
