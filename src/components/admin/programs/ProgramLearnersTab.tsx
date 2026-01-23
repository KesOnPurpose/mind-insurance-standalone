// ============================================================================
// FEAT-GH-014: Program Learners Tab
// ============================================================================
// Enrolled learners table with progress tracking
// Updated for FEAT-GH-019: Added Enroll Learner button and modal
// ============================================================================

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  Mail,
  Eye,
  RefreshCw,
  Download,
  Users,
  UserCheck,
  UserX,
  Clock,
  UserPlus,
} from 'lucide-react';
import type { AdminProgramLearner } from '@/types/programs';
import { EnrollLearnerModal } from '@/components/admin/enrollment';

// ============================================================================
// Types
// ============================================================================

interface ProgramLearnersTabProps {
  programId: string;
  programTitle?: string;
  learners: AdminProgramLearner[];
  isLoading: boolean;
  onRefresh: () => void;
}

type StatusFilter = 'all' | 'active' | 'completed' | 'paused' | 'cancelled';

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
        <TableCell>
          <Skeleton className="h-5 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

// ============================================================================
// Empty State
// ============================================================================

const EmptyState = ({ hasFilters }: { hasFilters: boolean }) => (
  <TableRow>
    <TableCell colSpan={6} className="h-32 text-center">
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
// Stats Cards
// ============================================================================

interface StatsCardsProps {
  learners: AdminProgramLearner[];
}

const StatsCards = ({ learners }: StatsCardsProps) => {
  const stats = useMemo(() => {
    const active = learners.filter((l) => l.status === 'active').length;
    const completed = learners.filter((l) => l.status === 'completed').length;
    const paused = learners.filter((l) => l.status === 'paused').length;

    // Calculate recently active (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyActive = learners.filter((l) => {
      if (!l.last_activity_at) return false;
      return new Date(l.last_activity_at) >= sevenDaysAgo;
    }).length;

    return { active, completed, paused, recentlyActive };
  }, [learners]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
            <UserX className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.paused}</p>
            <p className="text-sm text-muted-foreground">Paused</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.recentlyActive}</p>
            <p className="text-sm text-muted-foreground">Active 7d</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ProgramLearnersTab = ({
  programId,
  programTitle,
  learners,
  isLoading,
  onRefresh,
}: ProgramLearnersTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Filter learners
  const filteredLearners = useMemo(() => {
    return learners.filter((learner) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        learner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        learner.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || learner.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [learners, searchQuery, statusFilter]);

  // Export to CSV
  const handleExport = () => {
    const csv = [
      ['Email', 'Name', 'Status', 'Progress', 'Lessons', 'Enrolled', 'Last Activity'].join(
        ','
      ),
      ...filteredLearners.map((l) =>
        [
          l.email,
          l.full_name || '',
          l.status,
          `${l.completion_percent}%`,
          `${l.completed_lessons}/${l.total_required_lessons}`,
          new Date(l.enrolled_at).toLocaleDateString(),
          l.last_activity_at
            ? new Date(l.last_activity_at).toLocaleDateString()
            : 'Never',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `program-learners-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const hasFilters = searchQuery !== '' || statusFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Stats */}
      {!isLoading && learners.length > 0 && <StatsCards learners={learners} />}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setIsEnrollModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Enroll Learner
          </Button>
        </div>
      </div>

      {/* Enroll Learner Modal */}
      <EnrollLearnerModal
        open={isEnrollModalOpen}
        onOpenChange={setIsEnrollModalOpen}
        programId={programId}
        programTitle={programTitle}
        onSuccess={onRefresh}
      />

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Learner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Lessons</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : filteredLearners.length === 0 ? (
              <EmptyState hasFilters={hasFilters} />
            ) : (
              filteredLearners.map((learner) => (
                <TableRow key={learner.user_id}>
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
                  <TableCell>
                    <StatusBadge status={learner.status} />
                  </TableCell>
                  <TableCell>
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
                  <TableCell className="text-sm text-muted-foreground">
                    {learner.last_activity_at
                      ? formatRelativeTime(new Date(learner.last_activity_at))
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      {!isLoading && filteredLearners.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredLearners.length} of {learners.length} learners
        </p>
      )}
    </div>
  );
};

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

export default ProgramLearnersTab;
