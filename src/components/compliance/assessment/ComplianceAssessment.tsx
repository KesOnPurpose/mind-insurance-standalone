// ============================================================================
// COMPLIANCE ASSESSMENT WIZARD
// ============================================================================
// Main multi-step assessment wizard that guides users through compliance review
// Integrates all assessment sections, progress tracking, and phase gate
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Menu,
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { AssessmentProgress } from './AssessmentProgress';
import { AssessmentSection } from './AssessmentSection';
import { PhaseGate } from './PhaseGate';
import { useComplianceAssessment } from '@/hooks/useComplianceAssessment';
import { SECTION_ORDER, SECTION_TITLES } from '@/services/complianceAssessmentService';
import type { StateCode, AssessmentDetermination, AssessmentConclusion } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface ComplianceAssessmentProps {
  binderId?: string;
  stateCode: StateCode;
  onComplete?: (assessmentId: string, determination: AssessmentDetermination) => void;
  onCancel?: () => void;
  className?: string;
}

interface FindingData {
  research_url: string;
  pasted_language: string;
  user_interpretation: string;
  conclusion: AssessmentConclusion;
  is_flagged: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ComplianceAssessment = ({
  binderId,
  stateCode,
  onComplete,
  onCancel,
  className,
}: ComplianceAssessmentProps) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Hook for assessment data management
  const {
    assessment,
    findings,
    isLoading,
    error,
    createOrLoadAssessment,
    updateModelDefinition,
    saveFinding,
    markSectionComplete,
    completeAssessment,
  } = useComplianceAssessment();

  // Initialize assessment on mount
  useEffect(() => {
    createOrLoadAssessment(stateCode, binderId);
  }, [stateCode, binderId, createOrLoadAssessment]);

  // Current section info
  const currentSectionId = SECTION_ORDER[currentSectionIndex];
  const currentSectionTitle = SECTION_TITLES[currentSectionId] || currentSectionId;
  const isPhaseGate = currentSectionId === '1.5';
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === SECTION_ORDER.length - 1;

  // Get existing finding for current section
  const existingFinding = useMemo(() => {
    return findings.find((f) => f.section_id === currentSectionId);
  }, [findings, currentSectionId]);

  // Section progress from assessment
  const sectionProgress = assessment?.section_progress || {};

  // Navigation handlers
  const handleNextSection = () => {
    if (currentSectionIndex < SECTION_ORDER.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    const index = SECTION_ORDER.indexOf(sectionId);
    if (index !== -1) {
      setCurrentSectionIndex(index);
      setIsMobileNavOpen(false);
    }
  };

  // Model definition save handler
  const handleSaveModelDefinition = async (definition: string) => {
    if (!assessment) return;
    await updateModelDefinition(definition);
    await markSectionComplete('0');
    handleNextSection();
  };

  // Finding save handler
  const handleSaveFinding = async (findingData: FindingData) => {
    if (!assessment) return;
    await saveFinding(currentSectionId, findingData);
  };

  // Section complete handler
  const handleSectionComplete = async () => {
    if (!assessment) return;
    await markSectionComplete(currentSectionId);
    handleNextSection();
  };

  // Phase gate complete handler
  const handlePhaseGateComplete = async (determination: AssessmentDetermination) => {
    if (!assessment) return;
    await completeAssessment(determination);
    onComplete?.(assessment.id, determination);
  };

  // Export to binder handler
  const handleExportToBinder = () => {
    // This will be implemented to navigate to binder with assessment findings
    console.log('Export to binder:', assessment?.id);
  };

  // Loading state
  if (isLoading && !assessment) {
    return (
      <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-medium">Failed to load assessment</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => createOrLoadAssessment(stateCode, binderId)}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Compliance Assessment</h1>
            <p className="text-sm text-muted-foreground">
              {stateCode} • Section {currentSectionIndex + 1} of {SECTION_ORDER.length}
            </p>
          </div>
        </div>

        {/* Mobile nav trigger */}
        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <SheetHeader>
              <SheetTitle>Assessment Progress</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <AssessmentProgress
                sectionProgress={sectionProgress}
                currentSection={currentSectionId}
                onSectionClick={handleSectionClick}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Progress Sidebar (Desktop) */}
        <aside className="hidden md:block">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <AssessmentProgress
                sectionProgress={sectionProgress}
                currentSection={currentSectionId}
                onSectionClick={handleSectionClick}
              />
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="md:col-span-2 lg:col-span-3">
          {/* Phase Gate Section */}
          {isPhaseGate ? (
            <PhaseGate
              findings={findings}
              modelDefinition={assessment?.model_definition || undefined}
              stateCode={stateCode}
              onComplete={handlePhaseGateComplete}
              onExportToBinder={handleExportToBinder}
              isLoading={isLoading}
            />
          ) : (
            <AssessmentSection
              sectionId={currentSectionId}
              stateCode={stateCode}
              modelDefinition={assessment?.model_definition || undefined}
              existingFinding={existingFinding}
              status={sectionProgress[currentSectionId] || 'pending'}
              onSaveFinding={handleSaveFinding}
              onSaveModelDefinition={
                currentSectionId === '0' ? handleSaveModelDefinition : undefined
              }
              onComplete={handleSectionComplete}
              onPrevious={!isFirstSection ? handlePreviousSection : undefined}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>

      {/* Auto-save indicator */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Saving...</span>
        </div>
      )}
    </div>
  );
};

export default ComplianceAssessment;
