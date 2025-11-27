import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { COACHES } from '@/types/coach';

interface ChatWelcomeScreenProps {
  userName: string | null;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const QUICK_ACTIONS = [
  "Where should I start?",
  "Do I need a license?",
  "Tell me about your journey"
];

const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const getFirstName = (fullName: string | null): string => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

export const ChatWelcomeScreen = ({
  userName,
  onSendMessage,
  isLoading = false
}: ChatWelcomeScreenProps) => {
  const [input, setInput] = useState('');
  const firstName = getFirstName(userName);
  const greeting = getTimeBasedGreeting();

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
  };

  const handleQuickAction = (message: string) => {
    if (isLoading) return;
    onSendMessage(message);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Nette Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-6"
          style={{ background: COACHES.nette.gradient }}
        >
          {COACHES.nette.avatar}
        </div>

        {/* Greeting */}
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground text-center mb-2">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-center mb-8">
          How can I help you with your group home journey today?
        </p>

        {/* Input Container */}
        <div className="w-full mb-6">
          <div className="flex items-center gap-2 p-2 bg-background border rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask Nette anything..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-base"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={isLoading || !input.trim()}
              className="rounded-xl h-10 w-10"
              style={{ background: input.trim() ? COACHES.nette.gradient : undefined }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action}
              variant="outline"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
              className="rounded-full px-4 py-2 text-sm hover:bg-primary/5 hover:border-primary/30"
            >
              {action}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatWelcomeScreen;
