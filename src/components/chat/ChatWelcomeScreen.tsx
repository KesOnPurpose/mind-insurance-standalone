import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { COACHES } from '@/types/coach';
import { VoiceInputButton } from './VoiceInputButton';

interface ChatWelcomeScreenProps {
  userName: string | null;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  userTimezone?: string;
}

// GROUPHOME STANDALONE: Quick actions for Nette coach
const QUICK_ACTIONS = [
  "How to use this app?",
  "Where should I start?",
  "Do I need a license?",
  "Tell me about your journey"
];

const getTimeBasedGreeting = (userTimezone?: string): string => {
  const now = new Date();
  let hour: number;

  if (userTimezone) {
    // Get hour in user's timezone
    const hourStr = now.toLocaleString('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: userTimezone
    });
    hour = parseInt(hourStr, 10);
  } else {
    hour = now.getHours();
  }

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
  isLoading = false,
  userTimezone
}: ChatWelcomeScreenProps) => {
  const [input, setInput] = useState('');
  // GROUPHOME STANDALONE: Always use Nette coach
  const coach = COACHES.nette;
  const firstName = getFirstName(userName);
  const greeting = getTimeBasedGreeting(userTimezone);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
  };

  const handleQuickAction = (message: string) => {
    if (isLoading) return;
    onSendMessage(message);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Coach Avatar */}
        <img
          src={coach.avatar}
          alt={coach.name}
          className="w-16 h-16 rounded-full object-cover mb-6"
        />

        {/* Greeting */}
        <h1 className="text-2xl md:text-3xl font-semibold text-center mb-2 text-foreground">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>

        {/* Subtitle */}
        <p className="text-center mb-8 text-muted-foreground">
          How can I help you with your group home journey today?
        </p>


        {/* Input Container */}
        <div className="w-full mb-6">
          <div className="flex items-center gap-2 p-2 border rounded-2xl shadow-sm focus-within:ring-2 bg-background focus-within:ring-primary/20">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Ask ${coach.name} anything...`}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-base"
              disabled={isLoading}
            />
            <VoiceInputButton
              onTranscript={(text) => setInput(prev => prev ? `${prev} ${text}` : text)}
              onTranscriptUpdate={(text) => setInput(text)}
              disabled={isLoading}
              variant="default"
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
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action}
              variant="outline"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
              className="rounded-full px-4 py-2 text-sm hover:bg-primary/5 hover:border-primary/30"
              style={{ borderColor: `${coach.color}30` }}
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
