// ============================================================================
// FEAT-GH-010: Programs Filter Component
// ============================================================================
// Filter tabs for Programs Hub: All | In Progress | Completed
// ============================================================================

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { ProgramsFilterStatus } from '@/types/programs';

interface ProgramsFilterProps {
  activeStatus: ProgramsFilterStatus;
  onStatusChange: (status: ProgramsFilterStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts?: {
    all: number;
    in_progress: number;
    completed: number;
    not_started: number;
  };
  showSearch?: boolean;
}

export const ProgramsFilter = ({
  activeStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  counts,
  showSearch = true,
}: ProgramsFilterProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
      {/* Filter Tabs */}
      <Tabs
        value={activeStatus}
        onValueChange={(value) => onStatusChange(value as ProgramsFilterStatus)}
        className="w-full sm:w-auto"
      >
        <TabsList className="grid w-full sm:w-auto grid-cols-4 h-auto">
          <TabsTrigger
            value="all"
            className="text-xs sm:text-sm px-2 sm:px-4 py-2"
          >
            All
            {counts && <span className="ml-1.5 text-muted-foreground">({counts.all})</span>}
          </TabsTrigger>
          <TabsTrigger
            value="in_progress"
            className="text-xs sm:text-sm px-2 sm:px-4 py-2"
          >
            In Progress
            {counts && counts.in_progress > 0 && (
              <span className="ml-1.5 text-muted-foreground">({counts.in_progress})</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="text-xs sm:text-sm px-2 sm:px-4 py-2"
          >
            Completed
            {counts && counts.completed > 0 && (
              <span className="ml-1.5 text-muted-foreground">({counts.completed})</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="not_started"
            className="text-xs sm:text-sm px-2 sm:px-4 py-2"
          >
            Not Started
            {counts && counts.not_started > 0 && (
              <span className="ml-1.5 text-muted-foreground">({counts.not_started})</span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search Input */}
      {showSearch && (
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
    </div>
  );
};

export default ProgramsFilter;
