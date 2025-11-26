import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AssessmentAnswers } from '@/types/assessment';
import {
  Search, Home, BookOpen, FileText, TrendingUp
} from 'lucide-react';

interface StrategySelectionStepProps {
  answers: Partial<AssessmentAnswers>;
  updateAnswer: (field: keyof AssessmentAnswers, value: any) => void;
}

export const StrategySelectionStep = ({ answers, updateAnswer }: StrategySelectionStepProps) => {
  // Auto-suggest immediate priority based on property status
  useEffect(() => {
    if (answers.propertyStatus && !answers.immediatePriority) {
      if (answers.propertyStatus === 'owned' || answers.propertyStatus === 'leasing') {
        updateAnswer('immediatePriority', 'operations');
      } else if (answers.propertyStatus === 'not-started' || answers.propertyStatus === 'researching') {
        updateAnswer('immediatePriority', 'property_acquisition');
      }
    }
  }, [answers.propertyStatus, answers.immediatePriority, updateAnswer]);

  return (
    <div className="space-y-8">
      {/* Ownership Strategy */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          What ownership strategy aligns best with your goals?
        </Label>
        <p className="text-sm text-muted-foreground">
          This determines which tactics and costs we'll prioritize for your roadmap
        </p>
        <RadioGroup
          value={answers.ownershipModel}
          onValueChange={(value) => updateAnswer('ownershipModel', value)}
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

      {/* Target State */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Which state will you operate in?
        </Label>
        <p className="text-sm text-muted-foreground">
          Regulations and reimbursement rates vary significantly by state
        </p>
        <RadioGroup
          value={answers.targetState}
          onValueChange={(value) => updateAnswer('targetState', value)}
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

      {/* Property Status */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Where are you in your property journey?
        </Label>
        <p className="text-sm text-muted-foreground">
          This helps us prioritize the right tactics for your current situation
        </p>
        <RadioGroup
          value={answers.propertyStatus}
          onValueChange={(value) => updateAnswer('propertyStatus', value)}
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

      {/* Immediate Priority */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          What's your immediate focus right now?
        </Label>
        <p className="text-sm text-muted-foreground">
          We'll prioritize tactics based on your current needs (you can change this anytime)
        </p>
        <RadioGroup
          value={answers.immediatePriority}
          onValueChange={(value) => updateAnswer('immediatePriority', value)}
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
};