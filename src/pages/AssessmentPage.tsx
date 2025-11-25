import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { AssessmentAnswers } from "@/types/assessment";
import { ChevronLeft, ChevronRight, Loader2, Home, Search, FileText, Rocket, BookOpen, TrendingUp, AlertCircle } from "lucide-react";
import { useAssessment } from "@/hooks/useAssessment";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  saveAssessmentProgress,
  loadAssessmentProgress,
  clearAssessmentProgress,
  checkSavedProgress,
  migrateGuestProgress,
  cleanupOldProgress
} from "@/utils/assessmentStorage";

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
    primaryMotivation: "",
    // NEW: Enhanced personalization fields
    ownershipModel: "",
    targetState: "",
    propertyStatus: "",
    immediatePriority: "",
  });
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedProgressInfo, setSavedProgressInfo] = useState<{ timeAgo?: string }>({});

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

  // Auto-suggest immediate priority based on property status
  useEffect(() => {
    if (answers.propertyStatus && !answers.immediatePriority) {
      if (answers.propertyStatus === 'owned' || answers.propertyStatus === 'leasing') {
        setAnswers(prev => ({ ...prev, immediatePriority: 'operations' }));
      } else if (answers.propertyStatus === 'not-started' || answers.propertyStatus === 'researching') {
        setAnswers(prev => ({ ...prev, immediatePriority: 'property_acquisition' }));
      }
    }
  }, [answers.propertyStatus]);

  const categories = [
    {
      name: "Financial Readiness",
      description: "Let's understand your financial situation",
    },
    {
      name: "Strategy Selection",
      description: "Choose your ownership strategy and target market",
    },
    {
      name: "Market Knowledge",
      description: "Tell us about your market understanding",
    },
    {
      name: "Operational Readiness",
      description: "Assess your operational capabilities",
    },
    {
      name: "Mindset & Commitment",
      description: "Understand your motivation and commitment",
    },
  ];

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
      primaryMotivation: "",
      ownershipModel: "",
      targetState: "",
      propertyStatus: "",
      immediatePriority: "",
    });
  };

  const isStepComplete = () => {
    if (currentStep === 0) {
      return !!(answers.capital && answers.creditScore && answers.incomeStability && answers.creativeFinancing);
    }
    if (currentStep === 1) {
      // NEW: Strategy Selection step - now requires all 4 fields
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
        // Navigation happens after submission completes successfully
        navigate("/dashboard");
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

  const renderFinancialReadiness = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How much capital do you have available to invest in your first group home?
        </Label>
        <RadioGroup
          value={answers.capital}
          onValueChange={(value) => updateAnswer("capital", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="less-5k" id="cap1" />
            <Label htmlFor="cap1" className="font-normal cursor-pointer">
              Less than $5,000
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="5k-15k" id="cap2" />
            <Label htmlFor="cap2" className="font-normal cursor-pointer">
              $5,000 - $15,000
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="15k-30k" id="cap3" />
            <Label htmlFor="cap3" className="font-normal cursor-pointer">
              $15,000 - $30,000
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="30k-50k" id="cap4" />
            <Label htmlFor="cap4" className="font-normal cursor-pointer">
              $30,000 - $50,000
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="more-50k" id="cap5" />
            <Label htmlFor="cap5" className="font-normal cursor-pointer">
              More than $50,000
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">What is your current credit score?</Label>
        <RadioGroup
          value={answers.creditScore}
          onValueChange={(value) => updateAnswer("creditScore", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="below-580" id="credit1" />
            <Label htmlFor="credit1" className="font-normal cursor-pointer">
              Below 580 (Poor)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="580-669" id="credit2" />
            <Label htmlFor="credit2" className="font-normal cursor-pointer">
              580-669 (Fair)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="670-739" id="credit3" />
            <Label htmlFor="credit3" className="font-normal cursor-pointer">
              670-739 (Good)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="740-799" id="credit4" />
            <Label htmlFor="credit4" className="font-normal cursor-pointer">
              740-799 (Very Good)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="800+" id="credit5" />
            <Label htmlFor="credit5" className="font-normal cursor-pointer">
              800+ (Excellent)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="not-sure" id="credit6" />
            <Label htmlFor="credit6" className="font-normal cursor-pointer">
              Not sure
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">How stable is your current income?</Label>
        <RadioGroup
          value={answers.incomeStability}
          onValueChange={(value) => updateAnswer("incomeStability", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no-stable" id="income1" />
            <Label htmlFor="income1" className="font-normal cursor-pointer">
              No stable income currently
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="part-time" id="income2" />
            <Label htmlFor="income2" className="font-normal cursor-pointer">
              Part-time or inconsistent income
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="full-time-w2" id="income3" />
            <Label htmlFor="income3" className="font-normal cursor-pointer">
              Full-time W2 employment
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="self-employed" id="income4" />
            <Label htmlFor="income4" className="font-normal cursor-pointer">
              Self-employed with steady income
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="multiple-streams" id="income5" />
            <Label htmlFor="income5" className="font-normal cursor-pointer">
              Multiple income streams
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Are you familiar with creative financing strategies?
        </Label>
        <p className="text-sm text-muted-foreground">
          (seller financing, subject-to, lease options)
        </p>
        <RadioGroup
          value={answers.creativeFinancing}
          onValueChange={(value) => updateAnswer("creativeFinancing", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="never-heard" id="finance1" />
            <Label htmlFor="finance1" className="font-normal cursor-pointer">
              Never heard of them
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="heard-not-understand" id="finance2" />
            <Label htmlFor="finance2" className="font-normal cursor-pointer">
              Heard of them but don't understand
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="basic" id="finance3" />
            <Label htmlFor="finance3" className="font-normal cursor-pointer">
              Basic understanding
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="good" id="finance4" />
            <Label htmlFor="finance4" className="font-normal cursor-pointer">
              Good understanding, need practice
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="very-familiar" id="finance5" />
            <Label htmlFor="finance5" className="font-normal cursor-pointer">
              Very familiar, have used them before
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderStrategySelection = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          What ownership strategy aligns best with your goals?
        </Label>
        <p className="text-sm text-muted-foreground">
          This determines which tactics and costs we'll prioritize for your roadmap
        </p>
        <RadioGroup
          value={answers.ownershipModel}
          onValueChange={(value) => updateAnswer("ownershipModel", value)}
        >
          <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
            <RadioGroupItem value="rental_arbitrage" id="strat1" />
            <div className="flex-1">
              <Label htmlFor="strat1" className="font-semibold cursor-pointer">
                Rental Arbitrage (Recommended for beginners)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Lease properties from landlords and sublease as group homes. Lower upfront cost ($5K-$10K), faster start, lower risk.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
            <RadioGroupItem value="ownership" id="strat2" />
            <div className="flex-1">
              <Label htmlFor="strat2" className="font-semibold cursor-pointer">
                Property Ownership
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Purchase properties outright. Higher capital needed ($30K+), but maximum control and equity building.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
            <RadioGroupItem value="creative_financing" id="strat3" />
            <div className="flex-1">
              <Label htmlFor="strat3" className="font-semibold cursor-pointer">
                Creative Financing
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Subject-to, seller financing, or DSCR loans. Moderate capital ($2K-$20K), requires negotiation skills.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
            <RadioGroupItem value="house_hack" id="strat4" />
            <div className="flex-1">
              <Label htmlFor="strat4" className="font-semibold cursor-pointer">
                House Hacking
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Live in property while operating group home. Lower expenses, hands-on management.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
            <RadioGroupItem value="hybrid" id="strat5" />
            <div className="flex-1">
              <Label htmlFor="strat5" className="font-semibold cursor-pointer">
                Hybrid Approach
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Start with arbitrage, transition to ownership. Flexible scaling path.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Which state will you operate in?
        </Label>
        <p className="text-sm text-muted-foreground">
          Regulations and reimbursement rates vary significantly by state
        </p>
        <RadioGroup
          value={answers.targetState}
          onValueChange={(value) => updateAnswer("targetState", value)}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CA" id="state1" />
              <Label htmlFor="state1" className="font-normal cursor-pointer">California</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="TX" id="state2" />
              <Label htmlFor="state2" className="font-normal cursor-pointer">Texas</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="FL" id="state3" />
              <Label htmlFor="state3" className="font-normal cursor-pointer">Florida</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="NY" id="state4" />
              <Label htmlFor="state4" className="font-normal cursor-pointer">New York</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="GA" id="state5" />
              <Label htmlFor="state5" className="font-normal cursor-pointer">Georgia</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="AZ" id="state6" />
              <Label htmlFor="state6" className="font-normal cursor-pointer">Arizona</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="NC" id="state7" />
              <Label htmlFor="state7" className="font-normal cursor-pointer">North Carolina</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PA" id="state8" />
              <Label htmlFor="state8" className="font-normal cursor-pointer">Pennsylvania</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="OH" id="state9" />
              <Label htmlFor="state9" className="font-normal cursor-pointer">Ohio</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="OTHER" id="state10" />
              <Label htmlFor="state10" className="font-normal cursor-pointer">Other State</Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* NEW: Property Status Question */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Where are you in your property journey?
        </Label>
        <p className="text-sm text-muted-foreground">
          This helps us prioritize the right tactics for your current situation
        </p>
        <RadioGroup
          value={answers.propertyStatus}
          onValueChange={(value) => updateAnswer("propertyStatus", value)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="not-started" id="prop1" />
              <Search className="w-5 h-5 text-muted-foreground" />
              <Label htmlFor="prop1" className="font-normal cursor-pointer">Haven't started looking</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="researching" id="prop2" />
              <BookOpen className="w-5 h-5 text-blue-500" />
              <Label htmlFor="prop2" className="font-normal cursor-pointer">Researching areas/options</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="searching" id="prop3" />
              <Search className="w-5 h-5 text-amber-500" />
              <Label htmlFor="prop3" className="font-normal cursor-pointer">Actively searching</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="offer-pending" id="prop4" />
              <FileText className="w-5 h-5 text-orange-500" />
              <Label htmlFor="prop4" className="font-normal cursor-pointer">Made an offer / Negotiating</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="under-contract" id="prop5" />
              <FileText className="w-5 h-5 text-purple-500" />
              <Label htmlFor="prop5" className="font-normal cursor-pointer">Under contract</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="owned" id="prop6" />
              <Home className="w-5 h-5 text-green-600" />
              <Label htmlFor="prop6" className="font-normal cursor-pointer">I own a property</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="leasing" id="prop7" />
              <Home className="w-5 h-5 text-primary" />
              <Label htmlFor="prop7" className="font-normal cursor-pointer">I'm leasing a property</Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* NEW: Immediate Priority Question */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          What's your immediate focus right now?
        </Label>
        <p className="text-sm text-muted-foreground">
          We'll prioritize tactics based on your current needs (you can change this anytime)
        </p>
        <RadioGroup
          value={answers.immediatePriority}
          onValueChange={(value) => updateAnswer("immediatePriority", value)}
        >
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="property_acquisition" id="priority1" className="mt-1" />
              <Search className="w-6 h-6 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="priority1" className="font-semibold cursor-pointer block">
                  Finding & Acquiring Property
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Focus on property search, negotiations, landlord outreach, and securing a location
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="operations" id="priority2" className="mt-1" />
              <Home className="w-6 h-6 text-green-600 mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="priority2" className="font-semibold cursor-pointer block">
                  Operating My Property
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Focus on licensing, setup, staffing, and getting your first residents
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="comprehensive" id="priority3" className="mt-1" />
              <BookOpen className="w-6 h-6 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="priority3" className="font-semibold cursor-pointer block">
                  Learning All Strategies
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  I want to see all tactics in order - I like to be thorough and prepared
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="scaling" id="priority4" className="mt-1" />
              <TrendingUp className="w-6 h-6 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="priority4" className="font-semibold cursor-pointer block">
                  Scaling My Operation
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Focus on adding more properties, optimizing revenue, and building systems
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderMarketKnowledge = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How familiar are you with group home licensing requirements in your state?
        </Label>
        <RadioGroup
          value={answers.licensingFamiliarity}
          onValueChange={(value) => updateAnswer("licensingFamiliarity", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="not-familiar" id="license1" />
            <Label htmlFor="license1" className="font-normal cursor-pointer">
              Not familiar at all
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="know-exist" id="license2" />
            <Label htmlFor="license2" className="font-normal cursor-pointer">
              Know they exist but haven't researched
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="some-research" id="license3" />
            <Label htmlFor="license3" className="font-normal cursor-pointer">
              Have done some research
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="very-familiar" id="license4" />
            <Label htmlFor="license4" className="font-normal cursor-pointer">
              Very familiar with requirements
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="licensed" id="license5" />
            <Label htmlFor="license5" className="font-normal cursor-pointer">
              Already licensed or in licensing process
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Do you know which populations you want to serve?
        </Label>
        <p className="text-sm text-muted-foreground">(Select all that apply)</p>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop1"
              checked={answers.targetPopulations?.includes("developmental-disabilities")}
              onCheckedChange={() =>
                toggleArrayItem("targetPopulations", "developmental-disabilities")
              }
            />
            <Label htmlFor="pop1" className="font-normal cursor-pointer">
              Adults with developmental disabilities
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop2"
              checked={answers.targetPopulations?.includes("seniors")}
              onCheckedChange={() => toggleArrayItem("targetPopulations", "seniors")}
            />
            <Label htmlFor="pop2" className="font-normal cursor-pointer">
              Seniors/Elderly care
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop3"
              checked={answers.targetPopulations?.includes("mental-health")}
              onCheckedChange={() => toggleArrayItem("targetPopulations", "mental-health")}
            />
            <Label htmlFor="pop3" className="font-normal cursor-pointer">
              Mental health populations
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop4"
              checked={answers.targetPopulations?.includes("at-risk-youth")}
              onCheckedChange={() => toggleArrayItem("targetPopulations", "at-risk-youth")}
            />
            <Label htmlFor="pop4" className="font-normal cursor-pointer">
              At-risk youth
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop5"
              checked={answers.targetPopulations?.includes("substance-abuse")}
              onCheckedChange={() => toggleArrayItem("targetPopulations", "substance-abuse")}
            />
            <Label htmlFor="pop5" className="font-normal cursor-pointer">
              Substance abuse recovery
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop6"
              checked={answers.targetPopulations?.includes("not-sure")}
              onCheckedChange={() => toggleArrayItem("targetPopulations", "not-sure")}
            />
            <Label htmlFor="pop6" className="font-normal cursor-pointer">
              Not sure yet
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Have you researched the demand for group homes in your target area?
        </Label>
        <RadioGroup
          value={answers.marketResearch}
          onValueChange={(value) => updateAnswer("marketResearch", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="not-researched" id="research1" />
            <Label htmlFor="research1" className="font-normal cursor-pointer">
              Haven't researched yet
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="basic-google" id="research2" />
            <Label htmlFor="research2" className="font-normal cursor-pointer">
              Did some basic Google searches
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="talked-providers" id="research3" />
            <Label htmlFor="research3" className="font-normal cursor-pointer">
              Talked to some providers in the area
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="extensive" id="research4" />
            <Label htmlFor="research4" className="font-normal cursor-pointer">
              Researched extensively (waitlists, funding, competition)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="connected" id="research5" />
            <Label htmlFor="research5" className="font-normal cursor-pointer">
              Already connected with referral sources
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How much do group homes in your area typically receive per resident per month?
        </Label>
        <RadioGroup
          value={answers.reimbursementRate}
          onValueChange={(value) => updateAnswer("reimbursementRate", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no-idea" id="rate1" />
            <Label htmlFor="rate1" className="font-normal cursor-pointer">
              No idea
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1k-2k" id="rate2" />
            <Label htmlFor="rate2" className="font-normal cursor-pointer">
              Roughly $1,000 - $2,000
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2k-4k" id="rate3" />
            <Label htmlFor="rate3" className="font-normal cursor-pointer">
              $2,000 - $4,000
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="4k-6k" id="rate4" />
            <Label htmlFor="rate4" className="font-normal cursor-pointer">
              $4,000 - $6,000
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="more-6k" id="rate5" />
            <Label htmlFor="rate5" className="font-normal cursor-pointer">
              More than $6,000
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderOperationalReadiness = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Do you have experience in caregiving, healthcare, or social services?
        </Label>
        <RadioGroup
          value={answers.caregivingExperience}
          onValueChange={(value) => updateAnswer("caregivingExperience", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no-experience" id="exp1" />
            <Label htmlFor="exp1" className="font-normal cursor-pointer">
              No experience
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="some-experience" id="exp2" />
            <Label htmlFor="exp2" className="font-normal cursor-pointer">
              Some experience (volunteer or 1-3 years)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="extensive-experience" id="exp3" />
            <Label htmlFor="exp3" className="font-normal cursor-pointer">
              Extensive experience (3+ years professional)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="licensed-professional" id="exp4" />
            <Label htmlFor="exp4" className="font-normal cursor-pointer">
              Licensed professional
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How much time can you dedicate to your group home business?
        </Label>
        <RadioGroup
          value={answers.timeCommitment}
          onValueChange={(value) => updateAnswer("timeCommitment", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="less-10" id="time1" />
            <Label htmlFor="time1" className="font-normal cursor-pointer">
              Less than 10 hours per week
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="10-20" id="time2" />
            <Label htmlFor="time2" className="font-normal cursor-pointer">
              10-20 hours per week
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="20-30" id="time3" />
            <Label htmlFor="time3" className="font-normal cursor-pointer">
              20-30 hours per week
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="30-40" id="time4" />
            <Label htmlFor="time4" className="font-normal cursor-pointer">
              30-40 hours per week (part-time focus)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="40+" id="time5" />
            <Label htmlFor="time5" className="font-normal cursor-pointer">
              40+ hours per week (full-time)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Do you have a support team or plan to hire staff?
        </Label>
        <p className="text-sm text-muted-foreground">(Select all that apply)</p>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team1"
              checked={answers.supportTeam?.includes("primary-caregiver")}
              onCheckedChange={() => toggleArrayItem("supportTeam", "primary-caregiver")}
            />
            <Label htmlFor="team1" className="font-normal cursor-pointer">
              I plan to be the primary caregiver
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team2"
              checked={answers.supportTeam?.includes("family-help")}
              onCheckedChange={() => toggleArrayItem("supportTeam", "family-help")}
            />
            <Label htmlFor="team2" className="font-normal cursor-pointer">
              I have family members who can help
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team3"
              checked={answers.supportTeam?.includes("hire-caregivers")}
              onCheckedChange={() => toggleArrayItem("supportTeam", "hire-caregivers")}
            />
            <Label htmlFor="team3" className="font-normal cursor-pointer">
              I plan to hire professional caregivers
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team4"
              checked={answers.supportTeam?.includes("business-partner")}
              onCheckedChange={() => toggleArrayItem("supportTeam", "business-partner")}
            />
            <Label htmlFor="team4" className="font-normal cursor-pointer">
              I have a business partner
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team5"
              checked={answers.supportTeam?.includes("hire-manager")}
              onCheckedChange={() => toggleArrayItem("supportTeam", "hire-manager")}
            />
            <Label htmlFor="team5" className="font-normal cursor-pointer">
              I plan to hire a manager
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team6"
              checked={answers.supportTeam?.includes("not-sure")}
              onCheckedChange={() => toggleArrayItem("supportTeam", "not-sure")}
            />
            <Label htmlFor="team6" className="font-normal cursor-pointer">
              Not sure yet
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How comfortable are you with managing a property and handling maintenance issues?
        </Label>
        <div className="pt-4">
          <Slider
            value={[answers.propertyManagement || 5]}
            onValueChange={(value) => updateAnswer("propertyManagement", value[0])}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>1 - Not comfortable</span>
            <span className="text-foreground font-semibold">
              {answers.propertyManagement || 5}
            </span>
            <span>10 - Very comfortable</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMindsetCommitment = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          What is your primary motivation for starting a group home?
        </Label>
        <RadioGroup
          value={answers.primaryMotivation}
          onValueChange={(value) => updateAnswer("primaryMotivation", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="passive-income" id="mot1" />
            <Label htmlFor="mot1" className="font-normal cursor-pointer">
              Generate passive income
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="impact-income" id="mot2" />
            <Label htmlFor="mot2" className="font-normal cursor-pointer">
              Make a positive impact while earning income
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="scalable-business" id="mot3" />
            <Label htmlFor="mot3" className="font-normal cursor-pointer">
              Build a scalable business (multiple homes)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="passionate-care" id="mot4" />
            <Label htmlFor="mot4" className="font-normal cursor-pointer">
              Provide care for a specific population I'm passionate about
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="career-transition" id="mot5" />
            <Label htmlFor="mot5" className="font-normal cursor-pointer">
              Transition from another career
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How would you rate your commitment level to starting this business?
        </Label>
        <div className="pt-4">
          <Slider
            value={[answers.commitmentLevel || 5]}
            onValueChange={(value) => updateAnswer("commitmentLevel", value[0])}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>1 - Just exploring</span>
            <span className="text-foreground font-semibold">
              {answers.commitmentLevel || 5}
            </span>
            <span>10 - Ready to start immediately</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          What is your timeline for opening your first group home?
        </Label>
        <RadioGroup
          value={answers.timeline}
          onValueChange={(value) => updateAnswer("timeline", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no-timeline" id="timeline1" />
            <Label htmlFor="timeline1" className="font-normal cursor-pointer">
              Just researching, no timeline yet
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="12-months" id="timeline2" />
            <Label htmlFor="timeline2" className="font-normal cursor-pointer">
              Within 12 months
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="6-months" id="timeline3" />
            <Label htmlFor="timeline3" className="font-normal cursor-pointer">
              Within 6 months
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3-months" id="timeline4" />
            <Label htmlFor="timeline4" className="font-normal cursor-pointer">
              Within 3 months
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="now" id="timeline5" />
            <Label htmlFor="timeline5" className="font-normal cursor-pointer">
              Ready to start now
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderFinancialReadiness();
      case 1:
        return renderStrategySelection();
      case 2:
        return renderMarketKnowledge();
      case 3:
        return renderOperationalReadiness();
      case 4:
        return renderMindsetCommitment();
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Group Home Readiness Assessment</h1>
          <p className="text-muted-foreground">
            Help us understand where you are so we can create your personalized roadmap
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {categories.map((category, index) => (
              <div
                key={index}
                className={`flex-1 text-center ${
                  index === currentStep ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                <div className="text-sm">{category.name}</div>
              </div>
            ))}
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{categories[currentStep].name}</CardTitle>
            <CardDescription>{categories[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || isSubmitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="min-w-[120px]"
                disabled={!isStepComplete() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : currentStep === 4 ? (
                  "Complete Assessment"
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssessmentPage;
