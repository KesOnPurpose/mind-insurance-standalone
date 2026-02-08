/**
 * Phase 1B: BecomeTheChangeTracker Component
 * Tracks progress through the 5 "Become the Change" stages
 * with actionable weekly tasks and milestone celebrations.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  CheckCircle2,
  Circle,
  ChevronUp,
  Sparkles,
  Target,
} from 'lucide-react';
import { useRelationshipSolo, SOLO_STAGES } from '@/contexts/RelationshipSoloContext';

interface BecomeTheChangeTrackerProps {
  className?: string;
}

/** Weekly action items per stage */
const STAGE_ACTIONS: Record<number, string[]> = {
  1: [
    'Journal about 3 relationship patterns you notice in yourself',
    'Identify your top 2 emotional triggers',
    'Rate yourself honestly on all 10 KPIs',
    'Reflect on one conflict and your role in it',
  ],
  2: [
    'Practice the "Pause Before Reacting" protocol 3 times',
    'Use "I feel..." statements instead of "You always..."',
    'Take 5 deep breaths before responding to conflict',
    'Notice and name your emotions throughout the day',
  ],
  3: [
    'Complete one action item from your lowest-scoring KPI',
    'Read or listen to one resource about your weakest area',
    'Practice active listening for 10 minutes daily',
    'Ask a trusted person for honest feedback',
  ],
  4: [
    'Share one personal win naturally (without forcing)',
    'Model a new positive habit visibly at home',
    'Respond to conflict with curiosity instead of defensiveness',
    'Express appreciation without expecting reciprocation',
  ],
  5: [
    'Mention the app casually when timing feels right',
    'Share how the process has helped you grow',
    'Invite your partner to try one exercise together',
    'Celebrate your progress regardless of partner response',
  ],
};

export function BecomeTheChangeTracker({ className = '' }: BecomeTheChangeTrackerProps) {
  const {
    isSoloUser,
    soloStage,
    advanceSoloStage,
  } = useRelationshipSolo();

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isAdvancing, setIsAdvancing] = useState(false);

  const currentStage = soloStage ?? 1;
  const stageDef = SOLO_STAGES.find((s) => s.stage === currentStage) ?? SOLO_STAGES[0];
  const actions = STAGE_ACTIONS[currentStage] ?? [];
  const completedCount = actions.filter((a) => checkedItems.has(a)).length;
  const allCompleted = completedCount === actions.length && actions.length > 0;

  const handleToggle = useCallback((action: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  }, []);

  const handleAdvance = useCallback(async () => {
    if (!allCompleted || currentStage >= 5) return;
    setIsAdvancing(true);
    try {
      await advanceSoloStage();
      setCheckedItems(new Set());
    } catch (err) {
      console.error('Failed to advance stage:', err);
    } finally {
      setIsAdvancing(false);
    }
  }, [allCompleted, currentStage, advanceSoloStage]);

  if (!isSoloUser) return null;

  return (
    <Card className={`border-rose-500/20 bg-mi-navy-light shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Target className="h-4 w-4 text-rose-400" />
            Become the Change
          </CardTitle>
          <Badge
            variant="outline"
            className="border-rose-400/30 text-rose-300 text-[10px]"
          >
            Stage {currentStage}: {stageDef.title}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stage description */}
        <p className="text-xs text-white/50 leading-relaxed">
          {stageDef.description}
        </p>

        {/* Action items */}
        <div className="space-y-2">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Weekly Actions ({completedCount}/{actions.length})
          </p>
          {actions.map((action) => {
            const isChecked = checkedItems.has(action);
            return (
              <button
                key={action}
                onClick={() => handleToggle(action)}
                className={`flex items-start gap-2.5 w-full text-left p-2.5 rounded-lg border transition-all ${
                  isChecked
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                }`}
              >
                {isChecked ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-4 w-4 text-white/20 flex-shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-xs leading-relaxed ${
                    isChecked ? 'text-emerald-300/80 line-through' : 'text-white/60'
                  }`}
                >
                  {action}
                </span>
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${(completedCount / Math.max(actions.length, 1)) * 100}%` }}
          />
        </div>

        {/* Advance button or celebration */}
        {allCompleted && currentStage < 5 && (
          <div className="rounded-lg border border-amber-400/20 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-medium text-amber-300">
                All actions complete! Ready to advance.
              </p>
            </div>
            <Button
              size="sm"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white"
              onClick={handleAdvance}
              disabled={isAdvancing}
            >
              {isAdvancing ? 'Advancing...' : (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Advance to Stage {currentStage + 1}
                </>
              )}
            </Button>
          </div>
        )}

        {allCompleted && currentStage >= 5 && (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3 text-center">
            <Sparkles className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-emerald-300">
              You have completed the Become the Change journey!
            </p>
            <p className="text-[10px] text-emerald-300/60 mt-1">
              Consider inviting your partner to join.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
