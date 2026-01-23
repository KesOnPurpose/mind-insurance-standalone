// ============================================================================
// FEAT-GH-021: Tactic Library Browser Component
// ============================================================================
// Browse and select tactics from gh_tactic_instructions master library
// Supports search, grouping by week, multi-select, and duplicate prevention
// ============================================================================

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Plus,
  Loader2,
  AlertCircle,
  Video,
  Link2,
  Clock,
  Info,
} from 'lucide-react';
import { useLibraryTactics, useCopyLibraryTactic } from '@/hooks/useAdminPrograms';
import type { LibraryTactic, TacticLibraryGroup, UsedTactic } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface TacticLibraryBrowserProps {
  lessonId: string;
  programId: string;
  currentTacticsCount: number; // For calculating order_index
  onTacticsAdded: () => void; // Callback when tactics are successfully added
  onClose: () => void;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

const LibrarySkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-10 w-full" />
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <div className="space-y-2 pl-4">
            {Array.from({ length: 2 }).map((_, j) => (
              <Skeleton key={j} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// Empty State
// ============================================================================

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <CheckSquare className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="font-semibold text-lg mb-1">No Tactics Found</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      No matching tactics in the library. Try adjusting your search.
    </p>
  </div>
);

// ============================================================================
// Tactic Item Component
// ============================================================================

interface TacticItemProps {
  tactic: LibraryTactic;
  isSelected: boolean;
  isUsed: boolean;
  usedInLesson?: string;
  onToggle: (tactic: LibraryTactic) => void;
}

const TacticItem = ({
  tactic,
  isSelected,
  isUsed,
  usedInLesson,
  onToggle,
}: TacticItemProps) => {
  const isDisabled = isUsed;

  return (
    <TooltipProvider>
      <div
        className={`
          flex items-start gap-3 p-3 rounded-lg border transition-all
          ${isDisabled
            ? 'opacity-50 cursor-not-allowed bg-muted/30'
            : isSelected
              ? 'border-primary bg-primary/5 cursor-pointer'
              : 'border-border hover:border-primary/50 cursor-pointer hover:bg-muted/30'
          }
        `}
        onClick={() => !isDisabled && onToggle(tactic)}
      >
        {/* Checkbox */}
        <div className="pt-0.5">
          {isDisabled ? (
            <Tooltip>
              <TooltipTrigger>
                <div className="h-4 w-4 rounded border border-muted-foreground/30 bg-muted flex items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Already added to {usedInLesson}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Checkbox
              checked={isSelected}
              className="pointer-events-none"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isDisabled ? 'text-muted-foreground' : ''}`}>
              {tactic.tactic_name}
            </span>
            {tactic.video_url && (
              <Tooltip>
                <TooltipTrigger>
                  <Video className="h-3.5 w-3.5 text-primary" />
                </TooltipTrigger>
                <TooltipContent>Has video resource</TooltipContent>
              </Tooltip>
            )}
          </div>

          {tactic.why_it_matters && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {tactic.why_it_matters}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            {tactic.category && (
              <Badge variant="outline" className="text-xs">
                {tactic.category}
              </Badge>
            )}
            {tactic.estimated_time && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {tactic.estimated_time}
              </span>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// ============================================================================
// Week Group Component
// ============================================================================

interface WeekGroupProps {
  group: TacticLibraryGroup;
  selectedTactics: Set<string>;
  usedTacticMap: Map<string, string>; // tactic_id -> lesson_title
  onToggleTactic: (tactic: LibraryTactic) => void;
  searchQuery: string;
}

const WeekGroup = ({
  group,
  selectedTactics,
  usedTacticMap,
  onToggleTactic,
  searchQuery,
}: WeekGroupProps) => {
  const [isOpen, setIsOpen] = useState(true);

  // Filter tactics by search query
  const filteredTactics = useMemo(() => {
    if (!searchQuery.trim()) return group.tactics;

    const lower = searchQuery.toLowerCase();
    return group.tactics.filter(
      (t) =>
        t.tactic_name.toLowerCase().includes(lower) ||
        t.why_it_matters?.toLowerCase().includes(lower) ||
        t.category?.toLowerCase().includes(lower)
    );
  }, [group.tactics, searchQuery]);

  // Don't render if no matching tactics
  if (filteredTactics.length === 0) return null;

  const selectedInGroup = filteredTactics.filter((t) =>
    selectedTactics.has(t.id)
  ).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">{group.week_title}</span>
          <Badge variant="secondary" className="text-xs">
            {filteredTactics.length}
          </Badge>
        </div>
        {selectedInGroup > 0 && (
          <Badge variant="default" className="text-xs">
            {selectedInGroup} selected
          </Badge>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-2 pl-6 mt-2">
          {filteredTactics.map((tactic) => (
            <TacticItem
              key={tactic.id}
              tactic={tactic}
              isSelected={selectedTactics.has(tactic.id)}
              isUsed={usedTacticMap.has(tactic.id)}
              usedInLesson={usedTacticMap.get(tactic.id)}
              onToggle={onToggleTactic}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const TacticLibraryBrowser = ({
  lessonId,
  programId,
  currentTacticsCount,
  onTacticsAdded,
  onClose,
}: TacticLibraryBrowserProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTactics, setSelectedTactics] = useState<Map<string, LibraryTactic>>(
    new Map()
  );

  // Fetch library tactics and used tactics
  const { groupedTactics, usedTactics, isLoading, error } = useLibraryTactics({
    tacticSource: 'mentorship',
    programId,
  });

  const { copyTactics, isCopying } = useCopyLibraryTactic();

  // Build map of used tactic IDs -> lesson titles for quick lookup
  const usedTacticMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const used of usedTactics) {
      map.set(used.source_tactic_id, used.lesson_title);
    }
    return map;
  }, [usedTactics]);

  // Toggle tactic selection
  const handleToggleTactic = (tactic: LibraryTactic) => {
    setSelectedTactics((prev) => {
      const next = new Map(prev);
      if (next.has(tactic.id)) {
        next.delete(tactic.id);
      } else {
        next.set(tactic.id, tactic);
      }
      return next;
    });
  };

  // Add selected tactics to the lesson
  const handleAddSelected = async () => {
    if (selectedTactics.size === 0) return;

    const tacticsToAdd = Array.from(selectedTactics.values()).map(
      (tactic, index) => ({
        lesson_id: lessonId,
        library_tactic: tactic,
        order_index: currentTacticsCount + index,
      })
    );

    const result = await copyTactics(tacticsToAdd);

    if (result.success_count > 0) {
      onTacticsAdded();
      onClose();
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedTactics(new Map());
  };

  // Filter groups that have matching tactics
  const hasResults = useMemo(() => {
    if (!searchQuery.trim()) return groupedTactics.length > 0;

    const lower = searchQuery.toLowerCase();
    return groupedTactics.some((group) =>
      group.tactics.some(
        (t) =>
          t.tactic_name.toLowerCase().includes(lower) ||
          t.why_it_matters?.toLowerCase().includes(lower) ||
          t.category?.toLowerCase().includes(lower)
      )
    );
  }, [groupedTactics, searchQuery]);

  if (isLoading) {
    return <LibrarySkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="font-semibold text-lg mb-1">Error Loading Library</h3>
        <p className="text-sm text-muted-foreground">
          {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tactics by name, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary">
            Select tactics from the library to add them to this lesson. Tactics already
            used in other lessons are grayed out to prevent duplicates.
          </p>
        </div>
      </div>

      {/* Tactics List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {!hasResults ? (
            <EmptyState />
          ) : (
            groupedTactics.map((group) => (
              <WeekGroup
                key={group.week_number}
                group={group}
                selectedTactics={new Set(selectedTactics.keys())}
                usedTacticMap={usedTacticMap}
                onToggleTactic={handleToggleTactic}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer with Actions */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedTactics.size > 0 ? (
              <span className="flex items-center gap-2">
                <Badge variant="default">{selectedTactics.size}</Badge>
                tactic{selectedTactics.size !== 1 ? 's' : ''} selected
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              </span>
            ) : (
              <span>Select tactics to add to this lesson</span>
            )}
          </div>

          <Button
            onClick={handleAddSelected}
            disabled={selectedTactics.size === 0 || isCopying}
          >
            {isCopying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add {selectedTactics.size > 0 ? selectedTactics.size : ''} Tactic
                {selectedTactics.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TacticLibraryBrowser;
