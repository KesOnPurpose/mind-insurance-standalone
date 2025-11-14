import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Send, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm Nette, your group home expert. I have access to 403 proven tactics to help you achieve your first $100K. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Great question! Let me help you with that. Based on your location and current progress, here's what I recommend...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="container mx-auto px-4 py-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Chat with Nette AI</h1>
              <p className="text-white/80 text-sm">Your personal group home expert</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 container mx-auto px-4 py-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <Avatar className={`w-10 h-10 flex-shrink-0 ${
                message.role === "assistant" 
                  ? "bg-gradient-hero" 
                  : "bg-secondary"
              }`}>
                <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                  {message.role === "assistant" ? "N" : "Y"}
                </div>
              </Avatar>
              
              <Card className={`p-4 max-w-[80%] ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card"
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <span className={`text-xs mt-2 block ${
                  message.role === "user" 
                    ? "text-primary-foreground/70" 
                    : "text-muted-foreground"
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </Card>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0 bg-gradient-hero">
                <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                  N
                </div>
              </Avatar>
              <Card className="p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Nette anything about group homes..."
              className="flex-1 h-12"
            />
            <Button 
              onClick={handleSend}
              className="h-12 px-6 bg-gradient-hero hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2 max-w-4xl mx-auto">
            Nette has access to 403 tactics and location-specific guidance to help you succeed
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
