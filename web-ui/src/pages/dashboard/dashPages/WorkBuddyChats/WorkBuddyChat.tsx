import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Bot, ArrowUp, Loader2, Copy, Check } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import api from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationCache {
  conversationId: number;
  messages: Message[];
  lastFetched: number;
}

// ── Cursor helpers ────────────────────────────────────────────────────────────

function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return 0;
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return range.toString().length;
}

function setCaretOffset(el: HTMLElement, offset: number) {
  const sel = window.getSelection();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let chars = offset;
  let lastNode: Text | null = null;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    lastNode = node;
    if (chars <= (node.nodeValue?.length ?? 0)) {
      const range = document.createRange();
      range.setStart(node, chars);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    chars -= node.nodeValue?.length ?? 0;
  }
  if (lastNode) {
    const range = document.createRange();
    range.setStart(lastNode, lastNode.nodeValue?.length ?? 0);
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
}

function formatInputMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WorkBuddyChat() {
  const { user } = useAuth();
  const userId = user?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const CACHE_DURATION = 5 * 60 * 1000;

  // ── Cache helpers ──────────────────────────────────────────────────────────

  const getCachedConversation = useCallback((): ConversationCache | null => {
    if (!userId) return null;
    const cached = localStorage.getItem(`conversation_${userId}`);
    if (!cached) return null;
    const data: ConversationCache = JSON.parse(cached);
    if (Date.now() - data.lastFetched < CACHE_DURATION) return data;
    return null;
  }, [userId, CACHE_DURATION]);

  const setCachedConversation = useCallback((convId: number, msgs: Message[]) => {
    if (!userId) return;
    localStorage.setItem(`conversation_${userId}`, JSON.stringify({
      conversationId: convId, messages: msgs, lastFetched: Date.now(),
    }));
  }, [userId]);

  // ── Conversation loader ────────────────────────────────────────────────────

  const fetchOrCreateConversation = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const cached = getCachedConversation();
      if (cached) {
        try {
          await api.get(`/conversations/${cached.conversationId}`);
          setConversationId(cached.conversationId);
          setMessages(cached.messages);
          return;
        } catch { localStorage.removeItem(`conversation_${userId}`); }
      }
      const response = await api.get(`/conversations/user/${user.id}`);
      // Accept both GENERAL type and legacy null-type conversations
      const general = response.data.filter(
        (c: any) => c.conversation_type === 'GENERAL' || c.conversation_type === null
      );
      if (general.length > 0) {
        const latest = general[0];
        const msgRes = await api.get(`/conversations/${latest.id}/messages`);
        const formatted = msgRes.data.messages.map((m: any) => ({
          id: m.id.toString(), role: m.role.toLowerCase() as 'user' | 'assistant',
          content: m.content, timestamp: new Date(m.created_at),
        }));
        setConversationId(latest.id);
        setMessages(formatted);
        setCachedConversation(latest.id, formatted);
      } else {
        const created = await api.post('/conversations', {
          user_id: user.id, title: 'New Conversation', conversation_type: 'GENERAL',
        });
        setConversationId(created.data.id);
        setCachedConversation(created.data.id, []);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setConversationId(-1);
    } finally {
      setIsLoading(false);
    }
  }, [user, userId, getCachedConversation, setCachedConversation]);

  // ── Send handler ───────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!input.trim() || !conversationId) return;
    const currentInput = input;
    setInput('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    setMessages(prev => [...prev, {
      id: Date.now().toString(), role: 'user', content: currentInput, timestamp: new Date(),
    }]);
    setIsTyping(true);
    try {
      const response = await api.post(`/conversations/${conversationId}/messages`, {
        role: 'USER', content: currentInput,
      });
      if (response.data.assistantMessage) {
        setMessages(prev => [...prev, {
          id: response.data.assistantMessage.id.toString(),
          role: 'assistant',
          content: response.data.assistantMessage.content,
          timestamp: new Date(response.data.assistantMessage.created_at),
        }]);
      } else {
        // Agent unavailable — show inline error
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: 'assistant',
          content: "Sorry, I'm temporarily unavailable. Please try again in a moment.",
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, conversationId]);

  // ── Effects (must all be before any early returns) ─────────────────────────

  useEffect(() => { fetchOrCreateConversation(); }, [userId]);

  useEffect(() => {
    const cached = getCachedConversation();
    if (cached?.conversationId) {
      api.get(`/conversations/${cached.conversationId}`).catch(() => {
        localStorage.removeItem(`conversation_${userId}`);
      });
    }
  }, []);

  useEffect(() => {
    if (conversationId && conversationId > 0 && messages.length > 0) {
      setCachedConversation(conversationId, messages);
    }
  }, [messages, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Early returns (after all hooks) ───────────────────────────────────────

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // ── Editor handlers ────────────────────────────────────────────────────────

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const caretPos = getCaretOffset(el);
    const rawText = el.innerText;
    setInput(rawText);
    const formatted = formatInputMarkdown(rawText);
    if (el.innerHTML !== formatted) {
      el.innerHTML = formatted;
      setCaretOffset(el, caretPos);
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    sel.deleteFromDocument();
    const range = sel.getRangeAt(0);
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    editorRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const markdownComponents = {
    pre({ children }: any) {
      // Unlanguaged fenced blocks — scroll horizontally rather than overflow
      return (
        <pre className="overflow-x-auto whitespace-pre rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-[0.85em]">
          {children}
        </pre>
      );
    },
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      if (match) {
        return (
          <div className="not-prose my-3 rounded-xl overflow-hidden border border-white/10 text-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-[#1e2227]">
              <span className="text-xs font-mono text-white/35">{match[1]}</span>
              <CopyButton code={codeString} />
            </div>
            <div className="overflow-x-auto">
              <SyntaxHighlighter
                language={match[1]}
                style={oneDark}
                PreTag="div"
                customStyle={{ margin: 0, borderRadius: 0, padding: '1rem', fontSize: '0.85em', overflowX: 'auto' }}
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      }
      return (
        <code className="px-1.5 py-0.5 rounded font-mono text-[0.85em] bg-zinc-100 dark:bg-zinc-800 before:content-none after:content-none" {...props}>
          {children}
        </code>
      );
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-0 bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 bg-background overflow-hidden">

      {/* Messages */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-44 space-y-6">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
                <Bot className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Team Efficiency Assistant</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                Ask me anything about improving team productivity, managing challenges, or coaching your people.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id}>
              {message.role === 'user' ? (
                /* User — right-aligned solid pill */
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-3xl px-4 py-2.5 text-sm leading-relaxed">
                    <div className="prose prose-sm max-w-none prose-zinc dark:prose-invert prose-p:my-0 prose-p:leading-relaxed prose-code:bg-zinc-200 dark:prose-code:bg-zinc-700 prose-code:before:content-none prose-code:after:content-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                /* Assistant — no bubble, full-width prose */
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 break-words text-sm leading-relaxed text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-p:leading-relaxed prose-headings:mt-4 prose-headings:mb-2 prose-li:my-0.5 prose-pre:overflow-x-auto prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input — overlaid at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent px-4 pt-6 pb-5">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4)] transition-shadow">
            <div
              ref={editorRef}
              contentEditable={!!conversationId}
              suppressContentEditableWarning
              data-placeholder="Ask about team efficiency, productivity tips, or workflow improvements…"
              onInput={handleEditorInput}
              onKeyDown={handleEditorKeyDown}
              onPaste={handleEditorPaste}
              className="chat-editor min-h-[52px] max-h-[200px] overflow-y-auto px-4 py-4 pr-14 text-[15px] leading-6 text-zinc-900 dark:text-zinc-100 outline-none"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || !conversationId}
              size="icon"
              className="absolute bottom-3 right-3 h-8 w-8 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-25 transition-opacity"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground/50 mt-2">
            WorkBuddy can make mistakes. Review important information.
          </p>
        </div>
      </div>

    </div>
  );
}
