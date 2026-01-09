// Mental Pillar Competency Score Bar
// Animated bar showing score with optional growth delta

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MentalPillarCompetency, COMPETENCY_INFO } from '@/types/mental-pillar-assessment';

interface MPCompetencyBarProps {
  competency: MentalPillarCompetency;
  score: number;
  delta?: number;
  delay?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MPCompetencyBar({
  competency,
  score,
  delta,
  delay = 0,
  showLabel = true,
  size = 'md',
}: MPCompetencyBarProps) {
  const info = COMPETENCY_INFO[competency];

  const sizeConfig = {
    sm: {
      height: 'h-2',
      labelSize: 'text-xs',
      scoreSize: 'text-sm',
      iconSize: 'w-3 h-3',
    },
    md: {
      height: 'h-3',
      labelSize: 'text-sm',
      scoreSize: 'text-base',
      iconSize: 'w-4 h-4',
    },
    lg: {
      height: 'h-4',
      labelSize: 'text-base',
      scoreSize: 'text-lg',
      iconSize: 'w-5 h-5',
    },
  };

  const config = sizeConfig[size];

  const getDeltaIcon = () => {
    if (!delta || delta === 0) return <Minus className={config.iconSize} />;
    if (delta > 0) return <TrendingUp className={config.iconSize} />;
    return <TrendingDown className={config.iconSize} />;
  };

  const getDeltaColor = () => {
    if (!delta || delta === 0) return 'text-white/40';
    if (delta > 0) return 'text-emerald-400';
    return 'text-red-400';
  };

  return (
    <div className="w-full">
      {/* Label Row */}
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className={config.labelSize}>{info.icon}</span>
            <span className={`${config.labelSize} font-medium text-white/90`}>
              {info.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              className={`${config.scoreSize} font-bold`}
              style={{ color: info.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
            >
              {score}
            </motion.span>
            {delta !== undefined && (
              <motion.span
                className={`flex items-center gap-0.5 ${config.labelSize} ${getDeltaColor()}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.5 }}
              >
                {getDeltaIcon()}
                {delta > 0 ? '+' : ''}{delta}
              </motion.span>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className={`${config.height} bg-white/10 rounded-full overflow-hidden`}>
        <motion.div
          className={`${config.height} rounded-full`}
          style={{ backgroundColor: info.color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{
            duration: 0.8,
            delay: delay,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />
      </div>

      {/* Week indicator */}
      {showLabel && (
        <div className="flex justify-end mt-1">
          <span className="text-xs text-white/30">
            Week {info.week}
          </span>
        </div>
      )}
    </div>
  );
}

// Grid layout for all 4 competencies
interface MPCompetencyGridProps {
  scores: {
    pattern_awareness: number;
    identity_alignment: number;
    belief_mastery: number;
    mental_resilience: number;
  };
  deltas?: {
    pattern_awareness: number;
    identity_alignment: number;
    belief_mastery: number;
    mental_resilience: number;
  };
  primaryCompetency?: MentalPillarCompetency;
}

export function MPCompetencyGrid({
  scores,
  deltas,
  primaryCompetency,
}: MPCompetencyGridProps) {
  const competencies: MentalPillarCompetency[] = [
    'pattern_awareness',
    'identity_alignment',
    'belief_mastery',
    'mental_resilience',
  ];

  return (
    <div className="space-y-4">
      {competencies.map((competency, index) => (
        <div
          key={competency}
          className={`relative ${
            primaryCompetency === competency
              ? 'ring-2 ring-offset-2 ring-offset-slate-900 rounded-lg p-2 -m-2'
              : ''
          }`}
          style={
            primaryCompetency === competency
              ? { ringColor: COMPETENCY_INFO[competency].color }
              : {}
          }
        >
          {primaryCompetency === competency && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: COMPETENCY_INFO[competency].color,
                color: 'white',
              }}
            >
              Focus Area
            </motion.span>
          )}
          <MPCompetencyBar
            competency={competency}
            score={scores[competency]}
            delta={deltas?.[competency]}
            delay={index * 0.15}
          />
        </div>
      ))}
    </div>
  );
}
