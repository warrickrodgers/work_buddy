import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MessageCircle, Calendar, Target, TrendingUp, CheckCircle2, ArrowUp, Loader2, AlertTriangle, X, BookOpen, Flame, CheckSquare, Square, ExternalLink } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { ChatMessage, MarkdownContent } from '@/components/ChatMessage';
import { OutlineCard } from '@/components/OutlineCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { streamChatMessage, type StreamEvent } from '@/lib/streamChat';
import api from '@/lib/api';

// ── Outline types ──────────────────────────────────────────────────────────────
interface HabitLog { id: number; habit_id: number; logged_for: string; }

interface Habit {
  id: number; phase_id: number; description: string;
  cadence: 'DAILY' | 'WEEKLY'; logs: HabitLog[];
}

interface ChecklistItem {
  id: number; phase_id: number; order_index: number;
  description: string; is_complete: boolean;
}

interface OutlinePhase {
  id: number; habits: Habit[]; checklist_items: ChecklistItem[];
}

interface ActiveOutline {
  id: number; title: string; status: string; phases: OutlinePhase[];
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function isHabitLogged(habit: Habit): boolean {
  if (habit.logs.length === 0) return false;
  if (habit.cadence === 'DAILY') {
    return habit.logs.some(l => l.logged_for.split('T')[0] === todayStr());
  }
  const weekStart = getMondayOfWeek(new Date());
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);
  return habit.logs.some(l => { const d = new Date(l.logged_for); return d >= weekStart && d < weekEnd; });
}

// ── Challenge types ────────────────────────────────────────────────────────────
interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  challenge_type: string;
  audience_type: string;
  status: string;
  progress: number;
  start_date: string;
  end_date?: string;
  success_criteria: string;
  metrics?: string;
  ai_notes?: string;
  conversation_id?: number;
}

interface OutlineMeta {
  id: number;
  title: string;
  phaseCount: number;
  itemCount: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  kind?: 'outline';
  outlineMeta?: OutlineMeta;
  streaming?: boolean;
}

const STREAMING_ID = 'streaming-assistant';

export function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'warning' | 'error' } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [activeOutline, setActiveOutline] = useState<ActiveOutline | null>(null);
  const [loggingHabits, setLoggingHabits] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (id && user) {
      loadChallenge();
    }
  }, [id, user]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 7000);
    return () => clearTimeout(timer);
  }, [notification]);

  const loadChallenge = async () => {
    try {
      const [challengeRes, outlinesRes] = await Promise.all([
        api.get(`/challenges/${id}`),
        api.get(`/challenges/${id}/outlines`),
      ]);
      setChallenge(challengeRes.data);

      if (outlinesRes.data.outlines?.length > 0) {
        setActiveOutline(outlinesRes.data.outlines[0]);
      }

      if (challengeRes.data.conversation_id) {
        const messagesResponse = await api.get(`/conversations/${challengeRes.data.conversation_id}/messages`);
        setMessages(messagesResponse.data.messages.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role.toLowerCase(),
          content: msg.content,
          created_at: msg.created_at
        })));
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logHabitToday = async (phaseId: number, habitId: number) => {
    setLoggingHabits(prev => new Set([...prev, habitId]));
    try {
      const res = await api.post(`/habits/${habitId}/log`, { logged_for: todayStr() });
      const newLog: HabitLog = res.data.log;
      setActiveOutline(prev => prev && ({
        ...prev,
        phases: prev.phases.map(p => p.id !== phaseId ? p : {
          ...p,
          habits: p.habits.map(h => h.id !== habitId ? h : {
            ...h,
            logs: [...h.logs.filter(l => l.logged_for.split('T')[0] !== todayStr()), newLog],
          }),
        }),
      }));
    } catch (err) {
      console.error('Failed to log habit:', err);
    } finally {
      setLoggingHabits(prev => { const n = new Set(prev); n.delete(habitId); return n; });
    }
  };

  const toggleChecklistItem = async (phaseId: number, itemId: number, current: boolean) => {
    const next = !current;
    setActiveOutline(prev => prev && ({
      ...prev,
      phases: prev.phases.map(p => p.id !== phaseId ? p : {
        ...p,
        checklist_items: p.checklist_items.map(i => i.id !== itemId ? i : { ...i, is_complete: next }),
      }),
    }));
    try {
      await api.patch(`/checklist-items/${itemId}`, { is_complete: next });
    } catch {
      setActiveOutline(prev => prev && ({
        ...prev,
        phases: prev.phases.map(p => p.id !== phaseId ? p : {
          ...p,
          checklist_items: p.checklist_items.map(i => i.id !== itemId ? i : { ...i, is_complete: current }),
        }),
      }));
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !challenge || isSending) return;

    const messageText = input.trim();
    setInput('');
    setIsSending(true);
    setNotification(null);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [
      ...prev,
      userMsg,
      { id: STREAMING_ID, role: 'assistant', content: '', created_at: new Date().toISOString(), streaming: true },
    ]);

    try {
      // Create conversation if it doesn't exist yet
      let conversationId = challenge.conversation_id;
      if (!conversationId) {
        const convResponse = await api.post('/conversations', {
          user_id: user!.id,
          title: `Coaching: ${challenge.title}`,
          conversation_type: 'CHALLENGE',
          challenge_id: challenge.id,
        });
        conversationId = convResponse.data.id;
        setChallenge(prev => prev ? { ...prev, conversation_id: conversationId } : null);
      }

      abortRef.current = new AbortController();

      await streamChatMessage(
        conversationId,
        messageText,
        (event: StreamEvent) => {
          if (event.type === 'delta') {
            setMessages(prev => prev.map(m =>
              m.id === STREAMING_ID ? { ...m, content: m.content + event.text } : m
            ));
          } else if (event.type === 'done') {
            const isOutline = event.kind === 'outline' && event.outline;
            if (isOutline && event.outlineId) {
              // Refresh the outline panel from the server so we get the full DB record
              api.get(`/outlines/${event.outlineId}`).then(r => {
                setActiveOutline(r.data.outline);
              }).catch(() => {});
            }
            setMessages(prev => prev.map(m =>
              m.id === STREAMING_ID
                ? {
                    ...m,
                    id:         event.messageId.toString(),
                    streaming:  false,
                    created_at: event.createdAt,
                    ...(event.kind === 'outline' ? { content: event.preamble ?? m.content } : {}),
                    ...(isOutline ? {
                      kind: 'outline' as const,
                      outlineMeta: {
                        id:         event.outlineId!,
                        title:      event.outline.title,
                        phaseCount: event.outline.phases.length,
                        itemCount:  event.outline.phases.reduce(
                          (sum: number, p: any) =>
                            sum + (p.checklist_items?.length ?? 0) + (p.habits?.length ?? 0) + (p.check_in_prompts?.length ?? 0),
                          0,
                        ),
                      },
                    } : {}),
                  }
                : m
            ));
          } else if (event.type === 'error') {
            setMessages(prev => prev.map(m =>
              m.id === STREAMING_ID
                ? { ...m, id: `err-${Date.now()}`, streaming: false, content: 'Sorry, something went wrong. Please try again.' }
                : m
            ));
            setNotification({ message: 'Failed to get a response. Please try again.', type: 'error' });
          }
        },
        abortRef.current.signal,
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setMessages(prev => prev.filter(m => m.id !== STREAMING_ID));
        setInput(messageText);
        setNotification({ message: 'Failed to send message. Please check your connection and try again.', type: 'error' });
      }
    } finally {
      setIsSending(false);
    }
  }, [input, challenge, isSending, user]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const goBack = () => navigate('/dashboard/challenges');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Challenge Not Found</h2>
          <Button onClick={goBack}>Back to Challenges</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Left Panel - Challenge Details */}
      <div className="w-1/3 border-r border-border bg-background overflow-y-auto">
        <div className="p-6">
          <Button variant="ghost" size="icon" onClick={goBack} className="mb-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <StatusBadge status={challenge.status} className="mb-4" />

          <h1 className="text-2xl font-bold text-foreground mb-2">{challenge.title}</h1>
          <MarkdownContent content={challenge.description} className="text-muted-foreground mb-6" />

          {/* Progress */}
          <Card className="nm-raised border-0 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{challenge.progress}%</span>
                <TrendingUp className="w-5 h-5 text-[hsl(var(--status-active))]" />
              </div>
              <ProgressBar value={challenge.progress} />
            </CardContent>
          </Card>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Target className="w-4 h-4 mr-2" />
                <span className="font-semibold">Category</span>
              </div>
              <p className="text-foreground ml-6">{challenge.category}</p>
            </div>

            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="font-semibold">Timeline</span>
              </div>
              <p className="text-foreground ml-6">
                {new Date(challenge.start_date).toLocaleDateString()}
                {challenge.end_date && ` - ${new Date(challenge.end_date).toLocaleDateString()}`}
              </p>
            </div>

            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <span className="font-semibold">Success Criteria</span>
              </div>
              <MarkdownContent content={challenge.success_criteria} className="ml-6" />
            </div>

            {challenge.metrics && (
              <div>
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="font-semibold">Metrics</span>
                </div>
                <MarkdownContent content={challenge.metrics!} className="ml-6" />
              </div>
            )}
          </div>

          {/* Active Plan — compact action panel */}
          {activeOutline && (() => {
            const allHabits = activeOutline.phases.flatMap(p =>
              p.habits.map(h => ({ ...h, phaseId: p.id }))
            );
            const allItems = activeOutline.phases.flatMap(p =>
              p.checklist_items.map(i => ({ ...i, phaseId: p.id }))
            );
            const unloggedHabits   = allHabits.filter(h => !isHabitLogged(h));
            const incompleteItems  = allItems.filter(i => !i.is_complete).slice(0, 3);
            const hasDueItems      = unloggedHabits.length > 0 || incompleteItems.length > 0;

            return (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Active Plan</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/dashboard/challenges/${id}/outlines/${activeOutline.id}`)}
                  >
                    View full <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mb-3 truncate">{activeOutline.title}</p>

                {hasDueItems ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Due today</p>

                    {unloggedHabits.map(habit => (
                      <div key={habit.id} className="flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                        <span className="text-xs text-foreground flex-1 truncate">{habit.description}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loggingHabits.has(habit.id)}
                          className="h-6 text-[10px] px-2 rounded-lg flex-shrink-0"
                          onClick={() => logHabitToday(habit.phaseId, habit.id)}
                        >
                          {loggingHabits.has(habit.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Log'}
                        </Button>
                      </div>
                    ))}

                    {incompleteItems.map(item => (
                      <button
                        key={item.id}
                        className="flex items-center gap-2 w-full text-left group"
                        onClick={() => toggleChecklistItem(item.phaseId, item.id, item.is_complete)}
                      >
                        {item.is_complete
                          ? <CheckSquare className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          : <Square className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                        }
                        <span className={`text-xs flex-1 truncate ${item.is_complete ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {item.description}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">All caught up for today!</p>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header — glass surface */}
        <div className="glass border-0 border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Coaching Session</h2>
              <p className="text-sm text-muted-foreground">Chat with Simon about this challenge</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Start Your Coaching Session</h3>
              <p className="text-muted-foreground">Ask Simon for guidance, share progress, or discuss obstacles</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex gap-3 w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}

                  {message.role === 'user' ? (
                    <div className="px-4 py-3 max-w-2xl rounded-2xl bg-primary">
                      <ChatMessage content={message.content} role="user" />
                    </div>
                  ) : (
                    <Card className="nm-raised border-0 px-5 py-4 max-w-2xl">
                      {message.content === '' && message.streaming ? (
                        <span
                          aria-label="Simon is typing"
                          className="inline-block w-[2px] h-[0.9em] bg-foreground/50 rounded-sm align-middle animate-[caret_1s_ease-in-out_infinite]"
                        />
                      ) : (
                        <ChatMessage content={message.content} role="assistant" streaming={message.streaming} />
                      )}
                    </Card>
                  )}

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {message.kind === 'outline' && message.outlineMeta && (
                  <div className="ml-11">
                    <OutlineCard
                      outlineId={message.outlineMeta.id}
                      challengeId={parseInt(id!)}
                      title={message.outlineMeta.title}
                      phaseCount={message.outlineMeta.phaseCount}
                      itemCount={message.outlineMeta.itemCount}
                    />
                  </div>
                )}
              </div>
            ))
          )}

        </div>

        {/* Service notification */}
        {notification && (
          <div className={`mx-4 mb-1 px-4 py-2.5 rounded-xl border flex items-start gap-2.5 text-sm ${
            notification.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-200'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1 leading-snug">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input — glass surface */}
        <div className="glass border-0 border-t border-border p-4">
          <div className="relative rounded-3xl border border-border bg-background shadow-sm">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Share your progress, ask for guidance, or discuss challenges..."
              className="min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-4 pr-14 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
              disabled={isSending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isSending}
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 right-3 h-8 w-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
