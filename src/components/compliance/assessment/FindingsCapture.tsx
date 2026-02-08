// ============================================================================
// FINDINGS CAPTURE COMPONENT
// ============================================================================
// Captures compliance research findings: URL, pasted language, interpretation
// Used within each assessment section to document user research
// ============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Link2,
  FileText,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Flag,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { AssessmentConclusion, ComplianceFinding } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface FindingsCaptureProps {
  sectionId: string;
  sectionTitle: string;
  guidanceText?: string;
  initialFinding?: Partial<ComplianceFinding>;
  onSave: (finding: FindingData) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

interface FindingData {
  research_url: string;
  pasted_language: string;
  user_interpretation: string;
  conclusion: AssessmentConclusion;
  is_flagged: boolean;
}

// ============================================================================
// CONCLUSION OPTIONS
// ============================================================================

const CONCLUSION_OPTIONS: {
  value: AssessmentConclusion;
  label: string;
  description: string;
  icon: typeof CheckCircle2;
  color: string;
}[] = [
  {
    value: 'not_subject',
    label: 'Not Subject',
    description: 'My model is NOT subject to this requirement',
    icon: CheckCircle2,
    color: 'text-green-600',
  },
  {
    value: 'may_be_subject',
    label: 'May Be Subject',
    description: 'My model MAY be subject - needs further review',
    icon: AlertTriangle,
    color: 'text-amber-600',
  },
  {
    value: 'subject',
    label: 'Subject',
    description: 'My model IS subject to this requirement',
    icon: AlertTriangle,
    color: 'text-red-600',
  },
  {
    value: 'needs_review',
    label: 'Needs Review',
    description: 'I need professional guidance on this',
    icon: HelpCircle,
    color: 'text-blue-600',
  },
  {
    value: 'n_a',
    label: 'N/A',
    description: 'Not applicable to my situation',
    icon: CheckCircle2,
    color: 'text-muted-foreground',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FindingsCapture = ({
  sectionId,
  sectionTitle,
  guidanceText,
  initialFinding,
  onSave,
  isLoading = false,
  className,
}: FindingsCaptureProps) => {
  // Form state
  const [researchUrl, setResearchUrl] = useState(initialFinding?.research_url || '');
  const [pastedLanguage, setPastedLanguage] = useState(initialFinding?.pasted_language || '');
  const [userInterpretation, setUserInterpretation] = useState(
    initialFinding?.user_interpretation || ''
  );
  const [conclusion, setConclusion] = useState<AssessmentConclusion>(
    initialFinding?.conclusion || 'needs_review'
  );
  const [isFlagged, setIsFlagged] = useState(initialFinding?.is_flagged || false);
  const [isSaving, setIsSaving] = useState(false);

  // Validation
  const isValid = pastedLanguage.trim().length > 0 && userInterpretation.trim().length > 0;

  // Handle save
  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        research_url: researchUrl.trim(),
        pasted_language: pastedLanguage.trim(),
        user_interpretation: userInterpretation.trim(),
        conclusion,
        is_flagged: isFlagged,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Section {sectionId}: {sectionTitle}
            </CardTitle>
            {guidanceText && (
              <CardDescription className="mt-2">{guidanceText}</CardDescription>
            )}
          </div>
          {isFlagged && (
            <Badge variant="destructive" className="shrink-0">
              <Flag className="h-3 w-3 mr-1" />
              Flagged
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Research URL */}
        <div className="space-y-2">
          <Label htmlFor={`url-${sectionId}`} className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Research Source URL
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id={`url-${sectionId}`}
              type="url"
              placeholder="https://example.gov/regulations..."
              value={researchUrl}
              onChange={(e) => setResearchUrl(e.target.value)}
              disabled={isLoading || isSaving}
              className="flex-1"
            />
            {researchUrl && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(researchUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open link in new tab</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Link to the official regulation or resource you researched
          </p>
        </div>

        {/* Pasted Language */}
        <div className="space-y-2">
          <Label htmlFor={`language-${sectionId}`} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relevant Regulation Text
            <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id={`language-${sectionId}`}
            placeholder="Copy and paste the specific regulation language that applies to your situation..."
            value={pastedLanguage}
            onChange={(e) => setPastedLanguage(e.target.value)}
            disabled={isLoading || isSaving}
            rows={6}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Paste the exact language from the regulation, statute, or ordinance
          </p>
        </div>

        {/* User Interpretation */}
        <div className="space-y-2">
          <Label htmlFor={`interpretation-${sectionId}`} className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Your Interpretation
            <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id={`interpretation-${sectionId}`}
            placeholder="In plain English, this means... Based on my housing model, I believe..."
            value={userInterpretation}
            onChange={(e) => setUserInterpretation(e.target.value)}
            disabled={isLoading || isSaving}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Write your understanding of what this regulation means for YOUR specific situation
          </p>
        </div>

        {/* Conclusion */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Your Conclusion
          </Label>
          <RadioGroup
            value={conclusion}
            onValueChange={(value) => setConclusion(value as AssessmentConclusion)}
            disabled={isLoading || isSaving}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
          >
            {CONCLUSION_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <Label
                  key={option.value}
                  htmlFor={`conclusion-${sectionId}-${option.value}`}
                  className={cn(
                    'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                    conclusion === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:bg-accent'
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`conclusion-${sectionId}-${option.value}`}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <div className={cn('flex items-center gap-1 font-medium', option.color)}>
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
        </div>

        {/* Flag for Review */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Flag className={cn('h-4 w-4', isFlagged ? 'text-red-500' : 'text-muted-foreground')} />
            <div>
              <p className="text-sm font-medium">Flag for Professional Review</p>
              <p className="text-xs text-muted-foreground">
                Mark if you need attorney or consultant guidance
              </p>
            </div>
          </div>
          <Button
            variant={isFlagged ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setIsFlagged(!isFlagged)}
            disabled={isLoading || isSaving}
          >
            {isFlagged ? 'Flagged' : 'Flag'}
          </Button>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!isValid || isLoading || isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Finding'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FindingsCapture;
