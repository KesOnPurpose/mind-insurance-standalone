import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import CoachSelector from "@/components/chat/CoachSelector";
import ChatMessage from "@/components/chat/ChatMessage";
import { CoachType, COACHES } from "@/types/coach";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  coachType: CoachType;
}

const ChatPage = () => {
  const [selectedCoach, setSelectedCoach] = useState<CoachType>('mio');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm MIO - Mind Insurance Oracle. I'm your forensic behavioral psychologist here to help you see patterns you can't see yourself. I notice everything in your PROTECT practices and can help you break through mental blocks. What's on your mind?",
      timestamp: new Date(),
      coachType: 'mio'
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

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

  const handleCoachChange = (coach: CoachType) => {
    setSelectedCoach(coach);
    
    // Add a greeting message from the new coach
    const greetingMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `Hi! I'm ${COACHES[coach].name}, your ${COACHES[coach].title}. ${COACHES[coach].description} How can I help you today?`,
      timestamp: new Date(),
      coachType: coach
    };
    
    setMessages((prev) => [...prev, greetingMessage]);
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

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
      // Call MIO chat edge function with streaming
      const CHAT_URL = `https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/mio-chat`;
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODY2MjIsImV4cCI6MjA3NDM2MjYyMn0.COFyvu_J-FnwTjbPCzi2v7yVR9cLWcg_sodKRV_Wlvs`,
        },
        body: JSON.stringify({
          user_id: user.id,
          message: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from MIO');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      const aiMessageId = (Date.now() + 1).toString();

      // Create initial AI message
      const initialAiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: '',
        timestamp: new Date(),
        coachType: 'mio'
      };
      setMessages((prev) => [...prev, initialAiMessage]);

      // Stream response
      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  aiContent += content;
                  setMessages((prev) => 
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, content: aiContent }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
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
