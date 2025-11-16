import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building2 } from 'lucide-react';
import { TacticQuestion, BusinessProfile } from '@/types/assessment';
import { getQuestionsForTactic } from '@/config/tacticQuestions';

interface TacticCompletionFormProps {
  isOpen: boolean;
  onClose: () => void;
  tacticName: string;
  tacticCategory: string;
  onComplete: (profileUpdates: Partial<BusinessProfile>, notes: string) => void;
}

export function TacticCompletionForm({
  isOpen,
  onClose,
  tacticName,
  tacticCategory,
  onComplete,
}: TacticCompletionFormProps) {
  const [profileUpdates, setProfileUpdates] = useState<Partial<BusinessProfile>>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = getQuestionsForTactic(tacticName, tacticCategory);

  const handleInputChange = (fieldName: keyof BusinessProfile, value: unknown) => {
    setProfileUpdates(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(profileUpdates, notes);
      setProfileUpdates({});
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error completing tactic:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (question: TacticQuestion) => {
    const value = profileUpdates[question.fieldName];

    switch (question.inputType) {
      case 'text':
        return (
          <Input
            id={question.id}
            placeholder={question.placeholder}
            value={(value as string) || ''}
            onChange={(e) => handleInputChange(question.fieldName, e.target.value)}
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
          />
        );

      case 'date':
        return (
          <Input
            id={question.id}
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleInputChange(question.fieldName, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(val) => handleInputChange(question.fieldName, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md">
              {selectedValues.length === 0 && (
                <span className="text-sm text-muted-foreground">Click options below</span>
              )}
              {selectedValues.map((val) => {
                const option = question.options?.find(o => o.value === val);
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
                    {option?.label || val} ×
                  </Badge>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1">
              {question.options?.map((option) => {
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
            </div>
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
                  Help us build your business profile by answering these quick questions.
                </span>
              </>
            ) : (
              'Add any notes about this tactic completion.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <Label htmlFor={question.id} className="text-sm font-medium">
                {question.question}
                {question.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderInput(question)}
              {question.validation?.message && (
                <p className="text-xs text-muted-foreground">{question.validation.message}</p>
              )}
            </div>
          ))}

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
