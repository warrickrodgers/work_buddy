import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MessageCircle, Calendar, Target, TrendingUp, CheckCircle2, ArrowUp, Loader2, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { ChatMessage, MarkdownContent } from '@/components/ChatMessage';
import { OutlineCard } from '@/components/OutlineCard';
import api from '@/lib/api';

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
}

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
      const response = await api.get(`/challenges/${id}`);
      setChallenge(response.data);

      // Load challenge conversation if it exists
      if (response.data.conversation_id) {
        const messagesResponse = await api.get(`/conversations/${response.data.conversation_id}/messages`);
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

  const handleSendMessage = async () => {
    if (!input.trim() || !challenge) return;

    const messageText = input.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    setNotification(null);

    try {
      // Create conversation if doesn't exist
      let conversationId = challenge.conversation_id;

      if (!conversationId) {
        const convResponse = await api.post('/conversations', {
          user_id: user!.id,
          title: `Coaching: ${challenge.title}`,
          conversation_type: 'CHALLENGE',
          challenge_id: challenge.id
        });
        conversationId = convResponse.data.id;
        setChallenge(prev => prev ? { ...prev, conversation_id: conversationId } : null);
      }

      // Send message
      const response = await api.post(`/conversations/${conversationId}/messages`, {
        role: 'USER',
        content: messageText
      });

      if (response.data.assistantMessage) {
        const data = response.data;
        const isOutline = data.kind === 'outline' && data.outline;
        const assistantMessage: Message = {
          id: data.assistantMessage.id.toString(),
          role: 'assistant',
          content: data.assistantMessage.content,
          created_at: data.assistantMessage.created_at,
          ...(isOutline ? {
            kind: 'outline' as const,
            outlineMeta: {
              id: data.outlineId,
              title: data.outline.title,
              phaseCount: data.outline.phases.length,
              itemCount: data.outline.phases.reduce(
                (sum: number, p: any) =>
                  sum + (p.checklist_items?.length ?? 0) + (p.habits?.length ?? 0) + (p.check_in_prompts?.length ?? 0),
                0
              ),
            },
          } : {}),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);

      const isServiceOverloaded =
        error?.response?.status === 503 ||
        error?.response?.data?.retryable === true;

      if (isServiceOverloaded) {
        // Server rolled back the DB write — remove optimistic bubble and restore input
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        setInput(messageText);
        setNotification({
          message: 'Simon is currently experiencing increased demand. Your message has been restored — please try again shortly.',
          type: 'warning'
        });
      } else {
        setNotification({
          message: 'Failed to send message. Please check your connection and try again.',
          type: 'error'
        });
      }
    } finally {
      setIsSending(false);
    }
  };

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

          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
            challenge.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
            challenge.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
            'bg-muted text-muted-foreground'
          }`}>
            {challenge.status}
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">{challenge.title}</h1>
          <MarkdownContent content={challenge.description} className="text-muted-foreground mb-6" />

          {/* Progress */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{challenge.progress}%</span>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${challenge.progress}%` }}
                />
              </div>
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
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
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
                    <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                  )}

                  {message.role === 'user' ? (
                    <div className="px-4 py-3 max-w-2xl rounded-2xl bg-blue-600 dark:bg-blue-700">
                      <ChatMessage content={message.content} role="user" />
                    </div>
                  ) : (
                    <Card className="px-5 py-4 max-w-2xl">
                      <ChatMessage content={message.content} role="assistant" />
                    </Card>
                  )}

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-white" />
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

          {isSending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <Card className="px-4 py-3 bg-card border-border">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </Card>
            </div>
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

        {/* Input */}
        <div className="border-t border-border bg-background p-4">
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
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}