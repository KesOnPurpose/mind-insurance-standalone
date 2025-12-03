import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AssessmentAnswers } from '@/types/assessment';

interface MarketKnowledgeStepProps {
  answers: Partial<AssessmentAnswers>;
  updateAnswer: (field: keyof AssessmentAnswers, value: any) => void;
  toggleArrayItem: (field: keyof AssessmentAnswers, value: string) => void;
}

export const MarketKnowledgeStep = ({ answers, updateAnswer, toggleArrayItem }: MarketKnowledgeStepProps) => {
  return (
    <div className="space-y-8">
      {/* Licensing Familiarity */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How familiar are you with housing regulations for group homes in your state?
        </Label>
        <RadioGroup
          value={answers.licensingFamiliarity}
          onValueChange={(value) => updateAnswer('licensingFamiliarity', value)}
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
              Already operating or in setup process
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Target Populations */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Do you know which populations you want to serve?
        </Label>
        <p className="text-sm text-muted-foreground">(Select all that apply)</p>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop1"
              checked={answers.targetPopulations?.includes('developmental-disabilities')}
              onCheckedChange={() => toggleArrayItem('targetPopulations', 'developmental-disabilities')}
            />
            <Label htmlFor="pop1" className="font-normal cursor-pointer">
              Adults with developmental disabilities
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop2"
              checked={answers.targetPopulations?.includes('seniors')}
              onCheckedChange={() => toggleArrayItem('targetPopulations', 'seniors')}
            />
            <Label htmlFor="pop2" className="font-normal cursor-pointer">
              Seniors/Elderly housing
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop3"
              checked={answers.targetPopulations?.includes('mental-health')}
              onCheckedChange={() => toggleArrayItem('targetPopulations', 'mental-health')}
            />
            <Label htmlFor="pop3" className="font-normal cursor-pointer">
              Mental health populations
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop4"
              checked={answers.targetPopulations?.includes('at-risk-youth')}
              onCheckedChange={() => toggleArrayItem('targetPopulations', 'at-risk-youth')}
            />
            <Label htmlFor="pop4" className="font-normal cursor-pointer">
              At-risk youth
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop5"
              checked={answers.targetPopulations?.includes('substance-abuse')}
              onCheckedChange={() => toggleArrayItem('targetPopulations', 'substance-abuse')}
            />
            <Label htmlFor="pop5" className="font-normal cursor-pointer">
              Substance abuse recovery
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop6"
              checked={answers.targetPopulations?.includes('veterans')}
              onCheckedChange={() => toggleArrayItem('targetPopulations', 'veterans')}
            />
            <Label htmlFor="pop6" className="font-normal cursor-pointer">
              Veterans
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop7"
              checked={answers.targetPopulations?.includes('reentry')}
              onCheckedChange={() => toggleArrayItem('targetPopulations', 'reentry')}
            />
            <Label htmlFor="pop7" className="font-normal cursor-pointer">
              Reentry/Returning citizens
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pop8"
              checked={answers.targetPopulations?.includes('not-sure')}
              onCheckedChange={() => toggleArrayItem('targetPopulations', 'not-sure')}
            />
            <Label htmlFor="pop8" className="font-normal cursor-pointer">
              Not sure yet
            </Label>
          </div>
        </div>
      </div>

      {/* Market Research */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Have you researched the demand for group homes in your target area?
        </Label>
        <RadioGroup
          value={answers.marketResearch}
          onValueChange={(value) => updateAnswer('marketResearch', value)}
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

      {/* Reimbursement Rate */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          How much do group homes in your area typically receive per resident per month?
        </Label>
        <RadioGroup
          value={answers.reimbursementRate}
          onValueChange={(value) => updateAnswer('reimbursementRate', value)}
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
};