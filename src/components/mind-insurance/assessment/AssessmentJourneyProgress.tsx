/**
 * AssessmentJourneyProgress Component
 * Premium progress visualization for Identity Collision Assessment
 *
 * Features:
 * - 8 step dots with connecting lines
 * - 3 phase labels (Foundation, Pattern, Impact)
 * - Gradient progress bar
 * - Current step pulse animation
 * - Completed steps show checkmark
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Check, BarChart3, Target, TrendingUp } from 'lucide-react';

interface AssessmentJourneyProgressProps {
  currentStep: number; // 0-7 for questions, 8+ for results
  totalSteps?: number;
}

type Phase = 'foundation' | 'pattern' | 'impact';

interface PhaseConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  steps: number[];
}

const PHASES: Record<Phase, PhaseConfig> = {
  foundation: {
    label: 'Foundation',
    icon: <BarChart3 className="w-3 h-3" />,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    steps: [0, 1, 2],
  },
  pattern: {
    label: 'Pattern',
    icon: <Target className="w-3 h-3" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    steps: [3, 4, 5],
  },
  impact: {
    label: 'Impact',
    icon: <TrendingUp className="w-3 h-3" />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    steps: [6, 7],
  },
};

function getPhaseForStep(step: number): Phase {
  if (step <= 2) return 'foundation';
  if (step <= 5) return 'pattern';
  return 'impact';
}

export function AssessmentJourneyProgress({
  currentStep,
  totalSteps = 8,
}: AssessmentJourneyProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentPhase = getPhaseForStep(currentStep);
  const phaseConfig = PHASES[currentPhase];

  return (
    <div className="w-full px-3 sm:px-4 py-2.5 space-y-2">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-mi-cyan/20 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-mi-cyan" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-white">Identity Assessment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] sm:text-xs ${phaseConfig.color}`}>
            {phaseConfig.label}
          </span>
          <span className="text-[10px] sm:text-xs text-gray-500">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Simplified Progress Bar with Phase Markers */}
      <div className="relative pt-1">
        {/* Progress Bar */}
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 via-amber-500 to-mi-cyan rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Phase Markers */}
        <div className="flex justify-between mt-1.5">
          {(['foundation', 'pattern', 'impact'] as Phase[]).map((phase) => {
            const config = PHASES[phase];
            const isActive = currentPhase === phase;
            const phaseStart = config.steps[0];
            const phaseEnd = config.steps[config.steps.length - 1];
            const isComplete = currentStep > phaseEnd;

            return (
              <div
                key={phase}
                className={`flex items-center gap-1 ${
                  isActive ? config.color : isComplete ? 'text-mi-cyan' : 'text-gray-600'
                }`}
              >
                {config.icon}
                <span className="text-[10px] hidden sm:inline">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AssessmentJourneyProgress;
