// ============================================================================
// USE COMPLIANCE ASSESSMENT HOOK
// ============================================================================
// Custom hook for managing compliance assessment state and operations
// Provides CRUD operations for assessments and findings
// ============================================================================

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  createAssessment,
  getAssessmentByUserAndState,
  updateAssessment,
  getAssessmentFindings,
  createFinding,
  updateFinding,
  completePhaseGate,
} from '@/services/complianceAssessmentService';
import type {
  ComplianceAssessment,
  ComplianceFinding,
  StateCode,
  AssessmentDetermination,
  AssessmentConclusion,
  SectionStatus,
} from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface FindingData {
  research_url: string;
  pasted_language: string;
  user_interpretation: string;
  conclusion: AssessmentConclusion;
  is_flagged: boolean;
}

interface UseComplianceAssessmentReturn {
  assessment: ComplianceAssessment | null;
  findings: ComplianceFinding[];
  isLoading: boolean;
  error: Error | null;
  createOrLoadAssessment: (stateCode: StateCode, binderId?: string) => Promise<void>;
  updateModelDefinition: (definition: string) => Promise<void>;
  saveFinding: (sectionId: string, findingData: FindingData) => Promise<void>;
  markSectionComplete: (sectionId: string) => Promise<void>;
  completeAssessment: (determination: AssessmentDetermination) => Promise<void>;
  refreshFindings: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useComplianceAssessment = (): UseComplianceAssessmentReturn => {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<ComplianceAssessment | null>(null);
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create or load existing assessment
  const createOrLoadAssessment = useCallback(
    async (stateCode: StateCode, binderId?: string) => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Try to load existing assessment for this user + state
        const existing = await getAssessmentByUserAndState(user.id, stateCode);

        if (existing) {
          setAssessment(existing);
          // Load findings for existing assessment
          const existingFindings = await getAssessmentFindings(existing.id);
          setFindings(existingFindings);
        } else {
          // Create new assessment
          const newAssessment = await createAssessment({
            user_id: user.id,
            state_code: stateCode,
            binder_id: binderId,
          });
          setAssessment(newAssessment);
          setFindings([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load assessment'));
        console.error('Error loading assessment:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  // Refresh findings from database
  const refreshFindings = useCallback(async () => {
    if (!assessment?.id) return;

    try {
      const updatedFindings = await getAssessmentFindings(assessment.id);
      setFindings(updatedFindings);
    } catch (err) {
      console.error('Error refreshing findings:', err);
    }
  }, [assessment?.id]);

  // Update model definition
  const updateModelDefinition = useCallback(
    async (definition: string) => {
      if (!assessment?.id) return;

      setIsLoading(true);
      try {
        const updated = await updateAssessment(assessment.id, {
          model_definition: definition,
        });
        setAssessment(updated);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update model definition'));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [assessment?.id]
  );

  // Save or update a finding for a section
  const saveFinding = useCallback(
    async (sectionId: string, findingData: FindingData) => {
      if (!assessment?.id) return;

      setIsLoading(true);
      try {
        // Check if finding already exists for this section
        const existingFinding = findings.find((f) => f.section_id === sectionId);

        if (existingFinding) {
          // Update existing finding
          const updated = await updateFinding(existingFinding.id, {
            research_url: findingData.research_url || null,
            pasted_language: findingData.pasted_language || null,
            user_interpretation: findingData.user_interpretation || null,
            conclusion: findingData.conclusion,
            is_flagged: findingData.is_flagged,
          });

          setFindings((prev) =>
            prev.map((f) => (f.id === updated.id ? updated : f))
          );
        } else {
          // Create new finding
          const newFinding = await createFinding({
            assessment_id: assessment.id,
            section_id: sectionId,
            research_url: findingData.research_url || null,
            pasted_language: findingData.pasted_language || null,
            user_interpretation: findingData.user_interpretation || null,
            conclusion: findingData.conclusion,
            is_flagged: findingData.is_flagged,
          });

          setFindings((prev) => [...prev, newFinding]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to save finding'));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [assessment?.id, findings]
  );

  // Mark a section as complete
  const markSectionComplete = useCallback(
    async (sectionId: string) => {
      if (!assessment?.id) return;

      setIsLoading(true);
      try {
        const updatedProgress = {
          ...assessment.section_progress,
          [sectionId]: 'complete' as SectionStatus,
        };

        const updated = await updateAssessment(assessment.id, {
          section_progress: updatedProgress,
        });

        setAssessment(updated);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to mark section complete'));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [assessment]
  );

  // Complete the entire assessment with final determination
  const completeAssessment = useCallback(
    async (determination: AssessmentDetermination) => {
      if (!assessment?.id) return;

      setIsLoading(true);
      try {
        const completed = await completePhaseGate(assessment.id, determination);
        setAssessment(completed);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to complete assessment'));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [assessment?.id]
  );

  return {
    assessment,
    findings,
    isLoading,
    error,
    createOrLoadAssessment,
    updateModelDefinition,
    saveFinding,
    markSectionComplete,
    completeAssessment,
    refreshFindings,
  };
};

export default useComplianceAssessment;
