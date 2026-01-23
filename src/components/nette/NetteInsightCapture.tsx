// ============================================================================
// FEAT-GH-020: Nette Insight Capture Component
// ============================================================================
// Dialog to save meaningful insights from conversations
// ============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Sparkles, Lightbulb, HelpCircle, Link, Target, Loader2 } from 'lucide-react';
import type { UserInsight } from '@/types/programs';

interface NetteInsightCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialText?: string;
  lessonId?: string;
  conversationId?: string;
  onSave: (
    insightText: string,
    insightType: UserInsight['insight_type']
  ) => Promise<void>;
}

const INSIGHT_TYPES: {
  value: UserInsight['insight_type'];
  label: string;
  description: string;
  icon: typeof Lightbulb;
}[] = [
  {
    value: 'breakthrough',
    label: 'Breakthrough',
    description: 'An "aha!" moment or major realization',
    icon: Lightbulb,
  },
  {
    value: 'question',
    label: 'Question',
    description: 'Something to explore further',
    icon: HelpCircle,
  },
  {
    value: 'connection',
    label: 'Connection',
    description: 'A link to something you already know',
    icon: Link,
  },
  {
    value: 'goal',
    label: 'Goal',
    description: 'An action item or commitment',
    icon: Target,
  },
];

/**
 * NetteInsightCapture - Save insight dialog
 * Allows users to capture and categorize meaningful insights
 */
export const NetteInsightCapture = ({
  open,
  onOpenChange,
  initialText = '',
  lessonId,
  conversationId,
  onSave,
}: NetteInsightCaptureProps) => {
  const [insightText, setInsightText] = useState(initialText);
  const [insightType, setInsightType] = useState<UserInsight['insight_type']>('breakthrough');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!insightText.trim()) return;

    setIsSaving(true);
    try {
      await onSave(insightText.trim(), insightType);
      onOpenChange(false);
      // Reset form
      setInsightText('');
      setInsightType('breakthrough');
    } catch (error) {
      console.error('Error saving insight:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Save This Insight
          </DialogTitle>
          <DialogDescription>
            Capture this insight to your learning journal. You can review it later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Insight text */}
          <div className="space-y-2">
            <Label htmlFor="insight-text">Your insight</Label>
            <Textarea
              id="insight-text"
              value={insightText}
              onChange={(e) => setInsightText(e.target.value)}
              placeholder="What did you learn or realize?"
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Insight type */}
          <div className="space-y-3">
            <Label>Type of insight</Label>
            <RadioGroup
              value={insightType}
              onValueChange={(value) => setInsightType(value as UserInsight['insight_type'])}
              className="grid grid-cols-2 gap-3"
            >
              {INSIGHT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = insightType === type.value;

                return (
                  <Label
                    key={type.value}
                    htmlFor={type.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-border hover:border-purple-200 hover:bg-purple-50/50'
                    )}
                  >
                    <RadioGroupItem
                      id={type.value}
                      value={type.value}
                      className="sr-only"
                    />
                    <Icon
                      className={cn(
                        'h-5 w-5 mt-0.5 flex-shrink-0',
                        isSelected ? 'text-purple-600' : 'text-muted-foreground'
                      )}
                    />
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!insightText.trim() || isSaving}
            className="gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Save Insight
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NetteInsightCapture;
