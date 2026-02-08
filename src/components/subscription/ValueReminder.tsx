import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, BookOpen } from 'lucide-react';

interface ValueReminderProps {
  isMI: boolean;
  daysMember?: number;
  conversationsHeld?: number;
  programsAccessed?: number;
  onNext: () => void;
}

export function ValueReminder({
  isMI,
  daysMember = 0,
  conversationsHeld = 0,
  programsAccessed = 0,
  onNext,
}: ValueReminderProps) {
  const stats = [
    {
      icon: Calendar,
      value: daysMember,
      label: 'Days as a member',
      color: isMI ? 'text-mi-cyan' : 'text-blue-500',
      bg: isMI ? 'bg-mi-cyan/10 border-mi-cyan/20' : 'bg-blue-50 border-blue-200',
    },
    {
      icon: MessageSquare,
      value: conversationsHeld,
      label: 'Nette AI conversations',
      color: isMI ? 'text-mi-gold' : 'text-amber-500',
      bg: isMI ? 'bg-mi-gold/10 border-mi-gold/20' : 'bg-amber-50 border-amber-200',
    },
    {
      icon: BookOpen,
      value: programsAccessed,
      label: 'Programs & resources used',
      color: isMI ? 'text-purple-400' : 'text-purple-500',
      bg: isMI ? 'bg-purple-400/10 border-purple-400/20' : 'bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className={`text-lg font-semibold ${isMI ? 'text-white' : 'text-foreground'}`}>
          Here's what you'll be leaving behind
        </h3>
        <p className={`text-sm ${isMI ? 'text-white/60' : 'text-muted-foreground'}`}>
          Your Nette AI assistant, programs, and tools have been working for your business.
        </p>
      </div>

      <div className="grid gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`flex items-center gap-4 p-4 rounded-lg border ${stat.bg}`}
          >
            <div className={`p-2 rounded-full ${isMI ? 'bg-white/5' : 'bg-white'}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${isMI ? 'text-white' : 'text-foreground'}`}>
                {stat.value}
              </p>
              <p className={`text-sm ${isMI ? 'text-white/60' : 'text-muted-foreground'}`}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className={`text-center text-sm ${isMI ? 'text-white/50' : 'text-muted-foreground'}`}>
        <p>Your data and progress will be saved if you decide to come back.</p>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          className={
            isMI
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              : ''
          }
        >
          I've thought about it
        </Button>
      </div>
    </div>
  );
}
