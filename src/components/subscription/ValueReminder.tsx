import { Button } from '@/components/ui/button';
import { Calendar, Target, Brain } from 'lucide-react';

interface ValueReminderProps {
  isMI: boolean;
  daysActive?: number;
  practicesCompleted?: number;
  patternsIdentified?: number;
  onNext: () => void;
}

export function ValueReminder({
  isMI,
  daysActive = 0,
  practicesCompleted = 0,
  patternsIdentified = 0,
  onNext,
}: ValueReminderProps) {
  const stats = [
    {
      icon: Calendar,
      value: daysActive,
      label: 'Days on your journey',
      color: isMI ? 'text-mi-cyan' : 'text-blue-500',
      bg: isMI ? 'bg-mi-cyan/10 border-mi-cyan/20' : 'bg-blue-50 border-blue-200',
    },
    {
      icon: Target,
      value: practicesCompleted,
      label: 'Practices completed',
      color: isMI ? 'text-mi-gold' : 'text-amber-500',
      bg: isMI ? 'bg-mi-gold/10 border-mi-gold/20' : 'bg-amber-50 border-amber-200',
    },
    {
      icon: Brain,
      value: patternsIdentified,
      label: 'Patterns uncovered',
      color: isMI ? 'text-purple-400' : 'text-purple-500',
      bg: isMI ? 'bg-purple-400/10 border-purple-400/20' : 'bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className={`text-lg font-semibold ${isMI ? 'text-white' : 'text-foreground'}`}>
          Look how far you've come
        </h3>
        <p className={`text-sm ${isMI ? 'text-white/60' : 'text-muted-foreground'}`}>
          Your growth is real, even when it doesn't feel like it. Here's what the data shows.
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
