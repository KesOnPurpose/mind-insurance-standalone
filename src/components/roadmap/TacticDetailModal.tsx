import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Circle,
  Play,
  DollarSign,
  Lightbulb,
  AlertTriangle,
  Quote,
  GraduationCap,
  BookOpen,
  Target,
  X
} from 'lucide-react';
import { TacticWithProgress } from '@/types/tactic';
import { getCategoryColor } from '@/config/categories';
import { formatCostRange } from '@/services/tacticFilterService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TacticDetailModalProps {
  tactic: TacticWithProgress | null;
  isOpen: boolean;
  onClose: () => void;
  onStartTactic?: (tacticId: string) => void;
  onCompleteTactic?: (tacticId: string) => void;
}

/**
 * TacticDetailModal - Full detail view with interactive step-by-step checklist
 *
 * Features:
 * - Displays complete tactic information (why it matters, Lynette's guidance, common mistakes)
 * - Interactive checklist with database-backed step completion tracking
 * - Real-time progress bar showing X/Y steps completed
 * - Auto-calculates overall tactic completion when all steps checked
 * - Mobile-responsive with scroll support for long content
 *
 * Database Integration:
 * - Loads existing step progress from gh_user_tactic_step_progress on mount
 * - Saves step completion immediately to database on checkbox toggle
 * - Unique constraint ensures one record per user/tactic/step combination
 */
export function TacticDetailModal({
  tactic,
  isOpen,
  onClose,
  onStartTactic,
  onCompleteTactic
}: TacticDetailModalProps) {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [isSavingStep, setIsSavingStep] = useState<number | null>(null);

  // Extract steps array
  const steps = tactic?.step_by_step && Array.isArray(tactic.step_by_step)
    ? tactic.step_by_step
    : [];
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;

  // Load existing step progress when modal opens
  useEffect(() => {
    async function loadStepProgress() {
      if (!user || !tactic || !isOpen) return;

      setIsLoadingSteps(true);
      try {
        const { data, error } = await supabase
          .from('gh_user_tactic_step_progress')
          .select('step_index')
          .eq('user_id', user.id)
          .eq('tactic_id', tactic.tactic_id)
          .not('completed_at', 'is', null);

        if (error) throw error;

        if (data) {
          setCompletedSteps(data.map(d => d.step_index));
        }
      } catch (error) {
        console.error('Error loading step progress:', error);
        toast.error('Failed to load step progress');
      } finally {
        setIsLoadingSteps(false);
      }
    }

    loadStepProgress();
  }, [user, tactic, isOpen]);

  // Toggle step completion with database save
  const toggleStepCompletion = async (stepIndex: number) => {
    if (!user || !tactic) return;

    const isCompleted = completedSteps.includes(stepIndex);
    setIsSavingStep(stepIndex);

    try {
      if (isCompleted) {
        // Unchecking - delete the record
        const { error } = await supabase
          .from('gh_user_tactic_step_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('tactic_id', tactic.tactic_id)
          .eq('step_index', stepIndex);

        if (error) throw error;

        setCompletedSteps(prev => prev.filter(s => s !== stepIndex));
        toast.success(`Step ${stepIndex + 1} unmarked`);
      } else {
        // Checking - insert the record
        const { error } = await supabase
          .from('gh_user_tactic_step_progress')
          .insert({
            user_id: user.id,
            tactic_id: tactic.tactic_id,
            step_index: stepIndex,
            completed_at: new Date().toISOString()
          });

        if (error) throw error;

        setCompletedSteps(prev => [...prev, stepIndex]);
        toast.success(`Step ${stepIndex + 1} completed!`);

        // Auto-start tactic if first step and tactic not started
        if (tactic.status === 'not_started' && onStartTactic) {
          onStartTactic(tactic.tactic_id);
        }

        // Check if all steps are now complete
        const newCompletedSteps = [...completedSteps, stepIndex];
        if (newCompletedSteps.length === totalSteps && onCompleteTactic) {
          toast.success('All steps completed! 🎉');
          // Optional: Auto-complete the tactic
          // onCompleteTactic(tactic.tactic_id);
        }
      }
    } catch (error) {
      console.error('Error toggling step completion:', error);
      toast.error('Failed to save step progress');
    } finally {
      setIsSavingStep(null);
    }
  };

  if (!tactic) return null;

  const StatusIcon = tactic.status === 'completed' ? CheckCircle :
                     tactic.status === 'in_progress' ? Play : Circle;

  const statusColors = {
    completed: 'text-success',
    in_progress: 'text-primary',
    not_started: 'text-muted-foreground',
    skipped: 'text-muted-foreground'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          {/* Header with Status and Category */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <StatusIcon className={`w-6 h-6 mt-1 flex-shrink-0 ${statusColors[tactic.status]}`} />
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight pr-8">
                  {tactic.tactic_name}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={`${getCategoryColor(tactic.category)}`}>
                    {tactic.category}
                  </Badge>
                  {tactic.is_critical_path && (
                    <Badge variant="destructive" className="text-xs">
                      Critical Path
                    </Badge>
                  )}
                  {tactic.tactic_source === 'mentorship' && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      Mentorship
                    </Badge>
                  )}
                  {tactic.tactic_source === 'cashflow_course' && (
                    <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Cashflow Course
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Cost Display */}
          {(tactic.cost_min_usd !== null || tactic.cost_max_usd !== null) && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-emerald-600">
                {formatCostRange(tactic.cost_min_usd ?? null, tactic.cost_max_usd ?? null)}
              </span>
            </div>
          )}

          {/* Progress Bar (if steps exist) */}
          {totalSteps > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Progress
                </span>
                <span className="text-muted-foreground">
                  {completedSteps.length}/{totalSteps} steps completed
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Official Lynette Quote */}
          {tactic.official_lynette_quote && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200">
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-purple-700 mb-2">Lynette's Official Guidance</p>
                  <p className="text-sm text-purple-900 italic leading-relaxed">"{tactic.official_lynette_quote}"</p>
                  {tactic.course_lesson_reference && (
                    <p className="text-xs text-purple-600 mt-2 font-medium">
                      — {tactic.course_lesson_reference}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Why It Matters */}
          {tactic.why_it_matters && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-primary mb-2">Why This Matters</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tactic.why_it_matters}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step-by-Step Instructions with Checkboxes */}
          {totalSteps > 0 && (
            <div className="space-y-3">
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Step-by-Step Checklist
                </h3>
                {isLoadingSteps ? (
                  <div className="text-sm text-muted-foreground">Loading your progress...</div>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step: string, index: number) => {
                      const isCompleted = completedSteps.includes(index);
                      const isSaving = isSavingStep === index;

                      return (
                        <div
                          key={index}
                          className={`flex gap-4 p-3 rounded-lg border-2 transition-all ${
                            isCompleted
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => toggleStepCompletion(index)}
                              disabled={isSaving}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isCompleted
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {index + 1}
                                </span>
                                <span className={`text-sm font-medium ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                                  Step {index + 1}
                                </span>
                              </div>
                              <p className={`text-sm leading-relaxed ml-8 ${
                                isCompleted ? 'text-green-800 line-through' : 'text-gray-700'
                              }`}>
                                {step}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lynette's Tip */}
          {tactic.lynettes_tip && (
            <>
              <Separator />
              <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/10">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💡</span>
                  <div>
                    <p className="text-sm font-semibold text-secondary-foreground mb-2">Lynette's Pro Tip</p>
                    <p className="text-sm text-muted-foreground italic leading-relaxed">{tactic.lynettes_tip}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Common Mistakes */}
          {tactic.common_mistakes && Array.isArray(tactic.common_mistakes) && tactic.common_mistakes.length > 0 && (
            <>
              <Separator />
              <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-destructive mb-2">Common Mistakes to Avoid</p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {tactic.common_mistakes.map((mistake: string, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-destructive">•</span>
                          <span className="leading-relaxed">{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {onCompleteTactic && (
              <Button
                onClick={() => {
                  // Auto-start tactic if not started yet
                  if (tactic.status === 'not_started' && onStartTactic) {
                    onStartTactic(tactic.tactic_id);
                  }
                  onCompleteTactic(tactic.tactic_id);
                  onClose();
                }}
                disabled={progressPercent < 50}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {progressPercent < 50 ? `Complete ${progressPercent}% of checklist to unlock` : 'Mark Complete'}
              </Button>
            )}

            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
