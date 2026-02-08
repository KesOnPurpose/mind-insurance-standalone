// ============================================================================
// PHASE GATE COMPONENT
// ============================================================================
// Final assessment section that analyzes all findings and determines
// whether user can proceed or needs to address gaps first
// ============================================================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Flag,
  ArrowRight,
  FileText,
  Loader2,
  PartyPopper,
  ShieldAlert,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import type {
  ComplianceFinding,
  AssessmentDetermination,
  AssessmentConclusion,
} from '@/types/compliance';
import { SECTION_TITLES } from '@/services/complianceAssessmentService';

// ============================================================================
// TYPES
// ============================================================================

interface PhaseGateProps {
  findings: ComplianceFinding[];
  modelDefinition?: string;
  stateCode: string;
  onComplete: (determination: AssessmentDetermination) => Promise<void>;
  onExportToBinder?: () => void;
  isLoading?: boolean;
  className?: string;
}

interface AnalysisResult {
  determination: AssessmentDetermination;
  score: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  flaggedCount: number;
  summary: string;
  recommendations: string[];
}

// ============================================================================
// ANALYSIS LOGIC
// ============================================================================

const analyzeFindings = (findings: ComplianceFinding[]): AnalysisResult => {
  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  let flaggedCount = 0;

  // Count by conclusion type
  findings.forEach((finding) => {
    if (finding.is_flagged) flaggedCount++;

    switch (finding.conclusion) {
      case 'not_subject':
      case 'n_a':
        greenCount++;
        break;
      case 'may_be_subject':
      case 'needs_review':
        yellowCount++;
        break;
      case 'subject':
        redCount++;
        break;
    }
  });

  const total = findings.length;
  const score = total > 0 ? Math.round(((greenCount * 100) + (yellowCount * 50)) / total) : 0;

  // Determine outcome
  let determination: AssessmentDetermination = 'pending';
  let summary = '';
  const recommendations: string[] = [];

  if (redCount > 0 || flaggedCount >= 2) {
    determination = 'address_gaps';
    summary = 'Your assessment indicates areas that need attention before proceeding.';
    recommendations.push('Review all flagged sections with a compliance professional');
    if (redCount > 0) {
      recommendations.push(`Address ${redCount} section(s) where you ARE subject to requirements`);
    }
    recommendations.push('Consider consulting with a local attorney familiar with housing regulations');
  } else if (yellowCount > 2) {
    determination = 'address_gaps';
    summary = 'Several areas need clarification before you can confidently proceed.';
    recommendations.push('Research unclear areas more thoroughly');
    recommendations.push('Seek professional guidance for "May Be Subject" determinations');
    recommendations.push('Document your interpretations carefully');
  } else {
    determination = 'proceed';
    summary = 'Your assessment indicates you can proceed with confidence!';
    recommendations.push('Save your compliance binder for your records');
    recommendations.push('Review periodically as regulations may change');
    recommendations.push('Continue to Phase 2: Property Setup');
  }

  return {
    determination,
    score,
    greenCount,
    yellowCount,
    redCount,
    flaggedCount,
    summary,
    recommendations,
  };
};

// ============================================================================
// FINDING SUMMARY ROW
// ============================================================================

interface FindingSummaryProps {
  finding: ComplianceFinding;
}

const FindingSummary = ({ finding }: FindingSummaryProps) => {
  const getConclusionBadge = (conclusion?: AssessmentConclusion | null) => {
    switch (conclusion) {
      case 'not_subject':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Not Subject
          </Badge>
        );
      case 'may_be_subject':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            May Be Subject
          </Badge>
        );
      case 'subject':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Subject
          </Badge>
        );
      case 'needs_review':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Needs Review
          </Badge>
        );
      case 'n_a':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            N/A
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">Pending</Badge>
        );
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        {finding.is_flagged && (
          <Flag className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm font-medium">
          {SECTION_TITLES[finding.section_id] || finding.section_id}
        </span>
      </div>
      {getConclusionBadge(finding.conclusion)}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PhaseGate = ({
  findings,
  modelDefinition,
  stateCode,
  onComplete,
  onExportToBinder,
  isLoading = false,
  className,
}: PhaseGateProps) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Analyze findings on mount
  useEffect(() => {
    if (findings.length > 0) {
      setAnalysis(analyzeFindings(findings));
    }
  }, [findings]);

  const handleComplete = async () => {
    if (!analysis || isCompleting) return;

    setIsCompleting(true);
    try {
      await onComplete(analysis.determination);
    } finally {
      setIsCompleting(false);
    }
  };

  if (!analysis) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isProceed = analysis.determination === 'proceed';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Section 1.5: Phase Gate Assessment
          </CardTitle>
          <CardDescription>
            Review your compliance assessment results and determine your path forward.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Model Definition Reference */}
          {modelDefinition && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Your Model Definition:
              </p>
              <p className="text-sm italic">"{modelDefinition}"</p>
              <p className="text-xs text-muted-foreground mt-2">
                State: {stateCode}
              </p>
            </div>
          )}

          {/* Compliance Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Compliance Confidence Score</span>
              <span className={cn(
                'text-2xl font-bold',
                analysis.score >= 80 ? 'text-green-600' :
                analysis.score >= 50 ? 'text-amber-600' : 'text-red-600'
              )}>
                {analysis.score}%
              </span>
            </div>
            <Progress value={analysis.score} className="h-3" />
          </div>

          {/* Count Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-600">{analysis.greenCount}</p>
              <p className="text-xs text-muted-foreground">Clear</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-600">{analysis.yellowCount}</p>
              <p className="text-xs text-muted-foreground">Needs Review</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
              <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-600">{analysis.redCount}</p>
              <p className="text-xs text-muted-foreground">Subject To</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center">
              <Flag className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-600">{analysis.flaggedCount}</p>
              <p className="text-xs text-muted-foreground">Flagged</p>
            </div>
          </div>

          <Separator />

          {/* Determination Alert */}
          {isProceed ? (
            <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200">
              <PartyPopper className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-700">Ready to Proceed!</AlertTitle>
              <AlertDescription className="text-green-600">
                {analysis.summary}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <ShieldAlert className="h-5 w-5" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>{analysis.summary}</AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recommendations:</h4>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Findings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Section-by-Section Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {findings.map((finding) => (
              <FindingSummary key={finding.id} finding={finding} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
        {onExportToBinder && (
          <Button variant="outline" onClick={onExportToBinder} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Export to Compliance Binder
          </Button>
        )}

        <div className="flex-1" />

        <Button
          onClick={handleComplete}
          disabled={isLoading || isCompleting}
          className={cn(
            'min-w-[200px]',
            isProceed
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-amber-600 hover:bg-amber-700'
          )}
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Completing...
            </>
          ) : isProceed ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete & Proceed to Phase 2
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Acknowledge & Save Progress
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PhaseGate;
