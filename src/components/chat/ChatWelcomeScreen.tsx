import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { COACHES, CoachType } from '@/types/coach';
import { useProduct } from '@/contexts/ProductContext';
import { cn } from '@/lib/utils';

interface ChatWelcomeScreenProps {
  userName: string | null;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

// Product-specific quick actions
const QUICK_ACTIONS: Record<string, string[]> = {
  'grouphome': [
    "How to use this app?",
    "Where should I start?",
    "Do I need a license?",
    "Tell me about your journey"
  ],
  'mind-insurance': [
    "Help me see my patterns",
    "Why do I keep repeating mistakes?",
    "Explain the PROTECT practice",
    "What is identity collision?"
  ],
  'me-wealth': [
    "How to build business credit?",
    "Funding strategies for beginners",
    "Where should I start?",
    "Tell me about your journey"
  ]
};

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

// Map product to coach
const getCoachForProduct = (product: string): CoachType => {
  const coachMap: Record<string, CoachType> = {
    'grouphome': 'nette',
    'mind-insurance': 'mio',
    'me-wealth': 'me'
  };
  return coachMap[product] || 'nette';
};

export const ChatWelcomeScreen = ({
  userName,
  onSendMessage,
  isLoading = false
}: ChatWelcomeScreenProps) => {
  const [input, setInput] = useState('');
  const { currentProduct } = useProduct();
  const activeCoach = getCoachForProduct(currentProduct);
  const coach = COACHES[activeCoach];
  const quickActions = QUICK_ACTIONS[currentProduct] || QUICK_ACTIONS['grouphome'];
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

  // Product-specific subtitles
  const getSubtitle = () => {
    switch (currentProduct) {
      case 'mind-insurance':
        return "I'm here to help you see patterns you can't see yourself.";
      case 'me-wealth':
        return "How can I help you build your financial foundation today?";
      default:
        return "How can I help you with your group home journey today?";
    }
  };

  // Check if Mind Insurance for dark theme
  const isMindInsurance = currentProduct === 'mind-insurance';

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center px-4",
      isMindInsurance ? "bg-[#0a1628]" : "bg-background"
    )}>
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Coach Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-6"
          style={{ background: coach.gradient }}
        >
          {coach.avatar}
        </div>

        {/* Greeting */}
        <h1 className={cn(
          "text-2xl md:text-3xl font-semibold text-center mb-2",
          isMindInsurance ? "text-white" : "text-foreground"
        )}>
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>

        {/* Subtitle */}
        <p className={cn(
          "text-center mb-8",
          isMindInsurance ? "text-gray-400" : "text-muted-foreground"
        )}>
          {getSubtitle()}
        </p>

        {/* Input Container */}
        <div className="w-full mb-6">
          <div className={cn(
            "flex items-center gap-2 p-2 border rounded-2xl shadow-sm focus-within:ring-2",
            isMindInsurance
              ? "bg-[#0f1d32] border-[#05c3dd]/30 focus-within:ring-[#05c3dd]/20"
              : "bg-background focus-within:ring-primary/20"
          )}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Ask ${coach.name} anything...`}
              className={cn(
                "flex-1 border-0 bg-transparent focus-visible:ring-0 text-base",
                isMindInsurance && "text-white placeholder:text-gray-500"
              )}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={isLoading || !input.trim()}
              className="rounded-xl h-10 w-10"
              style={{ background: input.trim() ? coach.gradient : undefined }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {quickActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                isMindInsurance
                  ? "bg-[#0f1d32] border-[#05c3dd]/30 text-gray-300 hover:bg-[#05c3dd]/10 hover:text-white hover:border-[#05c3dd]/50"
                  : "hover:bg-primary/5 hover:border-primary/30"
              )}
              style={!isMindInsurance ? {
                borderColor: `${coach.color}30`,
              } : undefined}
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
