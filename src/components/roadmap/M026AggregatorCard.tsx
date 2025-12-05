import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Shield, ListChecks, Target } from 'lucide-react';
import { TacticWithProgress } from '@/types/tactic';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TacticDetailModal } from './TacticDetailModal';

interface M026AggregatorCardProps {
  m026Tactic: TacticWithProgress;
  lesson3Tactics: TacticWithProgress[]; // M021-M025 for progress calculation
  onStartTactic?: (tacticId: string) => void;
  onCompleteTactic?: (tacticId: string) => void;
}

/**
 * M026AggregatorCard - Special card for Lesson 3 Master Checklist
 *
 * Features:
 * - Shows dual progress (M021-M025 tactics + M026's own 10-step checklist)
 * - Hybrid completion: requires 100% M021-M025 + 50% M026 steps
 * - Visual distinction from regular tactic cards (teal/green theme)
 * - Clickable to open TacticDetailModal with interactive checklist
 */
export function M026AggregatorCard({
  m026Tactic,
  lesson3Tactics,
  onStartTactic,
  onCompleteTactic
}: M026AggregatorCardProps) {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Calculate M021-M025 completion
  const m021ToM025 = lesson3Tactics.filter(t =>
    t.tactic_id >= 'M021' && t.tactic_id <= 'M025'
  );
  const completedCount = m021ToM025.filter(t => t.status === 'completed').length;
  const totalCount = m021ToM025.length; // Should be 5
  const tacticProgressPercent = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  // Calculate M026's own step progress
  const steps = Array.isArray(m026Tactic.step_by_step) ? m026Tactic.step_by_step : [];
  const totalSteps = steps.length;
  const stepProgressPercent = totalSteps > 0
    ? Math.round((completedSteps.length / totalSteps) * 100)
    : 0;

  // Hybrid completion check: 100% tactics + 50% steps
  const canComplete = tacticProgressPercent === 100 && stepProgressPercent >= 50;

  // Load M026 step progress from database
  useEffect(() => {
    async function loadStepProgress() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('gh_user_tactic_step_progress')
          .select('step_index')
          .eq('user_id', user.id)
          .eq('tactic_id', 'M026')
          .not('completed_at', 'is', null);

        if (error) throw error;

        if (data) {
          setCompletedSteps(data.map(d => d.step_index));
        }
      } catch (error) {
        console.error('Error loading M026 step progress:', error);
      }
    }

    loadStepProgress();
  }, [user]);

  const handleComplete = async () => {
    if (!canComplete) {
      if (tacticProgressPercent < 100) {
        toast.error(`Complete all Lesson 3 tactics first (${completedCount}/5 done)`);
      } else if (stepProgressPercent < 50) {
        toast.error(`Complete ${50 - stepProgressPercent}% more of M026 checklist`);
      }
      return;
    }

    if (onCompleteTactic) {
      // Auto-start M026 if not started
      if (m026Tactic.status === 'not_started' && onStartTactic) {
        onStartTactic('M026');
      }

      onCompleteTactic('M026');
      toast.success('Lesson 3 Complete! You are ready to lead!');
    }
  };

  return (
    <>
      <Card
        onClick={() => setShowDetailModal(true)}
        className="border-2 border-teal-400 bg-gradient-to-br from-teal-50 to-green-50 cursor-pointer hover:shadow-xl transition-all"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Badge className="bg-gradient-to-r from-teal-500 to-green-500 text-white text-xs px-3 py-1">
                <Shield className="w-3 h-3 mr-1" />
                Master Checklist
              </Badge>
              {m026Tactic.status === 'completed' && (
                <Badge className="bg-green-600 text-white text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg font-bold text-teal-700 mt-2">
            {m026Tactic.tactic_name}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress 1: M021-M025 aggregate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" />
                <p className="text-sm font-semibold text-teal-900">Lesson 3 Tactics</p>
              </div>
              <span className="text-xs font-medium text-teal-700">
                {completedCount}/{totalCount} completed
              </span>
            </div>
            <Progress value={tacticProgressPercent} className="h-2 bg-teal-200" />
            <p className="text-xs text-muted-foreground">
              {tacticProgressPercent === 100
                ? 'All leadership tactics complete!'
                : `${totalCount - completedCount} tactics remaining`
              }
            </p>
          </div>

          {/* Progress 2: M026's own checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-green-600" />
                <p className="text-sm font-semibold text-green-900">Accountability Checklist</p>
              </div>
              <span className="text-xs font-medium text-green-700">
                {completedSteps.length}/{totalSteps} steps
              </span>
            </div>
            <Progress value={stepProgressPercent} className="h-2 bg-green-200" />
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
            className={`w-full mt-2 ${canComplete ? 'bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700' : ''}`}
            size="lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {canComplete
              ? 'Complete Lesson 3'
              : tacticProgressPercent < 100
                ? `Complete all 5 tactics to unlock (${completedCount}/5)`
                : `Check off ${50 - stepProgressPercent}% more steps`
            }
          </Button>

          <div className="text-xs text-center text-muted-foreground pt-2 border-t">
            Click card to view M026 accountability checklist
          </div>
        </CardContent>
      </Card>

      <TacticDetailModal
        tactic={m026Tactic}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onStartTactic={onStartTactic}
        onCompleteTactic={onCompleteTactic}
      />
    </>
  );
}
