import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { AssessmentAnswers } from '@/types/assessment';

interface MindsetCommitmentStepProps {
  answers: Partial<AssessmentAnswers>;
  updateAnswer: (field: keyof AssessmentAnswers, value: any) => void;
}

export const MindsetCommitmentStep = ({ answers, updateAnswer }: MindsetCommitmentStepProps) => {
  return (
    <div className="space-y-8">
      {/* Primary Motivation */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          What is your primary motivation for starting a group home?
        </Label>
        <RadioGroup
          value={answers.primaryMotivation}
          onValueChange={(value) => updateAnswer('primaryMotivation', value)}
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
              Provide housing for a specific population I'm passionate about
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

      {/* Commitment Level */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How would you rate your commitment level to starting this business?
        </Label>
        <div className="pt-4">
          <Slider
            value={[answers.commitmentLevel || 5]}
            onValueChange={(value) => updateAnswer('commitmentLevel', value[0])}
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

      {/* Timeline */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          What is your timeline for opening your first group home?
        </Label>
        <RadioGroup
          value={answers.timeline}
          onValueChange={(value) => updateAnswer('timeline', value)}
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
};