import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building2, Info, AlertCircle, Sparkles, ChevronDown } from 'lucide-react';
import { TacticQuestion, BusinessProfile, AssessmentAnswers } from '@/types/assessment';
import { getQuestionsForTactic } from '@/config/tacticQuestions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Keywords for identifying critical steps
const CRITICAL_KEYWORDS = [
  'create', 'design', 'develop', 'build', 'write', 'draft', 'prepare',
  'document', 'establish', 'set up', 'configure', 'research', 'analyze',
  'contact', 'schedule', 'meet', 'interview', 'present', 'submit',
  'gather', 'compile', 'organize', 'file', 'register', 'apply'
];

const TRIVIAL_KEYWORDS = [
  'purchase', 'buy', 'download', 'print', 'practice', 'review', 'read',
  'watch', 'listen', 'check', 'verify'
];

/**
 * Identifies 2-3 most critical steps that require deliverables
 */
function identifyCriticalSteps(steps: any[]): number[] {
  if (!Array.isArray(steps) || steps.length === 0) return [];

  const scoredSteps = steps.map((step, index) => {
    const stepText = typeof step === 'string' ? step : step.step || '';
    const stepLower = stepText.toLowerCase();

    let score = 0;

    // Add points for critical keywords
    CRITICAL_KEYWORDS.forEach(keyword => {
      if (stepLower.includes(keyword)) score += 2;
    });

    // Subtract points for trivial keywords
    TRIVIAL_KEYWORDS.forEach(keyword => {
      if (stepLower.includes(keyword)) score -= 1;
    });

    // Longer steps are more likely to be important
    if (stepText.length > 100) score += 1;

    // Steps with specific deliverables
    if (stepLower.match(/\b(form|plan|document|list|spreadsheet|agreement|contract|policy)\b/)) {
      score += 1;
    }

    return { index, score, stepText };
  });

  // Sort by score descending, take top 2-3
  const topCount = Math.min(3, steps.length);
  const criticalSteps = scoredSteps
    .sort((a, b) => b.score - a.score)
    .slice(0, topCount)
    .map(s => s.index)
    .sort((a, b) => a - b); // Restore original order

  return criticalSteps;
}

/**
 * Get contextual help text for a step based on keywords
 */
function getStepHelpText(stepText: string): string | null {
  const lower = stepText.toLowerCase();

  // Specific tactic patterns
  if (lower.includes('binder') && lower.includes('compliance')) {
    return "Include what documents you organized and where the binder is located";
  }
  if (lower.includes('llc') || lower.includes('ein')) {
    return "Include the business name, state filed, and EIN if obtained";
  }
  if (lower.includes('profit') && lower.includes('formula')) {
    return "Show your calculation with actual numbers (beds, expenses, target profit)";
  }
  if (lower.includes('research') && (lower.includes('market') || lower.includes('competitive'))) {
    return "Note the properties you researched and average rates you found";
  }
  if (lower.includes('contact') || lower.includes('referral')) {
    return "List agencies contacted, names of contacts, and next steps agreed upon";
  }
  if (lower.includes('pricing') || lower.includes('rate')) {
    return "Include your final rate and how you validated it against SSI/market rates";
  }

  // Generic patterns
  if (lower.includes('document') || lower.includes('write')) {
    return "What did you document and where is it stored?";
  }
  if (lower.includes('create') && lower.includes('plan')) {
    return "Summarize the key components of your plan";
  }

  return null;
}

/**
 * Get smart placeholder text based on step action verbs
 */
function getStepPlaceholder(stepText: string): string {
  const lower = stepText.toLowerCase();

  // Action-specific placeholders
  if (lower.includes('create') || lower.includes('build') || lower.includes('develop')) {
    return "Describe what you created and where you saved it...";
  }
  if (lower.includes('research') || lower.includes('analyze')) {
    return "Summarize your key findings and sources...";
  }
  if (lower.includes('contact') || lower.includes('schedule') || lower.includes('meet')) {
    return "Who did you contact and what was the outcome?";
  }
  if (lower.includes('document') || lower.includes('write')) {
    return "What did you document and where is it stored?";
  }
  if (lower.includes('gather') || lower.includes('compile')) {
    return "List what you gathered and how you organized it...";
  }
  if (lower.includes('calculate') || lower.includes('formula')) {
    return "Show your calculation with numbers (e.g., $4,000 profit + $3,500 expenses ÷ 8 beds = $938/bed)...";
  }
  if (lower.includes('file') || lower.includes('register') || lower.includes('apply')) {
    return "What did you file, where, and what was the confirmation/tracking number?";
  }

  return "Describe what you did...";
}

interface TacticCompletionFormProps {
  isOpen: boolean;
  onClose: () => void;
  tacticName: string;
  tacticCategory: string;
  tacticSteps?: any[];  // The step_by_step array from the tactic
  onComplete: (profileUpdates: Partial<BusinessProfile>, notes: string) => void;
}

interface FieldState {
  value: unknown;
  otherValue?: string; // For "Other" option custom text
  skipped?: boolean; // For skip checkbox
}

export function TacticCompletionForm({
  isOpen,
  onClose,
  tacticName,
  tacticCategory,
  tacticSteps = [],
  onComplete,
}: TacticCompletionFormProps) {
  const { user } = useAuth();
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [notes, setNotes] = useState('');
  const [stepResponses, setStepResponses] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentData, setAssessmentData] = useState<Partial<AssessmentAnswers>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [stepValidationErrors, setStepValidationErrors] = useState<Record<number, string>>({});
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false);

  const questions = getQuestionsForTactic(tacticName, tacticCategory);
  const hasSteps = Array.isArray(tacticSteps) && tacticSteps.length > 0;

  // Load assessment data on mount for pre-filling
  useEffect(() => {
    if (isOpen && user) {
      loadAssessmentData();
    }
  }, [isOpen, user]);

  // Pre-fill fields from assessment when questions and assessment data are available
  useEffect(() => {
    if (questions.length > 0 && Object.keys(assessmentData).length > 0) {
      prefillFromAssessment();
    }
  }, [questions, assessmentData]);

  const loadAssessmentData = async () => {
    if (!user) return;
    setIsLoadingAssessment(true);
    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('target_state, property_status, ownership_model, immediate_priority, capital_available')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        // Map database fields to assessment answer format
        setAssessmentData({
          targetState: data.target_state || '',
          propertyStatus: data.property_status || '',
          ownershipModel: data.ownership_model || '',
          immediatePriority: data.immediate_priority || '',
          capital: data.capital_available || '',
        });
      }
    } catch (err) {
      console.error('Error loading assessment data:', err);
    } finally {
      setIsLoadingAssessment(false);
    }
  };

  const prefillFromAssessment = () => {
    const newFieldStates: Record<string, FieldState> = { ...fieldStates };

    questions.forEach((question) => {
      // Only prefill if not already filled and has prefill mapping
      if (question.prefillFromAssessment && assessmentData[question.prefillFromAssessment]) {
        const prefillValue = assessmentData[question.prefillFromAssessment];
        if (prefillValue && !newFieldStates[question.fieldName]?.value) {
          newFieldStates[question.fieldName] = {
            value: prefillValue,
            skipped: false,
          };
        }
      }
    });

    if (Object.keys(newFieldStates).length > 0) {
      setFieldStates(newFieldStates);
    }
  };

  const handleInputChange = (fieldName: keyof BusinessProfile, value: unknown) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        skipped: false, // Clear skip if user enters value
      },
    }));
    // Clear validation error when user starts typing
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleOtherValueChange = (fieldName: keyof BusinessProfile, otherValue: string) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        otherValue,
      },
    }));
  };

  const handleSkipChange = (fieldName: keyof BusinessProfile, skipped: boolean) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        skipped,
        value: skipped ? '' : prev[fieldName]?.value, // Clear value if skipping
      },
    }));
    // Clear validation error if skipping
    if (skipped && validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    const stepErrors: Record<number, string> = {};

    // Step responses are now optional - no validation required

    questions.forEach((question) => {
      const state = fieldStates[question.fieldName];
      const requirementLevel = question.requirementLevel || 'optional';

      // Only validate required fields
      if (requirementLevel === 'required') {
        const value = state?.value;
        const isSkipped = state?.skipped;

        // If skipped, that's OK (skip option allows bypass)
        if (!isSkipped && (!value || value === '' || value === 0)) {
          errors[question.fieldName] = 'Please complete this field or use the skip option';
        }

        // If "Other" is selected, ensure custom value is provided
        if (value === 'other' && question.allowOther && !state?.otherValue) {
          errors[question.fieldName] = 'Please specify your custom answer';
        }
      }

      // Validate number ranges if provided
      if (question.inputType === 'number' && state?.value && question.validation) {
        const numValue = state.value as number;
        if (question.validation.min !== undefined && numValue < question.validation.min) {
          errors[question.fieldName] = question.validation.message || `Value must be at least ${question.validation.min}`;
        }
        if (question.validation.max !== undefined && numValue > question.validation.max) {
          errors[question.fieldName] = question.validation.message || `Value must be at most ${question.validation.max}`;
        }
      }
    });

    setValidationErrors(errors);
    setStepValidationErrors(stepErrors);
    return Object.keys(errors).length === 0 && Object.keys(stepErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate before submitting
    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Build profile updates from field states
      const profileUpdates: Partial<BusinessProfile> = {};

      questions.forEach((question) => {
        const state = fieldStates[question.fieldName];
        if (state && !state.skipped) {
          let finalValue = state.value;

          // If "Other" is selected and custom value provided, use that
          if (state.value === 'other' && state.otherValue) {
            finalValue = state.otherValue;
          }

          if (finalValue !== undefined && finalValue !== '' && finalValue !== null) {
            // @ts-ignore - Dynamic field assignment
            profileUpdates[question.fieldName] = finalValue;
          }
        }
      });

      // Build comprehensive notes including step responses
      let completionNotes = '';

      if (hasSteps && Object.keys(stepResponses).length > 0) {
        completionNotes += '=== STEP-BY-STEP COMPLETION ===\n\n';
        tacticSteps.forEach((step, index) => {
          const stepText = typeof step === 'string' ? step : step.step || `Step ${index + 1}`;
          const response = stepResponses[index] || '';
          completionNotes += `Step ${index + 1}: ${stepText}\n`;
          completionNotes += `Response: ${response}\n\n`;
        });
      }

      if (notes.trim()) {
        completionNotes += '=== ADDITIONAL NOTES ===\n' + notes;
      }

      await onComplete(profileUpdates, completionNotes);

      // Reset form state
      setFieldStates({});
      setNotes('');
      setStepResponses({});
      setValidationErrors({});
      setStepValidationErrors({});
      onClose();
    } catch (error) {
      console.error('Error completing tactic:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRequirementBadge = (question: TacticQuestion) => {
    const level = question.requirementLevel || 'optional';

    switch (level) {
      case 'required':
        return (
          <Badge variant="destructive" className="text-xs ml-2">
            Required
          </Badge>
        );
      case 'recommended':
        return (
          <Badge variant="secondary" className="text-xs ml-2 bg-amber-100 text-amber-800 border-amber-200">
            Recommended
          </Badge>
        );
      default:
        return null;
    }
  };

  const isPrefilled = (question: TacticQuestion) => {
    if (!question.prefillFromAssessment) return false;
    const assessmentValue = assessmentData[question.prefillFromAssessment];
    const currentValue = fieldStates[question.fieldName]?.value;
    return assessmentValue && currentValue === assessmentValue;
  };

  const renderInput = (question: TacticQuestion) => {
    const state = fieldStates[question.fieldName] || { value: undefined, skipped: false };
    const value = state.value;
    const hasError = !!validationErrors[question.fieldName];

    // If skipped, show disabled input
    if (state.skipped) {
      return (
        <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground italic">
          Skipped - you can update this later from your profile
        </div>
      );
    }

    switch (question.inputType) {
      case 'text':
        return (
          <Input
            id={question.id}
            placeholder={question.placeholder}
            value={(value as string) || ''}
            onChange={(e) => handleInputChange(question.fieldName, e.target.value)}
            className={hasError ? 'border-destructive' : ''}
          />
        );

      case 'number':
        return (
          <Input
            id={question.id}
            type="number"
            placeholder={question.placeholder}
            value={(value as number) || ''}
            min={question.validation?.min}
            max={question.validation?.max}
            onChange={(e) => handleInputChange(question.fieldName, Number(e.target.value))}
            className={hasError ? 'border-destructive' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={question.id}
            placeholder={question.placeholder}
            value={(value as string) || ''}
            onChange={(e) => handleInputChange(question.fieldName, e.target.value)}
            rows={3}
            className={hasError ? 'border-destructive' : ''}
          />
        );

      case 'date':
        return (
          <Input
            id={question.id}
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleInputChange(question.fieldName, e.target.value)}
            className={hasError ? 'border-destructive' : ''}
          />
        );

      case 'select':
        // Build options list, adding "Other" if allowed
        const selectOptions = [...(question.options || [])];
        if (question.allowOther) {
          selectOptions.push({ value: 'other', label: 'Other (specify below)' });
        }

        return (
          <div className="space-y-2">
            <Select
              value={(value as string) || ''}
              onValueChange={(val) => handleInputChange(question.fieldName, val)}
            >
              <SelectTrigger className={hasError ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {selectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Show custom input when "Other" is selected */}
            {value === 'other' && question.allowOther && (
              <Input
                placeholder="Please specify..."
                value={state.otherValue || ''}
                onChange={(e) => handleOtherValueChange(question.fieldName, e.target.value)}
                className={!state.otherValue && hasError ? 'border-destructive' : ''}
              />
            )}
          </div>
        );

      case 'multiselect':
        const selectedValues = (value as string[]) || [];
        const multiselectOptions = [...(question.options || [])];

        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md">
              {selectedValues.length === 0 && (
                <span className="text-sm text-muted-foreground">Click options below</span>
              )}
              {selectedValues.map((val) => {
                const option = question.options?.find(o => o.value === val);
                const isOther = val === 'other' || (!option && val);
                return (
                  <Badge
                    key={val}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      handleInputChange(
                        question.fieldName,
                        selectedValues.filter(v => v !== val)
                      );
                    }}
                  >
                    {isOther ? (state.otherValue || 'Other') : (option?.label || val)} ×
                  </Badge>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1">
              {multiselectOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <Badge
                    key={option.value}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      if (isSelected) {
                        handleInputChange(
                          question.fieldName,
                          selectedValues.filter(v => v !== option.value)
                        );
                      } else {
                        handleInputChange(
                          question.fieldName,
                          [...selectedValues, option.value]
                        );
                      }
                    }}
                  >
                    {option.label}
                  </Badge>
                );
              })}
              {question.allowOther && (
                <Badge
                  variant={selectedValues.includes('other') ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    if (selectedValues.includes('other')) {
                      handleInputChange(
                        question.fieldName,
                        selectedValues.filter(v => v !== 'other')
                      );
                    } else {
                      handleInputChange(
                        question.fieldName,
                        [...selectedValues, 'other']
                      );
                    }
                  }}
                >
                  Other
                </Badge>
              )}
            </div>

            {/* Show custom input when "Other" is in selections */}
            {selectedValues.includes('other') && question.allowOther && (
              <Input
                placeholder="Specify your custom option..."
                value={state.otherValue || ''}
                onChange={(e) => handleOtherValueChange(question.fieldName, e.target.value)}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Complete: {tacticName}
          </DialogTitle>
          <DialogDescription>
            {questions.length > 0 ? (
              <>
                <span className="flex items-center gap-2 mt-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Help us build your business profile. Fields are optional unless marked.
                </span>
              </>
            ) : (
              'Add any notes about this tactic completion.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoadingAssessment && (
            <div className="text-sm text-muted-foreground italic">
              Loading your assessment data...
            </div>
          )}

          {/* Step-by-Step Accountability Section - Smart Filtered */}
          {hasSteps && (() => {
            const criticalStepIndices = identifyCriticalSteps(tacticSteps);

            return (
              <div className="space-y-4">
                {/* Critical steps - optional responses */}
                <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Key Deliverables (optional)
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    You can optionally describe what you did for these important action steps:
                  </p>

                  {criticalStepIndices.map(index => {
                    const stepText = typeof tacticSteps[index] === 'string'
                      ? tacticSteps[index]
                      : tacticSteps[index].step || `Step ${index + 1}`;
                    const hasError = !!stepValidationErrors[index];
                    const helpText = getStepHelpText(stepText);
                    const placeholder = getStepPlaceholder(stepText);

                    return (
                      <div key={index} className="space-y-2">
                        <Label className="text-sm font-medium flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                          <span className="flex-1">{stepText}</span>
                          <Badge variant="secondary" className="text-xs ml-auto">Optional</Badge>
                        </Label>

                        {/* Contextual help */}
                        {helpText && (
                          <p className="text-xs text-muted-foreground flex items-start gap-1">
                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {helpText}
                          </p>
                        )}

                        <Textarea
                          placeholder={placeholder}
                          value={stepResponses[index] || ''}
                          onChange={(e) => {
                            setStepResponses(prev => ({ ...prev, [index]: e.target.value }));
                            if (stepValidationErrors[index]) {
                              setStepValidationErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors[index];
                                return newErrors;
                              });
                            }
                          }}
                          rows={3}
                          className={hasError ? 'border-destructive' : ''}
                        />
                        {hasError && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {stepValidationErrors[index]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* All steps - reference only */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <ChevronDown className="w-4 h-4 mr-2" />
                      View all {tacticSteps.length} steps (reference)
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 bg-muted/10 border border-border rounded-lg mt-2">
                      <ol className="space-y-2">
                        {tacticSteps.map((step, index) => {
                          const stepText = typeof step === 'string' ? step : step.step || `Step ${index + 1}`;
                          const isCritical = criticalStepIndices.includes(index);

                          return (
                            <li
                              key={index}
                              className={`text-sm flex gap-2 ${isCritical ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                            >
                              <span className="flex-shrink-0">{index + 1}.</span>
                              <span>{stepText}</span>
                              {isCritical && (
                                <Badge variant="secondary" className="ml-2 text-xs">Optional above</Badge>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })()}

          {questions.map((question) => {
            const state = fieldStates[question.fieldName] || { skipped: false };

            return (
              <div key={question.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={question.id} className="text-sm font-medium flex items-center">
                    {question.question}
                    {getRequirementBadge(question)}
                  </Label>
                </div>

                {/* Pre-filled indicator */}
                {isPrefilled(question) && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="w-3 h-3" />
                    Pre-filled from your assessment (you can edit)
                  </div>
                )}

                {/* Helper text */}
                {question.helperText && !state.skipped && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {question.helperText}
                  </p>
                )}

                {/* Input field */}
                {renderInput(question)}

                {/* Validation error */}
                {validationErrors[question.fieldName] && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors[question.fieldName]}
                  </p>
                )}

                {/* Skip option */}
                {question.skipOption && !state.skipped && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id={`skip-${question.id}`}
                      checked={state.skipped || false}
                      onCheckedChange={(checked) =>
                        handleSkipChange(question.fieldName, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`skip-${question.id}`}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      {question.skipOption.label}
                    </Label>
                  </div>
                )}

                {/* Show un-skip option if currently skipped */}
                {state.skipped && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSkipChange(question.fieldName, false)}
                  >
                    Actually, I want to answer this
                  </Button>
                )}
              </div>
            );
          })}

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="notes" className="text-sm font-medium">
              Additional Notes (optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any notes about what you learned or accomplished..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Complete Tactic'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
