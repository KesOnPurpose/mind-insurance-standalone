import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, GraduationCap, ListChecks, Target } from 'lucide-react';
import { TacticWithProgress } from '@/types/tactic';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TacticDetailModal } from './TacticDetailModal';

interface M013AggregatorCardProps {
  m013Tactic: TacticWithProgress;
  week1Tactics: TacticWithProgress[]; // M001-M012 for progress calculation
  onStartTactic?: (tacticId: string) => void;
  onCompleteTactic?: (tacticId: string) => void;
}

/**
 * M013AggregatorCard - Special card for Lesson 1 Master Checklist
 *
 * Features:
 * - Shows dual progress (M001-M012 tactics + M013's own 9-step checklist)
 * - Hybrid completion: requires 100% M001-M012 + 50% M013 steps
 * - Visual distinction from regular tactic cards
 * - Clickable to open TacticDetailModal with interactive checklist
 */
export function M013AggregatorCard({
  m013Tactic,
  week1Tactics,
  onStartTactic,
  onCompleteTactic
}: M013AggregatorCardProps) {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Calculate M001-M012 completion
  const m001ToM012 = week1Tactics.filter(t =>
    t.tactic_id >= 'M001' && t.tactic_id <= 'M012'
  );
  const completedCount = m001ToM012.filter(t => t.status === 'completed').length;
  const totalCount = m001ToM012.length; // Should be 12
  const tacticProgressPercent = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  // Calculate M013's own step progress
  const steps = Array.isArray(m013Tactic.step_by_step) ? m013Tactic.step_by_step : [];
  const totalSteps = steps.length;
  const stepProgressPercent = totalSteps > 0
    ? Math.round((completedSteps.length / totalSteps) * 100)
    : 0;

  // Hybrid completion check: 100% tactics + 50% steps
  const canComplete = tacticProgressPercent === 100 && stepProgressPercent >= 50;

  // Load M013 step progress from database
  useEffect(() => {
    async function loadStepProgress() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('gh_user_tactic_step_progress')
          .select('step_index')
          .eq('user_id', user.id)
          .eq('tactic_id', 'M013')
          .not('completed_at', 'is', null);

        if (error) throw error;

        if (data) {
          setCompletedSteps(data.map(d => d.step_index));
        }
      } catch (error) {
        console.error('Error loading M013 step progress:', error);
      }
    }

    loadStepProgress();
  }, [user]);

  const handleComplete = async () => {
    if (!canComplete) {
      if (tacticProgressPercent < 100) {
        toast.error(`Complete all Lesson 1 tactics first (${completedCount}/12 done)`);
      } else if (stepProgressPercent < 50) {
        toast.error(`Complete ${50 - stepProgressPercent}% more of M013 checklist`);
      }
      return;
    }

    if (onCompleteTactic) {
      // Auto-start M013 if not started
      if (m013Tactic.status === 'not_started' && onStartTactic) {
        onStartTactic('M013');
      }

      onCompleteTactic('M013');
      toast.success('🎉 Lesson 1 Complete! You\'re crushing it!');
    }
  };

  return (
    <>
      <Card
        onClick={() => setShowDetailModal(true)}
        className="border-2 border-primary bg-gradient-to-br from-purple-50 to-blue-50 cursor-pointer hover:shadow-xl transition-all"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-3 py-1">
                <GraduationCap className="w-3 h-3 mr-1" />
                Master Checklist
              </Badge>
              {m013Tactic.status === 'completed' && (
                <Badge className="bg-green-600 text-white text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg font-bold text-primary mt-2">
            {m013Tactic.tactic_name}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress 1: M001-M012 aggregate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-semibold text-purple-900">Lesson 1 Tactics</p>
              </div>
              <span className="text-xs font-medium text-purple-700">
                {completedCount}/{totalCount} completed
              </span>
            </div>
            <Progress value={tacticProgressPercent} className="h-2 bg-purple-200" />
            <p className="text-xs text-muted-foreground">
              {tacticProgressPercent === 100
                ? '✅ All foundational tactics complete!'
                : `${totalCount - completedCount} tactics remaining`
              }
            </p>
          </div>

          {/* Progress 2: M013's own checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-semibold text-blue-900">Accountability Checklist</p>
              </div>
              <span className="text-xs font-medium text-blue-700">
                {completedSteps.length}/{totalSteps} steps
              </span>
            </div>
            <Progress value={stepProgressPercent} className="h-2 bg-blue-200" />
            <p className="text-xs text-muted-foreground">
              {stepProgressPercent >= 50
                ? '✅ Checklist requirement met (50%+)'
                : `Need ${50 - stepProgressPercent}% more to unlock completion`
              }
            </p>
          </div>

          {/* Complete button (hybrid validation) */}
          <Button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click from firing
              handleComplete();
            }}
            disabled={!canComplete}
            className={`w-full mt-2 ${canComplete ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`}
            size="lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {canComplete
              ? 'Complete Lesson 1 🎉'
              : tacticProgressPercent < 100
                ? `Complete all 12 tactics to unlock (${completedCount}/12)`
                : `Check off ${50 - stepProgressPercent}% more steps`
            }
          </Button>

          <div className="text-xs text-center text-muted-foreground pt-2 border-t">
            💡 Click card to view M013 accountability checklist
          </div>
        </CardContent>
      </Card>

      <TacticDetailModal
        tactic={m013Tactic}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onStartTactic={onStartTactic}
        onCompleteTactic={onCompleteTactic}
      />
    </>
  );
}
