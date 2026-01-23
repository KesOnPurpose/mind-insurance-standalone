// ============================================================================
// FEAT-GH-018: Learner Header Component
// ============================================================================
// User info card with avatar, overall progress ring, enrollment date
// ============================================================================

import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Mail, Trophy, Clock } from 'lucide-react';
import { StuckIndicator } from './StuckIndicator';
import { NudgeButton } from './NudgeButton';
import type { AdminLearnerDetail } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface LearnerHeaderProps {
  learner: AdminLearnerDetail;
  onRefresh?: () => void;
}

// ============================================================================
// Status Badge
// ============================================================================

const StatusBadge = ({ status }: { status: AdminLearnerDetail['status'] }) => {
  const variants: Record<
    AdminLearnerDetail['status'],
    { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }
  > = {
    active: { variant: 'default', label: 'Active' },
    completed: { variant: 'outline', label: 'Completed' },
    paused: { variant: 'secondary', label: 'Paused' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
  };

  const { variant, label } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
};

// ============================================================================
// Progress Ring
// ============================================================================

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

const ProgressRing = ({
  value,
  size = 80,
  strokeWidth = 8,
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={value === 100 ? 'text-green-500' : 'text-primary'}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{value}%</span>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const LearnerHeader = ({ learner, onRefresh }: LearnerHeaderProps) => {
  const getInitials = () => {
    if (learner.full_name) {
      return learner.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return learner.email.charAt(0).toUpperCase();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar and basic info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              {learner.avatar_url && (
                <AvatarImage src={learner.avatar_url} alt={learner.full_name || 'Learner'} />
              )}
              <AvatarFallback className="text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {learner.full_name || 'No name'}
                </h2>
                <StatusBadge status={learner.status} />
                {learner.is_stuck && (
                  <StuckIndicator
                    isStuck={learner.is_stuck}
                    stuckSince={learner.stuck_since}
                    variant="badge"
                  />
                )}
              </div>

              <div className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{learner.email}</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    Enrolled {format(new Date(learner.enrolled_at), 'MMM d, yyyy')}
                  </span>
                </div>
                {learner.last_activity_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      Last active {format(new Date(learner.last_activity_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress ring and stats */}
          <div className="flex items-center gap-6 md:ml-auto">
            <ProgressRing value={learner.completion_percent} />

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold">
                    {learner.completed_lessons} / {learner.total_required_lessons}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Phases Progress</p>
                <Progress
                  value={
                    (learner.phases.filter((p) => p.status === 'completed').length /
                      learner.phases.length) *
                    100
                  }
                  className="h-2 w-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {learner.phases.filter((p) => p.status === 'completed').length} of{' '}
                  {learner.phases.length} phases
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <NudgeButton
                userId={learner.user_id}
                userName={learner.full_name}
                lessonId={learner.stuck_lesson_id || undefined}
                onNudgeSent={onRefresh}
              />
            </div>
          </div>
        </div>

        {/* Completion date if completed */}
        {learner.status === 'completed' && learner.completed_at && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-green-600">
            <Trophy className="h-5 w-5" />
            <span className="font-medium">
              Completed on {format(new Date(learner.completed_at), 'MMMM d, yyyy')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LearnerHeader;
