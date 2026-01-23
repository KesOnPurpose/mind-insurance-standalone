// ============================================================================
// FEAT-GH-016: Tactics Tab Component
// ============================================================================
// CRUD tactics list - THE KEY DIFFERENTIATOR!
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Target,
  GripVertical,
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  ExternalLink,
  CheckSquare,
  Type,
  Upload,
  Link2,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { TacticEditor } from './TacticEditor';
import {
  useCreateTactic,
  useUpdateTactic,
  useDeleteTactic,
  useReorderTactics,
} from '@/hooks/useAdminPrograms';
import type { AdminTactic, TacticFormData } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface TacticsTabProps {
  lessonId: string;
  programId: string; // FEAT-GH-021: Required for library browser duplicate detection
  tactics: AdminTactic[];
  onRefresh: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Tactic Type Icons
// ============================================================================

const TacticTypeIcon = ({ type }: { type: AdminTactic['tactic_type'] }) => {
  const icons: Record<string, React.ReactNode> = {
    checkbox: <CheckSquare className="h-4 w-4" />,
    text_input: <Type className="h-4 w-4" />,
    file_upload: <Upload className="h-4 w-4" />,
    link_submit: <Link2 className="h-4 w-4" />,
    reflection: <MessageSquare className="h-4 w-4" />,
  };
  return <>{icons[type] || icons.checkbox}</>;
};

// ============================================================================
// Loading Skeleton
// ============================================================================

const TacticsSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    ))}
  </div>
);

// ============================================================================
// Empty State
// ============================================================================

const EmptyState = ({ onAddTactic }: { onAddTactic: () => void }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Target className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-1">No Tactics Yet</h3>
      <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
        Tactics are THE KEY DIFFERENTIATOR! Add action items for learners to
        complete and apply what they've learned.
      </p>
      <Button onClick={onAddTactic}>
        <Plus className="mr-2 h-4 w-4" />
        Add First Tactic
      </Button>
    </CardContent>
  </Card>
);

// ============================================================================
// Tactic Row Component
// ============================================================================

interface TacticRowProps {
  tactic: AdminTactic;
  index: number;
  onEdit: (tactic: AdminTactic) => void;
  onDelete: (tactic: AdminTactic) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

const TacticRow = ({
  tactic,
  index,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
}: TacticRowProps) => {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={`
        group flex items-center gap-3 p-3 rounded-lg border bg-card transition-all
        ${isDragging ? 'opacity-50' : ''}
        ${dragOverIndex === index ? 'border-primary border-dashed' : 'border-border'}
        hover:shadow-sm cursor-grab active:cursor-grabbing
      `}
    >
      {/* Drag Handle */}
      <div className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Order Index */}
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
        {index + 1}
      </div>

      {/* Tactic Type Icon */}
      <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center text-muted-foreground flex-shrink-0">
        <TacticTypeIcon type={tactic.tactic_type} />
      </div>

      {/* Tactic Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{tactic.label}</span>
          {tactic.reference_url && (
            <a
              href={tactic.reference_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        {tactic.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {tactic.description}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        {tactic.is_required ? (
          <Badge variant="secondary" className="text-xs gap-1">
            <Star className="h-3 w-3" />
            Required
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Optional
          </Badge>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Tactic actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(tactic)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Tactic
          </DropdownMenuItem>
          {tactic.reference_url && (
            <DropdownMenuItem asChild>
              <a
                href={tactic.reference_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Reference
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(tactic)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Tactic
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const TacticsTab = ({
  lessonId,
  programId,
  tactics,
  onRefresh,
  isLoading,
}: TacticsTabProps) => {
  // Mutations
  const { createTactic, isCreating } = useCreateTactic();
  const { updateTactic, isUpdating } = useUpdateTactic();
  const { deleteTactic, isDeleting } = useDeleteTactic();
  const { reorderTactics, isReordering } = useReorderTactics();

  // Local state for optimistic reordering
  const [localTactics, setLocalTactics] = useState<AdminTactic[]>(tactics);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingTactic, setEditingTactic] = useState<AdminTactic | null>(null);

  // Delete confirmation
  const [tacticToDelete, setTacticToDelete] = useState<AdminTactic | null>(null);

  // Update local tactics when prop changes
  useEffect(() => {
    if (!dragIndex) {
      setLocalTactics(tactics);
    }
  }, [tactics, dragIndex]);

  // Drag handlers
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) return;
      setDragOverIndex(index);
    },
    [dragIndex]
  );

  const handleDragEnd = useCallback(async () => {
    if (
      dragIndex === null ||
      dragOverIndex === null ||
      dragIndex === dragOverIndex
    ) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder locally (optimistic update)
    const newTactics = [...localTactics];
    const [movedTactic] = newTactics.splice(dragIndex, 1);
    newTactics.splice(dragOverIndex, 0, movedTactic);
    setLocalTactics(newTactics);

    // Reset drag state
    setDragIndex(null);
    setDragOverIndex(null);

    // Save to database
    const orderedIds = newTactics.map((t) => t.id);
    const success = await reorderTactics(lessonId, orderedIds);

    if (!success) {
      // Revert on failure
      setLocalTactics(tactics);
    } else {
      onRefresh();
    }
  }, [dragIndex, dragOverIndex, localTactics, tactics, lessonId, reorderTactics, onRefresh]);

  // Add tactic
  const handleAddTactic = () => {
    setEditingTactic(null);
    setShowEditor(true);
  };

  // Edit tactic
  const handleEditTactic = (tactic: AdminTactic) => {
    setEditingTactic(tactic);
    setShowEditor(true);
  };

  // Save tactic (create or update)
  const handleSaveTactic = async (data: TacticFormData) => {
    if (editingTactic) {
      const success = await updateTactic(editingTactic.id, data);
      if (success) {
        setShowEditor(false);
        onRefresh();
      }
    } else {
      const newId = await createTactic(lessonId, data);
      if (newId) {
        setShowEditor(false);
        onRefresh();
      }
    }
  };

  // Delete tactic
  const handleDeleteTactic = (tactic: AdminTactic) => {
    setTacticToDelete(tactic);
  };

  const confirmDelete = async () => {
    if (!tacticToDelete) return;

    const success = await deleteTactic(tacticToDelete.id, lessonId);
    if (success) {
      onRefresh();
    }
    setTacticToDelete(null);
  };

  // Stats
  const requiredCount = localTactics.filter((t) => t.is_required).length;
  const optionalCount = localTactics.length - requiredCount;

  if (isLoading) {
    return <TacticsSkeleton />;
  }

  if (localTactics.length === 0) {
    return (
      <>
        <EmptyState onAddTactic={handleAddTactic} />
        <TacticEditor
          open={showEditor}
          onOpenChange={setShowEditor}
          tactic={editingTactic}
          onSave={handleSaveTactic}
          isSaving={isCreating || isUpdating}
          lessonId={lessonId}
          programId={programId}
          currentTacticsCount={localTactics.length}
          onLibraryTacticsAdded={onRefresh}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Tactics
              </CardTitle>
              <CardDescription>
                THE KEY DIFFERENTIATOR - Action items for learners to complete
              </CardDescription>
            </div>
            <Button onClick={handleAddTactic}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tactic
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <span>
              <strong>{localTactics.length}</strong> total
            </span>
            <span className="text-muted-foreground">|</span>
            <span>
              <strong>{requiredCount}</strong> required
            </span>
            <span className="text-muted-foreground">|</span>
            <span>
              <strong>{optionalCount}</strong> optional
            </span>
            {isReordering && (
              <span className="text-muted-foreground animate-pulse">
                Saving order...
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tactics List */}
      <div className="space-y-2">
        {localTactics.map((tactic, index) => (
          <TacticRow
            key={tactic.id}
            tactic={tactic}
            index={index}
            onEdit={handleEditTactic}
            onDelete={handleDeleteTactic}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            isDragging={dragIndex === index}
            dragOverIndex={dragOverIndex}
          />
        ))}
      </div>

      {/* Tip Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm text-primary">
            <strong>Pro Tip:</strong> Drag tactics to reorder them. Required tactics
            must be completed before learners can mark the lesson as done.
          </p>
        </CardContent>
      </Card>

      {/* Tactic Editor Dialog */}
      <TacticEditor
        open={showEditor}
        onOpenChange={setShowEditor}
        tactic={editingTactic}
        onSave={handleSaveTactic}
        isSaving={isCreating || isUpdating}
        lessonId={lessonId}
        programId={programId}
        currentTacticsCount={localTactics.length}
        onLibraryTacticsAdded={onRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!tacticToDelete}
        onOpenChange={(open) => !open && setTacticToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Tactic
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{tacticToDelete?.label}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Tactic'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TacticsTab;
