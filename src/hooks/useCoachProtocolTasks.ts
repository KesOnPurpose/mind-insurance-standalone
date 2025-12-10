// useCoachProtocolTasks Hook
// Fetches today's tasks for coach protocols and handles task completion

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getTodayTasks,
  completeTask,
} from '@/services/coachProtocolV2Service';
import type {
  TodayCoachTasksResponse,
  CompleteTaskRequest,
  AssignmentSlot,
} from '@/types/coach-protocol';

interface UseCoachProtocolTasksReturn {
  todayTasks: TodayCoachTasksResponse;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  completeTaskHandler: (
    assignmentId: string,
    taskId: string,
    data?: Partial<CompleteTaskRequest>
  ) => Promise<{ success: boolean; protocolCompleted?: boolean }>;
  refetch: () => Promise<void>;
  getSlotTasks: (slot: AssignmentSlot) => {
    tasks: TodayCoachTasksResponse['primary'];
    completedCount: number;
    totalCount: number;
    allCompleted: boolean;
  };
}

export function useCoachProtocolTasks(): UseCoachProtocolTasksReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayTasks, setTodayTasks] = useState<TodayCoachTasksResponse>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user?.id) {
      setTodayTasks({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getTodayTasks(user.id);
      setTodayTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
      console.error('Error fetching today tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completeTaskHandler = useCallback(
    async (
      assignmentId: string,
      taskId: string,
      data?: Partial<CompleteTaskRequest>
    ): Promise<{ success: boolean; protocolCompleted?: boolean }> => {
      try {
        setIsSaving(true);

        const result = await completeTask({
          assignment_id: assignmentId,
          task_id: taskId,
          notes: data?.notes,
          response_data: data?.response_data,
          time_spent_minutes: data?.time_spent_minutes,
          self_rating: data?.self_rating,
        });

        if (result.all_today_tasks_completed) {
          toast({
            title: 'Day Complete! 🎉',
            description: 'Great work completing all of today\'s tasks!',
          });
        } else {
          toast({
            title: 'Task Complete ✓',
            description: 'Keep going, you\'ve got this!',
          });
        }

        if (result.protocol_completed) {
          toast({
            title: 'Protocol Complete! 🏆',
            description: 'Congratulations on completing your coaching protocol!',
            duration: 5000,
          });
        }

        // Refetch to update UI
        await fetchTasks();

        return {
          success: true,
          protocolCompleted: result.protocol_completed,
        };
      } catch (err) {
        console.error('Error completing task:', err);
        toast({
          title: 'Error',
          description: 'Failed to complete task. Please try again.',
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsSaving(false);
      }
    },
    [fetchTasks, toast]
  );

  const getSlotTasks = useCallback(
    (slot: AssignmentSlot) => {
      const slotData = slot === 'primary' ? todayTasks.primary : todayTasks.secondary;

      if (!slotData) {
        return {
          tasks: undefined,
          completedCount: 0,
          totalCount: 0,
          allCompleted: false,
        };
      }

      const completedCount = slotData.completed_task_ids.length;
      const totalCount = slotData.tasks.length;

      return {
        tasks: slotData,
        completedCount,
        totalCount,
        allCompleted: completedCount === totalCount && totalCount > 0,
      };
    },
    [todayTasks]
  );

  return {
    todayTasks,
    isLoading,
    isSaving,
    error,
    completeTaskHandler,
    refetch: fetchTasks,
    getSlotTasks,
  };
}
