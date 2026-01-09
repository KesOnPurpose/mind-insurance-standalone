/**
 * PROTECTInfoTooltip Component
 * Responsive info tooltip for PROTECT method letters
 *
 * Features:
 * - Desktop: Hover tooltip with 200ms delay
 * - Mobile: Tap popover that stays open until dismissed
 * - Full practice explanation with example
 * - Points and time window display
 */

import { Info, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

export type PROTECTLetter = 'P' | 'R' | 'O' | 'T' | 'E' | 'C' | 'T2';

interface PROTECTInfoData {
  name: string;
  emoji: string;
  points: number;
  timeWindow: string;
  timeWindowLabel: string;
  quickDef: string;
  fullDef: string;
  example: string;
}

// PROTECT method content from founder transcript
const PROTECT_INFO: Record<PROTECTLetter, PROTECTInfoData> = {
  P: {
    name: 'Pattern Check',
    emoji: '🔍',
    points: 4,
    timeWindow: 'Morning',
    timeWindowLabel: 'Before 10am',
    quickDef: 'Catch your Identity Collision before it catches you',
    fullDef:
      'Ask yourself: "What pattern showed up yesterday?" Look for moments where Past Prison, Success Sabotage, or Compass Crisis appeared—even subtly. Awareness is the antidote.',
    example:
      '"Yesterday I noticed I almost didn\'t send that email because I was worried about rejection. That\'s my Past Prison pattern."',
  },
  R: {
    name: 'Reinforce Identity',
    emoji: '💪',
    points: 3,
    timeWindow: 'Morning',
    timeWindowLabel: 'Before 10am',
    quickDef: "Declare who you're becoming, out loud",
    fullDef:
      "Record yourself speaking your Champion Identity Statement. Not affirmations—DECLARATIONS. Say it like it's already true. Your brain can't tell the difference between rehearsal and reality.",
    example:
      '"I am someone who takes action before I feel ready. I am someone who sends the email, makes the call, shows up even when it\'s uncomfortable."',
  },
  O: {
    name: 'Outcome Visualization',
    emoji: '🎯',
    points: 3,
    timeWindow: 'Morning',
    timeWindowLabel: 'Before 10am',
    quickDef: 'See your future self winning',
    fullDef:
      "Close your eyes for 60 seconds and visualize yourself AFTER you've achieved your goal. Feel the emotions. See the details. Your brain starts building neural pathways to that future.",
    example:
      'Visualize closing the deal, getting the keys, the celebration dinner—feel the pride, relief, excitement.',
  },
  T: {
    name: 'Trigger Reset',
    emoji: '⚡',
    points: 2,
    timeWindow: 'Midday',
    timeWindowLabel: '10am-3pm',
    quickDef: 'Reprogram your automatic responses',
    fullDef:
      'Identify ONE trigger that normally sets off your pattern, and create a NEW response. Use "Pattern LOCKED → Pattern UNLOCKED" to rewrite your automatic reaction.',
    example:
      'LOCKED: "When I see competitors succeeding, I feel behind." UNLOCKED: "When I see competitors succeeding, I\'m reminded the market is real."',
  },
  E: {
    name: 'Energy Audit',
    emoji: '🔋',
    points: 4,
    timeWindow: 'Midday',
    timeWindowLabel: '10am-3pm',
    quickDef: 'Check your fuel levels',
    fullDef:
      "Rate your energy (1-10) and identify what's draining or charging you. Your patterns are STRONGEST when you're depleted. Champions protect their energy like athletes protect their bodies.",
    example:
      'Energy: 6/10. Drains: Back-to-back Zoom calls. Charges: 20-min walk, power playlist.',
  },
  C: {
    name: 'Celebrate Wins',
    emoji: '🏆',
    points: 2,
    timeWindow: 'Evening',
    timeWindowLabel: '3pm-10pm',
    quickDef: 'Acknowledge your victories—especially the small ones',
    fullDef:
      'Write down 1-3 wins from today. Your brain is wired to remember failures. You have to ACTIVELY train it to register success. Small wins compound into unstoppable momentum.',
    example:
      '"Today I finished the proposal, worked out even though I was tired, and didn\'t check email after 8pm."',
  },
  T2: {
    name: 'Tomorrow Setup',
    emoji: '🚀',
    points: 2,
    timeWindow: 'Evening',
    timeWindowLabel: '3pm-10pm',
    quickDef: 'Prepare for championship performance',
    fullDef:
      "Write down your TOP 3 priorities for tomorrow and identify ONE potential trigger. When you wake up with clarity, your patterns have less room to hijack your day.",
    example:
      'Tomorrow: 1) Send pitch deck 2) Call investor 3) Review contract. Trigger watch: Self-doubt after rejection.',
  },
};

interface PROTECTInfoTooltipProps {
  letter: PROTECTLetter;
  variant?: 'icon' | 'inline';
  className?: string;
}

/**
 * PROTECTInfoTooltip - Responsive info tooltip for PROTECT method practices
 *
 * Desktop: Shows tooltip on hover with 200ms delay
 * Mobile: Shows popover on tap that stays open until dismissed
 */
export function PROTECTInfoTooltip({
  letter,
  variant = 'icon',
  className = '',
}: PROTECTInfoTooltipProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const info = PROTECT_INFO[letter];

  const tooltipBody = (
    <div className="space-y-3 max-w-xs">
      {/* Header: Emoji, Name, Points */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{info.emoji}</span>
          <span className="font-semibold text-white">{info.name}</span>
        </div>
        <span className="text-xs font-medium bg-mi-gold/20 text-mi-gold px-2 py-0.5 rounded-full">
          {info.points} pts
        </span>
      </div>

      {/* Time Window Badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs bg-mi-cyan/20 text-mi-cyan px-2 py-0.5 rounded-full">
          {info.timeWindow}
        </span>
        <span className="text-xs text-gray-500">{info.timeWindowLabel}</span>
      </div>

      {/* Quick Definition */}
      <p className="text-sm font-medium text-mi-cyan">{info.quickDef}</p>

      {/* Full Definition */}
      <p className="text-sm text-gray-300 leading-relaxed">{info.fullDef}</p>

      {/* Example */}
      <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
        <p className="text-xs text-gray-400 mb-1 font-medium">Example:</p>
        <p className="text-xs text-gray-300 italic leading-relaxed">{info.example}</p>
      </div>
    </div>
  );

  // Mobile: Use Popover (tap to open)
  if (isMobile) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={`inline-flex items-center justify-center p-1 rounded-full text-gray-400 hover:text-mi-cyan hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] ${className}`}
            aria-label={`Info about ${info.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <Info className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          className="w-80 bg-mi-navy-light border-white/10 shadow-xl shadow-black/30"
          onPointerDownOutside={(e) => {
            e.preventDefault();
            setIsOpen(false);
          }}
        >
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            {tooltipBody}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Desktop: Use Tooltip (hover)
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={`inline-flex items-center justify-center p-0.5 rounded-full text-gray-400 hover:text-mi-cyan hover:bg-white/10 transition-colors ${className}`}
            aria-label={`Info about ${info.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="w-80 p-4 bg-mi-navy-light border-white/10 shadow-xl shadow-black/30"
        >
          {tooltipBody}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Export the PROTECT_INFO for use in other components
export { PROTECT_INFO };
export type { PROTECTInfoData };

export default PROTECTInfoTooltip;
