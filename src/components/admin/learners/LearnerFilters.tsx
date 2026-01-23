// ============================================================================
// FEAT-GH-018: Learner Filters Component
// ============================================================================
// Filters for the learners table: Phase, completion %, stuck status, drip status
// ============================================================================

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, Filter, X } from 'lucide-react';
import type { LearnerFilterOptions, Phase } from '@/types/programs';

// ============================================================================
// Types
// ============================================================================

interface LearnerFiltersProps {
  phases: Phase[];
  filters: LearnerFilterOptions;
  onFiltersChange: (filters: LearnerFilterOptions) => void;
  totalCount: number;
  filteredCount: number;
}

// ============================================================================
// Default Filters
// ============================================================================

export const defaultFilters: LearnerFilterOptions = {
  phaseId: null,
  minCompletionPercent: null,
  maxCompletionPercent: null,
  isStuck: null,
  dripStatus: null,
  status: 'all',
  searchQuery: '',
};

// ============================================================================
// Main Component
// ============================================================================

export const LearnerFilters = ({
  phases,
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: LearnerFiltersProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Count active filters (excluding search)
  const activeFilterCount = [
    filters.phaseId,
    filters.minCompletionPercent !== null || filters.maxCompletionPercent !== null,
    filters.isStuck !== null,
    filters.dripStatus && filters.dripStatus !== 'all',
    filters.status !== 'all',
  ].filter(Boolean).length;

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value as LearnerFilterOptions['status'],
    });
  };

  const handlePhaseChange = (value: string) => {
    onFiltersChange({
      ...filters,
      phaseId: value === 'all' ? null : value,
    });
  };

  const handleStuckChange = (value: string) => {
    onFiltersChange({
      ...filters,
      isStuck: value === 'all' ? null : value === 'true',
    });
  };

  const handleDripStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dripStatus: value === 'all' ? null : (value as LearnerFilterOptions['dripStatus']),
    });
  };

  const handleCompletionRangeChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      minCompletionPercent: values[0] === 0 ? null : values[0],
      maxCompletionPercent: values[1] === 100 ? null : values[1],
    });
  };

  const handleClearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const hasFilters = activeFilterCount > 0 || filters.searchQuery !== '';

  return (
    <div className="space-y-4">
      {/* Main filter row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
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

        {/* Phase filter */}
        <Select
          value={filters.phaseId || 'all'}
          onValueChange={handlePhaseChange}
        >
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

        {/* Advanced filters popover */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="font-medium">Advanced Filters</div>

              {/* Completion % range */}
              <div className="space-y-2">
                <Label>Completion %</Label>
                <Slider
                  value={[
                    filters.minCompletionPercent ?? 0,
                    filters.maxCompletionPercent ?? 100,
                  ]}
                  onValueChange={handleCompletionRangeChange}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{filters.minCompletionPercent ?? 0}%</span>
                  <span>{filters.maxCompletionPercent ?? 100}%</span>
                </div>
              </div>

              {/* Stuck status */}
              <div className="space-y-2">
                <Label>Stuck Status</Label>
                <Select
                  value={filters.isStuck === null ? 'all' : String(filters.isStuck)}
                  onValueChange={handleStuckChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Learners</SelectItem>
                    <SelectItem value="true">Stuck Only</SelectItem>
                    <SelectItem value="false">Not Stuck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Drip status */}
              <div className="space-y-2">
                <Label>Drip Status</Label>
                <Select
                  value={filters.dripStatus || 'all'}
                  onValueChange={handleDripStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="on_schedule">On Schedule</SelectItem>
                    <SelectItem value="ahead">Ahead</SelectItem>
                    <SelectItem value="behind">Behind</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear filters */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter summary */}
      {hasFilters && filteredCount !== totalCount && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} learners
        </p>
      )}
    </div>
  );
};

export default LearnerFilters;
