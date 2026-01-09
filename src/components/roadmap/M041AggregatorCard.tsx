import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Home, ListChecks, Target } from 'lucide-react';
import { TacticWithProgress } from '@/types/tactic';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TacticDetailModal } from './TacticDetailModal';

interface M041AggregatorCardProps {
  m041Tactic: TacticWithProgress;
  lesson5Tactics: TacticWithProgress[]; // M035-M040 for progress calculation
  onStartTactic?: (tacticId: string) => void;
  onCompleteTactic?: (tacticId: string) => void;
}

/**
 * M041AggregatorCard - Special card for Lesson 5 Master Checklist
 *
 * Features:
 * - Shows dual progress (M035-M040 tactics + M041's own 9-step checklist)
 * - Hybrid completion: requires 100% M035-M040 + 50% M041 steps
 * - Visual distinction from regular tactic cards (rose/pink theme)
 * - Clickable to open TacticDetailModal with interactive checklist
 */
export function M041AggregatorCard({
  m041Tactic,
  lesson5Tactics,
  onStartTactic,
  onCompleteTactic
}: M041AggregatorCardProps) {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Calculate M035-M040 completion
  const m035ToM040 = lesson5Tactics.filter(t =>
    t.tactic_id >= 'M035' && t.tactic_id <= 'M040'
  );
  const completedCount = m035ToM040.filter(t => t.status === 'completed').length;
  const totalCount = m035ToM040.length; // Should be 6
  const tacticProgressPercent = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  // Calculate M041's own step progress
  const steps = Array.isArray(m041Tactic.step_by_step) ? m041Tactic.step_by_step : [];
  const totalSteps = steps.length;
  const stepProgressPercent = totalSteps > 0
    ? Math.round((completedSteps.length / totalSteps) * 100)
    : 0;

  // Hybrid completion check: 100% tactics + 50% steps
  const canComplete = tacticProgressPercent === 100 && stepProgressPercent >= 50;

  // Load M041 step progress from database
  useEffect(() => {
    async function loadStepProgress() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('gh_user_tactic_step_progress')
          .select('step_index')
          .eq('user_id', user.id)
          .eq('tactic_id', 'M041')
          .not('completed_at', 'is', null);

        if (error) throw error;

        if (data) {
          setCompletedSteps(data.map(d => d.step_index));
        }
      } catch (error) {
        console.error('Error loading M041 step progress:', error);
      }
    }

    loadStepProgress();
  }, [user]);

  const handleComplete = async () => {
    if (!canComplete) {
      if (tacticProgressPercent < 100) {
        toast.error(`Complete all Lesson 5 tactics first (${completedCount}/6 done)`);
      } else if (stepProgressPercent < 50) {
        toast.error(`Complete ${50 - stepProgressPercent}% more of M041 checklist`);
      }
      return;
    }

    if (onCompleteTactic) {
      // Auto-start M041 if not started
      if (m041Tactic.status === 'not_started' && onStartTactic) {
        onStartTactic('M041');
      }

      onCompleteTactic('M041');
      toast.success('Lesson 5 Complete! Property strategy locked in!');
    }
  };

  return (
    <>
      <Card
        onClick={() => setShowDetailModal(true)}
        className="border-2 border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 cursor-pointer hover:shadow-xl transition-all"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs px-3 py-1">
                <Home className="w-3 h-3 mr-1" />
                Master Checklist
              </Badge>
              {m041Tactic.status === 'completed' && (
                <Badge className="bg-green-600 text-white text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg font-bold text-rose-700 mt-2">
            {m041Tactic.tactic_name}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress 1: M035-M040 aggregate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-600" />
                <p className="text-sm font-semibold text-rose-900">Lesson 5 Tactics</p>
              </div>
              <span className="text-xs font-medium text-rose-700">
                {completedCount}/{totalCount} completed
              </span>
            </div>
            <Progress value={tacticProgressPercent} className="h-2 bg-rose-200" />
            <p className="text-xs text-muted-foreground">
              {tacticProgressPercent === 100
                ? 'All property selection tactics complete!'
                : `${totalCount - completedCount} tactics remaining`
              }
            </p>
          </div>

          {/* Progress 2: M041's own checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-pink-600" />
                <p className="text-sm font-semibold text-pink-900">Accountability Checklist</p>
              </div>
              <span className="text-xs font-medium text-pink-700">
                {completedSteps.length}/{totalSteps} steps
              </span>
            </div>
            <Progress value={stepProgressPercent} className="h-2 bg-pink-200" />
            <p className="text-xs text-muted-foreground">
              {stepProgressPercent >= 50
                ? 'Checklist requirement met (50%+)'
                : `Need ${50 - stepProgressPercent}% more to unlock completion`
              }
            </p>
          </div>

          {/* Complete button (hybrid validation) */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleComplete();
            }}
            disabled={!canComplete}
            className={`w-full mt-2 ${canComplete ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700' : ''}`}
            size="lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {canComplete
              ? 'Complete Lesson 5'
              : tacticProgressPercent < 100
                ? `Complete all 6 tactics to unlock (${completedCount}/6)`
                : `Check off ${50 - stepProgressPercent}% more steps`
            }
          </Button>

          <div className="text-xs text-center text-muted-foreground pt-2 border-t">
            Click card to view M041 accountability checklist
          </div>
        </CardContent>
      </Card>

      <TacticDetailModal
        tactic={m041Tactic}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onStartTactic={onStartTactic}
        onCompleteTactic={onCompleteTactic}
      />
    </>
  );
}
