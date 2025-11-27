import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssessmentAnswers } from '@/types/assessment';
import { AlertCircle } from 'lucide-react';
import { useAssessment } from '@/hooks/useAssessment';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  saveAssessmentProgress,
  loadAssessmentProgress,
  clearAssessmentProgress,
  checkSavedProgress,
  migrateGuestProgress,
  cleanupOldProgress
} from '@/utils/assessmentStorage';

// Extracted components
import { AssessmentHeader } from '@/components/assessment/AssessmentHeader';
import { AssessmentNavigation } from '@/components/assessment/AssessmentNavigation';
import { FinancialReadinessStep } from '@/components/assessment/FinancialReadinessStep';
import { StrategySelectionStep } from '@/components/assessment/StrategySelectionStep';
import { MarketKnowledgeStep } from '@/components/assessment/MarketKnowledgeStep';
import { OperationalReadinessStep } from '@/components/assessment/OperationalReadinessStep';
import { MindsetCommitmentStep } from '@/components/assessment/MindsetCommitmentStep';

const AssessmentPage = () => {
  const navigate = useNavigate();
  const { submitAssessmentAsync, isSubmitting } = useAssessment();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<AssessmentAnswers>>({
    targetPopulations: [],
    supportTeam: [],
    propertyManagement: 5,
    commitmentLevel: 5,
    primaryMotivation: '',
    // Enhanced personalization fields
    ownershipModel: '',
    targetState: '',
    propertyStatus: '',
    immediatePriority: '',
  });
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedProgressInfo, setSavedProgressInfo] = useState<{ timeAgo?: string }>({});

  const categories = [
    {
      name: 'Financial Readiness',
      description: "Let's understand your financial situation",
    },
    {
      name: 'Strategy Selection',
      description: 'Choose your ownership strategy and target market',
    },
    {
      name: 'Market Knowledge',
      description: 'Tell us about your market understanding',
    },
    {
      name: 'Operational Readiness',
      description: 'Assess your operational capabilities',
    },
    {
      name: 'Mindset & Commitment',
      description: 'Understand your motivation and commitment',
    },
  ];

  // Check for saved progress on component mount
  useEffect(() => {
    // Clean up old progress (older than 7 days)
    cleanupOldProgress();

    // If user just logged in, migrate any guest progress
    if (user?.id) {
      migrateGuestProgress(user.id);
    }

    // Check if there's saved progress
    const progressCheck = checkSavedProgress(user?.id);
    if (progressCheck.hasProgress) {
      setSavedProgressInfo({ timeAgo: progressCheck.timeAgo });
      setShowResumeDialog(true);
    }
  }, [user?.id]);

  // Auto-save progress whenever answers change
  useEffect(() => {
    // Don't save if we're just initializing or if submitting
    if (Object.keys(answers).some(key => answers[key as keyof AssessmentAnswers]) && !isSubmitting) {
      saveAssessmentProgress(currentStep, answers, user?.id);
    }
  }, [answers, currentStep, user?.id, isSubmitting]);

  const handleResume = () => {
    const progress = loadAssessmentProgress(user?.id);
    if (progress) {
      setAnswers(progress.answers as Partial<AssessmentAnswers>);
      setCurrentStep(progress.currentStep);
    }
    setShowResumeDialog(false);
  };

  const handleStartFresh = () => {
    clearAssessmentProgress(user?.id);
    setShowResumeDialog(false);
    // Reset to initial state
    setCurrentStep(0);
    setAnswers({
      targetPopulations: [],
      supportTeam: [],
      propertyManagement: 5,
      commitmentLevel: 5,
      primaryMotivation: '',
      ownershipModel: '',
      targetState: '',
      propertyStatus: '',
      immediatePriority: '',
    });
  };

  const isStepComplete = () => {
    if (currentStep === 0) {
      return !!(answers.capital && answers.creditScore && answers.incomeStability && answers.creativeFinancing);
    }
    if (currentStep === 1) {
      // Strategy Selection step - requires all 4 fields
      return !!(answers.ownershipModel && answers.targetState && answers.propertyStatus && answers.immediatePriority);
    }
    if (currentStep === 2) {
      return !!(answers.licensingFamiliarity && answers.targetPopulations && answers.targetPopulations.length > 0 && answers.marketResearch && answers.reimbursementRate);
    }
    if (currentStep === 3) {
      return !!(answers.caregivingExperience && answers.timeCommitment && answers.supportTeam && answers.supportTeam.length > 0);
    }
    if (currentStep === 4) {
      return !!(answers.primaryMotivation && answers.timeline);
    }
    return false;
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit assessment to database with await
      try {
        await submitAssessmentAsync(answers as AssessmentAnswers);
        // Clear localStorage after successful submission
        clearAssessmentProgress(user?.id);
        // Navigate to chat page for personalized onboarding experience
        navigate('/chat');
      } catch (error) {
        console.error('Assessment submission failed:', error);
        // Error is already handled by useAssessment hook with toast
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateAnswer = (field: keyof AssessmentAnswers, value: any) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof AssessmentAnswers, value: string) => {
    const currentArray = (answers[field] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateAnswer(field, newArray);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <FinancialReadinessStep answers={answers} updateAnswer={updateAnswer} />;
      case 1:
        return <StrategySelectionStep answers={answers} updateAnswer={updateAnswer} />;
      case 2:
        return <MarketKnowledgeStep answers={answers} updateAnswer={updateAnswer} toggleArrayItem={toggleArrayItem} />;
      case 3:
        return <OperationalReadinessStep answers={answers} updateAnswer={updateAnswer} toggleArrayItem={toggleArrayItem} />;
      case 4:
        return <MindsetCommitmentStep answers={answers} updateAnswer={updateAnswer} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Resume Progress Dialog */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Resume Your Assessment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              We found a saved assessment from {savedProgressInfo.timeAgo}. Would you like to continue where you left off or start fresh?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResume}>
              Resume Progress
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <AssessmentHeader currentStep={currentStep} categories={categories} />

        <Card>
          <CardHeader>
            <CardTitle>{categories[currentStep].name}</CardTitle>
            <CardDescription>{categories[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}

            <AssessmentNavigation
              currentStep={currentStep}
              totalSteps={5}
              isStepComplete={isStepComplete()}
              isSubmitting={isSubmitting}
              onBack={handleBack}
              onNext={handleNext}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssessmentPage;