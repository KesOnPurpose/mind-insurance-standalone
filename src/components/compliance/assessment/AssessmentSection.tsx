// ============================================================================
// ASSESSMENT SECTION COMPONENT
// ============================================================================
// Renders a single assessment section with guidance, instructions, and findings capture
// Handles different section types (model definition, research, classification, etc.)
// ============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  BookOpen,
  Lightbulb,
  ExternalLink,
  Loader2,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { FindingsCapture } from './FindingsCapture';
import { SECTION_TITLES, getSectionGuidance } from '@/services/complianceAssessmentService';
import type {
  ComplianceFinding,
  AssessmentConclusion,
  SectionStatus,
} from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface AssessmentSectionProps {
  sectionId: string;
  stateCode: string;
  modelDefinition?: string;
  existingFinding?: ComplianceFinding;
  status: SectionStatus;
  onSaveFinding: (finding: FindingData) => Promise<void>;
  onSaveModelDefinition?: (definition: string) => Promise<void>;
  onComplete: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
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
// SECTION-SPECIFIC RESOURCE LINKS
// ============================================================================

const SECTION_RESOURCES: Record<string, { label: string; url: string }[]> = {
  '1.1': [
    {
      label: 'State Licensing Agency Directory',
      url: 'https://www.nasuad.org/resources/state-aging-and-disability-agencies',
    },
  ],
  '1.2': [
    {
      label: 'Rooming/Boarding House Laws by State',
      url: 'https://www.nolo.com/legal-encyclopedia/landlord-tenant-law',
    },
  ],
  '1.3.1': [
    {
      label: 'Local Occupancy Limit Research Guide',
      url: 'https://www.hud.gov/program_offices/fair_housing_equal_opp',
    },
  ],
  '1.3.3': [
    {
      label: 'Zoning Basics for Group Housing',
      url: 'https://www.planning.org/knowledgebase/zoning/',
    },
  ],
};

// ============================================================================
// MODEL DEFINITION SECTION (Section 0)
// ============================================================================

interface ModelDefinitionSectionProps {
  modelDefinition?: string;
  onSave: (definition: string) => Promise<void>;
  onComplete: () => void;
  isLoading?: boolean;
}

const ModelDefinitionSection = ({
  modelDefinition,
  onSave,
  onComplete,
  isLoading,
}: ModelDefinitionSectionProps) => {
  const [definition, setDefinition] = useState(modelDefinition || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!definition.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(definition.trim());
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = definition.trim().length >= 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Section 0: Model Definition
        </CardTitle>
        <CardDescription>
          Define your housing model in one clear sentence. This becomes the foundation
          for all compliance analysis.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Tip:</strong> Focus on what services you DO and DO NOT provide.
            Example: "Housing-only, no personal care services, residents are independent
            and manage their own daily activities."
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="model-definition" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Your Housing Model Definition
            <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="model-definition"
            placeholder="Describe your housing model in one clear sentence. What do you provide? What don't you provide?"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            disabled={isLoading || isSaving}
            rows={4}
            className="text-lg"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minimum 10 characters</span>
            <span>{definition.length} characters</span>
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Strong Model Definition Examples:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • "Room rental only - residents are independent, no services, no meals,
              no assistance with daily activities."
            </li>
            <li>
              • "Shared housing for working professionals - housing only, tenants
              responsible for their own meals and care."
            </li>
            <li>
              • "Recovery-supportive housing - peer support environment, no medical
              services, no licensed care provided."
            </li>
          </ul>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!isValid || isLoading || isSaving}
            className="min-w-[160px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save & Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AssessmentSection = ({
  sectionId,
  stateCode,
  modelDefinition,
  existingFinding,
  status,
  onSaveFinding,
  onSaveModelDefinition,
  onComplete,
  onPrevious,
  isLoading = false,
  className,
}: AssessmentSectionProps) => {
  const sectionTitle = SECTION_TITLES[sectionId] || sectionId;
  const guidance = getSectionGuidance(sectionId, stateCode, modelDefinition);
  const resources = SECTION_RESOURCES[sectionId] || [];

  // Special handling for Section 0 (Model Definition)
  if (sectionId === '0' && onSaveModelDefinition) {
    return (
      <div className={className}>
        <ModelDefinitionSection
          modelDefinition={modelDefinition}
          onSave={onSaveModelDefinition}
          onComplete={onComplete}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // Handle finding save and continue
  const handleSaveFinding = async (finding: FindingData) => {
    await onSaveFinding(finding);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Header with Guidance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Section {sectionId}: {sectionTitle}
          </CardTitle>
          <CardDescription>{guidance.instruction}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Model Definition Reference */}
          {modelDefinition && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Your Model Definition:
              </p>
              <p className="text-sm italic">"{modelDefinition}"</p>
            </div>
          )}

          {/* Research Assignment */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Research Assignment:</strong> {guidance.research_prompt}
            </AlertDescription>
          </Alert>

          {/* Warning if applicable */}
          {guidance.warning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{guidance.warning}</AlertDescription>
            </Alert>
          )}

          {/* Resource Links */}
          {resources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Helpful Resources:</h4>
              <div className="flex flex-wrap gap-2">
                {resources.map((resource, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(resource.url, '_blank')}
                    className="gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {resource.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Findings Capture */}
      <FindingsCapture
        sectionId={sectionId}
        sectionTitle={sectionTitle}
        guidanceText={guidance.capture_prompt}
        initialFinding={existingFinding}
        onSave={handleSaveFinding}
        isLoading={isLoading}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious} disabled={isLoading}>
            Previous Section
          </Button>
        )}
        <div className="flex-1" />
        <Button onClick={onComplete} disabled={isLoading} className="min-w-[160px]">
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default AssessmentSection;
