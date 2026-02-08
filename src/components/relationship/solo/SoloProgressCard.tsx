/**
 * Phase 1B: SoloProgressCard Component
 * Dashboard card showing solo user's current stage and progress
 * through the "Become the Change" framework.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, ChevronRight, Star } from 'lucide-react';
import { useRelationshipSolo, SOLO_STAGES } from '@/contexts/RelationshipSoloContext';
import { RESISTANCE_TYPES } from '@/types/relationship-user-profile';

interface SoloProgressCardProps {
  className?: string;
}

export function SoloProgressCard({ className = '' }: SoloProgressCardProps) {
  const {
    isSoloUser,
    soloStage,
    partnerResistanceType,
  } = useRelationshipSolo();

  if (!isSoloUser) return null;

  const currentStage = soloStage ?? 1;
  const stageDef = SOLO_STAGES.find((s) => s.stage === currentStage) ?? SOLO_STAGES[0];
  const resistanceLabel =
    RESISTANCE_TYPES.find((r) => r.type === partnerResistanceType)?.label ?? null;
  const progress = (currentStage / 5) * 100;

  return (
    <Card className={`border-rose-500/20 bg-mi-navy-light shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
            <User className="h-4 w-4 text-rose-400" />
            Solo Journey
          </CardTitle>
          {resistanceLabel && (
            <Badge
              variant="outline"
              className="border-white/10 text-white/40 text-[10px]"
            >
              {resistanceLabel}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stage progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/40">Stage {currentStage} of 5</span>
            <span className="text-xs font-medium text-rose-400">
              {stageDef.title}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current stage details */}
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-white/60 leading-relaxed">
            {stageDef.description}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <Star className="h-3 w-3 text-amber-400" />
            <p className="text-[10px] text-amber-400/80">
              Focus: {stageDef.focus}
            </p>
          </div>
        </div>

        {/* Stage steps */}
        <div className="flex gap-1">
          {SOLO_STAGES.map((s) => (
            <div
              key={s.stage}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s.stage <= currentStage
                  ? 'bg-rose-400'
                  : s.stage === currentStage + 1
                  ? 'bg-rose-400/30'
                  : 'bg-white/5'
              }`}
            />
          ))}
        </div>

        {/* Next stage preview */}
        {currentStage < 5 && (
          <div className="flex items-center text-[10px] text-white/30">
            <span>Next:</span>
            <ChevronRight className="h-3 w-3 mx-0.5" />
            <span>
              {SOLO_STAGES.find((s) => s.stage === currentStage + 1)?.title}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
