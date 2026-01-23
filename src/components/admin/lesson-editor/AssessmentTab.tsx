// ============================================================================
// FEAT-GH-016: Assessment Tab Component
// ============================================================================
// Toggle assessment on/off, quiz configuration (future)
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import type { AdminLessonFull, LessonContentUpdate } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface AssessmentTabProps {
  lesson: AdminLessonFull;
  onUpdate: (data: LessonContentUpdate) => void;
  isSaving?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export const AssessmentTab = ({
  lesson,
  onUpdate,
  isSaving,
}: AssessmentTabProps) => {
  // Local state
  const [hasAssessment, setHasAssessment] = useState(lesson.has_assessment);
  const [requiresPass, setRequiresPass] = useState(lesson.requires_assessment_pass);

  // Update local state when lesson changes
  useEffect(() => {
    setHasAssessment(lesson.has_assessment);
    setRequiresPass(lesson.requires_assessment_pass);
  }, [lesson]);

  // Handle toggle changes
  const handleHasAssessmentChange = (checked: boolean) => {
    setHasAssessment(checked);
    onUpdate({
      has_assessment: checked,
      // If disabling assessment, also disable requires pass
      requires_assessment_pass: checked ? requiresPass : false,
    });
    if (!checked) {
      setRequiresPass(false);
    }
  };

  const handleRequiresPassChange = (checked: boolean) => {
    setRequiresPass(checked);
    onUpdate({ requires_assessment_pass: checked });
  };

  return (
    <div className="space-y-6">
      {/* Assessment Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Lesson Assessment
          </CardTitle>
          <CardDescription>
            Add an assessment to test learner knowledge at the end of this lesson
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Assessment */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <Label htmlFor="has-assessment" className="font-medium">
                  Enable Assessment
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Add a quiz or knowledge check to this lesson
              </p>
            </div>
            <Switch
              id="has-assessment"
              checked={hasAssessment}
              onCheckedChange={handleHasAssessmentChange}
              disabled={isSaving}
            />
          </div>

          {/* Requires Pass */}
          {hasAssessment && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <Label htmlFor="requires-pass" className="font-medium">
                    Require Passing Score
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Learners must pass the assessment to complete this lesson
                </p>
              </div>
              <Switch
                id="requires-pass"
                checked={requiresPass}
                onCheckedChange={handleRequiresPassChange}
                disabled={isSaving}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Status */}
      {hasAssessment ? (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">
                  Assessment Enabled
                </p>
                <p className="text-sm text-muted-foreground">
                  Full quiz builder coming soon! For now, assessments can be configured
                  through the database or admin panel.
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">
                    {requiresPass ? 'Passing Required' : 'Completion Only'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  No Assessment
                </p>
                <p className="text-sm text-muted-foreground">
                  This lesson will not include an assessment. Learners will complete
                  the lesson through video watch time and tactics only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Future Feature Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-5 w-5" />
            Coming Soon: Quiz Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A full-featured quiz builder is planned for a future release. Features will include:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>Multiple choice questions</li>
            <li>True/false questions</li>
            <li>Short answer questions</li>
            <li>Custom passing scores</li>
            <li>Question randomization</li>
            <li>Unlimited retakes or limited attempts</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentTab;
