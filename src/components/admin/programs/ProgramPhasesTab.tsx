// ============================================================================
// FEAT-GH-014: Program Phases Tab
// ============================================================================
// Phase list with drag-to-reorder functionality and links to phase builder
// ============================================================================

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GripVertical,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Layers,
  BookOpen,
  Lock,
  Unlock,
  ExternalLink,
} from 'lucide-react';
import { useReorderPhases } from '@/hooks/useAdminPrograms';
import { CreatePhaseModal } from './CreatePhaseModal';
import type { Phase } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface ProgramPhasesTabProps {
  programId: string;
  phases: Phase[];
  isLoading: boolean;
  onRefresh: () => void;
}

// ============================================================================
// Phase Card Component
// ============================================================================

interface PhaseCardProps {
  phase: Phase;
  index: number;
  programId: string;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDelete?: (phase: Phase) => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

const PhaseCard = ({
  phase,
  index,
  programId,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDelete,
  isDragging,
  dragOverIndex,
}: PhaseCardProps) => {
  const navigate = useNavigate();

  const statusBadge = () => {
    if (phase.status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>;
    }
    return <Badge variant="default">Published</Badge>;
  };

  const dripBadge = () => {
    switch (phase.drip_model) {
      case 'calendar':
        return (
          <Badge variant="outline" className="text-xs">
            Calendar Unlock
          </Badge>
        );
      case 'relative':
        return (
          <Badge variant="outline" className="text-xs">
            Day {phase.unlock_offset_days || 0}
          </Badge>
        );
      case 'progress':
        return (
          <Badge variant="outline" className="text-xs">
            Progress Based
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={`
        group border rounded-lg p-4 bg-card transition-all
        ${isDragging ? 'opacity-50' : ''}
        ${dragOverIndex === index ? 'border-primary border-dashed' : ''}
        hover:shadow-md cursor-grab active:cursor-grabbing
      `}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="mt-1 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Phase Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-muted-foreground">
              Phase {index + 1}
            </span>
            {statusBadge()}
            {dripBadge()}
          </div>
          <h3 className="font-semibold truncate">{phase.title}</h3>
          {phase.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {phase.short_description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{phase.total_lessons} lessons</span>
            </div>
            {phase.estimated_duration_minutes && (
              <div className="flex items-center gap-1">
                <span>{phase.estimated_duration_minutes} min</span>
              </div>
            )}
            {phase.is_required ? (
              <div className="flex items-center gap-1 text-amber-600">
                <Lock className="h-4 w-4" />
                <span>Required</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Unlock className="h-4 w-4" />
                <span>Optional</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`/admin/programs/${programId}/phases/${phase.id}`)
            }
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Phase actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  navigate(`/admin/programs/${programId}/phases/${phase.id}`)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Phase
              </DropdownMenuItem>
              {phase.total_lessons === 0 && onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(phase)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Phase
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Loading Skeleton
// ============================================================================

const PhasesSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 mt-1" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    ))}
  </div>
);

// ============================================================================
// Empty State
// ============================================================================

const EmptyState = ({ onAddPhase }: { onAddPhase: () => void }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Layers className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">No Phases Yet</h3>
      <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
        Create phases to organize your program content. Each phase can contain
        multiple lessons.
      </p>
      <Button onClick={onAddPhase}>
        <Plus className="mr-2 h-4 w-4" />
        Add First Phase
      </Button>
    </CardContent>
  </Card>
);

// ============================================================================
// Main Component
// ============================================================================

export const ProgramPhasesTab = ({
  programId,
  phases,
  isLoading,
  onRefresh,
}: ProgramPhasesTabProps) => {
  const { reorderPhases, isReordering } = useReorderPhases();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [localPhases, setLocalPhases] = useState<Phase[]>(phases);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Update local phases when prop changes
  if (phases !== localPhases && !dragIndex) {
    setLocalPhases(phases);
  }

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
    if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder locally
    const newPhases = [...localPhases];
    const [movedPhase] = newPhases.splice(dragIndex, 1);
    newPhases.splice(dragOverIndex, 0, movedPhase);
    setLocalPhases(newPhases);

    // Reset drag state
    setDragIndex(null);
    setDragOverIndex(null);

    // Save to database
    const orderedIds = newPhases.map((p) => p.id);
    const success = await reorderPhases(programId, orderedIds);

    if (!success) {
      // Revert on failure
      setLocalPhases(phases);
    } else {
      onRefresh();
    }
  }, [dragIndex, dragOverIndex, localPhases, phases, programId, reorderPhases, onRefresh]);

  // Add phase handler
  const handleAddPhase = () => {
    setIsCreateModalOpen(true);
  };

  // Delete phase handler (placeholder)
  const handleDeletePhase = (phase: Phase) => {
    // TODO: Implement delete with confirmation
    console.log('Delete phase:', phase.id);
  };

  if (isLoading) {
    return <PhasesSkeleton />;
  }

  if (localPhases.length === 0) {
    return (
      <>
        <EmptyState onAddPhase={handleAddPhase} />
        <CreatePhaseModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          programId={programId}
          onSuccess={() => {
            onRefresh();
          }}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Program Phases</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop to reorder. Click to view or edit.
          </p>
        </div>
        <Button onClick={handleAddPhase}>
          <Plus className="mr-2 h-4 w-4" />
          Add Phase
        </Button>
      </div>

      {/* Phase List */}
      <div className="space-y-3">
        {localPhases.map((phase, index) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            index={index}
            programId={programId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDelete={handleDeletePhase}
            isDragging={dragIndex === index}
            dragOverIndex={dragOverIndex}
          />
        ))}
      </div>

      {/* Reordering indicator */}
      {isReordering && (
        <div className="text-center text-sm text-muted-foreground">
          Saving new order...
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Content</span>
            <div className="flex items-center gap-4">
              <span>
                <strong>{localPhases.length}</strong> phases
              </span>
              <span>
                <strong>
                  {localPhases.reduce((sum, p) => sum + (p.total_lessons || 0), 0)}
                </strong>{' '}
                lessons
              </span>
              <span>
                <strong>
                  {localPhases.reduce((sum, p) => sum + (p.total_tactics || 0), 0)}
                </strong>{' '}
                tactics
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Phase Modal */}
      <CreatePhaseModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        programId={programId}
        onSuccess={() => {
          onRefresh();
        }}
      />
    </div>
  );
};

export default ProgramPhasesTab;
