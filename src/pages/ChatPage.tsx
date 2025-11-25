import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import CoachSelector from "@/components/chat/CoachSelector";
import ChatMessage from "@/components/chat/ChatMessage";
import HandoffSuggestion from "@/components/chat/HandoffSuggestion";
import { CoachType, COACHES } from "@/types/coach";
import { HandoffSuggestion as HandoffSuggestionType } from "@/types/handoff";
import { useAuth } from "@/contexts/AuthContext";
import { useProduct, ProductType } from "@/contexts/ProductContext";
import { useToast } from "@/hooks/use-toast";

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

  const getCoachResponse = (coachType: CoachType, userInput: string): string => {
    const coach = COACHES[coachType];
    
    // Simple response logic based on coach personality
    if (coachType === 'nette') {
      return `Great question! As your Strategy Coach, I can help you with that. Based on my knowledge of 403 proven tactics and state-specific insights, here's what I recommend for your situation...`;
    } else if (coachType === 'mio') {
      return `I appreciate you sharing that with me. As your Mindset & Accountability Coach, let's work through this together. Remember, your identity collision work and daily PROTECT practices are key to breaking through obstacles...`;
    } else {
      return `Perfect timing to address this! As your Operations Coach, let me help you organize this practically. Let's break this down into actionable steps you can schedule in your model week...`;
    }
  };

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
      // Call Railway MIO FastAPI backend with streaming
      const API_URL = import.meta.env.VITE_API_URL || 'https://mio-fastapi-production-production.up.railway.app';
      const CHAT_URL = `${API_URL}/api/chat`;

      console.log('[MIO Chat] Calling Railway backend:', CHAT_URL);

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          message: messageText,
          current_agent: selectedCoach,
          conversation_id: currentConversationId, // Use generated ID
        }),
      });

      console.log('[MIO Chat] Response status:', response.status);
      console.log('[MIO Chat] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('[MIO Chat] Error response:', response.status, response.statusText);
        if (response.status === 429) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive",
          });
          setIsTyping(false);
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Credits Required",
            description: "Please add credits to your Lovable AI workspace to continue.",
            variant: "destructive",
          });
          setIsTyping(false);
          return;
        }
        throw new Error('Failed to get response from MIO');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      const aiMessageId = (Date.now() + 1).toString();

      // Create initial AI message with current selected coach
      const initialAiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: '',
        timestamp: new Date(),
        coachType: selectedCoach
      };
      setMessages((prev) => [...prev, initialAiMessage]);

      // Helper function to check if JSON is complete
      const isCompleteJson = (str: string): boolean => {
        let depth = 0;
        let inString = false;
        let escape = false;

        for (let i = 0; i < str.length; i++) {
          const char = str[i];

          if (escape) {
            escape = false;
            continue;
          }

          if (char === '\\') {
            escape = true;
            continue;
          }

          if (char === '"' && !escape) {
            inString = !inString;
            continue;
          }

          if (inString) continue;

          if (char === '{' || char === '[') depth++;
          if (char === '}' || char === ']') depth--;
        }

        return depth === 0 && !inString;
      };

      // Stream response with robust SSE parsing and buffering
      if (reader) {
        console.log('[MIO Chat] Starting SSE stream read with enhanced buffering...');
        let textBuffer = '';
        let incompleteDataLine = ''; // Buffer for incomplete data: lines
        let streamDone = false;
        let metadataReceived = false;
        let chunkCount = 0;
        let bufferHits = 0;
        let parseErrors = 0;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[MIO Chat] Stream done, total chunks:', chunkCount);
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          console.log('[MIO Chat] Chunk #' + chunkCount + ':', chunk.substring(0, 200));
          textBuffer += chunk;

          // Process line-by-line as data arrives
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1); // handle CRLF
            if (line.startsWith(":") || line.trim() === "") continue; // SSE comments/keepalive

            // Check if we have a buffered incomplete data line
            if (incompleteDataLine) {
              line = incompleteDataLine + line;
              incompleteDataLine = '';
            }

            if (!line.startsWith("data: ")) {
              // This could be part of multi-line content from the previous data chunk
              // The backend sometimes sends content with newlines that break SSE format
              // We should append this as part of the content with a newline
              if (aiContent.length > 0 && line.trim()) {
                console.log('[MIO Chat] Multi-line content continuation:', line.substring(0, 50));
                aiContent += '\n' + line;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: aiContent }
                      : msg
                  )
                );
              } else {
                console.log('[MIO Chat] Skipping non-data line:', line.substring(0, 50));
              }
              continue;
            }

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              console.log('[MIO Chat] Received [DONE] signal');
              streamDone = true;
              break;
            }

            // Check if this is JSON or plain text
            const isJson = jsonStr.startsWith('{') || jsonStr.startsWith('[');

            // Only check JSON completeness for actual JSON data
            if (isJson && !isCompleteJson(jsonStr)) {
              bufferHits++;
              console.log('[MIO Chat] Incomplete JSON detected (buffer hit #' + bufferHits + '), buffering line...');
              incompleteDataLine = line;
              continue;
            }

            if (isJson) {
              // Handle JSON format (for metadata/handoffs)
              try {
                const parsed = JSON.parse(jsonStr);
                console.log('[MIO Chat] Successfully parsed SSE JSON data:', parsed);

                // Check for handoff suggestion metadata
                if (parsed.type === 'handoff') {
                  console.log('[MIO Chat] Handoff suggestion:', parsed);
                  setHandoffSuggestion({
                    suggestedAgent: parsed.suggestedAgent,
                    reason: `This question might be better answered by ${parsed.suggestedAgent === 'nette' ? 'Nette' : parsed.suggestedAgent === 'mio' ? 'MIO' : 'ME'}`,
                    confidence: parsed.confidence,
                    detectedKeywords: [],
                    method: parsed.method
                  });
                  metadataReceived = true;
                  continue;
                }

                // Check for OpenAI format content
                const content = parsed.choices?.[0]?.delta?.content as string | undefined;
                if (content !== undefined) { // Handle empty string content
                  console.log('[MIO Chat] Got JSON content:', content);
                  aiContent += content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, content: aiContent }
                        : msg
                    )
                  );
                }
              } catch (err) {
                parseErrors++;
                console.error('[MIO Chat] JSON parse error #' + parseErrors + ':', err, 'Line:', jsonStr.substring(0, 100));
                // Skip this malformed line and continue
                continue;
              }
            } else {
              // Handle plain text format (current backend format)
              console.log('[MIO Chat] Got plain text content:', jsonStr);
              // Add the text chunk (already includes spaces from backend)
              aiContent += jsonStr;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, content: aiContent }
                    : msg
                )
              );
            }
          }
        }

        // Handle any incomplete data line that wasn't completed
        if (incompleteDataLine) {
          console.log('[MIO Chat] Processing final incomplete data line:', incompleteDataLine.substring(0, 100));
          const jsonStr = incompleteDataLine.slice(6).trim();
          if (jsonStr !== "[DONE]") {
            const isJson = jsonStr.startsWith('{') || jsonStr.startsWith('[');

            if (isJson && isCompleteJson(jsonStr)) {
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content as string | undefined;
                if (content !== undefined) {
                  aiContent += content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, content: aiContent }
                        : msg
                    )
                  );
                }
              } catch (err) {
                parseErrors++;
                console.error('[MIO Chat] Final buffer JSON parse error:', err);
              }
            } else if (!isJson) {
              // Plain text - just append it
              aiContent += jsonStr;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, content: aiContent }
                    : msg
                )
              );
            }
          }
        }

        // Final flush in case remaining buffered text arrived without trailing newline
        if (textBuffer.trim()) {
          console.log('[MIO Chat] Processing remaining buffer:', textBuffer.substring(0, 100));
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            const isJson = jsonStr.startsWith('{') || jsonStr.startsWith('[');

            if (isJson) {
              if (!isCompleteJson(jsonStr)) {
                console.log('[MIO Chat] Skipping incomplete JSON in final buffer');
                continue;
              }

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content as string | undefined;
                if (content !== undefined) {
                  aiContent += content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, content: aiContent }
                        : msg
                    )
                  );
                }
              } catch (err) {
                parseErrors++;
                console.error('[MIO Chat] Final buffer parse error:', err);
              }
            } else {
              // Plain text - just append it
              aiContent += jsonStr;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, content: aiContent }
                    : msg
                )
              );
            }
          }
        }

        // Log stream statistics
        console.log('[MIO Chat] Stream statistics:');
        console.log('  - Total chunks:', chunkCount);
        console.log('  - Buffer hits:', bufferHits);
        console.log('  - Parse errors:', parseErrors);
        console.log('  - Final content length:', aiContent.length);

        // FRONTEND FALLBACK: Detect and flag incomplete responses
        const trimmedContent = aiContent.trim();
        const endsWithPunctuation = /[.?!]$/.test(trimmedContent);
        const isSuspiciouslyShort = trimmedContent.length < 30;

        if (isSuspiciouslyShort && trimmedContent.length > 0) {
          console.error('[MIO Chat] INCOMPLETE RESPONSE - Very short:', trimmedContent.length, 'chars');

          // Add user-friendly notice
          aiContent += '\n\n_[Response incomplete - please try sending your message again]_';
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: aiContent }
                : msg
            )
          );
        } else if (!endsWithPunctuation && trimmedContent.length > 0) {
          console.warn('[MIO Chat] Response may be incomplete - no ending punctuation. Last 30 chars:', trimmedContent.slice(-30));
        }
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
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                coachType={message.coachType}
              />
            ))}

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
                disabled={isTyping}
              />
              <Button
                onClick={handleSend}
                size="icon"
                disabled={isTyping || !input.trim()}
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
