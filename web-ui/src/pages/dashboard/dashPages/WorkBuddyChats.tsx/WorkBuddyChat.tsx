import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Bot, User, ArrowUp, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

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
  const { user, token } = useAuth();

  if (!user || !token) {
    return <div>Loading...</div>;
  }

  return <WorkBuddyChatComponent userId={user.id} authToken={token} />;
}

export function WorkBuddyChatComponent({ userId, authToken }: { userId: number; authToken: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
    
    // Check if cache is still valid
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

  // API calls
  const fetchOrCreateConversation = async () => {
    try {
      // Check cache first
      const cached = getCachedConversation();
      if (cached) {
        setConversationId(cached.conversationId);
        setMessages(cached.messages);
        setIsLoading(false);
        return cached.conversationId;
      }

      // Fetch user's conversations
      const response = await fetch(`${API_BASE_URL}/conversations/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch conversations');

      const conversations = await response.json();

      if (conversations.length > 0) {
        // Load most recent conversation
        const latestConv = conversations[0];
        const messagesResponse = await fetch(
          `${API_BASE_URL}/conversations/${latestConv.id}/messages`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!messagesResponse.ok) throw new Error('Failed to fetch messages');

        const data = await messagesResponse.json();
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
        // Create new conversation
        const createResponse = await fetch(`${API_BASE_URL}/conversations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            title: 'New Conversation'
          })
        });

        if (!createResponse.ok) throw new Error('Failed to create conversation');

        const newConv = await createResponse.json();
        setConversationId(newConv.id);
        setCachedConversation(newConv.id, []);
        
        return newConv.id;
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      // Fallback to local-only mode
      setConversationId(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessageToBackend = async (convId: number, role: 'USER' | 'ASSISTANT', content: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${convId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role,
          content
        })
      });

      if (!response.ok) throw new Error('Failed to save message');
      
      return await response.json();
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  // Load conversation on mount
  useEffect(() => {
    fetchOrCreateConversation();
  }, [userId]);

  // Update cache whenever messages change
  useEffect(() => {
    if (conversationId && conversationId > 0 && messages.length > 0) {
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

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Save user message to backend
    if (conversationId > 0) {
      saveMessageToBackend(conversationId, 'USER', currentInput);
    }

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(currentInput);
      const response = result.response;
      const text = cleanMarkdown(response.text());

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to backend
      if (conversationId > 0) {
        saveMessageToBackend(conversationId, 'ASSISTANT', text);
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-medium text-slate-600 mb-2">Start a conversation</h2>
              <p className="text-slate-400">Ask me anything about improving team efficiency</p>
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
                  ? 'bg-gray-900 text-white border-gray-900' 
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
      <div className="border-t bg-white shadow-lg">
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