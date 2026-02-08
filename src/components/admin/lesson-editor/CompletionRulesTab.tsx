// ============================================================================
// FEAT-GH-016: Completion Rules Tab Component
// ============================================================================
// Watch %, tactics required, assessment settings
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Video,
  Target,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import type { AdminLessonFull, LessonContentUpdate } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface CompletionRulesTabProps {
  lesson: AdminLessonFull;
  onUpdate: (data: LessonContentUpdate) => void;
  isSaving?: boolean;
}

// ============================================================================
// Gate Status Component
// ============================================================================

interface GateStatusProps {
  label: string;
  icon: React.ReactNode;
  isEnabled: boolean;
  description: string;
}

const GateStatus = ({ label, icon, isEnabled, description }: GateStatusProps) => (
  <div className="flex items-start gap-3 p-4 rounded-lg border">
    <div
      className={`p-2 rounded-lg ${
        isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      }`}
    >
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-medium">{label}</span>
        {isEnabled ? (
          <Badge variant="default" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Disabled
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const CompletionRulesTab = ({
  lesson,
  onUpdate,
  isSaving,
}: CompletionRulesTabProps) => {
  // Local state
  const [watchPercent, setWatchPercent] = useState(lesson.required_watch_percent);

  // Update local state when lesson changes
  useEffect(() => {
    setWatchPercent(lesson.required_watch_percent);
  }, [lesson]);

  // Handle watch percent change
  const handleWatchPercentChange = (value: number[]) => {
    const percent = value[0];
    setWatchPercent(percent);
    onUpdate({ required_watch_percent: percent });
  };

  // Determine gate statuses
  const hasVideo = !!lesson.video_url;
  const hasTactics = lesson.tactics.length > 0;
  const requiredTactics = lesson.tactics.filter((t) => t.is_required).length;
  const hasAssessment = lesson.has_assessment;

  // Calculate completion requirements
  const requirements: string[] = [];
  if (hasVideo && watchPercent > 0) {
    requirements.push(`Watch at least ${watchPercent}% of the video`);
  }
  if (requiredTactics > 0) {
    requirements.push(`Complete ${requiredTactics} required tactic${requiredTactics > 1 ? 's' : ''}`);
  }
  if (hasAssessment && lesson.requires_assessment_pass) {
    requirements.push('Pass the assessment');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Completion Rules
          </CardTitle>
          <CardDescription>
            Configure what learners need to do to complete this lesson
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Video Watch Requirement */}
      {hasVideo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              Video Watch Requirement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Required Watch Percentage</Label>
                <span className="text-2xl font-bold text-primary">
                  {watchPercent}%
                </span>
              </div>
              <Slider
                value={[watchPercent]}
                onValueChange={handleWatchPercentChange}
                min={0}
                max={100}
                step={5}
                disabled={isSaving}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0% (No requirement)</span>
                <span>100% (Full video)</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {watchPercent === 0
                ? 'Video watching is not required for completion.'
                : watchPercent === 100
                ? 'Learners must watch the entire video to complete this lesson.'
                : `Learners must watch at least ${watchPercent}% of the video to complete this lesson.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Completion Gates Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Completion Gates</CardTitle>
          <CardDescription>
            All active gates must be satisfied to mark the lesson as complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <GateStatus
            label="Video Gate"
            icon={<Video className="h-4 w-4" />}
            isEnabled={hasVideo && watchPercent > 0}
            description={
              hasVideo
                ? `${watchPercent}% watch time required`
                : 'No video content in this lesson'
            }
          />

          <GateStatus
            label="Tactics Gate"
            icon={<Target className="h-4 w-4" />}
            isEnabled={requiredTactics > 0}
            description={
              requiredTactics > 0
                ? `${requiredTactics} required tactic${requiredTactics > 1 ? 's' : ''} must be completed`
                : hasTactics
                ? 'All tactics are optional'
                : 'No tactics in this lesson'
            }
          />

          <GateStatus
            label="Assessment Gate"
            icon={<ClipboardCheck className="h-4 w-4" />}
            isEnabled={hasAssessment && lesson.requires_assessment_pass}
            description={
              !hasAssessment
                ? 'No assessment for this lesson'
                : lesson.requires_assessment_pass
                ? 'Must pass assessment'
                : 'Assessment completion only (no passing score required)'
            }
          />
        </CardContent>
      </Card>

      {/* Completion Summary */}
      <Card
        className={
          requirements.length > 0
            ? 'bg-primary/5 border-primary/20'
            : 'bg-yellow-500/5 border-yellow-500/20'
        }
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {requirements.length > 0 ? (
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium">
                {requirements.length > 0
                  ? 'To Complete This Lesson'
                  : 'No Completion Requirements'}
              </p>
              {requirements.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  {requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  This lesson has no completion requirements. Consider adding video
                  content with watch requirements, required tactics, or an assessment.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletionRulesTab;
