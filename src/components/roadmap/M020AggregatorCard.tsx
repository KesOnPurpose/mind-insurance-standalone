import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Megaphone, ListChecks, Target } from 'lucide-react';
import { TacticWithProgress } from '@/types/tactic';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TacticDetailModal } from './TacticDetailModal';

interface M020AggregatorCardProps {
  m020Tactic: TacticWithProgress;
  lesson2Tactics: TacticWithProgress[]; // M014-M019 for progress calculation
  onStartTactic?: (tacticId: string) => void;
  onCompleteTactic?: (tacticId: string) => void;
}

/**
 * M020AggregatorCard - Special card for Lesson 2 Master Checklist
 *
 * Features:
 * - Shows dual progress (M014-M019 tactics + M020's own 10-step checklist)
 * - Hybrid completion: requires 100% M014-M019 + 50% M020 steps
 * - Visual distinction from regular tactic cards (orange/yellow theme)
 * - Clickable to open TacticDetailModal with interactive checklist
 */
export function M020AggregatorCard({
  m020Tactic,
  lesson2Tactics,
  onStartTactic,
  onCompleteTactic
}: M020AggregatorCardProps) {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Calculate M014-M019 completion
  const m014ToM019 = lesson2Tactics.filter(t =>
    t.tactic_id >= 'M014' && t.tactic_id <= 'M019'
  );
  const completedCount = m014ToM019.filter(t => t.status === 'completed').length;
  const totalCount = m014ToM019.length; // Should be 6
  const tacticProgressPercent = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  // Calculate M020's own step progress
  const steps = Array.isArray(m020Tactic.step_by_step) ? m020Tactic.step_by_step : [];
  const totalSteps = steps.length;
  const stepProgressPercent = totalSteps > 0
    ? Math.round((completedSteps.length / totalSteps) * 100)
    : 0;

  // Hybrid completion check: 100% tactics + 50% steps
  const canComplete = tacticProgressPercent === 100 && stepProgressPercent >= 50;

  // Load M020 step progress from database
  useEffect(() => {
    async function loadStepProgress() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('gh_user_tactic_step_progress')
          .select('step_index')
          .eq('user_id', user.id)
          .eq('tactic_id', 'M020')
          .not('completed_at', 'is', null);

        if (error) throw error;

        if (data) {
          setCompletedSteps(data.map(d => d.step_index));
        }
      } catch (error) {
        console.error('Error loading M020 step progress:', error);
      }
    }

    loadStepProgress();
  }, [user]);

  const handleComplete = async () => {
    if (!canComplete) {
      if (tacticProgressPercent < 100) {
        toast.error(`Complete all Lesson 2 tactics first (${completedCount}/6 done)`);
      } else if (stepProgressPercent < 50) {
        toast.error(`Complete ${50 - stepProgressPercent}% more of M020 checklist`);
      }
      return;
    }

    if (onCompleteTactic) {
      // Auto-start M020 if not started
      if (m020Tactic.status === 'not_started' && onStartTactic) {
        onStartTactic('M020');
      }

      onCompleteTactic('M020');
      toast.success('Lesson 2 Complete! Your referral pipeline is built!');
    }
  };

  return (
    <>
      <Card
        onClick={() => setShowDetailModal(true)}
        className="border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50 cursor-pointer hover:shadow-xl transition-all"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-3 py-1">
                <Megaphone className="w-3 h-3 mr-1" />
                Master Checklist
              </Badge>
              {m020Tactic.status === 'completed' && (
                <Badge className="bg-green-600 text-white text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg font-bold text-orange-700 mt-2">
            {m020Tactic.tactic_name}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress 1: M014-M019 aggregate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                <p className="text-sm font-semibold text-orange-900">Lesson 2 Tactics</p>
              </div>
              <span className="text-xs font-medium text-orange-700">
                {completedCount}/{totalCount} completed
              </span>
            </div>
            <Progress value={tacticProgressPercent} className="h-2 bg-orange-200" />
            <p className="text-xs text-muted-foreground">
              {tacticProgressPercent === 100
                ? 'All referral pipeline tactics complete!'
                : `${totalCount - completedCount} tactics remaining`
              }
            </p>
          </div>

          {/* Progress 2: M020's own checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-yellow-600" />
                <p className="text-sm font-semibold text-yellow-900">Accountability Checklist</p>
              </div>
              <span className="text-xs font-medium text-yellow-700">
                {completedSteps.length}/{totalSteps} steps
              </span>
            </div>
            <Progress value={stepProgressPercent} className="h-2 bg-yellow-200" />
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
            className={`w-full mt-2 ${canComplete ? 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700' : ''}`}
            size="lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {canComplete
              ? 'Complete Lesson 2'
              : tacticProgressPercent < 100
                ? `Complete all 6 tactics to unlock (${completedCount}/6)`
                : `Check off ${50 - stepProgressPercent}% more steps`
            }
          </Button>

          <div className="text-xs text-center text-muted-foreground pt-2 border-t">
            Click card to view M020 accountability checklist
          </div>
        </CardContent>
      </Card>

      <TacticDetailModal
        tactic={m020Tactic}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onStartTactic={onStartTactic}
        onCompleteTactic={onCompleteTactic}
      />
    </>
  );
}
