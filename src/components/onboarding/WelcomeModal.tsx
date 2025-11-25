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
import { Sparkles, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: {
    name?: string;
    readiness_level?: string;
    ownership_model?: string;
    timeline?: string;
    overall_score?: number;
    immediate_priority?: string;
  };
  userId: string;
}

const readinessLevelMessages = {
  foundation_building: {
    title: "Building Your Foundation",
    message: "You're at the beginning of an exciting journey. We'll guide you step-by-step to build the knowledge and resources you need.",
    color: "text-blue-600",
    icon: Sparkles,
  },
  accelerated_learning: {
    title: "Accelerated Learning Path",
    message: "You have a solid foundation. We'll help you quickly close knowledge gaps and move toward your first property.",
    color: "text-purple-600",
    icon: TrendingUp,
  },
  fast_track: {
    title: "Fast Track to Launch",
    message: "You're well-prepared! Focus on execution and fine-tuning your strategy to launch your grouphome business.",
    color: "text-green-600",
    icon: Target,
  },
  expert_implementation: {
    title: "Expert Implementation",
    message: "You're ready to execute at a high level. Let's optimize your operations and scale your business.",
    color: "text-orange-600",
    icon: CheckCircle2,
  },
};

const priorityMessages = {
  property_acquisition: "Your focus: Finding and securing the right property",
  operations: "Your focus: Building operational systems and compliance",
  comprehensive: "Your focus: Complete business setup from scratch",
  scaling: "Your focus: Growing and optimizing your business",
};

export const WelcomeModal = ({ isOpen, onClose, userProfile, userId }: WelcomeModalProps) => {
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();

  const readinessLevel = userProfile.readiness_level || 'foundation_building';
  const levelInfo = readinessLevelMessages[readinessLevel as keyof typeof readinessLevelMessages] ||
    readinessLevelMessages.foundation_building;

  const LevelIcon = levelInfo.icon;

  // Mark welcome as seen whenever modal is closed (any dismissal method)
  const handleClose = async () => {
    try {
      // Update database to mark welcome as seen
      await supabase
        .from('user_onboarding')
        .update({
          has_seen_welcome: true,
          welcome_shown_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // Close the modal even if database update fails
      onClose();
    } catch (error) {
      console.error('Error updating welcome status:', error);
      // Still close the modal - don't block user
      onClose();
    }
  };

  const handleStartJourney = async () => {
    setIsStarting(true);
    try {
      // Mark welcome as seen and update onboarding step
      const { error } = await supabase
        .from('user_onboarding')
        .update({
          has_seen_welcome: true,
          welcome_shown_at: new Date().toISOString(),
          onboarding_step: 'welcome_shown',
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Let's get started! 🚀",
        description: "Your personalized roadmap is ready.",
      });

      onClose();
    } catch (error) {
      console.error('Error updating welcome status:', error);
      toast({
        title: "Welcome!",
        description: "Let's begin your journey.",
        variant: "default",
      });
      onClose();
    } finally {
      setIsStarting(false);
    }
  };

  const ownershipModelLabels = {
    rental_arbitrage: "Rental Arbitrage",
    ownership: "Property Ownership",
    creative_financing: "Creative Financing",
    house_hack: "House Hacking",
    hybrid: "Hybrid Model",
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 ${levelInfo.color}`}>
              <LevelIcon className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl">
              Welcome{userProfile.name ? `, ${userProfile.name}` : ''}! 👋
            </DialogTitle>
          </div>
          <DialogDescription className="text-base space-y-4 pt-2">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className={`font-semibold text-lg mb-2 ${levelInfo.color}`}>
                {levelInfo.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {levelInfo.message}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                Your Personalized Plan
              </h4>

              <div className="grid gap-2 text-sm">
                {userProfile.ownership_model && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>
                      <strong>Business Model:</strong>{' '}
                      {ownershipModelLabels[userProfile.ownership_model as keyof typeof ownershipModelLabels] || userProfile.ownership_model}
                    </span>
                  </div>
                )}

                {userProfile.immediate_priority && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>
                      {priorityMessages[userProfile.immediate_priority as keyof typeof priorityMessages] ||
                       `Focus: ${userProfile.immediate_priority}`}
                    </span>
                  </div>
                )}

                {userProfile.timeline && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>
                      <strong>Timeline:</strong> {userProfile.timeline}
                    </span>
                  </div>
                )}

                {userProfile.overall_score !== undefined && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>
                      <strong>Readiness Score:</strong> {Math.round(userProfile.overall_score)}/100
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What's Next?
              </h4>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>Review your personalized roadmap with tactics matched to your goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>Start with Week 1 to build your foundation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>Track your progress and unlock milestones as you go</span>
                </li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isStarting}
            className="w-full sm:w-auto"
          >
            I'll explore first
          </Button>
          <Button
            onClick={handleStartJourney}
            disabled={isStarting}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isStarting ? 'Starting...' : 'Start My Journey 🚀'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
