// ============================================================================
// FEAT-GH-018: Enhanced Learners Table Component
// ============================================================================
// Learner table with sorting, filtering, and navigation to detail view
// ============================================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  Mail,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { StuckIndicator } from './StuckIndicator';
import { NudgeButton } from './NudgeButton';
import type { AdminProgramLearner, LearnerFilterOptions, DripStatusType } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface LearnersTableProps {
  programId: string;
  learners: AdminProgramLearner[];
  isLoading: boolean;
  filters: LearnerFilterOptions;
  onRefresh: () => void;
}

type SortField = 'name' | 'completion' | 'lastActivity' | 'enrolled';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// Helper Functions
// ============================================================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDripStatus(
  completionPercent: number,
  enrolledAt: string
): DripStatusType {
  // Simple heuristic for drip status
  // In production, this would compare against expected drip schedule
  const daysSinceEnrollment = Math.floor(
    (Date.now() - new Date(enrolledAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const expectedCompletion = Math.min(daysSinceEnrollment * 3, 100); // 3% per day expectation

  if (completionPercent > expectedCompletion + 10) return 'ahead';
  if (completionPercent < expectedCompletion - 10) return 'behind';
  return 'on_schedule';
}

// ============================================================================
// Status Badge
// ============================================================================

const StatusBadge = ({ status }: { status: AdminProgramLearner['status'] }) => {
  const variants: Record<
    AdminProgramLearner['status'],
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
// Drip Status Badge
// ============================================================================

const DripStatusBadge = ({ status }: { status: DripStatusType }) => {
  const variants: Record<
    DripStatusType,
    { variant: 'default' | 'secondary' | 'destructive'; label: string }
  > = {
    on_schedule: { variant: 'secondary', label: 'On Schedule' },
    ahead: { variant: 'default', label: 'Ahead' },
    behind: { variant: 'destructive', label: 'Behind' },
  };

  const { variant, label } = variants[status];

  return (
    <Badge variant={variant} className="text-xs">
      {label}
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
        <TableCell>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </TableCell>
        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
      </TableRow>
    ))}
  </>
);

// ============================================================================
// Empty State
// ============================================================================

const EmptyState = ({ hasFilters }: { hasFilters: boolean }) => (
  <TableRow>
    <TableCell colSpan={8} className="h-32 text-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Users className="h-8 w-8" />
        <p>
          {hasFilters ? 'No learners match your filters' : 'No learners enrolled yet'}
        </p>
        {!hasFilters && (
          <p className="text-sm">
            Learners will appear here once they enroll in this program
          </p>
        )}
      </div>
    </TableCell>
  </TableRow>
);

// ============================================================================
// Sort Header
// ============================================================================

interface SortHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}

const SortHeader = ({
  label,
  field,
  currentField,
  direction,
  onSort,
}: SortHeaderProps) => {
  const isActive = currentField === field;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 font-medium"
      onClick={() => onSort(field)}
    >
      {label}
      {isActive ? (
        direction === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const LearnersTable = ({
  programId,
  learners,
  isLoading,
  filters,
  onRefresh,
}: LearnersTableProps) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('lastActivity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort learners
  const processedLearners = useMemo(() => {
    let result = [...learners];

    // Apply filters
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.email.toLowerCase().includes(query) ||
          l.full_name?.toLowerCase().includes(query)
      );
    }

    if (filters.status !== 'all') {
      result = result.filter((l) => l.status === filters.status);
    }

    if (filters.minCompletionPercent !== null) {
      result = result.filter(
        (l) => l.completion_percent >= (filters.minCompletionPercent ?? 0)
      );
    }

    if (filters.maxCompletionPercent !== null) {
      result = result.filter(
        (l) => l.completion_percent <= (filters.maxCompletionPercent ?? 100)
      );
    }

    if (filters.dripStatus && filters.dripStatus !== 'all') {
      result = result.filter((l) => {
        const status = getDripStatus(l.completion_percent, l.enrolled_at);
        return status === filters.dripStatus;
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = (a.full_name || a.email).localeCompare(
            b.full_name || b.email
          );
          break;
        case 'completion':
          comparison = a.completion_percent - b.completion_percent;
          break;
        case 'lastActivity':
          const aDate = a.last_activity_at
            ? new Date(a.last_activity_at).getTime()
            : 0;
          const bDate = b.last_activity_at
            ? new Date(b.last_activity_at).getTime()
            : 0;
          comparison = aDate - bDate;
          break;
        case 'enrolled':
          comparison =
            new Date(a.enrolled_at).getTime() -
            new Date(b.enrolled_at).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [learners, filters, sortField, sortDirection]);

  const hasFilters =
    filters.searchQuery !== '' ||
    filters.status !== 'all' ||
    filters.minCompletionPercent !== null ||
    filters.maxCompletionPercent !== null ||
    filters.dripStatus !== null;

  const handleViewDetails = (userId: string) => {
    navigate(`/admin/programs/${programId}/learners/${userId}`);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortHeader
                label="Learner"
                field="name"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <SortHeader
                label="Progress"
                field="completion"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead>Lessons</TableHead>
            <TableHead>Drip</TableHead>
            <TableHead className="w-[50px]">Stuck</TableHead>
            <TableHead>
              <SortHeader
                label="Last Activity"
                field="lastActivity"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : processedLearners.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            processedLearners.map((learner) => {
              const dripStatus = getDripStatus(
                learner.completion_percent,
                learner.enrolled_at
              );
              // Mock stuck status - in production this would come from the API
              const isStuck = learner.completion_percent > 0 &&
                learner.completion_percent < 100 &&
                learner.last_activity_at &&
                (Date.now() - new Date(learner.last_activity_at).getTime()) > 7 * 24 * 60 * 60 * 1000;

              return (
                <TableRow
                  key={learner.user_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetails(learner.user_id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {(learner.full_name || learner.email)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {learner.full_name || 'No name'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {learner.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={learner.status} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Progress
                        value={learner.completion_percent}
                        className="h-2 flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-10">
                        {learner.completion_percent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {learner.completed_lessons}/{learner.total_required_lessons}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DripStatusBadge status={dripStatus} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StuckIndicator isStuck={isStuck} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {learner.last_activity_at
                      ? formatRelativeTime(new Date(learner.last_activity_at))
                      : 'Never'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(learner.user_id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <NudgeButton
                        userId={learner.user_id}
                        userName={learner.full_name}
                        variant="ghost"
                        size="icon"
                        onNudgeSent={onRefresh}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default LearnersTable;
