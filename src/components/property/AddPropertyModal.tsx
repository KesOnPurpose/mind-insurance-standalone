// ============================================================================
// ADD PROPERTY MODAL COMPONENT
// ============================================================================
// Multi-step wizard for creating new properties
// ============================================================================

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  MapPin,
  DollarSign,
  BedDouble,
  ChevronRight,
  ChevronLeft,
  Check,
  Info,
} from 'lucide-react';
import type { CreatePropertyInput, PropertyType, OwnershipModel, PropertyAmenity } from '@/types/property';
import type { StateCode } from '@/types/compliance';
import { PROPERTY_TYPE_LABELS, OWNERSHIP_MODEL_LABELS, AMENITY_LABELS } from '@/types/property';
import { US_STATES } from '@/types/compliance';
import { cn } from '@/lib/utils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AddPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePropertyInput) => Promise<void>;
  isLoading?: boolean;
  defaultState?: StateCode;
}

interface StepProps {
  data: Partial<CreatePropertyInput>;
  onChange: (field: keyof CreatePropertyInput, value: unknown) => void;
  errors: Record<string, string>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STEPS = [
  { id: 'basics', title: 'Basic Info', icon: Building2 },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'ownership', title: 'Ownership', icon: DollarSign },
  { id: 'configuration', title: 'Configuration', icon: BedDouble },
];

const AMENITY_OPTIONS: PropertyAmenity[] = [
  'washer_dryer',
  'parking',
  'central_ac',
  'heating',
  'accessible',
  'wheelchair_ramp',
  'security_system',
  'fenced_yard',
  'garage',
  'furnished',
  'wifi',
];

// ============================================================================
// STEP COMPONENTS
// ============================================================================

function BasicsStep({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nickname">Property Nickname *</Label>
        <Input
          id="nickname"
          value={data.nickname || ''}
          onChange={(e) => onChange('nickname', e.target.value)}
          placeholder="e.g., The Oak House"
          className={errors.nickname ? 'border-red-500' : ''}
        />
        {errors.nickname && (
          <p className="text-sm text-red-500">{errors.nickname}</p>
        )}
        <p className="text-xs text-muted-foreground">
          A friendly name to identify this property
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="property_type">Property Type</Label>
        <Select
          value={data.property_type || ''}
          onValueChange={(value) => onChange('property_type', value as PropertyType)}
        >
          <SelectTrigger id="property_type">
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="square_footage">Square Footage</Label>
          <Input
            id="square_footage"
            type="number"
            value={data.square_footage || ''}
            onChange={(e) => onChange('square_footage', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 2400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year_built">Year Built</Label>
          <Input
            id="year_built"
            type="number"
            value={data.year_built || ''}
            onChange={(e) => onChange('year_built', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 1985"
          />
        </div>
      </div>
    </div>
  );
}

function LocationStep({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address_line1">Street Address</Label>
        <Input
          id="address_line1"
          value={data.address_line1 || ''}
          onChange={(e) => onChange('address_line1', e.target.value)}
          placeholder="123 Main Street"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line2">Apt/Unit/Suite</Label>
        <Input
          id="address_line2"
          value={data.address_line2 || ''}
          onChange={(e) => onChange('address_line2', e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={data.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Houston"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state_code">State *</Label>
          <Select
            value={data.state_code || ''}
            onValueChange={(value) => onChange('state_code', value as StateCode)}
          >
            <SelectTrigger id="state_code" className={errors.state_code ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.name} ({state.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state_code && (
            <p className="text-sm text-red-500">{errors.state_code}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zip_code">ZIP Code</Label>
        <Input
          id="zip_code"
          value={data.zip_code || ''}
          onChange={(e) => onChange('zip_code', e.target.value)}
          placeholder="77001"
          className="w-32"
        />
      </div>
    </div>
  );
}

function OwnershipStep({ data, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ownership_model">Ownership Model</Label>
        <Select
          value={data.ownership_model || ''}
          onValueChange={(value) => onChange('ownership_model', value as OwnershipModel)}
        >
          <SelectTrigger id="ownership_model">
            <SelectValue placeholder="Select ownership model" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(OWNERSHIP_MODEL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          How you acquired or manage this property
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthly_rent_or_mortgage">Monthly Rent/Mortgage ($)</Label>
        <Input
          id="monthly_rent_or_mortgage"
          type="number"
          value={data.monthly_rent_or_mortgage || ''}
          onChange={(e) => onChange('monthly_rent_or_mortgage', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="2000"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchase_price">Purchase Price ($)</Label>
          <Input
            id="purchase_price"
            type="number"
            value={data.purchase_price || ''}
            onChange={(e) => onChange('purchase_price', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="down_payment">Down Payment ($)</Label>
          <Input
            id="down_payment"
            type="number"
            value={data.down_payment || ''}
            onChange={(e) => onChange('down_payment', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="acquisition_date">Acquisition Date</Label>
          <Input
            id="acquisition_date"
            type="date"
            value={data.acquisition_date || ''}
            onChange={(e) => onChange('acquisition_date', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="operating_since">Operating Since</Label>
          <Input
            id="operating_since"
            type="date"
            value={data.operating_since || ''}
            onChange={(e) => onChange('operating_since', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function ConfigurationStep({ data, onChange, errors }: StepProps) {
  const amenities = (data.amenities || []) as PropertyAmenity[];

  const toggleAmenity = (amenity: PropertyAmenity) => {
    if (amenities.includes(amenity)) {
      onChange('amenities', amenities.filter(a => a !== amenity));
    } else {
      onChange('amenities', [...amenities, amenity]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="configured_beds">Number of Beds *</Label>
          <Input
            id="configured_beds"
            type="number"
            min="1"
            max="20"
            value={data.configured_beds || ''}
            onChange={(e) => onChange('configured_beds', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="6"
            className={errors.configured_beds ? 'border-red-500' : ''}
          />
          {errors.configured_beds && (
            <p className="text-sm text-red-500">{errors.configured_beds}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_rate_per_bed">Rate per Bed ($)</Label>
          <Input
            id="default_rate_per_bed"
            type="number"
            value={data.default_rate_per_bed ?? ''}
            onChange={(e) => onChange('default_rate_per_bed', e.target.value ? parseInt(e.target.value) : 0)}
            placeholder="907"
          />
          <p className="text-xs text-muted-foreground">Default: $907 (SSI max)</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_occupancy_percent">Target Occupancy (%)</Label>
        <Input
          id="target_occupancy_percent"
          type="number"
          min="0"
          max="100"
          value={data.target_occupancy_percent || 90}
          onChange={(e) => onChange('target_occupancy_percent', e.target.value ? parseInt(e.target.value) : 90)}
          placeholder="90"
          className="w-24"
        />
      </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
          {AMENITY_OPTIONS.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={amenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <label
                htmlFor={amenity}
                className="text-sm cursor-pointer"
              >
                {AMENITY_LABELS[amenity]}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Room Customization Tip */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Room Customization Available
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              After adding your property, visit the Rooms tab to configure
              individual room features (private bath, separate entry, etc.)
              and set custom rates for each room.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AddPropertyModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  defaultState,
}: AddPropertyModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Partial<CreatePropertyInput>>({
    state_code: defaultState,
    configured_beds: 6,
    default_rate_per_bed: 907,
    target_occupancy_percent: 90,
    amenities: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CreatePropertyInput, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!data.nickname?.trim()) {
        newErrors.nickname = 'Property name is required';
      }
    }

    if (step === 1) {
      if (!data.state_code) {
        newErrors.state_code = 'State is required';
      }
    }

    if (step === 3) {
      if (!data.configured_beds || data.configured_beds < 1) {
        newErrors.configured_beds = 'At least 1 bed is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    // Final validation
    if (!data.nickname || !data.state_code) {
      return;
    }

    await onSubmit({
      nickname: data.nickname,
      state_code: data.state_code,
      address_line1: data.address_line1,
      address_line2: data.address_line2,
      city: data.city,
      zip_code: data.zip_code,
      property_type: data.property_type,
      square_footage: data.square_footage,
      year_built: data.year_built,
      ownership_model: data.ownership_model,
      monthly_rent_or_mortgage: data.monthly_rent_or_mortgage,
      purchase_price: data.purchase_price,
      down_payment: data.down_payment,
      acquisition_date: data.acquisition_date,
      operating_since: data.operating_since,
      amenities: data.amenities,
      configured_beds: data.configured_beds,
      default_rate_per_bed: data.default_rate_per_bed || 907,
      target_occupancy_percent: data.target_occupancy_percent,
    });

    // Reset form
    setData({
      state_code: defaultState,
      configured_beds: 6,
      default_rate_per_bed: 907,
      target_occupancy_percent: 90,
      amenities: [],
    });
    setCurrentStep(0);
    setErrors({});
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form when closing
      setData({
        state_code: defaultState,
        configured_beds: 6,
        default_rate_per_bed: 907,
        target_occupancy_percent: 90,
        amenities: [],
      });
      setCurrentStep(0);
      setErrors({});
    }
    onOpenChange(isOpen);
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStep = () => {
    const stepProps: StepProps = { data, onChange: handleChange, errors };

    switch (currentStep) {
      case 0:
        return <BasicsStep {...stepProps} />;
      case 1:
        return <LocationStep {...stepProps} />;
      case 2:
        return <OwnershipStep {...stepProps} />;
      case 3:
        return <ConfigurationStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-1" />
          <div className="flex justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-4 min-h-[300px]">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={isLoading}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Property'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddPropertyModal;
