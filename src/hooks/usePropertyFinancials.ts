// ============================================================================
// USE PROPERTY FINANCIALS HOOK
// ============================================================================
// Dedicated hook for property financial tracking with React Query.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPropertyFinancials,
  recordFinancials,
  updatePropertyFinancials,
  type RecordFinancialsInput,
} from '@/services/propertyService';
import type { PropertyFinancials } from '@/types/property';
import { propertyKeys } from './useProperty';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePropertyFinancialsReturn {
  // Data
  financials: PropertyFinancials[];

  // Loading state
  isLoading: boolean;

  // Error state
  error: Error | null;

  // Mutations
  saveFinancial: (input: Omit<RecordFinancialsInput, 'property_id'>) => Promise<PropertyFinancials>;
  updateFinancial: (id: string, data: Partial<PropertyFinancials>) => Promise<PropertyFinancials>;

  // Mutation states
  isSaving: boolean;
  isUpdating: boolean;

  // Refetch
  refetch: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function usePropertyFinancials(propertyId: string): UsePropertyFinancialsReturn {
  const queryClient = useQueryClient();

  // Fetch financials
  const {
    data: financials = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: propertyKeys.financials(propertyId),
    queryFn: () => getPropertyFinancials(propertyId),
    enabled: !!propertyId,
    staleTime: 60000,
  });

  // Save financials mutation
  const saveMutation = useMutation({
    mutationFn: (input: Omit<RecordFinancialsInput, 'property_id'>) =>
      recordFinancials({ ...input, property_id: propertyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.financials(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.health(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.portfolio() });
    },
  });

  // Update financials mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyFinancials> }) =>
      updatePropertyFinancials(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.financials(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.health(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.portfolio() });
    },
  });

  return {
    // Data
    financials,

    // Loading
    isLoading,

    // Error
    error: error as Error | null,

    // Mutations
    saveFinancial: saveMutation.mutateAsync,
    updateFinancial: (id: string, data: Partial<PropertyFinancials>) =>
      updateMutation.mutateAsync({ id, data }),

    // Mutation states
    isSaving: saveMutation.isPending,
    isUpdating: updateMutation.isPending,

    // Refetch
    refetch,
  };
}

export default usePropertyFinancials;
