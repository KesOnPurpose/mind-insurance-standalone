import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Home, Search, BookOpen, TrendingUp, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UpdateStrategyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentData?: {
    ownershipModel?: string;
    targetState?: string;
    propertyStatus?: string;
    immediatePriority?: string;
  };
  onSuccess?: () => void;
}

export function UpdateStrategyModal({
  open,
  onOpenChange,
  currentData = {},
  onSuccess
}: UpdateStrategyModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    ownershipModel: currentData.ownershipModel || '',
    targetState: currentData.targetState || '',
    propertyStatus: currentData.propertyStatus || '',
    immediatePriority: currentData.immediatePriority || '',
  });

  // Auto-suggest immediate priority based on property status
  useEffect(() => {
    if (formData.propertyStatus && !formData.immediatePriority) {
      if (formData.propertyStatus === 'owned' || formData.propertyStatus === 'leasing') {
        setFormData(prev => ({ ...prev, immediatePriority: 'operations' }));
      } else if (formData.propertyStatus === 'not-started' || formData.propertyStatus === 'researching') {
        setFormData(prev => ({ ...prev, immediatePriority: 'property_acquisition' }));
      }
    }
  }, [formData.propertyStatus]);

  const canProceed = () => {
    if (step === 1) return !!formData.ownershipModel;
    if (step === 2) return !!formData.targetState;
    if (step === 3) return !!formData.propertyStatus;
    if (step === 4) return !!formData.immediatePriority;
    return false;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Calculate budget range (we'll need to fetch capital from existing data)
      const { data: existingData } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const budgetRanges: Record<string, { min: number; max: number }> = {
        'less-5k': { min: 0, max: 5000 },
        '5k-15k': { min: 5000, max: 15000 },
        '15k-30k': { min: 15000, max: 30000 },
        '30k-50k': { min: 30000, max: 50000 },
        'more-50k': { min: 50000, max: 100000 }
      };

      const budget = existingData?.capital_available
        ? budgetRanges[existingData.capital_available]
        : { min: 0, max: 50000 };

      // Calculate profile completeness dynamically based on ALL fields
      const fieldsToCheck = [
        formData.targetState,
        existingData?.business_name,
        existingData?.entity_type,
        existingData?.bed_count,
        formData.propertyStatus,
        existingData?.funding_source,
        existingData?.license_status,
        existingData?.service_model,
        existingData?.monthly_revenue_target,
      ];
      const filledCount = fieldsToCheck.filter(f => f !== null && f !== '' && f !== undefined).length;
      const profileCompleteness = Math.round((filledCount / 9) * 100);

      // Update user_onboarding with new strategy data
      const { error } = await supabase
        .from('user_onboarding')
        .update({
          ownership_model: formData.ownershipModel,
          target_state: formData.targetState,
          property_status: formData.propertyStatus,
          immediate_priority: formData.immediatePriority,
          budget_min_usd: budget.min,
          budget_max_usd: budget.max,
          // Recalculate profile completeness based on actual filled fields
          profile_completeness: profileCompleteness,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Strategy Profile Updated!',
        description: 'Your personalized roadmap will now reflect your current priorities.',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating strategy:', error);
      toast({
        title: 'Error',
        description: 'Failed to update your strategy profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              What ownership strategy aligns with your goals?
            </Label>
            <RadioGroup
              value={formData.ownershipModel}
              onValueChange={(value) => setFormData(prev => ({ ...prev, ownershipModel: value }))}
            >
              <div className="space-y-2">
                {[
                  { value: 'rental_arbitrage', label: 'Rental Arbitrage', desc: 'Lease & sublease - lower risk' },
                  { value: 'ownership', label: 'Property Ownership', desc: 'Buy properties - build equity' },
                  { value: 'creative_financing', label: 'Creative Financing', desc: 'Subject-to, seller financing' },
                  { value: 'house_hack', label: 'House Hacking', desc: 'Live in property while operating' },
                  { value: 'hybrid', label: 'Hybrid Approach', desc: 'Start with arbitrage, transition to ownership' },
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value={option.value} id={`strat-${option.value}`} />
                    <div className="flex-1">
                      <Label htmlFor={`strat-${option.value}`} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Which state will you operate in?
            </Label>
            <RadioGroup
              value={formData.targetState}
              onValueChange={(value) => setFormData(prev => ({ ...prev, targetState: value }))}
            >
              <div className="grid grid-cols-2 gap-2">
                {['CA', 'TX', 'FL', 'NY', 'GA', 'AZ', 'NC', 'PA', 'OH', 'OTHER'].map((state) => (
                  <div key={state} className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50">
                    <RadioGroupItem value={state} id={`state-${state}`} />
                    <Label htmlFor={`state-${state}`} className="font-normal cursor-pointer">
                      {state === 'OTHER' ? 'Other State' : state}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Where are you in your property journey?
            </Label>
            <RadioGroup
              value={formData.propertyStatus}
              onValueChange={(value) => setFormData(prev => ({ ...prev, propertyStatus: value }))}
            >
              <div className="space-y-2">
                {[
                  { value: 'not-started', label: "Haven't started looking", icon: Search },
                  { value: 'researching', label: 'Researching areas/options', icon: BookOpen },
                  { value: 'searching', label: 'Actively searching', icon: Search },
                  { value: 'offer-pending', label: 'Made an offer / Negotiating', icon: BookOpen },
                  { value: 'under-contract', label: 'Under contract', icon: BookOpen },
                  { value: 'owned', label: 'I own a property', icon: Home },
                  { value: 'leasing', label: "I'm leasing a property", icon: Home },
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value={option.value} id={`prop-${option.value}`} />
                    <option.icon className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor={`prop-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              What's your immediate focus right now?
            </Label>
            <p className="text-sm text-muted-foreground">
              We'll prioritize tactics based on this (you can change anytime)
            </p>
            <RadioGroup
              value={formData.immediatePriority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, immediatePriority: value }))}
            >
              <div className="space-y-3">
                {[
                  {
                    value: 'property_acquisition',
                    label: 'Finding & Acquiring Property',
                    desc: 'Property search, negotiations, landlord outreach',
                    icon: Search,
                    color: 'text-amber-500'
                  },
                  {
                    value: 'operations',
                    label: 'Operating My Property',
                    desc: 'Licensing, setup, staffing, first residents',
                    icon: Home,
                    color: 'text-green-600'
                  },
                  {
                    value: 'comprehensive',
                    label: 'Learning All Strategies',
                    desc: 'See all tactics in order - thorough preparation',
                    icon: BookOpen,
                    color: 'text-blue-500'
                  },
                  {
                    value: 'scaling',
                    label: 'Scaling My Operation',
                    desc: 'Adding properties, optimizing revenue, building systems',
                    icon: TrendingUp,
                    color: 'text-purple-600'
                  },
                ].map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value={option.value} id={`priority-${option.value}`} className="mt-1" />
                    <option.icon className={`w-6 h-6 ${option.color} mt-0.5`} />
                    <div className="flex-1">
                      <Label htmlFor={`priority-${option.value}`} className="font-semibold cursor-pointer block">
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Complete Your Strategy Profile
          </DialogTitle>
          <DialogDescription>
            Step {step} of 4 - Help us personalize your journey
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Progress indicator */}
          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          {renderStep()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : step === 4 ? (
              'Save & Personalize'
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
