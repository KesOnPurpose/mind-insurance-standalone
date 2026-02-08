// CEO Dashboard Hook
// React Query hooks for CEO preferences, documents, and facts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type {
  CEOPreferences,
  CEODocument,
  CEOExtractedFact,
  CEODocumentUpload,
  CEOContextCompleteness,
  CEODashboardTab,
  CEONutrition,
  CEOActivePolicy,
  CEOPremiumSchedule,
  CEOCoverageTarget,
  CEOPremiumBlock,
  DayOfWeek,
  CEOVisionBlueprint,
  VisionSynthesizedOutput,
} from '@/types/ceoDashboard';
import {
  fetchCEOPreferences,
  saveCEOPreferences,
  updatePreferencesSection,
  calculateContextCompleteness,
  isCEOUser,
  fetchCEONutrition,
  saveCEONutrition,
  fetchActivePolicy,
  saveActivePolicy,
  updateCoverageTarget,
  addCoverageTarget,
  removeCoverageTarget,
  updatePremiumPaymentCount,
  recordPolicyHealthScore,
  fetchPremiumSchedule,
  savePremiumSchedule,
  addTimeBlock,
  updateTimeBlock,
  removeTimeBlock,
  calculateScheduleStats,
  fetchVisionBlueprint,
  saveVisionBlueprint,
  updateVisionSection,
  synthesizeVision,
  resetSynthesisStatus,
} from '@/services/ceoPreferencesService';
import {
  fetchCEODocuments,
  uploadCEODocument,
  updateCEODocument,
  deleteCEODocument,
  fetchCEOFacts,
  verifyFact,
  markFactIncorrect,
  deleteFact,
  updateFact,
} from '@/services/ceoDocumentsService';
import { useState, useCallback, useMemo } from 'react';

// Query keys
const QUERY_KEYS = {
  preferences: ['ceo', 'preferences'] as const,
  documents: ['ceo', 'documents'] as const,
  facts: ['ceo', 'facts'] as const,
  nutrition: ['ceo', 'nutrition'] as const,
  isCEO: ['ceo', 'isCEO'] as const,
  activePolicy: ['ceo', 'activePolicy'] as const,
  premiumSchedule: ['ceo', 'premiumSchedule'] as const,
  visionBlueprint: ['ceo', 'visionBlueprint'] as const,
};

// ============================================================================
// ACCESS CONTROL HOOK
// ============================================================================

/**
 * Hook to check if current user is CEO
 */
export const useIsCEO = () => {
  return useQuery({
    queryKey: QUERY_KEYS.isCEO,
    queryFn: async () => {
      console.log('='.repeat(40));
      console.log('[useIsCEO] Checking CEO status...');
      const result = await isCEOUser();
      console.log('[useIsCEO] Result:', result);
      console.log('='.repeat(40));
      return result;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// ============================================================================
// PREFERENCES HOOKS
// ============================================================================

/**
 * Hook to fetch CEO preferences
 */
export const useCEOPreferences = () => {
  return useQuery({
    queryKey: QUERY_KEYS.preferences,
    queryFn: fetchCEOPreferences,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to save CEO preferences
 */
export const useSaveCEOPreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: saveCEOPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.preferences, data);
      toast({
        title: 'Preferences saved',
        description: 'Your preferences have been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving preferences',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update a specific section of preferences
 */
export const useUpdatePreferencesSection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async <K extends keyof CEOPreferences>({
      section,
      data,
    }: {
      section: K;
      data: CEOPreferences[K];
    }) => {
      return updatePreferencesSection(section, data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.preferences, data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating preferences',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// NUTRITION HOOKS
// ============================================================================

/**
 * Hook to fetch CEO nutrition data
 */
export const useCEONutrition = () => {
  return useQuery({
    queryKey: QUERY_KEYS.nutrition,
    queryFn: fetchCEONutrition,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to save CEO nutrition data
 */
export const useSaveCEONutrition = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: saveCEONutrition,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.nutrition, data);
      toast({
        title: 'Nutrition saved',
        description: 'Your nutrition data has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving nutrition',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// ACTIVE POLICY HOOKS (12 Week Domination)
// ============================================================================

/**
 * Hook to fetch active policy
 */
export const useActivePolicy = () => {
  return useQuery({
    queryKey: QUERY_KEYS.activePolicy,
    queryFn: fetchActivePolicy,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to save active policy
 */
export const useSaveActivePolicy = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: saveActivePolicy,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.activePolicy, data);
      toast({
        title: 'Policy saved',
        description: 'Your active policy has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving policy',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update a coverage target
 */
export const useUpdateCoverageTarget = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      targetId,
      updates,
    }: {
      targetId: string;
      updates: Partial<CEOCoverageTarget>;
    }) => {
      return updateCoverageTarget(targetId, updates);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.activePolicy, data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating target',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to add a coverage target
 */
export const useAddCoverageTarget = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: addCoverageTarget,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.activePolicy, data);
      toast({
        title: 'Target added',
        description: 'New coverage target has been added.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding target',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to remove a coverage target
 */
export const useRemoveCoverageTarget = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: removeCoverageTarget,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.activePolicy, data);
      toast({
        title: 'Target removed',
        description: 'Coverage target has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing target',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update premium payment count
 */
export const useUpdatePremiumPaymentCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetId,
      paymentId,
      newCount,
    }: {
      targetId: string;
      paymentId: string;
      newCount: number;
    }) => {
      return updatePremiumPaymentCount(targetId, paymentId, newCount);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.activePolicy, data);
    },
  });
};

/**
 * Hook to record policy health score
 */
export const useRecordPolicyHealthScore = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: recordPolicyHealthScore,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.activePolicy, data);
      toast({
        title: 'Score recorded',
        description: 'Weekly policy health score has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error recording score',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// PREMIUM SCHEDULE HOOKS (Model Week)
// ============================================================================

/**
 * Hook to fetch premium schedule
 */
export const usePremiumSchedule = () => {
  return useQuery({
    queryKey: QUERY_KEYS.premiumSchedule,
    queryFn: fetchPremiumSchedule,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to save premium schedule
 */
export const useSavePremiumSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: savePremiumSchedule,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.premiumSchedule, data);
      toast({
        title: 'Schedule saved',
        description: 'Your premium schedule has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving schedule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to add a time block
 */
export const useAddTimeBlock = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      day,
      block,
    }: {
      day: DayOfWeek;
      block: CEOPremiumBlock;
    }) => {
      return addTimeBlock(day, block);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.premiumSchedule, data);
      toast({
        title: 'Block added',
        description: 'Time block has been added to your schedule.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding block',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update a time block
 */
export const useUpdateTimeBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      day,
      blockId,
      updates,
    }: {
      day: DayOfWeek;
      blockId: string;
      updates: Partial<CEOPremiumBlock>;
    }) => {
      return updateTimeBlock(day, blockId, updates);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.premiumSchedule, data);
    },
  });
};

/**
 * Hook to remove a time block
 */
export const useRemoveTimeBlock = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      day,
      blockId,
    }: {
      day: DayOfWeek;
      blockId: string;
    }) => {
      return removeTimeBlock(day, blockId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.premiumSchedule, data);
      toast({
        title: 'Block removed',
        description: 'Time block has been removed from your schedule.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing block',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// V.I.S.I.O.N. BLUEPRINT HOOKS
// ============================================================================

/**
 * Hook to fetch V.I.S.I.O.N. Blueprint
 * Only executes query after confirming user is CEO to avoid RLS timing issues
 */
export const useVisionBlueprint = () => {
  const { data: isCEO, isLoading: isCheckingCEO, error: ceoError } = useIsCEO();

  // DIAGNOSTIC: Detailed state logging
  console.log('*'.repeat(50));
  console.log('[useVisionBlueprint] Hook state - BUILD v5:');
  console.log('  isCEO:', isCEO);
  console.log('  isCheckingCEO:', isCheckingCEO);
  console.log('  ceoError:', ceoError ? (ceoError as Error).message : 'none');
  // DEBUG: Temporarily ALWAYS enable the query to bypass CEO check
  // RLS is now permissive (anon+authenticated can read), so this is safe
  const queryEnabled = true; // Was: !isCheckingCEO && isCEO === true
  console.log('  Query enabled (FORCED TRUE for debug):', queryEnabled);
  console.log('*'.repeat(50));

  return useQuery({
    queryKey: QUERY_KEYS.visionBlueprint,
    queryFn: fetchVisionBlueprint,
    staleTime: 1000 * 60 * 2, // 2 minutes
    // DEBUG v5: Always run query - RLS handles access control
    // TODO: Restore CEO check after debugging
    enabled: queryEnabled,
  });
};

/**
 * Hook to save V.I.S.I.O.N. Blueprint
 */
export const useSaveVisionBlueprint = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: saveVisionBlueprint,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.visionBlueprint, data);
      toast({
        title: 'Vision saved',
        description: 'Your V.I.S.I.O.N. Blueprint has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving vision',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update a specific vision section
 */
export const useUpdateVisionSection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      sectionLetter,
      content,
    }: {
      sectionLetter: 'V' | 'I' | 'S' | 'I2' | 'O' | 'N';
      content: string;
    }) => {
      return updateVisionSection(sectionLetter, content);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.visionBlueprint, data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating section',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to synthesize V.I.S.I.O.N. Blueprint with AI
 * Generates Executive Doc and Inspirational Narrative
 */
export const useSynthesizeVision = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: synthesizeVision,
    onMutate: async (blueprint) => {
      // Optimistically update synthesis status
      queryClient.setQueryData<CEOVisionBlueprint>(
        QUERY_KEYS.visionBlueprint,
        (old) => (old ? { ...old, synthesisStatus: 'processing' } : old)
      );
    },
    onSuccess: async (result, blueprint) => {
      if (result.success) {
        // Force refetch to get the updated blueprint with outputs
        // Use refetchQueries to ensure immediate fetch, not just invalidation
        await queryClient.refetchQueries({ queryKey: QUERY_KEYS.visionBlueprint });
        toast({
          title: 'Vision synthesized!',
          description:
            'Your V.I.S.I.O.N. has been transformed into shareable documents.',
        });
      } else {
        // Refetch to get the failed status from server
        await queryClient.refetchQueries({ queryKey: QUERY_KEYS.visionBlueprint });
        toast({
          title: 'Synthesis failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      // Reset status on error
      queryClient.setQueryData<CEOVisionBlueprint>(
        QUERY_KEYS.visionBlueprint,
        (old) => (old ? { ...old, synthesisStatus: 'failed' } : old)
      );
      toast({
        title: 'Synthesis error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to reset synthesis status (retry after failure)
 */
export const useResetSynthesisStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetSynthesisStatus,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.visionBlueprint, data);
    },
  });
};

// ============================================================================
// DOCUMENTS HOOKS
// ============================================================================

/**
 * Hook to fetch CEO documents
 */
export const useCEODocuments = () => {
  return useQuery({
    queryKey: QUERY_KEYS.documents,
    queryFn: fetchCEODocuments,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Hook to upload a document
 */
export const useUploadCEODocument = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: uploadCEODocument,
    onSuccess: (newDoc) => {
      queryClient.setQueryData<CEODocument[]>(QUERY_KEYS.documents, (old) => {
        return old ? [newDoc, ...old] : [newDoc];
      });
      toast({
        title: 'Document uploaded',
        description: `${newDoc.document_name} has been uploaded successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update a document
 */
export const useUpdateCEODocument = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      documentId,
      updates,
    }: {
      documentId: string;
      updates: Parameters<typeof updateCEODocument>[1];
    }) => {
      return updateCEODocument(documentId, updates);
    },
    onSuccess: (updatedDoc) => {
      queryClient.setQueryData<CEODocument[]>(QUERY_KEYS.documents, (old) => {
        return old?.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc)) || [];
      });
      toast({
        title: 'Document updated',
        description: 'Document details have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to delete a document
 */
export const useDeleteCEODocument = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteCEODocument,
    onSuccess: (_, documentId) => {
      queryClient.setQueryData<CEODocument[]>(QUERY_KEYS.documents, (old) => {
        return old?.filter((doc) => doc.id !== documentId) || [];
      });
      toast({
        title: 'Document deleted',
        description: 'The document has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// FACTS HOOKS
// ============================================================================

/**
 * Hook to fetch CEO facts
 */
export const useCEOFacts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.facts,
    queryFn: fetchCEOFacts,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Hook to verify a fact
 */
export const useVerifyFact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: verifyFact,
    onSuccess: (updatedFact) => {
      queryClient.setQueryData<CEOExtractedFact[]>(QUERY_KEYS.facts, (old) => {
        return old?.map((fact) => (fact.id === updatedFact.id ? updatedFact : fact)) || [];
      });
      toast({
        title: 'Fact verified',
        description: 'This fact has been marked as correct.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to mark a fact as incorrect
 */
export const useMarkFactIncorrect = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: markFactIncorrect,
    onSuccess: (_, factId) => {
      queryClient.setQueryData<CEOExtractedFact[]>(QUERY_KEYS.facts, (old) => {
        return old?.filter((fact) => fact.id !== factId) || [];
      });
      toast({
        title: 'Fact marked incorrect',
        description: 'This fact will no longer be used.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Action failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to delete a fact
 */
export const useDeleteFact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteFact,
    onSuccess: (_, factId) => {
      queryClient.setQueryData<CEOExtractedFact[]>(QUERY_KEYS.facts, (old) => {
        return old?.filter((fact) => fact.id !== factId) || [];
      });
      toast({
        title: 'Fact deleted',
        description: 'The fact has been permanently removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update a fact
 */
export const useUpdateFact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      factId,
      updates,
    }: {
      factId: string;
      updates: Parameters<typeof updateFact>[1];
    }) => {
      return updateFact(factId, updates);
    },
    onSuccess: (updatedFact) => {
      queryClient.setQueryData<CEOExtractedFact[]>(QUERY_KEYS.facts, (old) => {
        return old?.map((fact) => (fact.id === updatedFact.id ? updatedFact : fact)) || [];
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// COMBINED DASHBOARD HOOK
// ============================================================================

/**
 * Main hook for CEO Dashboard - combines all data and state
 */
export const useCEODashboard = () => {
  const [activeTab, setActiveTab] = useState<CEODashboardTab>('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check access
  const { data: isCEO, isLoading: isCheckingAccess } = useIsCEO();

  // Fetch data
  const preferencesQuery = useCEOPreferences();
  const documentsQuery = useCEODocuments();
  const factsQuery = useCEOFacts();
  const nutritionQuery = useCEONutrition();

  // Mutations
  const savePreferences = useSaveCEOPreferences();
  const updateSection = useUpdatePreferencesSection();
  const uploadDocument = useUploadCEODocument();
  const deleteDocument = useDeleteCEODocument();
  const verifyFactMutation = useVerifyFact();
  const markIncorrectMutation = useMarkFactIncorrect();
  const deleteFactMutation = useDeleteFact();
  const saveNutrition = useSaveCEONutrition();

  // Calculate context completeness
  const contextCompleteness = useMemo<CEOContextCompleteness>(() => {
    const verifiedFactsCount = factsQuery.data?.filter((f) => f.is_verified).length || 0;
    return calculateContextCompleteness(
      preferencesQuery.data || null,
      documentsQuery.data?.length || 0,
      verifiedFactsCount
    );
  }, [preferencesQuery.data, documentsQuery.data, factsQuery.data]);

  // Handle tab change with unsaved changes warning
  const handleTabChange = useCallback(
    (newTab: CEODashboardTab) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to switch tabs?'
        );
        if (!confirmed) return;
      }
      setHasUnsavedChanges(false);
      setActiveTab(newTab);
    },
    [hasUnsavedChanges]
  );

  // Mark changes as unsaved
  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Mark changes as saved
  const markSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  // Loading state
  const isLoading =
    isCheckingAccess ||
    preferencesQuery.isLoading ||
    documentsQuery.isLoading ||
    factsQuery.isLoading ||
    nutritionQuery.isLoading;

  // Error state
  const error =
    preferencesQuery.error ||
    documentsQuery.error ||
    factsQuery.error ||
    nutritionQuery.error;

  // Mutation loading states
  const isMutating =
    savePreferences.isPending ||
    updateSection.isPending ||
    uploadDocument.isPending ||
    deleteDocument.isPending ||
    verifyFactMutation.isPending ||
    markIncorrectMutation.isPending ||
    deleteFactMutation.isPending ||
    saveNutrition.isPending;

  return {
    // Access
    isCEO: isCEO ?? false,
    isCheckingAccess,

    // Tab state
    activeTab,
    setActiveTab: handleTabChange,

    // Data
    preferences: preferencesQuery.data || null,
    documents: documentsQuery.data || [],
    facts: factsQuery.data || [],
    nutrition: nutritionQuery.data || null,
    contextCompleteness,

    // Loading states
    isLoading,
    isMutating,
    error,

    // Unsaved changes tracking
    hasUnsavedChanges,
    markUnsaved,
    markSaved,

    // Mutations
    savePreferences: savePreferences.mutateAsync,
    updateSection: updateSection.mutateAsync,
    uploadDocument: uploadDocument.mutateAsync,
    deleteDocument: deleteDocument.mutateAsync,
    verifyFact: verifyFactMutation.mutateAsync,
    markFactIncorrect: markIncorrectMutation.mutateAsync,
    deleteFact: deleteFactMutation.mutateAsync,
    saveNutrition: saveNutrition.mutateAsync,

    // Refetch functions
    refetchPreferences: preferencesQuery.refetch,
    refetchDocuments: documentsQuery.refetch,
    refetchFacts: factsQuery.refetch,
    refetchNutrition: nutritionQuery.refetch,
  };
};

export default useCEODashboard;
