import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { AssessmentAnswers } from '@/types/assessment';

interface OperationalReadinessStepProps {
  answers: Partial<AssessmentAnswers>;
  updateAnswer: (field: keyof AssessmentAnswers, value: any) => void;
  toggleArrayItem: (field: keyof AssessmentAnswers, value: string) => void;
}

export const OperationalReadinessStep = ({
  answers,
  updateAnswer,
  toggleArrayItem
}: OperationalReadinessStepProps) => {
  return (
    <div className="space-y-8">
      {/* Caregiving Experience */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Do you have experience in caregiving, healthcare, or social services?
        </Label>
        <RadioGroup
          value={answers.caregivingExperience}
          onValueChange={(value) => updateAnswer('caregivingExperience', value)}
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

      {/* Time Commitment */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How much time can you dedicate to your group home business?
        </Label>
        <RadioGroup
          value={answers.timeCommitment}
          onValueChange={(value) => updateAnswer('timeCommitment', value)}
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

      {/* Support Team */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Do you have a support team or plan to hire staff?
        </Label>
        <p className="text-sm text-muted-foreground">(Select all that apply)</p>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team1"
              checked={answers.supportTeam?.includes('primary-caregiver')}
              onCheckedChange={() => toggleArrayItem('supportTeam', 'primary-caregiver')}
            />
            <Label htmlFor="team1" className="font-normal cursor-pointer">
              I plan to be the primary caregiver
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team2"
              checked={answers.supportTeam?.includes('family-help')}
              onCheckedChange={() => toggleArrayItem('supportTeam', 'family-help')}
            />
            <Label htmlFor="team2" className="font-normal cursor-pointer">
              I have family members who can help
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team3"
              checked={answers.supportTeam?.includes('hire-caregivers')}
              onCheckedChange={() => toggleArrayItem('supportTeam', 'hire-caregivers')}
            />
            <Label htmlFor="team3" className="font-normal cursor-pointer">
              I plan to hire professional caregivers
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team4"
              checked={answers.supportTeam?.includes('business-partner')}
              onCheckedChange={() => toggleArrayItem('supportTeam', 'business-partner')}
            />
            <Label htmlFor="team4" className="font-normal cursor-pointer">
              I have a business partner
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team5"
              checked={answers.supportTeam?.includes('hire-manager')}
              onCheckedChange={() => toggleArrayItem('supportTeam', 'hire-manager')}
            />
            <Label htmlFor="team5" className="font-normal cursor-pointer">
              I plan to hire a manager
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="team6"
              checked={answers.supportTeam?.includes('not-sure')}
              onCheckedChange={() => toggleArrayItem('supportTeam', 'not-sure')}
            />
            <Label htmlFor="team6" className="font-normal cursor-pointer">
              Not sure yet
            </Label>
          </div>
        </div>
      </div>

      {/* Property Management Comfort */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How comfortable are you with managing a property and handling maintenance issues?
        </Label>
        <div className="pt-4">
          <Slider
            value={[answers.propertyManagement || 5]}
            onValueChange={(value) => updateAnswer('propertyManagement', value[0])}
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
};