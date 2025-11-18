import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SkipAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  userId: string;
}

/**
 * Modal shown when user tries to access roadmap without completing assessment
 * Explains benefits of assessment while allowing skip option
 */
export const SkipAssessmentModal = ({ isOpen, onClose, onSkip, userId }: SkipAssessmentModalProps) => {
  const [isSkipping, setIsSkipping] = useState(false);
  const { toast } = useToast();

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      // Create default assessment record with foundation_building level
      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: userId,
          overall_score: 40, // Default to foundation_building (0-40)
          readiness_level: 'foundation_building',
          financial_score: 40,
          market_score: 40,
          operational_score: 40,
          mindset_score: 40,
          assessment_completed_at: new Date().toISOString(),
          onboarding_step: 'assessment_skipped',
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Assessment Skipped",
        description: "You can complete it later to get personalized recommendations.",
      });

      onSkip();
    } catch (error) {
      console.error('Error skipping assessment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to skip assessment. Please try again.",
      });
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-100 to-orange-100">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-2xl">
              Complete Your Assessment?
            </DialogTitle>
          </div>
          <DialogDescription className="text-base space-y-4 pt-2">
            <p className="text-gray-700 dark:text-gray-300">
              The assessment helps us personalize your roadmap to match your unique situation.
            </p>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                What You'll Get:
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Personalized roadmap</strong> based on your readiness level</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Tactics matched to your goals</strong> (ownership model, timeline, budget)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Optimized week-by-week plan</strong> tailored to your situation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Budget-aware recommendations</strong> based on your capital</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Skip for now?</strong> You'll see a generic roadmap and can complete the assessment later to unlock personalization.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSkipping}
            className="w-full sm:w-auto"
          >
            {isSkipping ? 'Skipping...' : 'Skip & See Generic Roadmap'}
          </Button>
          <Button
            onClick={onClose}
            disabled={isSkipping}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Complete Assessment (5 min)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
