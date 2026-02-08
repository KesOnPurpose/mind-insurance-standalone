/**
 * Phase 1A: SeparationBreakdown Component
 * Shows 3 horizontal progress bars for Mental, Emotional, and Physical separation.
 * Derived from KPI scores snapshot on the latest assessment.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Heart, Users } from 'lucide-react';
import type { RelationshipSeparationAssessment } from '@/types/relationship-separation';

interface SeparationBreakdownProps {
  assessment: RelationshipSeparationAssessment | null;
  className?: string;
}

interface DimensionData {
  key: string;
  label: string;
  icon: typeof Brain;
  kpis: string[];
  color: string;
  bgColor: string;
}

const DIMENSIONS: DimensionData[] = [
  {
    key: 'mental',
    label: 'Mental',
    icon: Brain,
    kpis: ['communication', 'conflict_resolution', 'shared_goals'],
    color: 'bg-purple-400',
    bgColor: 'bg-purple-400/20',
  },
  {
    key: 'emotional',
    label: 'Emotional',
    icon: Heart,
    kpis: ['emotional_intimacy', 'trust', 'appreciation'],
    color: 'bg-rose-400',
    bgColor: 'bg-rose-400/20',
  },
  {
    key: 'physical',
    label: 'Physical',
    icon: Users,
    kpis: ['physical_intimacy', 'quality_time', 'personal_growth'],
    color: 'bg-blue-400',
    bgColor: 'bg-blue-400/20',
  },
];

function computeDimensionScore(
  kpiScores: Record<string, number>,
  kpiKeys: string[]
): number | null {
  const scores = kpiKeys
    .map((k) => kpiScores[k])
    .filter((v): v is number => v != null && v > 0);
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function getBarColor(score: number): string {
  if (score >= 7) return 'bg-emerald-400';
  if (score >= 5) return 'bg-amber-400';
  if (score >= 3) return 'bg-orange-400';
  return 'bg-red-400';
}

export function SeparationBreakdown({
  assessment,
  className = '',
}: SeparationBreakdownProps) {
  if (!assessment) {
    return null;
  }

  const kpiScores = assessment.kpi_scores_snapshot ?? {};

  return (
    <Card className={`border-rose-500/20 bg-mi-navy-light shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white/80">
          Separation Dimensions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DIMENSIONS.map((dim) => {
          const Icon = dim.icon;
          const score = computeDimensionScore(kpiScores, dim.kpis);
          const percentage = score != null ? (score / 10) * 100 : 0;

          return (
            <div key={dim.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-6 w-6 rounded-md ${dim.bgColor} flex items-center justify-center`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${dim.color.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="text-xs font-medium text-white/70">
                    {dim.label}
                  </span>
                </div>
                <span className="text-xs font-semibold text-white">
                  {score != null ? score.toFixed(1) : '—'}
                  <span className="text-white/30">/10</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    score != null ? getBarColor(score) : 'bg-white/10'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Risk factors summary */}
        {assessment.risk_factors && assessment.risk_factors.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">
              Risk Factors
            </p>
            <div className="flex flex-wrap gap-1.5">
              {assessment.risk_factors.slice(0, 4).map((rf, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    rf.severity === 'critical'
                      ? 'bg-red-500/20 text-red-300'
                      : rf.severity === 'high'
                      ? 'bg-orange-500/20 text-orange-300'
                      : rf.severity === 'medium'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-white/5 text-white/50'
                  }`}
                >
                  {rf.message}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
