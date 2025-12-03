import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface AssessmentNavigationProps {
  currentStep: number;
  totalSteps: number;
  isStepComplete: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
}

export const AssessmentNavigation = ({
  currentStep,
  totalSteps,
  isStepComplete,
  isSubmitting,
  onBack,
  onNext
}: AssessmentNavigationProps) => {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex justify-between mt-8 pt-6 border-t">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={currentStep === 0 || isSubmitting}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Button
        onClick={onNext}
        className="min-w-[120px]"
        disabled={!isStepComplete || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : isLastStep ? (
          'Complete Assessment'
        ) : (
          <>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
};