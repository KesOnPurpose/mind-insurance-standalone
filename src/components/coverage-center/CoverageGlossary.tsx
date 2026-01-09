/**
 * CoverageGlossary Component
 * Coverage Center - $100M Mind Insurance Feature
 *
 * Info tooltip and glossary for Coverage Center terminology.
 * Uses insurance-themed language with neuroscience explanations.
 */

import React from 'react';
import { Info, Flame, Shield, Trophy, Brain, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { COVERAGE_LANGUAGE } from '@/types/coverage';

// ============================================================================
// GLOSSARY TERMS
// ============================================================================

interface GlossaryTerm {
  term: string;
  definition: string;
  neuralPrinciple?: string;
  icon: React.ElementType;
}

const glossaryTerms: GlossaryTerm[] = [
  {
    term: COVERAGE_LANGUAGE.streak,
    definition: 'The number of consecutive days you\'ve completed your protocol task. Building streaks creates neural momentum.',
    neuralPrinciple: 'Consecutive practice strengthens synaptic connections, making new behaviors automatic.',
    icon: Flame,
  },
  {
    term: COVERAGE_LANGUAGE.skipToken,
    definition: 'A protection token that lets you miss one day without losing your streak. Earned by completing 7-day protocols.',
    neuralPrinciple: 'Removing perfectionism anxiety actually increases long-term adherence by 40%.',
    icon: Shield,
  },
  {
    term: COVERAGE_LANGUAGE.milestone,
    definition: 'Achievement badges at Day 7, 21, and 66 - each representing a neurological breakthrough point.',
    neuralPrinciple: 'Day 7: Initial pattern recognition. Day 21: Habit foundation. Day 66: Identity integration.',
    icon: Trophy,
  },
  {
    term: COVERAGE_LANGUAGE.protocol,
    definition: 'A 7-day structured practice targeting your specific identity collision pattern.',
    neuralPrinciple: '7 days creates enough repetition for your prefrontal cortex to override amygdala defaults.',
    icon: Brain,
  },
  {
    term: 'Coverage Window',
    definition: 'The daily time period (3PM-10PM) when you can complete your protocol task through PROTECT CT.',
    neuralPrinciple: 'Evening reflection leverages the brain\'s natural consolidation cycle during sleep.',
    icon: Clock,
  },
  {
    term: COVERAGE_LANGUAGE.completion,
    definition: 'Successfully reflecting on your daily protocol task during the Coverage Window.',
    neuralPrinciple: 'The act of conscious reflection transforms implicit learning into explicit memory.',
    icon: CheckCircle,
  },
];

// ============================================================================
// TYPES
// ============================================================================

interface CoverageGlossaryProps {
  className?: string;
}

interface GlossaryInfoButtonProps {
  term: keyof typeof COVERAGE_LANGUAGE | string;
  className?: string;
}

// ============================================================================
// FULL GLOSSARY POPOVER
// ============================================================================

export function CoverageGlossary({ className }: CoverageGlossaryProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-md',
            'text-sm text-gray-400',
            'hover:bg-mi-navy transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-mi-cyan focus:ring-offset-2 focus:ring-offset-mi-navy',
            className
          )}
          aria-label="Open coverage glossary"
        >
          <Info className="h-4 w-4" />
          <span>What do these mean?</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-mi-navy-light border-mi-cyan/20" align="end">
        <div className="p-4 border-b border-mi-cyan/20">
          <h3 className="font-semibold text-lg text-white">Coverage Glossary</h3>
          <p className="text-sm text-gray-400 mt-1">
            Understanding your Mind Insurance coverage
          </p>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {glossaryTerms.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.term}
                className={cn(
                  'p-4',
                  index < glossaryTerms.length - 1 && 'border-b border-mi-cyan/20'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-mi-navy flex-shrink-0">
                    <Icon className="h-4 w-4 text-mi-cyan" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-medium text-sm text-white">{item.term}</h4>
                    <p className="text-sm text-gray-400">
                      {item.definition}
                    </p>
                    {item.neuralPrinciple && (
                      <p className="text-xs text-gray-500 italic border-l-2 border-mi-cyan/30 pl-2">
                        {item.neuralPrinciple}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-mi-navy border-t border-mi-cyan/20">
          <p className="text-xs text-gray-400 text-center">
            Based on behavioral neuroscience research
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// SINGLE TERM INFO BUTTON
// ============================================================================

/**
 * Small info button for individual term explanations
 */
export function GlossaryInfoButton({ term, className }: GlossaryInfoButtonProps) {
  const termData = glossaryTerms.find((t) => t.term === term || t.term.toLowerCase().includes(term.toLowerCase()));

  if (!termData) return null;

  const Icon = termData.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'inline-flex items-center justify-center',
              'h-5 w-5 rounded-full',
              'text-gray-400 hover:text-white',
              'hover:bg-mi-navy transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-mi-cyan',
              className
            )}
            aria-label={`Learn about ${term}`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-mi-navy-light border-mi-cyan/20">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-mi-cyan" />
              <p className="font-medium text-white">{termData.term}</p>
            </div>
            <p className="text-sm text-gray-400">{termData.definition}</p>
            {termData.neuralPrinciple && (
              <p className="text-xs text-gray-500 italic">
                {termData.neuralPrinciple}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// INLINE TERM WITH TOOLTIP
// ============================================================================

/**
 * Inline term that shows definition on hover
 */
export function GlossaryTerm({
  term,
  children,
  className,
}: {
  term: keyof typeof COVERAGE_LANGUAGE | string;
  children: React.ReactNode;
  className?: string;
}) {
  const termData = glossaryTerms.find((t) => t.term === term || t.term.toLowerCase().includes(term.toLowerCase()));

  if (!termData) {
    return <span className={className}>{children}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'underline decoration-dotted decoration-mi-cyan/50',
              'cursor-help transition-colors',
              'hover:decoration-mi-cyan hover:text-mi-cyan',
              className
            )}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-mi-navy-light border-mi-cyan/20">
          <p className="text-sm text-gray-400">{termData.definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// ONBOARDING GLOSSARY CARD
// ============================================================================

/**
 * Card component for First Session onboarding
 */
export function GlossaryOnboardingCard({ className }: { className?: string }) {
  const keyTerms = glossaryTerms.slice(0, 3); // Streak, Token, Milestone

  return (
    <div
      className={cn(
        'p-4 rounded-lg border border-mi-cyan/20 bg-mi-navy-light',
        className
      )}
    >
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
        <Brain className="h-5 w-5 text-mi-cyan" />
        Quick Reference
      </h4>

      <div className="space-y-3">
        {keyTerms.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.term} className="flex items-start gap-2">
              <Icon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-sm text-white">{item.term}:</span>{' '}
                <span className="text-sm text-gray-400">
                  {item.definition.split('.')[0]}.
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CoverageGlossary;
