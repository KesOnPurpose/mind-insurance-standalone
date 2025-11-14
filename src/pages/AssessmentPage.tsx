import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { AssessmentAnswers } from "@/types/assessment";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<AssessmentAnswers>>({
    targetPopulations: [],
    supportTeam: [],
    propertyManagement: 5,
    commitmentLevel: 5,
  });

  const categories = [
    {
      name: "Financial Readiness",
      description: "Let's understand your financial situation",
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

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate results and navigate to dashboard
      navigate("/dashboard");
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
            <RadioGroupItem value="volunteer" id="exp2" />
            <Label htmlFor="exp2" className="font-normal cursor-pointer">
              Some volunteer experience
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1-3-years" id="exp3" />
            <Label htmlFor="exp3" className="font-normal cursor-pointer">
              1-3 years professional experience
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3-5-years" id="exp4" />
            <Label htmlFor="exp4" className="font-normal cursor-pointer">
              3-5 years professional experience
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="5+-years" id="exp5" />
            <Label htmlFor="exp5" className="font-normal cursor-pointer">
              More than 5 years professional experience
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
        return renderMarketKnowledge();
      case 2:
        return renderOperationalReadiness();
      case 3:
        return renderMindsetCommitment();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
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
              style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
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
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} className="min-w-[120px]">
                {currentStep === 3 ? "Complete" : "Next"}
                {currentStep !== 3 && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssessmentPage;
