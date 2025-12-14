import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Bot, User, ArrowUp, Loader2 } from 'lucide-react';
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
export function WorkBuddyChat() {
  const { user } = useAuth();
  const userId = user?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Guard clause - handle null user
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  // Clean up markdown response from LLM
  const cleanMarkdown = (text: string): string => {
    let cleaned = text.trim();
    
    const markdownPattern = /^```markdown\s*\n([\s\S]*?)\n```$/;
    const markdownMatch = cleaned.match(markdownPattern);
    if (markdownMatch) {
      return markdownMatch[1].trim();
    }
    
    const codeBlockPattern = /^```\s*\n([\s\S]*?)\n```$/;
    const codeMatch = cleaned.match(codeBlockPattern);
    if (codeMatch) {
      return codeMatch[1].trim();
    }
    
    return cleaned;
  };

  // Cache management
  const getCachedConversation = (): ConversationCache | null => {
    const cached = localStorage.getItem(`conversation_${userId}`);
    if (!cached) return null;
    
    const data: ConversationCache = JSON.parse(cached);
    const now = Date.now();
    
    if (now - data.lastFetched < CACHE_DURATION) {
      return data;
    }
    return null;
  };

  const setCachedConversation = (convId: number, msgs: Message[]) => {
    const cache: ConversationCache = {
      conversationId: convId,
      messages: msgs,
      lastFetched: Date.now()
    };
    localStorage.setItem(`conversation_${userId}`, JSON.stringify(cache));
  };

  // Fetch or create conversation
  const fetchOrCreateConversation = async () => {
  try {
    setIsLoading(true);
    
    // Check cache first
    const cached = getCachedConversation();
    if (cached) {
      console.log('Using cached conversation:', cached.conversationId);
      
      // Verify conversation still exists in DB and is GENERAL type
      try {
        const verifyResponse = await api.get(`/conversations/${cached.conversationId}`);
        if (verifyResponse.data.conversation_type === 'GENERAL') {
          setConversationId(cached.conversationId);
          setMessages(cached.messages);
          setIsLoading(false);
          return cached.conversationId;
        } else {
          // Cached conversation is not GENERAL type, clear cache
          console.log('Cached conversation is not GENERAL type, fetching fresh');
          localStorage.removeItem(`conversation_${user.id}`);
        }
      } catch (error) {
        console.log('Cached conversation no longer exists, fetching fresh');
        localStorage.removeItem(`conversation_${user.id}`);
      }
    }

    // Fetch user's GENERAL conversations only
    const response = await api.get(`/conversations/user/${user.id}`);
    const conversations = response.data;
    
    // Filter for GENERAL conversations only
    const generalConversations = conversations.filter(
      (conv: any) => conv.conversation_type === 'GENERAL'
    );

    if (generalConversations.length > 0) {
      // Load most recent GENERAL conversation
      const latestConv = generalConversations[0];
      console.log('Loading GENERAL conversation:', latestConv.id);
      
      const messagesResponse = await api.get(`/conversations/${latestConv.id}/messages`);
      const data = messagesResponse.data;
      
      const formattedMessages = data.messages.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));

      setConversationId(latestConv.id);
      setMessages(formattedMessages);
      setCachedConversation(latestConv.id, formattedMessages);
      
      return latestConv.id;
    } else {
      // Create new GENERAL conversation
      console.log('Creating new GENERAL conversation for user:', user.id);
      
      const createResponse = await api.post('/conversations', {
        user_id: user.id,
        title: 'New Conversation',
        conversation_type: 'GENERAL'  // ← Explicitly set to GENERAL
      });

      const newConv = createResponse.data;
      console.log('Created GENERAL conversation:', newConv.id);
      
      setConversationId(newConv.id);
      setCachedConversation(newConv.id, []);
      
      return newConv.id;
    }
  } catch (error) {
    console.error('Error loading conversation:', error);
    setConversationId(-1);
  } finally {
    setIsLoading(false);
  }
};

  // Load conversation on mount
  useEffect(() => {
    fetchOrCreateConversation();
  }, [userId]);

  // Add a manual cache clear function (temporary for debugging)
  useEffect(() => {
    // Clear cache on mount if conversationId is invalid
    const cached = getCachedConversation();
    if (cached && cached.conversationId) {
      console.log('Checking cached conversation validity...');
      api.get(`/conversations/${cached.conversationId}`)
        .catch(() => {
          console.log('Clearing invalid cache');
          localStorage.removeItem(`conversation_${user.id}`);
        });
    }
  }, []);

  // Update cache whenever messages change
  useEffect(() => {
    if (conversationId && conversationId > 0 && messages.length > 0) {
      console.log('Updating cache with', messages.length, 'messages');
      setCachedConversation(conversationId, messages);
    }
  }, [messages, conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const currentInput = input;
    setInput('');
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);

    try {
      // Call bi-app API (which calls agent-server internally)
      const response = await api.post(`/conversations/${conversationId}/messages`, {
        role: 'USER',
        content: currentInput
      });

      const data = response.data;

      // Add assistant message to UI
      if (data.assistantMessage) {
        const assistantMessage: Message = {
          id: data.assistantMessage.id.toString(),
          role: 'assistant',
          content: data.assistantMessage.content,
          timestamp: new Date(data.assistantMessage.created_at)
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-slate-800">Simon: Leadership Coach</h1>
          <p className="text-sm text-slate-500 mt-1">Powered by AI to help improve workplace motivation</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-100">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-medium text-slate-600 mb-2">Start a conversation</h2>
              <p className="text-slate-400">Ask me anything about what you're trying to inspire</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <Card className={`px-4 py-3 max-w-2xl ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white border-slate-200'
              }`}>
                <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
                  message.role === 'user' 
                    ? 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-li:text-white prose-code:text-white prose-code:bg-blue-700 prose-pre:bg-blue-800 prose-h1:text-xl prose-h1:font-bold prose-h1:mb-3 prose-h1:mt-4 prose-h2:text-lg prose-h2:font-semibold prose-h2:mb-2 prose-h2:mt-3 prose-h3:text-base prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-3 prose-p:mb-3 prose-p:mt-0' 
                    : 'prose-slate prose-code:text-blue-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900 prose-pre:rounded-lg prose-pre:border prose-pre:border-slate-700 prose-h1:text-xl prose-h1:font-bold prose-h1:mb-3 prose-h1:mt-4 prose-h2:text-lg prose-h2:font-semibold prose-h2:mb-2 prose-h2:mt-3 prose-h3:text-base prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-3 prose-p:mb-3 prose-p:mt-0'
                }`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: ({ node, children, ...props }: any) => (
                        <pre className="!p-4 !my-3 overflow-x-auto" {...props}>
                          {children}
                        </pre>
                      ),
                      code: ({ node, className, children, ...props }: any) => {
                        const isInline = !className?.includes('language-');
                        if (isInline) {
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <code className={`${className} !bg-transparent text-slate-100`} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </Card>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
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

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white shadow-lg bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="relative rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about team efficiency, productivity tips, or workflow improvements..."
              className="min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-4 pr-14 focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] leading-6"
              rows={1}
              disabled={!conversationId}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || !conversationId}
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 right-3 h-8 w-8 rounded-lg hover:opacity-90 disabled:opacity-30"
              style={{color:'#ffffff', backgroundColor: '#101828' }}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}