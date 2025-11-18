import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FirstTacticOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  startingWeek: number;
  readinessLevel: string;
}

/**
 * First-time overlay shown when user first visits roadmap
 * Provides guidance on how to use the roadmap and start their first tactic
 */
export const FirstTacticOverlay = ({
  isOpen,
  onClose,
  userId,
  startingWeek,
  readinessLevel
}: FirstTacticOverlayProps) => {
  const [isDismissing, setIsDismissing] = useState(false);
  const { toast } = useToast();

  const readinessLabels = {
    foundation_building: 'Foundation Building',
    accelerated_learning: 'Accelerated Learning',
    fast_track: 'Fast Track',
    expert_implementation: 'Expert Implementation'
  };

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      // Update onboarding record to mark roadmap first visit
      const { error } = await supabase
        .from('user_onboarding')
        .update({
          roadmap_first_visit: new Date().toISOString(),
          onboarding_step: 'roadmap_visited',
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Let's get started!",
        description: "Time to tackle your first tactic.",
      });

      onClose();
    } catch (error) {
      console.error('Error updating roadmap visit:', error);
      // Still close even if error
      onClose();
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <DialogTitle className="text-2xl">
              Your Roadmap is Ready! 🗺️
            </DialogTitle>
          </div>
          <DialogDescription className="text-base space-y-4 pt-2">
            {/* Personalization Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Personalized for You
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>
                    <strong>Path:</strong> {readinessLabels[readinessLevel as keyof typeof readinessLabels] || readinessLevel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span>
                    <strong>Starting Point:</strong> Week {startingWeek}
                  </span>
                </div>
              </div>
            </div>

            {/* How to Use the Roadmap */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                How to Use Your Roadmap
              </h3>
              <div className="grid gap-3">
                <Card className="p-3 bg-white dark:bg-gray-900 border-l-4 border-l-blue-500">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        Navigate by Week
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Use the week selector to jump between weeks. We recommend starting at Week {startingWeek} based on your assessment.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 bg-white dark:bg-gray-900 border-l-4 border-l-green-500">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300 font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        Start Tactics
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click "Start Tactic" to begin. Track your progress with notes and mark complete when done.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 bg-white dark:bg-gray-900 border-l-4 border-l-amber-500">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-300 font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        Unlock New Weeks
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Complete tactics to unlock future weeks. You can always see 2 weeks ahead of your progress.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 bg-white dark:bg-gray-900 border-l-4 border-l-purple-500">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-semibold text-sm">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        Track Your Budget
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        The sidebar shows your cost breakdown and critical path tactics for efficient spending.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pro Tips
              </h4>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>Tactics marked with <strong>★</strong> are critical path items - prioritize these first</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>Use filters to focus on specific categories or status</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>Add notes to tactics to track your learning and decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>The Journey Map shows your overall progress across all phases</span>
                </li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            onClick={handleDismiss}
            disabled={isDismissing}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isDismissing ? 'Loading...' : (
              <>
                Got it! Start Week {startingWeek}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
