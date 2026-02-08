// ============================================================================
// USE PROPERTY ROOMS HOOK
// ============================================================================
// Dedicated hook for property room management with React Query.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPropertyRooms,
  createRoom,
  updateRoom,
  toggleRoomOccupancy,
  deleteRoom,
  reorderRooms,
  type CreateRoomInput,
  type UpdateRoomInput,
} from '@/services/propertyService';
import type { PropertyRoom } from '@/types/property';
import { propertyKeys } from './useProperty';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePropertyRoomsReturn {
  // Data
  rooms: PropertyRoom[];

  // Loading states
  isLoading: boolean;

  // Error state
  error: Error | null;

  // Mutations
  createRoom: (input: CreateRoomInput) => Promise<PropertyRoom>;
  updateRoom: (roomId: string, input: UpdateRoomInput) => Promise<PropertyRoom>;
  toggleOccupancy: (roomId: string, isOccupied: boolean, occupiedSince?: string) => Promise<PropertyRoom>;
  deleteRoom: (roomId: string) => Promise<void>;
  reorderRooms: (roomIds: string[]) => Promise<void>;

  // Mutation states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Refetch
  refetch: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function usePropertyRooms(propertyId: string): UsePropertyRoomsReturn {
  const queryClient = useQueryClient();

  // Fetch rooms
  const {
    data: rooms = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: propertyKeys.rooms(propertyId),
    queryFn: () => getPropertyRooms(propertyId),
    enabled: !!propertyId,
    staleTime: 30000,
  });

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateRoomInput) => createRoom(propertyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.rooms(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.health(propertyId) });
    },
  });

  // Update room mutation
  const updateMutation = useMutation({
    mutationFn: ({ roomId, input }: { roomId: string; input: UpdateRoomInput }) =>
      updateRoom(roomId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.rooms(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.health(propertyId) });
    },
  });

  // Toggle occupancy mutation
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

  // Delete room mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.rooms(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.health(propertyId) });
    },
  });

  // Reorder rooms mutation
  const reorderMutation = useMutation({
    mutationFn: (roomIds: string[]) => reorderRooms(propertyId, roomIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.rooms(propertyId) });
    },
  });

  return {
    // Data
    rooms,

    // Loading
    isLoading,

    // Error
    error: error as Error | null,

    // Mutations
    createRoom: createMutation.mutateAsync,
    updateRoom: (roomId: string, input: UpdateRoomInput) =>
      updateMutation.mutateAsync({ roomId, input }),
    toggleOccupancy: (roomId: string, isOccupied: boolean, occupiedSince?: string) =>
      toggleOccupancyMutation.mutateAsync({ roomId, isOccupied, occupiedSince }),
    deleteRoom: deleteMutation.mutateAsync,
    reorderRooms: reorderMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Refetch
    refetch,
  };
}

export default usePropertyRooms;
