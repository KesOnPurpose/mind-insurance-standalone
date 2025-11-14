import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import CoachSelector from "@/components/chat/CoachSelector";
import ChatMessage from "@/components/chat/ChatMessage";
import { CoachType, COACHES } from "@/types/coach";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  coachType: CoachType;
}

const ChatPage = () => {
  const [selectedCoach, setSelectedCoach] = useState<CoachType>('nette');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm Nette, your Strategy Coach. I have access to 403 proven tactics to help you achieve your first $100K. I can help you with business strategy, state licensing, and selecting the right tactics for your situation. What would you like to know?",
      timestamp: new Date(),
      coachType: 'nette'
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      coachType: selectedCoach
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getCoachResponse(selectedCoach, input),
        timestamp: new Date(),
        coachType: selectedCoach
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
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
