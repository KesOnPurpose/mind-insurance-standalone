/**
 * RKPI Check-In: IntroStep
 * Welcome screen before KPI scoring begins.
 */

import { Heart, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IntroStepProps {
  onNext: () => void;
  weekLabel: string;
}

export function IntroStep({ onNext, weekLabel }: IntroStepProps) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
        <Heart className="h-8 w-8 text-rose-400" />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Weekly Relationship Check-In
        </h2>
        <p className="text-sm text-white/50">{weekLabel}</p>
      </div>

      <p className="text-sm text-white/60 max-w-md mx-auto leading-relaxed">
        Rate 10 areas of your relationship on a scale of 1-10.
        Be honest — this is for your growth. You can mark any score
        as private if you prefer.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto text-left">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
          <Clock className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-white/80">5-10 minutes</p>
            <p className="text-xs text-white/40">Quick weekly reflection</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
          <Lock className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-white/80">Private by default</p>
            <p className="text-xs text-white/40">Only you see your scores</p>
          </div>
        </div>
      </div>

      <Button
        className="bg-rose-500 hover:bg-rose-600 text-white px-8"
        onClick={onNext}
      >
        Let's Begin
      </Button>
    </div>
  );
}
