import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { ModelWeek } from '@/types/modelWeek';

const STORAGE_KEY_PREFIX = 'modelWeek_';

// Generate default empty model week structure
function generateDefaultModelWeek(userId: string): ModelWeek {
  return {
    userId,
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
    preferences: {
      maxTacticsPerDay: 3,
      preferredTimes: ['morning', 'afternoon'],
      bufferTime: 15,
    },
  };
}

// Load model week from localStorage
function loadModelWeek(userId: string): ModelWeek {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[useModelWeek] Error loading from localStorage:', error);
  }
  return generateDefaultModelWeek(userId);
}

// Save model week to localStorage
function saveModelWeekToStorage(modelWeek: ModelWeek): void {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${modelWeek.userId}`,
      JSON.stringify(modelWeek)
    );
  } catch (error) {
    console.error('[useModelWeek] Error saving to localStorage:', error);
    throw error;
  }
}

export function useModelWeek(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load from localStorage
  const { data: modelWeek, isLoading, error } = useQuery({
    queryKey: ['modelWeek', userId],
    queryFn: () => loadModelWeek(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Save mutation with optimistic updates
  const { mutate: saveModelWeek, isPending: isSaving } = useMutation({
    mutationFn: async (updatedWeek: ModelWeek) => {
      saveModelWeekToStorage(updatedWeek);
      return updatedWeek;
    },
    onMutate: async (updatedWeek) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['modelWeek', userId] });

      // Snapshot previous value
      const previousWeek = queryClient.getQueryData<ModelWeek>(['modelWeek', userId]);

      // Optimistically update
      queryClient.setQueryData(['modelWeek', userId], updatedWeek);

      return { previousWeek };
    },
    onError: (error, _updatedWeek, context) => {
      // Rollback on error
      if (context?.previousWeek) {
        queryClient.setQueryData(['modelWeek', userId], context.previousWeek);
      }
      toast({
        title: 'Error',
        description: 'Failed to save model week. Please try again.',
        variant: 'destructive',
      });
      console.error('[useModelWeek] Save error:', error);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Model week saved successfully!',
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['modelWeek', userId] });
    },
  });

  // Reset to default
  const { mutate: resetModelWeek } = useMutation({
    mutationFn: async () => {
      const defaultWeek = generateDefaultModelWeek(userId);
      saveModelWeekToStorage(defaultWeek);
      return defaultWeek;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['modelWeek', userId], data);
      toast({
        title: 'Reset Complete',
        description: 'Model week has been reset to default.',
      });
    },
  });

  return {
    modelWeek: modelWeek || null,
    isLoading,
    isSaving,
    error,
    saveModelWeek,
    resetModelWeek,
  };
}
