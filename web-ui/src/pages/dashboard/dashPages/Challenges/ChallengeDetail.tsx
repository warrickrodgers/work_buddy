import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MessageCircle, Calendar, Target, TrendingUp, CheckCircle2, ArrowUp, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadChallenge();
    }
  }, [id, user]);

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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

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
        content: input
      });

      if (response.data.assistantMessage) {
        const assistantMessage: Message = {
          id: response.data.assistantMessage.id.toString(),
          role: 'assistant',
          content: response.data.assistantMessage.content,
          created_at: response.data.assistantMessage.created_at
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
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

  const goBack = () => {
    window.location.href = '/dashboard/challenges';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Challenge Not Found</h2>
          <Button onClick={goBack}>Back to Challenges</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left Panel - Challenge Details */}
      <div className="w-1/3 border-r bg-white overflow-y-auto">
        <div className="p-6">
          <Button variant="ghost" size="icon" onClick={goBack} className="mb-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
            challenge.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
            challenge.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {challenge.status}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">{challenge.title}</h1>
          <p className="text-slate-600 mb-6">{challenge.description}</p>

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
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${challenge.progress}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center text-sm text-slate-600 mb-1">
                <Target className="w-4 h-4 mr-2" />
                <span className="font-semibold">Category</span>
              </div>
              <p className="text-slate-900 ml-6">{challenge.category}</p>
            </div>

            <div>
              <div className="flex items-center text-sm text-slate-600 mb-1">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="font-semibold">Timeline</span>
              </div>
              <p className="text-slate-900 ml-6">
                {new Date(challenge.start_date).toLocaleDateString()}
                {challenge.end_date && ` - ${new Date(challenge.end_date).toLocaleDateString()}`}
              </p>
            </div>

            <div>
              <div className="flex items-center text-sm text-slate-600 mb-1">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <span className="font-semibold">Success Criteria</span>
              </div>
              <p className="text-slate-900 ml-6">{challenge.success_criteria}</p>
            </div>

            {challenge.metrics && (
              <div>
                <div className="flex items-center text-sm text-slate-600 mb-1">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="font-semibold">Metrics</span>
                </div>
                <p className="text-slate-900 ml-6">{challenge.metrics}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Coaching Session</h2>
              <p className="text-sm text-slate-500">Chat with Simon about this challenge</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Start Your Coaching Session</h3>
              <p className="text-slate-500">Ask Simon for guidance, share progress, or discuss obstacles</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                )}

                <Card className={`px-4 py-3 max-w-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
                    message.role === 'user' ? 'prose-invert' : 'prose-slate'
                  }`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </Card>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {isSending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <Card className="px-4 py-3 bg-white border-slate-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t bg-white p-4">
          <div className="relative rounded-3xl border border-slate-200 bg-white shadow-sm">
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
              className="absolute top-1/2 -translate-y-1/2 right-3 h-8 w-8 rounded-lg"
              style={{ color: '#ffffff', backgroundColor: '#101828' }}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}