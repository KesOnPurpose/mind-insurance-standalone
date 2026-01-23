// ============================================================================
// COMPLIANCE ASSESSMENT PAGE
// ============================================================================
// Dedicated page for the guided compliance assessment workbook.
// Helps users verify their housing model against state requirements.
// ============================================================================

import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ClipboardCheck,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { ComplianceAssessment } from '@/components/compliance/assessment';
import { useBinderList } from '@/hooks/useComplianceBinder';
import type { StateCode, AssessmentDetermination } from '@/types/compliance';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComplianceAssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get state code from URL params (e.g., ?state=AR)
  const stateParam = searchParams.get('state') as StateCode | null;
  // Get optional binder ID from URL params (e.g., ?binder=xxx)
  const binderIdParam = searchParams.get('binder');

  // Get user's binders to determine state if not in URL
  const { binders, isLoading: bindersLoading } = useBinderList();

  // Determine the state code to use:
  // 1. From URL param (highest priority)
  // 2. From user's primary binder
  // 3. Null (will show state selection prompt)
  const primaryBinder = binders.length > 0 ? binders[0] : null;
  const stateCode = stateParam || primaryBinder?.state_code || null;
  const binderId = binderIdParam || primaryBinder?.id;

  // Handle assessment completion
  const handleAssessmentComplete = (assessmentId: string, determination: AssessmentDetermination) => {
    console.log('Assessment complete:', assessmentId, determination);
    navigate('/compliance?tab=my-binder');
  };

  // Loading state while fetching binders
  if (bindersLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    );
  }

  // No state selected - show prompt to select state
  if (!stateCode) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/compliance')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Hub
          </Button>
        </div>

        {/* Page Title */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <ClipboardCheck className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Compliance Assessment</h1>
            <p className="text-muted-foreground">
              Guided workbook to verify your housing model against state requirements.
            </p>
          </div>
        </div>

        {/* State Selection Required */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Select Your State
            </CardTitle>
            <CardDescription>
              Before starting the assessment, you need to select the state where your
              group home will be located. This determines which regulations apply.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No State Selected</AlertTitle>
              <AlertDescription>
                You haven't set up a compliance binder with a state yet.
                Please create a binder first or go to the Research tab to select your state.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={() => navigate('/compliance?tab=research')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Go to Research
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/compliance?tab=my-binder')}
              >
                Create a Binder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/compliance')}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Hub
        </Button>
      </div>

      {/* Page Title */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          <ClipboardCheck className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Compliance Assessment</h1>
          <p className="text-muted-foreground">
            Guided workbook to verify your housing model against {stateCode} requirements.
          </p>
        </div>
      </div>

      {/* Introduction Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Getting Started
          </CardTitle>
          <CardDescription>
            This assessment will guide you through verifying your housing model
            against state and local compliance requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h4 className="font-medium">What You'll Do</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>Define your housing model clearly</li>
                <li>Research state licensure requirements</li>
                <li>Review local zoning and occupancy rules</li>
                <li>Document your findings and interpretations</li>
                <li>Receive a compliance determination</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">What You'll Get</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>Clear understanding of requirements</li>
                <li>Documented research trail</li>
                <li>Auto-populated compliance binder</li>
                <li>Confidence when speaking to officials</li>
                <li>Actionable next steps checklist</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Time estimate:</strong> 30-60 minutes to complete all sections.
              You can save and return at any time - your progress is automatically saved.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Assessment Component */}
      <ComplianceAssessment
        stateCode={stateCode}
        binderId={binderId}
        onComplete={handleAssessmentComplete}
        onCancel={() => navigate('/compliance')}
      />
    </div>
  );
}
