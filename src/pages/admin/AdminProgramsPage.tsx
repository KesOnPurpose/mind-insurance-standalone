// ============================================================================
// FEAT-GH-014: Admin Programs Page
// ============================================================================
// List view of all programs with stats and management actions
// Route: /admin/programs
// ============================================================================

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Plus, Search, RefreshCw, BookOpen } from 'lucide-react';
import { useAdminPrograms, useUpdateProgram, useDeleteProgram } from '@/hooks/useAdminPrograms';
import {
  ProgramsTable,
  ProgramsCards,
  CreateProgramModal,
} from '@/components/admin/programs';
import type { AdminProgram } from '@/types/programs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ============================================================================
// Main Component
// ============================================================================

export const AdminProgramsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>(
    (searchParams.get('status') as 'all' | 'draft' | 'published' | 'archived') || 'all'
  );
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [programToArchive, setProgramToArchive] = useState<AdminProgram | null>(null);
  const [programToDelete, setProgramToDelete] = useState<AdminProgram | null>(null);

  // Hooks
  const { programs, isLoading, refetch } = useAdminPrograms({
    filterStatus: statusFilter,
    searchQuery: debouncedSearch,
  });
  const { updateProgram, isUpdating } = useUpdateProgram();
  const { deleteProgram, isDeleting } = useDeleteProgram();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync status filter to URL
  useEffect(() => {
    if (statusFilter === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', statusFilter);
    }
    setSearchParams(searchParams, { replace: true });
  }, [statusFilter, searchParams, setSearchParams]);

  // Handle program actions
  const handlePublish = async (program: AdminProgram) => {
    const success = await updateProgram(program.id, { status: 'published' });
    if (success) {
      refetch();
    }
  };

  const handleArchive = async () => {
    if (!programToArchive) return;
    const success = await updateProgram(programToArchive.id, { status: 'archived' });
    if (success) {
      refetch();
    }
    setProgramToArchive(null);
  };

  const handleDelete = async () => {
    if (!programToDelete) return;
    const success = await deleteProgram(programToDelete.id);
    if (success) {
      refetch();
    }
    setProgramToDelete(null);
  };

  return (
    <SidebarLayout mode="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
            <p className="text-muted-foreground">
              Manage your course programs and track learner progress
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Program
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as 'all' | 'draft' | 'published' | 'archived')
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        {/* Programs List */}
        {isMobile ? (
          <ProgramsCards
            programs={programs}
            isLoading={isLoading}
            onArchive={(program) => setProgramToArchive(program)}
            onDelete={(program) => setProgramToDelete(program)}
            onPublish={handlePublish}
          />
        ) : (
          <ProgramsTable
            programs={programs}
            isLoading={isLoading}
            onArchive={(program) => setProgramToArchive(program)}
            onDelete={(program) => setProgramToDelete(program)}
            onPublish={handlePublish}
          />
        )}

        {/* Summary */}
        {!isLoading && programs.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {programs.length} program{programs.length === 1 ? '' : 's'}
          </p>
        )}

        {/* Empty State when no programs at all */}
        {!isLoading && programs.length === 0 && !debouncedSearch && statusFilter === 'all' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No Programs Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create your first program to start building courses and enrolling learners.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Program
            </Button>
          </div>
        )}
      </div>

      {/* Create Program Modal */}
      <CreateProgramModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Archive Confirmation Dialog */}
      <AlertDialog
        open={!!programToArchive}
        onOpenChange={(open) => !open && setProgramToArchive(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Program?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide "{programToArchive?.title}" from learners. Existing enrollees
              will retain their progress but won't be able to continue. You can restore
              it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isUpdating}>
              {isUpdating ? 'Archiving...' : 'Archive Program'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!programToDelete}
        onOpenChange={(open) => !open && setProgramToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              "{programToDelete?.title}" and all its phases, lessons, and tactics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Forever'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarLayout>
  );
};

export default AdminProgramsPage;
