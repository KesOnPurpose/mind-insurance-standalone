// ============================================================================
// FEAT-GH-018: Lesson Breakdown Table Component
// ============================================================================
// Per-lesson details: Video %, Tactics %, Assessment status, Timestamps
// ============================================================================

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Video,
  CheckSquare,
  FileQuestion,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StuckIndicator } from './StuckIndicator';
import type { AdminLearnerLessonProgress } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface LessonBreakdownTableProps {
  lessons: AdminLearnerLessonProgress[];
  isLoading: boolean;
  className?: string;
}

// ============================================================================
// Status Badge
// ============================================================================

const LessonStatusBadge = ({
  status,
}: {
  status: AdminLearnerLessonProgress['status'];
}) => {
  const variants: Record<
    AdminLearnerLessonProgress['status'],
    { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string; icon?: React.ReactNode }
  > = {
    completed: { variant: 'default', label: 'Completed' },
    in_progress: { variant: 'secondary', label: 'In Progress' },
    not_started: { variant: 'outline', label: 'Not Started' },
    locked: { variant: 'outline', label: 'Locked', icon: <Lock className="h-3 w-3 mr-1" /> },
    stuck: { variant: 'destructive', label: 'Stuck', icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
  };

  const { variant, label, icon } = variants[status];

  return (
    <Badge variant={variant} className="text-xs flex items-center gap-1">
      {icon}
      {label}
    </Badge>
  );
};

// ============================================================================
// Assessment Status Badge
// ============================================================================

const AssessmentBadge = ({
  status,
  score,
}: {
  status: string | null;
  score: number | null;
}) => {
  if (!status || status === 'not_started') {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
    passed: { variant: 'default', label: 'Passed' },
    failed: { variant: 'destructive', label: 'Failed' },
    in_progress: { variant: 'secondary', label: 'In Progress' },
  };

  const config = variants[status] || { variant: 'secondary' as const, label: status };

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
      {score !== null && ` (${score}%)`}
    </Badge>
  );
};

// ============================================================================
// Table Skeleton
// ============================================================================

const TableSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      </TableRow>
    ))}
  </>
);

// ============================================================================
// Phase Group Component
// ============================================================================

interface PhaseGroupProps {
  phaseTitle: string;
  phaseId: string;
  lessons: AdminLearnerLessonProgress[];
}

const PhaseGroup = ({ phaseTitle, phaseId, lessons }: PhaseGroupProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const completedLessons = lessons.filter((l) => l.status === 'completed').length;
  const stuckLessons = lessons.filter((l) => l.status === 'stuck').length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <TableRow className="bg-muted/50 hover:bg-muted cursor-pointer">
          <TableCell colSpan={6}>
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{phaseTitle}</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {completedLessons}/{lessons.length}
              </Badge>
              {stuckLessons > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stuckLessons} Stuck
                </Badge>
              )}
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {lessons.map((lesson) => (
          <TableRow
            key={lesson.lesson_id}
            className={cn(
              lesson.status === 'stuck' && 'bg-destructive/5'
            )}
          >
            <TableCell>
              <div className="flex items-center gap-2 pl-6">
                <span className="text-sm">{lesson.lesson_title}</span>
                {lesson.status === 'stuck' && (
                  <StuckIndicator isStuck={true} variant="icon" />
                )}
              </div>
            </TableCell>
            <TableCell>
              <LessonStatusBadge status={lesson.status} />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                <Progress
                  value={lesson.video_watched_percent}
                  className="h-2 w-16"
                />
                <span className="text-sm text-muted-foreground w-10">
                  {lesson.video_watched_percent}%
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {lesson.tactics_completed}/{lesson.tactics_required}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <AssessmentBadge
                status={lesson.assessment_status}
                score={lesson.assessment_score}
              />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {lesson.last_activity_at
                ? format(new Date(lesson.last_activity_at), 'MMM d, h:mm a')
                : '-'}
            </TableCell>
          </TableRow>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const LessonBreakdownTable = ({
  lessons,
  isLoading,
  className = '',
}: LessonBreakdownTableProps) => {
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get unique phases
  const phases = useMemo(() => {
    const uniquePhases = new Map<string, string>();
    lessons.forEach((l) => {
      if (!uniquePhases.has(l.phase_id)) {
        uniquePhases.set(l.phase_id, l.phase_title);
      }
    });
    return Array.from(uniquePhases.entries()).map(([id, title]) => ({
      id,
      title,
    }));
  }, [lessons]);

  // Filter and group lessons
  const groupedLessons = useMemo(() => {
    let filtered = [...lessons];

    if (phaseFilter !== 'all') {
      filtered = filtered.filter((l) => l.phase_id === phaseFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }

    // Group by phase
    const groups = new Map<string, AdminLearnerLessonProgress[]>();
    filtered.forEach((lesson) => {
      const key = lesson.phase_id;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(lesson);
    });

    return groups;
  }, [lessons, phaseFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const completed = lessons.filter((l) => l.status === 'completed').length;
    const stuck = lessons.filter((l) => l.status === 'stuck').length;
    const avgVideo =
      lessons.length > 0
        ? Math.round(
            lessons.reduce((sum, l) => sum + l.video_watched_percent, 0) /
              lessons.length
          )
        : 0;
    return { completed, stuck, avgVideo, total: lessons.length };
  }, [lessons]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">Lesson Progress</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Phases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="stuck">Stuck</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 mt-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Completed:</span>{' '}
            <span className="font-medium">
              {stats.completed}/{stats.total}
            </span>
          </div>
          {stats.stuck > 0 && (
            <div className="text-sm text-destructive">
              <span className="text-muted-foreground">Stuck:</span>{' '}
              <span className="font-medium">{stats.stuck}</span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-muted-foreground">Avg Video:</span>{' '}
            <span className="font-medium">{stats.avgVideo}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lesson</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Video Progress</TableHead>
                <TableHead>Tactics</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : groupedLessons.size === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-8 w-8" />
                      <p>No lessons found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                Array.from(groupedLessons.entries()).map(
                  ([phaseId, phaseLessons]) => (
                    <PhaseGroup
                      key={phaseId}
                      phaseId={phaseId}
                      phaseTitle={phaseLessons[0]?.phase_title || 'Unknown Phase'}
                      lessons={phaseLessons}
                    />
                  )
                )
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonBreakdownTable;
