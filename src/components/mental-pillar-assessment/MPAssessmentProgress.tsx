// Mental Pillar Assessment Progress Header
// Shows current progress through the assessment

import { motion } from 'framer-motion';
import { Brain, CheckCircle2 } from 'lucide-react';
import { MENTAL_PILLAR_COLORS } from '@/types/mental-pillar-assessment';

interface MPAssessmentProgressProps {
  currentStep: number;
  totalSteps: number;
  phase: 'intro' | 'questions' | 'analyzing' | 'results';
}

export function MPAssessmentProgress({
  currentStep,
  totalSteps,
  phase,
}: MPAssessmentProgressProps) {
  const progress = phase === 'intro' ? 0 : (currentStep / totalSteps) * 100;

  const getPhaseLabel = () => {
    switch (phase) {
      case 'intro':
        return 'Getting Started';
      case 'questions':
        return `Question ${currentStep} of ${totalSteps}`;
      case 'analyzing':
        return 'MIO Analyzing';
      case 'results':
        return 'Your Results';
    }
  };

  const getCompetencyPhase = () => {
    if (phase !== 'questions') return null;
    if (currentStep <= 2) return { name: 'Pattern Awareness', week: 1 };
    if (currentStep <= 4) return { name: 'Identity Alignment', week: 2 };
    if (currentStep <= 6) return { name: 'Belief Mastery', week: 3 };
    if (currentStep <= 8) return { name: 'Mental Resilience', week: 4 };
    return { name: 'Self-Assessment', week: null };
  };

  const competencyPhase = getCompetencyPhase();

  return (
    <div className="w-full px-4 py-3 bg-gradient-to-r from-violet-900/30 to-purple-900/30 backdrop-blur-sm border-b border-violet-500/20">
      <div className="max-w-2xl mx-auto">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${MENTAL_PILLAR_COLORS.primary}30` }}
            >
              <Brain className="w-4 h-4" style={{ color: MENTAL_PILLAR_COLORS.primary }} />
            </div>
            <span className="text-sm font-medium text-white/90">Mental Pillar Assessment</span>
          </div>

          <div className="flex items-center gap-2">
            {competencyPhase && (
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: `${MENTAL_PILLAR_COLORS.primary}20`,
                  color: MENTAL_PILLAR_COLORS.primaryLight,
                }}
              >
                {competencyPhase.week ? `Week ${competencyPhase.week}` : ''} {competencyPhase.name}
              </span>
            )}
            <span className="text-sm text-white/60">{getPhaseLabel()}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${MENTAL_PILLAR_COLORS.primary}, ${MENTAL_PILLAR_COLORS.primaryLight})`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Competency Indicators */}
        {phase === 'questions' && (
          <div className="flex justify-between mt-2 px-1">
            {[1, 2, 3, 4].map((week) => {
              const isComplete = currentStep > week * 2;
              const isCurrent = currentStep > (week - 1) * 2 && currentStep <= week * 2;

              return (
                <div key={week} className="flex items-center gap-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isComplete
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isCurrent
                        ? 'bg-violet-500/30 text-violet-300'
                        : 'bg-white/5 text-white/30'
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="w-3 h-3" /> : week}
                  </div>
                  <span
                    className={`text-xs hidden sm:inline ${
                      isCurrent ? 'text-white/80' : 'text-white/40'
                    }`}
                  >
                    {week === 1
                      ? 'Patterns'
                      : week === 2
                      ? 'Identity'
                      : week === 3
                      ? 'Beliefs'
                      : 'Resilience'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
