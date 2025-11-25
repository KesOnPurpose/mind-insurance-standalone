// BulkActionToolbar Component
// Batch operations for bulk document upload

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2, Sparkles, Trash2 } from 'lucide-react';
import type { BatchAction } from '@/types/bulkUpload';
import {
  DOCUMENT_CATEGORIES,
  DIFFICULTY_LEVELS,
  US_STATES,
} from '@/types/documents';

interface BulkActionToolbarProps {
  onApplyBatchAction: (action: BatchAction) => void;
}

export const BulkActionToolbar = ({ onApplyBatchAction }: BulkActionToolbarProps) => {

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
      <span className="text-sm font-medium mr-2">Batch Actions:</span>

      {/* Approve Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approve
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Approve Documents</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onApplyBatchAction({ type: 'approve_all' })}
          >
            <CheckCircle2 className="h-3 w-3 mr-2" />
            Approve All
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              onApplyBatchAction({ type: 'approve_high_confidence' })
            }
          >
            <Sparkles className="h-3 w-3 mr-2" />
            Approve High Confidence (&gt;90%)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Apply Category */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Apply Category
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-60 overflow-y-auto">
          <DropdownMenuLabel>Set Category for All</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DOCUMENT_CATEGORIES.map((category) => (
            <DropdownMenuItem
              key={category}
              onClick={() =>
                onApplyBatchAction({ type: 'apply_category', category })
              }
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Apply States */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Apply States
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-60 overflow-y-auto">
          <DropdownMenuLabel>Set States for All</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              onApplyBatchAction({ type: 'apply_state', states: ['ALL'] })
            }
          >
            All States
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {US_STATES.map((state) => (
            <DropdownMenuItem
              key={state}
              onClick={() =>
                onApplyBatchAction({ type: 'apply_state', states: [state] })
              }
            >
              {state}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Apply Difficulty */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Apply Difficulty
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Set Difficulty for All</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DIFFICULTY_LEVELS.map((level) => (
            <DropdownMenuItem
              key={level}
              onClick={() =>
                onApplyBatchAction({ type: 'apply_difficulty', difficulty: level })
              }
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove Duplicates */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onApplyBatchAction({ type: 'reject_all_duplicates' })}
        className="gap-1"
      >
        <Trash2 className="h-3 w-3" />
        Remove Duplicates
      </Button>
    </div>
  );
};
