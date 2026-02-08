// ============================================================================
// USE PROPERTY HOOK
// ============================================================================
// React hook for property management with React Query for caching,
// optimistic updates, and real-time sync.
// ============================================================================

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  // Property CRUD
  getUserProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  archiveProperty,
  restoreProperty,
  deleteProperty,
  // Rooms
  getPropertyRooms,
  createRoom,
  updateRoom,
  toggleRoomOccupancy,
  deleteRoom,
  reorderRooms,
  // Financials
  getPropertyFinancials,
  recordFinancials,
  // Timeline
  getPropertyTimeline,
  addTimelineEvent,
  toggleTimelinePin,
  deleteTimelineEvent,
  // Goals
  getPropertyGoals,
  setGoal,
  updateGoalProgress,
  deleteGoal,
  // Calculator Scenarios
  getPropertyScenarios,
  saveScenario,
  setActiveScenario,
  deleteScenario,
  // Portfolio
  getPortfolioSummary,
  calculatePropertyHealth,
  // Types
  type CreatePropertyInput,
  type UpdatePropertyInput,
  type CreateRoomInput,
  type UpdateRoomInput,
  type RecordFinancialsInput,
  type AddTimelineEventInput,
  type SetGoalInput,
  type SaveScenarioInput,
} from '@/services/propertyService';
import type {
  Property,
  PropertyRoom,
  PropertyFinancials,
  PropertyTimeline,
  PropertyGoal,
  PropertyCalculatorScenario,
  PortfolioSummary,
  PropertyHealthScore,
} from '@/types/property';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (filters: string) => [...propertyKeys.lists(), filters] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
  rooms: (propertyId: string) => [...propertyKeys.detail(propertyId), 'rooms'] as const,
  financials: (propertyId: string) => [...propertyKeys.detail(propertyId), 'financials'] as const,
  timeline: (propertyId: string) => [...propertyKeys.detail(propertyId), 'timeline'] as const,
  goals: (propertyId: string) => [...propertyKeys.detail(propertyId), 'goals'] as const,
  scenarios: (propertyId: string) => [...propertyKeys.detail(propertyId), 'scenarios'] as const,
  health: (propertyId: string) => [...propertyKeys.detail(propertyId), 'health'] as const,
  portfolio: () => [...propertyKeys.all, 'portfolio'] as const,
};

// ============================================================================
// TYPES
// ============================================================================

export interface UsePropertyOptions {
  propertyId: string;
  enabled?: boolean;
}

export interface UsePropertyReturn {
  // Property data
  property: Property | null;
  rooms: PropertyRoom[];
  financials: PropertyFinancials[];
  timeline: PropertyTimeline[];
  goals: PropertyGoal[];
  scenarios: PropertyCalculatorScenario[];
  healthScore: PropertyHealthScore | null;

  // Loading states
  isLoading: boolean;
  isLoadingRooms: boolean;
  isLoadingFinancials: boolean;
  isLoadingTimeline: boolean;
  isLoadingGoals: boolean;

  // Error states
  error: Error | null;

  // Property mutations
  updateProperty: (input: UpdatePropertyInput) => Promise<Property>;
  archiveProperty: () => Promise<Property>;
  restoreProperty: () => Promise<Property>;
  deleteProperty: () => Promise<void>;

  // Room mutations
  addRoom: (input: CreateRoomInput) => Promise<PropertyRoom>;
  updateRoom: (roomId: string, input: UpdateRoomInput) => Promise<PropertyRoom>;
  toggleOccupancy: (roomId: string, isOccupied: boolean, occupiedSince?: string) => Promise<PropertyRoom>;
  deleteRoom: (roomId: string) => Promise<void>;
  reorderRooms: (roomIds: string[]) => Promise<void>;

  // Financial mutations
  recordFinancials: (input: Omit<RecordFinancialsInput, 'property_id'>) => Promise<PropertyFinancials>;

  // Timeline mutations
  addEvent: (input: Omit<AddTimelineEventInput, 'property_id'>) => Promise<PropertyTimeline>;
  togglePin: (eventId: string) => Promise<PropertyTimeline>;
  deleteEvent: (eventId: string) => Promise<void>;

  // Goal mutations
  setGoal: (input: Omit<SetGoalInput, 'property_id'>) => Promise<PropertyGoal>;
  updateGoalProgress: (goalId: string, currentValue: number) => Promise<PropertyGoal>;
  deleteGoal: (goalId: string) => Promise<void>;

  // Scenario mutations
  saveScenario: (input: Omit<SaveScenarioInput, 'property_id'>) => Promise<PropertyCalculatorScenario>;
  setActiveScenario: (scenarioId: string) => Promise<void>;
  deleteScenario: (scenarioId: string) => Promise<void>;

  // Refetch
  refetch: () => void;
  refetchRooms: () => void;
  refetchFinancials: () => void;
  refetchTimeline: () => void;
  refetchGoals: () => void;
}

// ============================================================================
// HOOK: Use Property List
// ============================================================================

export function usePropertyList(includeArchived: boolean = false) {
  const queryClient = useQueryClient();

  const {
    data: properties = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: propertyKeys.list(includeArchived ? 'all' : 'active'),
    queryFn: () => getUserProperties(includeArchived),
    staleTime: 60000,
  });

  const createMutation = useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.portfolio() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.portfolio() });
    },
  });

  return {
    properties,
    isLoading,
    error: error as Error | null,
    refetch,
    createProperty: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteProperty: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

// ============================================================================
// HOOK: Use Single Property
// ============================================================================

export function useProperty(options: UsePropertyOptions): UsePropertyReturn {
  const { propertyId, enabled = true } = options;
  const queryClient = useQueryClient();

  // ========== Queries ==========

  const {
    data: property = null,
    isLoading,
    error,
    refetch: refetchProperty,
  } = useQuery({
    queryKey: propertyKeys.detail(propertyId),
    queryFn: () => getPropertyById(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 30000,
  });

  const {
    data: rooms = [],
    isLoading: isLoadingRooms,
    refetch: refetchRooms,
  } = useQuery({
    queryKey: propertyKeys.rooms(propertyId),
    queryFn: () => getPropertyRooms(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 30000,
  });

  const {
    data: financials = [],
    isLoading: isLoadingFinancials,
    refetch: refetchFinancials,
  } = useQuery({
    queryKey: propertyKeys.financials(propertyId),
    queryFn: () => getPropertyFinancials(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 60000,
  });

  const {
    data: timeline = [],
    isLoading: isLoadingTimeline,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: propertyKeys.timeline(propertyId),
    queryFn: () => getPropertyTimeline(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 60000,
  });

  const {
    data: goals = [],
    isLoading: isLoadingGoals,
    refetch: refetchGoals,
  } = useQuery({
    queryKey: propertyKeys.goals(propertyId),
    queryFn: () => getPropertyGoals(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 60000,
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: propertyKeys.scenarios(propertyId),
    queryFn: () => getPropertyScenarios(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 60000,
  });

  const { data: healthScore = null } = useQuery({
    queryKey: propertyKeys.health(propertyId),
    queryFn: () => calculatePropertyHealth(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 5 * 60000, // 5 minutes
  });

  // ========== Property Mutations ==========

  const updatePropertyMutation = useMutation({
    mutationFn: (input: UpdatePropertyInput) => updateProperty(propertyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.portfolio() });
    },
  });

  const archivePropertyMutation = useMutation({
    mutationFn: () => archiveProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.portfolio() });
    },
  });

  const restorePropertyMutation = useMutation({
    mutationFn: () => restoreProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.portfolio() });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: () => deleteProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.portfolio() });
    },
  });

  // ========== Room Mutations ==========

  const createRoomMutation = useMutation({
    mutationFn: (input: CreateRoomInput) => createRoom(propertyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.rooms(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.health(propertyId) });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ roomId, input }: { roomId: string; input: UpdateRoomInput }) =>
      updateRoom(roomId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.rooms(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.health(propertyId) });
    },
  });

  const toggleOccupancyMutation = useMutation({
    mutationFn: ({
      roomId,
      isOccupied,
      occupiedSince,
    }: {
      roomId: string;
      isOccupied: boolean;
      occupiedSince?: string;
    }) => toggleRoomOccupancy(roomId, isOccupied, occupiedSince),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.rooms(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.health(propertyId) });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.rooms(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.health(propertyId) });
    },
  });

  const reorderRoomsMutation = useMutation({
    mutationFn: (roomIds: string[]) => reorderRooms(propertyId, roomIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.rooms(propertyId) });
    },
  });

  // ========== Financial Mutations ==========

  const recordFinancialsMutation = useMutation({
    mutationFn: (input: Omit<RecordFinancialsInput, 'property_id'>) =>
      recordFinancials({ ...input, property_id: propertyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.financials(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.health(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.portfolio() });
    },
  });

  // ========== Timeline Mutations ==========

  const addEventMutation = useMutation({
    mutationFn: (input: Omit<AddTimelineEventInput, 'property_id'>) =>
      addTimelineEvent({ ...input, property_id: propertyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.timeline(propertyId) });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: toggleTimelinePin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.timeline(propertyId) });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteTimelineEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.timeline(propertyId) });
    },
  });

  // ========== Goal Mutations ==========

  const setGoalMutation = useMutation({
    mutationFn: (input: Omit<SetGoalInput, 'property_id'>) =>
      setGoal({ ...input, property_id: propertyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.goals(propertyId) });
    },
  });

  const updateGoalProgressMutation = useMutation({
    mutationFn: ({ goalId, currentValue }: { goalId: string; currentValue: number }) =>
      updateGoalProgress(goalId, currentValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.goals(propertyId) });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.goals(propertyId) });
    },
  });

  // ========== Scenario Mutations ==========

  const saveScenarioMutation = useMutation({
    mutationFn: (input: Omit<SaveScenarioInput, 'property_id'>) =>
      saveScenario({ ...input, property_id: propertyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.scenarios(propertyId) });
    },
  });

  const setActiveScenarioMutation = useMutation({
    mutationFn: (scenarioId: string) => setActiveScenario(propertyId, scenarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.scenarios(propertyId) });
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: deleteScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.scenarios(propertyId) });
    },
  });

  // ========== Return ==========

  return {
    // Data
    property,
    rooms,
    financials,
    timeline,
    goals,
    scenarios,
    healthScore,

    // Loading
    isLoading,
    isLoadingRooms,
    isLoadingFinancials,
    isLoadingTimeline,
    isLoadingGoals,

    // Error
    error: error as Error | null,

    // Property mutations
    updateProperty: updatePropertyMutation.mutateAsync,
    archiveProperty: archivePropertyMutation.mutateAsync,
    restoreProperty: restorePropertyMutation.mutateAsync,
    deleteProperty: deletePropertyMutation.mutateAsync,

    // Room mutations
    addRoom: createRoomMutation.mutateAsync,
    updateRoom: (roomId: string, input: UpdateRoomInput) =>
      updateRoomMutation.mutateAsync({ roomId, input }),
    toggleOccupancy: (roomId: string, isOccupied: boolean, occupiedSince?: string) =>
      toggleOccupancyMutation.mutateAsync({ roomId, isOccupied, occupiedSince }),
    deleteRoom: deleteRoomMutation.mutateAsync,
    reorderRooms: reorderRoomsMutation.mutateAsync,

    // Financial mutations
    recordFinancials: recordFinancialsMutation.mutateAsync,

    // Timeline mutations
    addEvent: addEventMutation.mutateAsync,
    togglePin: togglePinMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,

    // Goal mutations
    setGoal: setGoalMutation.mutateAsync,
    updateGoalProgress: (goalId: string, currentValue: number) =>
      updateGoalProgressMutation.mutateAsync({ goalId, currentValue }),
    deleteGoal: deleteGoalMutation.mutateAsync,

    // Scenario mutations
    saveScenario: saveScenarioMutation.mutateAsync,
    setActiveScenario: setActiveScenarioMutation.mutateAsync,
    deleteScenario: deleteScenarioMutation.mutateAsync,

    // Refetch
    refetch: refetchProperty,
    refetchRooms,
    refetchFinancials,
    refetchTimeline,
    refetchGoals,
  };
}

// ============================================================================
// HOOK: Use Property Portfolio
// ============================================================================

export function usePropertyPortfolio() {
  const queryClient = useQueryClient();

  const {
    data: summary = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: propertyKeys.portfolio(),
    queryFn: getPortfolioSummary,
    staleTime: 60000,
  });

  return {
    summary,
    isLoading,
    error: error as Error | null,
    refetch,

    // Convenience getters
    totalProperties: summary?.total_properties ?? 0,
    totalBeds: summary?.total_beds ?? 0,
    occupiedBeds: summary?.occupied_beds ?? 0,
    vacantBeds: summary?.vacant_beds ?? 0,
    averageOccupancy: summary?.average_occupancy ?? 0,
    totalMonthlyRevenue: summary?.total_monthly_revenue ?? 0,
    totalMonthlyExpenses: summary?.total_monthly_expenses ?? 0,
    totalMonthlyProfit: summary?.total_monthly_profit ?? 0,
    averageProfitMargin: summary?.average_profit_margin ?? 0,
    stateBreakdown: summary?.state_breakdown ?? [],
    ownershipModelBreakdown: summary?.ownership_model_breakdown ?? [],
  };
}

// ============================================================================
// HOOK: Use Property Health
// ============================================================================

export function usePropertyHealth(propertyId: string) {
  const {
    data: healthScore = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: propertyKeys.health(propertyId),
    queryFn: () => calculatePropertyHealth(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60000,
  });

  return {
    healthScore,
    isLoading,
    error: error as Error | null,
    refetch,
    score: healthScore?.score ?? 0,
    factors: healthScore?.factors ?? {},
    recommendations: healthScore?.recommendations ?? [],
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useProperty;
