// ============================================================================
// SEARCH FILTERS COMPONENT
// ============================================================================
// Faceted filter controls for compliance search including state selection,
// section type filter, and match count configuration.
// ============================================================================

import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Filter, MapPin, FolderOpen, Hash } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
] as const;

export const SECTION_TYPES = [
  { value: 'licensure', label: 'State Licensure', icon: '📋' },
  { value: 'fha', label: 'Fair Housing Act', icon: '🏠' },
  { value: 'local', label: 'Local Ordinances', icon: '🏛️' },
  { value: 'definitions', label: 'Definitions', icon: '📖' },
  { value: 'staffing', label: 'Staffing Requirements', icon: '👥' },
  { value: 'physical', label: 'Physical Requirements', icon: '🔧' },
  { value: 'operations', label: 'Operations', icon: '⚙️' },
  { value: 'populations', label: 'Target Populations', icon: '🎯' },
] as const;

export const MATCH_COUNT_OPTIONS = [
  { value: 5, label: '5 results' },
  { value: 10, label: '10 results' },
  { value: 20, label: '20 results' },
  { value: 50, label: '50 results' },
] as const;

// ============================================================================
// TYPES
// ============================================================================

export interface SearchFiltersProps {
  stateFilter?: string;
  sectionFilter?: string;
  matchCount: number;
  onStateChange: (state: string | undefined) => void;
  onSectionChange: (section: string | undefined) => void;
  onMatchCountChange: (count: number) => void;
  variant?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SearchFilters({
  stateFilter,
  sectionFilter,
  matchCount,
  onStateChange,
  onSectionChange,
  onMatchCountChange,
  variant = 'horizontal',
  showLabels = true,
  className = '',
}: SearchFiltersProps) {
  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (stateFilter) count++;
    if (sectionFilter) count++;
    return count;
  }, [stateFilter, sectionFilter]);

  // Clear all filters
  const clearFilters = () => {
    onStateChange(undefined);
    onSectionChange(undefined);
  };

  // Get state name from code
  const getStateName = (code: string) => {
    const state = US_STATES.find((s) => s.code === code);
    return state?.name || code;
  };

  // Get section label from value
  const getSectionLabel = (value: string) => {
    const section = SECTION_TYPES.find((s) => s.value === value);
    return section?.label || value;
  };

  // Container classes based on variant
  const containerClasses = useMemo(() => {
    const base = 'gap-4';
    switch (variant) {
      case 'vertical':
        return `flex flex-col ${base}`;
      case 'compact':
        return `flex flex-wrap items-center gap-2`;
      case 'horizontal':
      default:
        return `flex flex-col sm:flex-row sm:items-end ${base}`;
    }
  }, [variant]);

  return (
    <div className={`${className}`}>
      <div className={containerClasses}>
        {/* State Filter */}
        <div className={variant === 'compact' ? '' : 'flex-1 min-w-[180px]'}>
          {showLabels && variant !== 'compact' && (
            <Label className="flex items-center gap-1.5 mb-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              State
            </Label>
          )}
          <Select
            value={stateFilter || 'all'}
            onValueChange={(value) =>
              onStateChange(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className={variant === 'compact' ? 'w-[140px]' : ''}>
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All States</SelectItem>
              {US_STATES.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section Type Filter */}
        <div className={variant === 'compact' ? '' : 'flex-1 min-w-[180px]'}>
          {showLabels && variant !== 'compact' && (
            <Label className="flex items-center gap-1.5 mb-1.5 text-sm text-muted-foreground">
              <FolderOpen className="h-3.5 w-3.5" />
              Section Type
            </Label>
          )}
          <Select
            value={sectionFilter || 'all'}
            onValueChange={(value) =>
              onSectionChange(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className={variant === 'compact' ? 'w-[160px]' : ''}>
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {SECTION_TYPES.map((section) => (
                <SelectItem key={section.value} value={section.value}>
                  <span className="flex items-center gap-2">
                    <span>{section.icon}</span>
                    <span>{section.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Match Count */}
        <div className={variant === 'compact' ? '' : 'flex-1 min-w-[140px]'}>
          {showLabels && variant !== 'compact' && (
            <Label className="flex items-center gap-1.5 mb-1.5 text-sm text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              Results
            </Label>
          )}
          <Select
            value={matchCount.toString()}
            onValueChange={(value) => onMatchCountChange(parseInt(value, 10))}
          >
            <SelectTrigger className={variant === 'compact' ? 'w-[120px]' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATCH_COUNT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button (only show if filters active) */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size={variant === 'compact' ? 'sm' : 'default'}
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Badges */}
      {activeFiltersCount > 0 && variant !== 'compact' && (
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Active filters:
          </div>
          {stateFilter && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/10"
              onClick={() => onStateChange(undefined)}
            >
              <MapPin className="h-3 w-3 mr-1" />
              {getStateName(stateFilter)}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {sectionFilter && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/10"
              onClick={() => onSectionChange(undefined)}
            >
              <FolderOpen className="h-3 w-3 mr-1" />
              {getSectionLabel(sectionFilter)}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SearchFilters;
