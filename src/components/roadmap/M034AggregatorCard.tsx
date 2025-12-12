import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ShieldAlert, ListChecks, Target } from 'lucide-react';
import { TacticWithProgress } from '@/types/tactic';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TacticDetailModal } from './TacticDetailModal';

interface M034AggregatorCardProps {
  m034Tactic: TacticWithProgress;
  lesson4Tactics: TacticWithProgress[]; // M027-M033 for progress calculation
  onStartTactic?: (tacticId: string) => void;
  onCompleteTactic?: (tacticId: string) => void;
}

/**
 * M034AggregatorCard - Special card for Lesson 4 Master Checklist
 *
 * Features:
 * - Shows dual progress (M027-M033 tactics + M034's own 10-step checklist)
 * - Hybrid completion: requires 100% M027-M033 + 50% M034 steps
 * - Visual distinction from regular tactic cards (indigo/violet theme)
 * - Clickable to open TacticDetailModal with interactive checklist
 */
export function M034AggregatorCard({
  m034Tactic,
  lesson4Tactics,
  onStartTactic,
  onCompleteTactic
}: M034AggregatorCardProps) {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Calculate M027-M033 completion
  const m027ToM033 = lesson4Tactics.filter(t =>
    t.tactic_id >= 'M027' && t.tactic_id <= 'M033'
  );
  const completedCount = m027ToM033.filter(t => t.status === 'completed').length;
  const totalCount = m027ToM033.length; // Should be 7
  const tacticProgressPercent = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  // Calculate M034's own step progress
  const steps = Array.isArray(m034Tactic.step_by_step) ? m034Tactic.step_by_step : [];
  const totalSteps = steps.length;
  const stepProgressPercent = totalSteps > 0
    ? Math.round((completedSteps.length / totalSteps) * 100)
    : 0;

  // Hybrid completion check: 100% tactics + 50% steps
  const canComplete = tacticProgressPercent === 100 && stepProgressPercent >= 50;

  // Load M034 step progress from database
  useEffect(() => {
    async function loadStepProgress() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('gh_user_tactic_step_progress')
          .select('step_index')
          .eq('user_id', user.id)
          .eq('tactic_id', 'M034')
          .not('completed_at', 'is', null);

        if (error) throw error;

        if (data) {
          setCompletedSteps(data.map(d => d.step_index));
        }
      } catch (error) {
        console.error('Error loading M034 step progress:', error);
      }
    }

    loadStepProgress();
  }, [user]);

  const handleComplete = async () => {
    if (!canComplete) {
      if (tacticProgressPercent < 100) {
        toast.error(`Complete all Lesson 4 tactics first (${completedCount}/7 done)`);
      } else if (stepProgressPercent < 50) {
        toast.error(`Complete ${50 - stepProgressPercent}% more of M034 checklist`);
      }
      return;
    }

    if (onCompleteTactic) {
      // Auto-start M034 if not started
      if (m034Tactic.status === 'not_started' && onStartTactic) {
        onStartTactic('M034');
      }

      onCompleteTactic('M034');
      toast.success('Lesson 4 Complete! Your risk mitigation is solid!');
    }
  };

  return (
    <>
      <Card
        onClick={() => setShowDetailModal(true)}
        className="border-2 border-indigo-400 bg-gradient-to-br from-indigo-50 to-violet-50 cursor-pointer hover:shadow-xl transition-all"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs px-3 py-1">
                <ShieldAlert className="w-3 h-3 mr-1" />
                Master Checklist
              </Badge>
              {m034Tactic.status === 'completed' && (
                <Badge className="bg-green-600 text-white text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg font-bold text-indigo-700 mt-2">
            {m034Tactic.tactic_name}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress 1: M027-M033 aggregate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">Lesson 4 Tactics</p>
              </div>
              <span className="text-xs font-medium text-indigo-700">
                {completedCount}/{totalCount} completed
              </span>
            </div>
            <Progress value={tacticProgressPercent} className="h-2 bg-indigo-200" />
            <p className="text-xs text-muted-foreground">
              {tacticProgressPercent === 100
                ? 'All risk mitigation tactics complete!'
                : `${totalCount - completedCount} tactics remaining`
              }
            </p>
          </div>

          {/* Progress 2: M034's own checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-violet-600" />
                <p className="text-sm font-semibold text-violet-900">Accountability Checklist</p>
              </div>
              <span className="text-xs font-medium text-violet-700">
                {completedSteps.length}/{totalSteps} steps
              </span>
            </div>
            <Progress value={stepProgressPercent} className="h-2 bg-violet-200" />
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
            className={`w-full mt-2 ${canComplete ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700' : ''}`}
            size="lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {canComplete
              ? 'Complete Lesson 4'
              : tacticProgressPercent < 100
                ? `Complete all 7 tactics to unlock (${completedCount}/7)`
                : `Check off ${50 - stepProgressPercent}% more steps`
            }
          </Button>

          <div className="text-xs text-center text-muted-foreground pt-2 border-t">
            Click card to view M034 accountability checklist
          </div>
        </CardContent>
      </Card>

      <TacticDetailModal
        tactic={m034Tactic}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onStartTactic={onStartTactic}
        onCompleteTactic={onCompleteTactic}
      />
    </>
  );
}
