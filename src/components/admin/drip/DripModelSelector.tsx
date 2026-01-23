// ============================================================================
// FEAT-GH-017: Drip Model Selector Component
// ============================================================================
// Radio button group for selecting drip model: Calendar/Relative/Progress/Hybrid
// ============================================================================

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, TrendingUp, Layers } from 'lucide-react';
import type { DripModel } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface DripModelSelectorProps {
  value: DripModel;
  onChange: (model: DripModel) => void;
  disabled?: boolean;
}

interface DripModelOption {
  value: DripModel;
  label: string;
  description: string;
  icon: React.ReactNode;
}

// ============================================================================
// Drip Model Options
// ============================================================================

const DRIP_MODEL_OPTIONS: DripModelOption[] = [
  {
    value: 'calendar',
    label: 'Calendar-Based',
    description: 'Phases unlock on specific dates and times. Ideal for live cohorts with fixed schedules.',
    icon: <Calendar className="h-5 w-5 text-blue-500" />,
  },
  {
    value: 'relative',
    label: 'Relative Days',
    description: 'Phases unlock X days after enrollment. Good for self-paced cohort courses.',
    icon: <Clock className="h-5 w-5 text-amber-500" />,
  },
  {
    value: 'progress',
    label: 'Progress-Based',
    description: 'Phases unlock when the previous phase is completed. Best for sequential learning.',
    icon: <TrendingUp className="h-5 w-5 text-green-500" />,
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    description: 'Combine time-based unlocks with progress requirements for maximum flexibility.',
    icon: <Layers className="h-5 w-5 text-purple-500" />,
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const DripModelSelector = ({
  value,
  onChange,
  disabled = false,
}: DripModelSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Control Model</CardTitle>
        <CardDescription>
          Choose how learners gain access to program phases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={value}
          onValueChange={(v) => onChange(v as DripModel)}
          className="space-y-3"
          disabled={disabled}
        >
          {DRIP_MODEL_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`
                flex items-start gap-4 p-4 border rounded-lg cursor-pointer
                transition-all duration-200 hover:bg-muted/50
                ${value === option.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-muted-foreground/30'
                }
                ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
              `}
            >
              <RadioGroupItem
                value={option.value}
                className="mt-1"
                disabled={disabled}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default DripModelSelector;
