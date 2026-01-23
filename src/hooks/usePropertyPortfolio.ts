// ============================================================================
// USE PROPERTY PORTFOLIO HOOK
// ============================================================================
// Composite hook for property portfolio management, combining property list,
// portfolio summary, and health scores.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserProperties,
  createProperty,
  getPortfolioSummary,
  calculatePropertyHealth,
  type CreatePropertyInput,
} from '@/services/propertyService';
import type {
  Property,
  PortfolioSummary,
  PropertyHealthScore,
} from '@/types/property';
import { propertyKeys } from './useProperty';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePropertyPortfolioReturn {
  // Data
  properties: Property[];
  summary: PortfolioSummary | null;
  healthScores: Record<string, PropertyHealthScore>;

  // Loading states
  isLoading: boolean;
  isLoadingProperties: boolean;
  isLoadingSummary: boolean;

  // Error state
  error: Error | null;

  // Mutations
  createProperty: (input: CreatePropertyInput) => Promise<Property>;
  isCreating: boolean;

  // Refetch
  refetch: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function usePropertyPortfolio(): UsePropertyPortfolioReturn {
  const queryClient = useQueryClient();

  // Fetch properties list
  const {
    data: properties = [],
    isLoading: isLoadingProperties,
    error: propertiesError,
    refetch: refetchProperties,
  } = useQuery({
    queryKey: propertyKeys.list('active'),
    queryFn: () => getUserProperties(false),
    staleTime: 60000,
  });

  // Fetch portfolio summary
  const {
    data: summary = null,
    isLoading: isLoadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: propertyKeys.portfolio(),
    queryFn: getPortfolioSummary,
    staleTime: 60000,
  });

  // Fetch health scores for all properties
  const {
    data: healthScoresArray = [],
  } = useQuery({
    queryKey: [...propertyKeys.all, 'health-scores'],
    queryFn: async () => {
      if (properties.length === 0) return [];
      const scores = await Promise.all(
        properties.map(async (p) => {
          try {
            const score = await calculatePropertyHealth(p.id);
            return { propertyId: p.id, score };
          } catch {
            return { propertyId: p.id, score: null };
          }
        })
      );
      return scores;
    },
    enabled: properties.length > 0,
    staleTime: 5 * 60000,
  });

  // Convert array to record for easier lookup
  const healthScores: Record<string, PropertyHealthScore> = {};
  healthScoresArray.forEach(({ propertyId, score }) => {
    if (score) {
      healthScores[propertyId] = score;
    }
  });

  // Create property mutation
  const createMutation = useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.portfolio() });
    },
  });

  // Combined refetch
  const refetch = () => {
    refetchProperties();
    refetchSummary();
  };

  return {
    // Data
    properties,
    summary,
    healthScores,

    // Loading
    isLoading: isLoadingProperties || isLoadingSummary,
    isLoadingProperties,
    isLoadingSummary,

    // Error
    error: (propertiesError || summaryError) as Error | null,

    // Mutations
    createProperty: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    // Refetch
    refetch,
  };
}

export default usePropertyPortfolio;
