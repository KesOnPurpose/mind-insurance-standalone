// ============================================================================
// ASSESSMENT PROGRESS COMPONENT
// ============================================================================
// Displays section completion progress for the compliance assessment wizard
// Shows all 11 sections with their status (pending, in_progress, complete)
// ============================================================================

import { cn } from '@/lib/utils';
import { Check, Circle, Clock, AlertCircle } from 'lucide-react';
import type { SectionProgress, SectionStatus } from '@/types/compliance';
import { SECTION_ORDER, SECTION_TITLES } from '@/services/complianceAssessmentService';

// ============================================================================
// TYPES
// ============================================================================

interface AssessmentProgressProps {
  sectionProgress: SectionProgress;
  currentSection: string;
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

interface SectionItemProps {
  sectionId: string;
  title: string;
  status: SectionStatus;
  isCurrent: boolean;
  isClickable: boolean;
  onClick?: () => void;
}

// ============================================================================
// SECTION GROUPS (for visual grouping)
// ============================================================================

const SECTION_GROUPS = [
  {
    label: 'Foundation',
    sections: ['0'],
  },
  {
    label: 'State Requirements',
    sections: ['1.1', '1.2'],
  },
  {
    label: 'Local Rules',
    sections: ['1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5', '1.3.6'],
  },
  {
    label: 'Classification',
    sections: ['1.4', '1.5'],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusIcon = (status: SectionStatus, isCurrent: boolean) => {
  if (isCurrent) {
    return <Clock className="h-4 w-4 text-primary animate-pulse" />;
  }

  switch (status) {
    case 'complete':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'flagged':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusColor = (status: SectionStatus, isCurrent: boolean): string => {
  if (isCurrent) {
    return 'border-primary bg-primary/10';
  }

  switch (status) {
    case 'complete':
      return 'border-green-500 bg-green-50 dark:bg-green-950/30';
    case 'in_progress':
      return 'border-amber-500 bg-amber-50 dark:bg-amber-950/30';
    case 'flagged':
      return 'border-red-500 bg-red-50 dark:bg-red-950/30';
    default:
      return 'border-muted bg-background';
  }
};

// ============================================================================
// SECTION ITEM COMPONENT
// ============================================================================

const SectionItem = ({
  sectionId,
  title,
  status,
  isCurrent,
  isClickable,
  onClick,
}: SectionItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md border text-left w-full transition-colors',
        getStatusColor(status, isCurrent),
        isClickable && 'hover:bg-accent cursor-pointer',
        !isClickable && 'cursor-default opacity-70'
      )}
    >
      <div className="shrink-0">
        {getStatusIcon(status, isCurrent)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {sectionId}
          </span>
          {isCurrent && (
            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              Current
            </span>
          )}
        </div>
        <p className="text-sm font-medium truncate">{title}</p>
      </div>
    </button>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AssessmentProgress = ({
  sectionProgress,
  currentSection,
  onSectionClick,
  className,
}: AssessmentProgressProps) => {
  // Calculate overall progress
  const completedCount = SECTION_ORDER.filter(
    (id) => sectionProgress[id] === 'complete'
  ).length;
  const totalCount = SECTION_ORDER.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Determine if a section is clickable (can navigate to completed or current sections)
  const canNavigateTo = (sectionId: string): boolean => {
    const sectionIndex = SECTION_ORDER.indexOf(sectionId);
    const currentIndex = SECTION_ORDER.indexOf(currentSection);

    // Can navigate to completed sections or the current one
    return sectionProgress[sectionId] === 'complete' || sectionIndex <= currentIndex;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Assessment Progress</span>
          <span className="text-muted-foreground">
            {completedCount} of {totalCount} sections
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {progressPercent}% complete
        </p>
      </div>

      {/* Section Groups */}
      <div className="space-y-6">
        {SECTION_GROUPS.map((group) => (
          <div key={group.label} className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </h4>
            <div className="space-y-1">
              {group.sections.map((sectionId) => (
                <SectionItem
                  key={sectionId}
                  sectionId={sectionId}
                  title={SECTION_TITLES[sectionId] || sectionId}
                  status={sectionProgress[sectionId] || 'pending'}
                  isCurrent={sectionId === currentSection}
                  isClickable={!!onSectionClick && canNavigateTo(sectionId)}
                  onClick={() => onSectionClick?.(sectionId)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssessmentProgress;
