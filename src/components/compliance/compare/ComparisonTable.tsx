// ============================================================================
// COMPARISON TABLE COMPONENT
// ============================================================================
// Displays side-by-side comparison of state compliance requirements.
// Shows key requirements for each category without anxiety-inducing scores.
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertTriangle,
  Plus,
  ChevronRight,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type StateCode,
  type StateComparisonEntry,
  type ComparisonSection,
  type BinderSectionType,
  STATE_NAMES,
  SECTION_TYPE_LABELS,
} from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface ComparisonTableProps {
  comparisonData: StateComparisonEntry[];
  isLoading?: boolean;
  onAddToBinder?: (stateCode: StateCode, section: ComparisonSection) => void;
  highlightDifferences?: boolean;
  similarityScore?: number;
  keyDifferences?: string[];
  className?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

// NOTE: Complexity scores and risk badges removed per user feedback
// These were causing anxiety for new business owners rather than helping them

function SectionComparison({
  section,
  stateCode,
  onAddToBinder,
  showDiff = false,
  isIdentical = false,
  isUniqueToState = false,
  stateName,
}: {
  section: ComparisonSection;
  stateCode: StateCode;
  onAddToBinder?: (stateCode: StateCode, section: ComparisonSection) => void;
  showDiff?: boolean;
  isIdentical?: boolean;
  isUniqueToState?: boolean;
  stateName?: string;
}) {
  // When highlighting is on and content is identical, dim it
  const contentOpacity = showDiff && isIdentical ? 'opacity-50' : '';

  // When highlighting is on and content differs, add visual emphasis
  const diffHighlight = showDiff && !isIdentical && !isUniqueToState
    ? 'border-l-4 border-l-amber-400 pl-3'
    : '';

  return (
    <div className={cn('space-y-3', contentOpacity, diffHighlight)}>
      {/* Section header with badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="font-medium text-sm">{SECTION_TYPE_LABELS[section.section_type]}</h4>

        {/* "Only in [State]" badge */}
        {showDiff && isUniqueToState && (
          <Badge variant="default" className="bg-blue-500 text-xs">
            Only in {stateName || stateCode}
          </Badge>
        )}

        {/* Identical indicator */}
        {showDiff && isIdentical && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Same across states
          </Badge>
        )}

        {/* Different indicator */}
        {showDiff && !isIdentical && !isUniqueToState && section.differences && section.differences.length > 0 && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
            Differs
          </Badge>
        )}
      </div>

      {/* Content summary */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {section.content_summary}
      </p>

      {/* Key requirements */}
      {section.key_requirements.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Key Requirements
          </h5>
          <ul className="space-y-1.5">
            {section.key_requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Differences (if showing diff mode) */}
      {showDiff && section.differences && section.differences.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <h5 className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            How This State Differs
          </h5>
          <ul className="space-y-1">
            {section.differences.map((diff, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                <span>{diff}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add to binder button */}
      {onAddToBinder && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2"
          onClick={() => onAddToBinder(stateCode, section)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add to Binder
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// DIFF DETECTION HELPERS
// ============================================================================

/**
 * Check if a section is identical across all states
 * Compares content_summary and key_requirements
 */
function isSectionIdentical(
  sectionType: BinderSectionType,
  comparisonData: StateComparisonEntry[]
): boolean {
  const sectionsOfType = comparisonData
    .map((state) => state.sections.find((s) => s.section_type === sectionType))
    .filter(Boolean);

  if (sectionsOfType.length < 2) return false;

  // Compare content summaries (normalized)
  const summaries = sectionsOfType.map((s) =>
    (s?.content_summary || '').toLowerCase().trim()
  );
  const allSummariesEqual = summaries.every((s) => s === summaries[0]);

  // Compare key requirements
  const reqSets = sectionsOfType.map((s) =>
    new Set((s?.key_requirements || []).map((r) => r.toLowerCase().trim()))
  );
  const allReqsEqual = reqSets.every((set) => {
    const first = reqSets[0];
    if (set.size !== first.size) return false;
    for (const item of set) {
      if (!first.has(item)) return false;
    }
    return true;
  });

  return allSummariesEqual && allReqsEqual;
}

/**
 * Check if a section exists only in one state (unique to that state)
 */
function getSectionUniqueness(
  sectionType: BinderSectionType,
  stateCode: StateCode,
  comparisonData: StateComparisonEntry[]
): boolean {
  const statesWithSection = comparisonData.filter((state) =>
    state.sections.some((s) => s.section_type === sectionType)
  );
  return statesWithSection.length === 1 && statesWithSection[0].state_code === stateCode;
}

/**
 * Get states that are missing a particular section
 */
function getStatesMissingSection(
  sectionType: BinderSectionType,
  comparisonData: StateComparisonEntry[]
): StateCode[] {
  return comparisonData
    .filter((state) => !state.sections.some((s) => s.section_type === sectionType))
    .map((state) => state.state_code);
}

// ============================================================================
// LOADING STATE
// ============================================================================

function ComparisonTableSkeleton({ columns = 2 }: { columns?: number }) {
  return (
    <div className="space-y-6">
      {/* Header Skeletons */}
      <div className={`grid gap-4 grid-cols-${columns}`}>
        {Array.from({ length: columns }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Section Skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`grid gap-4 grid-cols-${columns}`}>
          {Array.from({ length: columns }).map((_, j) => (
            <Card key={j}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ComparisonTable({
  comparisonData,
  isLoading = false,
  onAddToBinder,
  highlightDifferences = true,
  similarityScore,
  keyDifferences,
  className = '',
}: ComparisonTableProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Loading state
  if (isLoading) {
    return <ComparisonTableSkeleton columns={comparisonData.length || 2} />;
  }

  // Empty state
  if (comparisonData.length === 0) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Comparison Data</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Select two or more states above to see a side-by-side comparison of
            their compliance requirements.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get all unique section types across all states
  const allSectionTypes = new Set<BinderSectionType>();
  comparisonData.forEach((state) => {
    state.sections.forEach((section) => {
      allSectionTypes.add(section.section_type);
    });
  });

  const sectionTypes = Array.from(allSectionTypes);
  const gridCols = comparisonData.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={cn('space-y-6', className)}>
      {/* State Headers */}
      <div className={cn('grid gap-4', gridCols)}>
        {comparisonData.map((state) => (
          <Card key={state.state_code} className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>{state.state_name}</span>
                <Badge variant="outline">{state.state_code}</Badge>
              </CardTitle>
              {state.summary && (
                <p className="text-sm text-muted-foreground mt-2">
                  {state.summary}
                </p>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Comparison Sections */}
      <Accordion
        type="multiple"
        value={expandedSections}
        onValueChange={setExpandedSections}
        className="space-y-4"
      >
        {sectionTypes.map((sectionType) => {
          // Detect if this section is identical across all states
          const isIdentical = highlightDifferences
            ? isSectionIdentical(sectionType, comparisonData)
            : false;

          // Get states that don't have this section
          const missingStates = getStatesMissingSection(sectionType, comparisonData);

          return (
            <AccordionItem
              key={sectionType}
              value={sectionType}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{SECTION_TYPE_LABELS[sectionType]}</span>
                  {highlightDifferences && isIdentical && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                      Same
                    </Badge>
                  )}
                  {highlightDifferences && !isIdentical && missingStates.length === 0 && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      Differs
                    </Badge>
                  )}
                  {highlightDifferences && missingStates.length > 0 && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                      Partial
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className={cn('grid gap-4 p-4', gridCols)}>
                  {comparisonData.map((state) => {
                    const section = state.sections.find(
                      (s) => s.section_type === sectionType
                    );

                    // Check if this section is unique to this state
                    const isUniqueToState = section
                      ? getSectionUniqueness(sectionType, state.state_code, comparisonData)
                      : false;

                    if (!section) {
                      return (
                        <Card key={state.state_code} className="border-dashed bg-muted/30">
                          <CardContent className="p-4 text-center text-muted-foreground">
                            <Info className="h-5 w-5 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              Not covered in {state.state_name}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    }

                    return (
                      <Card
                        key={state.state_code}
                        className={cn(
                          highlightDifferences && isUniqueToState && 'border-blue-300 bg-blue-50/50'
                        )}
                      >
                        <CardContent className="p-4">
                          <SectionComparison
                            section={section}
                            stateCode={state.state_code}
                            stateName={state.state_name}
                            onAddToBinder={onAddToBinder}
                            showDiff={highlightDifferences}
                            isIdentical={isIdentical}
                            isUniqueToState={isUniqueToState}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ComparisonTable;
