// ============================================================================
// FEAT-GH-014: Programs Table Component
// ============================================================================
// Admin table displaying all programs with stats and actions
// ============================================================================

import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  MoreHorizontal,
  Eye,
  Settings,
  Archive,
  Trash2,
  Users,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import type { AdminProgram } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface ProgramsTableProps {
  programs: AdminProgram[];
  isLoading: boolean;
  onArchive?: (program: AdminProgram) => void;
  onDelete?: (program: AdminProgram) => void;
  onPublish?: (program: AdminProgram) => void;
}

// ============================================================================
// Status Badge
// ============================================================================

const StatusBadge = ({ status }: { status: AdminProgram['status'] }) => {
  const variants: Record<
    AdminProgram['status'],
    { variant: 'default' | 'secondary' | 'outline'; label: string }
  > = {
    draft: { variant: 'secondary', label: 'Draft' },
    published: { variant: 'default', label: 'Published' },
    archived: { variant: 'outline', label: 'Archived' },
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
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
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

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={6} className="h-32 text-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <BookOpen className="h-8 w-8" />
        <p>No programs found</p>
        <p className="text-sm">Create your first program to get started</p>
      </div>
    </TableCell>
  </TableRow>
);

// ============================================================================
// Main Component
// ============================================================================

export const ProgramsTable = ({
  programs,
  isLoading,
  onArchive,
  onDelete,
  onPublish,
}: ProgramsTableProps) => {
  const navigate = useNavigate();

  const handleViewProgram = (programId: string) => {
    navigate(`/admin/programs/${programId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Program</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                <span>Enrolled</span>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span>Avg. Completion</span>
              </div>
            </TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : programs.length === 0 ? (
            <EmptyState />
          ) : (
            programs.map((program) => (
              <TableRow
                key={program.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleViewProgram(program.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    {program.thumbnail_url ? (
                      <img
                        src={program.thumbnail_url}
                        alt={program.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{program.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {program.phase_count} phases, {program.lesson_count}{' '}
                        lessons
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <StatusBadge status={program.status} />
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{program.enrolled_count}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress
                      value={program.avg_completion_percent}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-10">
                      {program.avg_completion_percent}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(program.created_at)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewProgram(program.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          navigate(`/admin/programs/${program.id}?tab=settings`)
                        }
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {program.status === 'draft' && onPublish && (
                        <DropdownMenuItem onClick={() => onPublish(program)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      {program.status === 'published' && onArchive && (
                        <DropdownMenuItem onClick={() => onArchive(program)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      {program.status !== 'published' &&
                        program.enrolled_count === 0 &&
                        onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(program)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// ============================================================================
// Mobile Card View (for responsive design)
// ============================================================================

export const ProgramsCards = ({
  programs,
  isLoading,
  onArchive,
  onDelete,
  onPublish,
}: ProgramsTableProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No programs found</p>
        <p className="text-sm text-muted-foreground">
          Create your first program to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {programs.map((program) => (
        <div
          key={program.id}
          className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate(`/admin/programs/${program.id}`)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {program.thumbnail_url ? (
                <img
                  src={program.thumbnail_url}
                  alt={program.title}
                  className="w-14 h-14 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded bg-muted flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{program.title}</p>
                <p className="text-sm text-muted-foreground">
                  {program.phase_count} phases, {program.lesson_count} lessons
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={program.status} />
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/programs/${program.id}`);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/programs/${program.id}?tab=settings`);
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {program.status === 'draft' && onPublish && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onPublish(program);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Publish
                  </DropdownMenuItem>
                )}
                {program.status === 'published' && onArchive && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(program);
                    }}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                )}
                {program.status !== 'published' &&
                  program.enrolled_count === 0 &&
                  onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(program);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{program.enrolled_count} enrolled</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Progress
                value={program.avg_completion_percent}
                className="h-2 flex-1 max-w-[100px]"
              />
              <span className="text-muted-foreground">
                {program.avg_completion_percent}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgramsTable;
