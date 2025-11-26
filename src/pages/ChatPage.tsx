import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import CoachSelector from "@/components/chat/CoachSelector";
import ChatMessage from "@/components/chat/ChatMessage";
import HandoffSuggestion from "@/components/chat/HandoffSuggestion";
import { CoachType, COACHES } from "@/types/coach";
import { HandoffSuggestion as HandoffSuggestionType } from "@/types/handoff";
import { useAuth } from "@/contexts/AuthContext";
import { useProduct, ProductType } from "@/contexts/ProductContext";
import { useToast } from "@/hooks/use-toast";
import { fetchRecentConversation } from "@/services/chatHistoryService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  coachType: CoachType;
}

// Map product type to default coach
const getDefaultCoachForProduct = (product: ProductType): CoachType => {
  const coachMap: Record<ProductType, CoachType> = {
    'grouphome': 'nette',
    'mind-insurance': 'mio',
    'me-wealth': 'me'
  };
  return coachMap[product];
};

// Get initial greeting based on coach type
const getInitialGreeting = (coach: CoachType): string => {
  const greetings: Record<CoachType, string> = {
    'nette': "Hey there! I'm Nette, your Group Home Expert. I have access to 403 proven tactics and state-specific insights to help you launch your group home business. Whether you need help with licensing, property selection, or operational strategies, I'm here to guide you. What would you like to work on today?",
    'mio': "Hi! I'm MIO - Mind Insurance Oracle. I'm your forensic behavioral psychologist here to help you see patterns you can't see yourself. I notice everything in your PROTECT practices and can help you break through mental blocks. What's on your mind?",
    'me': "Hello! I'm ME, your Money Evolution Expert. I specialize in business credit, funding strategies, and financial planning for your group home venture. Let's build your financial foundation together. What financial goals are you working towards?"
  };
  return greetings[coach];
};

const ChatPage = () => {
  const { currentProduct } = useProduct();
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize coach based on current product context
  const defaultCoach = getDefaultCoachForProduct(currentProduct);

  const [selectedCoach, setSelectedCoach] = useState<CoachType>(defaultCoach);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: getInitialGreeting(defaultCoach),
      timestamp: new Date(),
      coachType: defaultCoach
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [handoffSuggestion, setHandoffSuggestion] = useState<HandoffSuggestionType | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation ID from localStorage on mount
  useEffect(() => {
    const storedConversationId = localStorage.getItem('mio_conversation_id');
    if (storedConversationId) {
      setConversationId(storedConversationId);
      console.log('[Conversation] Restored conversation:', storedConversationId);
    }
  }, []);

  // Load chat history on mount and when coach changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user?.id) {
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      console.log('[ChatHistory] Loading history for', selectedCoach);

      try {
        const history = await fetchRecentConversation(user.id, selectedCoach, 30);

        if (history.length > 0) {
          console.log('[ChatHistory] Loaded', history.length, 'messages');
          // Add the initial greeting at the start, then the history
          setMessages([
            {
              id: "1",
              role: "assistant",
              content: getInitialGreeting(selectedCoach),
              timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
              coachType: selectedCoach
            },
            ...history
          ]);
        } else {
          console.log('[ChatHistory] No history found, showing greeting');
          // No history, just show the greeting
          setMessages([
            {
              id: "1",
              role: "assistant",
              content: getInitialGreeting(selectedCoach),
              timestamp: new Date(),
              coachType: selectedCoach
            }
          ]);
        }
      } catch (error) {
        console.error('[ChatHistory] Error loading history:', error);
        // On error, just show the greeting
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: getInitialGreeting(selectedCoach),
            timestamp: new Date(),
            coachType: selectedCoach
          }
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [user?.id, selectedCoach]);

  // Save conversation ID to localStorage when it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('mio_conversation_id', conversationId);
      console.log('[Conversation] Saved conversation:', conversationId);
    }
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCoachChange = (coach: CoachType, isHandoff: boolean = false) => {
    const previousCoach = selectedCoach;
    setSelectedCoach(coach);

    // Reset conversation when switching coaches
    if (!isHandoff) {
      setConversationId(null);
      localStorage.removeItem('mio_conversation_id');
      console.log('[Conversation] Reset - coach changed');
    }

    // Build warm introduction with context
    let greetingContent = `Hi! I'm ${COACHES[coach].name}, your ${COACHES[coach].title}.`;

    if (isHandoff && previousCoach !== coach) {
      greetingContent += ` I've reviewed your conversation with ${COACHES[previousCoach].name}. `;
    }

    greetingContent += ` ${COACHES[coach].description} How can I help you today?`;

    const greetingMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: greetingContent,
      timestamp: new Date(),
      coachType: coach
    };

    setMessages((prev) => [...prev, greetingMessage]);
    setHandoffSuggestion(null);
  };

  const handleAcceptHandoff = () => {
    if (handoffSuggestion) {
      handleCoachChange(handoffSuggestion.suggestedAgent, true);
    }
  };

  const handleDismissHandoff = () => {
    setHandoffSuggestion(null);
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    // Generate conversation ID on first message
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      currentConversationId = crypto.randomUUID();
      setConversationId(currentConversationId);
      console.log('[Conversation] Started new conversation:', currentConversationId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      coachType: selectedCoach
    };

    setMessages([...messages, userMessage]);
    const messageText = input;
    setInput("");
    setIsTyping(true);

    try {
      // Call n8n webhook for AI agent response
      const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n-n8n.vq00fr.easypanel.host/webhook/UnifiedChat';

      console.log('[Chat] Calling n8n webhook:', N8N_WEBHOOK_URL);
      console.log('[Chat] User ID:', user.id);
      console.log('[Chat] Agent:', selectedCoach);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          message: messageText,
          agent: selectedCoach,
          conversation_id: currentConversationId,
        }),
      });

      console.log('[Chat] Response status:', response.status);

      if (!response.ok) {
        console.error('[Chat] Error response:', response.status, response.statusText);

        // Handle specific error codes
        if (response.status === 429) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive",
          });
          setIsTyping(false);
          return;
        }

        if (response.status === 500) {
          // Check if it's a user not found error
          const errorText = await response.text();
          if (errorText.includes('select condition') || errorText.includes('user')) {
            toast({
              title: "Profile Not Found",
              description: "Your user profile wasn't found. Please refresh the page and try again.",
              variant: "destructive",
            });
            setIsTyping(false);
            return;
          }
        }

        throw new Error(`Failed to get response: ${response.status}`);
      }

      // Parse JSON response from n8n
      const data = await response.json();
      console.log('[Chat] Response data:', data);

      const aiMessageId = (Date.now() + 1).toString();
      const responseAgent = (data.agent || selectedCoach) as CoachType;

      // Create AI message with the response
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: data.response || "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: new Date(),
        coachType: responseAgent
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Handle handoff detection from n8n
      if (data.handoff_detected && data.handoff_message) {
        console.log('[Chat] Handoff detected:', data.agent);
        setHandoffSuggestion({
          suggestedAgent: responseAgent,
          reason: data.handoff_message,
          confidence: 0.85,
          detectedKeywords: [],
          method: 'keyword_scoring'
        });
      }

      // Update selected coach if handoff occurred
      if (data.agent && data.agent !== selectedCoach) {
        console.log('[Chat] Agent switched from', selectedCoach, 'to', data.agent);
        // Don't auto-switch, let user accept handoff
      }

      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <div 
        className="text-white transition-all"
        style={{ background: COACHES[selectedCoach].gradient }}
      >
        <div className="container mx-auto px-4 py-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl">
              {COACHES[selectedCoach].avatar}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Chat with {COACHES[selectedCoach].name}</h1>
              <p className="text-white/90 text-sm">{COACHES[selectedCoach].title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Coach Selector */}
          <CoachSelector 
            selectedCoach={selectedCoach} 
            onSelectCoach={handleCoachChange}
          />
          
          {/* Messages */}
          <div className="space-y-6 mb-6">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading conversation...</span>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  coachType={message.coachType}
                />
              ))
            )}

            {handoffSuggestion && (
              <HandoffSuggestion
                suggestedAgent={handoffSuggestion.suggestedAgent}
                reason={handoffSuggestion.reason}
                confidence={handoffSuggestion.confidence}
                method={handoffSuggestion.method}
                onAccept={handleAcceptHandoff}
                onDismiss={handleDismissHandoff}
              />
            )}

            {isTyping && (
              <ChatMessage
                role="assistant"
                content="..."
                timestamp={new Date()}
                coachType={selectedCoach}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background sticky bottom-0">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            {/* New Conversation Button */}
            {conversationId && messages.length > 1 && (
              <div className="flex justify-center mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConversationId(null);
                    localStorage.removeItem('mio_conversation_id');
                    setMessages([{
                      id: "1",
                      role: "assistant",
                      content: getInitialGreeting(selectedCoach),
                      timestamp: new Date(),
                      coachType: selectedCoach
                    }]);
                    console.log('[Conversation] Reset - starting fresh');
                  }}
                  className="text-xs"
                >
                  Start New Conversation
                </Button>
              </div>
            )}

            {/* Active Conversation Indicator */}
            {conversationId && (
              <div className="text-xs text-muted-foreground text-center mb-2">
                Active conversation • {messages.length - 1} {messages.length === 2 ? 'message' : 'messages'}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={`Ask ${COACHES[selectedCoach].name} about ${COACHES[selectedCoach].expertise[0].toLowerCase()}...`}
                className="flex-1"
                disabled={isTyping || isLoadingHistory}
              />
              <Button
                onClick={handleSend}
                size="icon"
                disabled={isTyping || isLoadingHistory || !input.trim()}
                style={{ background: COACHES[selectedCoach].gradient }}
                className="text-white hover:opacity-90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Currently chatting with {COACHES[selectedCoach].name} • {COACHES[selectedCoach].title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
