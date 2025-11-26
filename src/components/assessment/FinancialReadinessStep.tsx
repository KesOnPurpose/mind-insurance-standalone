import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AssessmentAnswers } from '@/types/assessment';

interface FinancialReadinessStepProps {
  answers: Partial<AssessmentAnswers>;
  updateAnswer: (field: keyof AssessmentAnswers, value: any) => void;
}

export const FinancialReadinessStep = ({ answers, updateAnswer }: FinancialReadinessStepProps) => {
  return (
    <div className="space-y-8">
      {/* Capital Question */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How much capital do you have available to invest in your first group home?
        </Label>
        <RadioGroup
          value={answers.capital}
          onValueChange={(value) => updateAnswer('capital', value)}
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

      {/* Credit Score Question */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">What is your current credit score?</Label>
        <RadioGroup
          value={answers.creditScore}
          onValueChange={(value) => updateAnswer('creditScore', value)}
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

      {/* Income Stability Question */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">How stable is your current income?</Label>
        <RadioGroup
          value={answers.incomeStability}
          onValueChange={(value) => updateAnswer('incomeStability', value)}
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

      {/* Creative Financing Question */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Are you familiar with creative financing strategies?
        </Label>
        <p className="text-sm text-muted-foreground">
          (seller financing, subject-to, lease options)
        </p>
        <RadioGroup
          value={answers.creativeFinancing}
          onValueChange={(value) => updateAnswer('creativeFinancing', value)}
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
};