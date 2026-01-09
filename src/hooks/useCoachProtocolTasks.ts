// useCoachProtocolTasks Hook
// Fetches today's tasks for coach protocols and handles task completion

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getTodayTasks,
  completeTask,
  getWeekDayTitles,
} from '@/services/coachProtocolV2Service';
import type {
  TodayCoachTasksResponse,
  CompleteTaskRequest,
  AssignmentSlot,
} from '@/types/coach-protocol';

// Extended slot data with week titles for roadmap display
interface SlotTasksWithTitles {
  tasks: TodayCoachTasksResponse['primary'];
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
  weekTitles: string[];  // Task titles for each day in current week
  tomorrowTitle: string | undefined;  // Tomorrow's task title for celebration teaser
}

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
  getSlotTasks: (slot: AssignmentSlot) => SlotTasksWithTitles;
}

export function useCoachProtocolTasks(): UseCoachProtocolTasksReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayTasks, setTodayTasks] = useState<TodayCoachTasksResponse>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Week titles for roadmap display (keyed by slot)
  const [weekTitles, setWeekTitles] = useState<Record<AssignmentSlot, string[]>>({
    primary: [],
    secondary: [],
  });

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

      // Fetch week titles for each active slot
      const newWeekTitles: Record<AssignmentSlot, string[]> = {
        primary: [],
        secondary: [],
      };

      if (data.primary?.protocol?.id && data.primary?.assignment?.current_week) {
        newWeekTitles.primary = await getWeekDayTitles(
          data.primary.protocol.id,
          data.primary.assignment.current_week
        );
      }

      if (data.secondary?.protocol?.id && data.secondary?.assignment?.current_week) {
        newWeekTitles.secondary = await getWeekDayTitles(
          data.secondary.protocol.id,
          data.secondary.assignment.current_week
        );
      }

      setWeekTitles(newWeekTitles);
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
          user_id: user?.id, // Required for virtual assignments (all_users visibility)
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
    (slot: AssignmentSlot): SlotTasksWithTitles => {
      const slotData = slot === 'primary' ? todayTasks.primary : todayTasks.secondary;
      const slotWeekTitles = weekTitles[slot] || [];

      if (!slotData) {
        return {
          tasks: undefined,
          completedCount: 0,
          totalCount: 0,
          allCompleted: false,
          weekTitles: [],
          tomorrowTitle: undefined,
        };
      }

      const completedCount = slotData.completed_task_ids.length;
      const totalCount = slotData.tasks.length;
      const currentDay = slotData.assignment?.current_day || 1;

      // Get tomorrow's title for celebration teaser (day is 1-indexed, array is 0-indexed)
      const tomorrowTitle = currentDay < 7 ? slotWeekTitles[currentDay] : undefined;

      return {
        tasks: slotData,
        completedCount,
        totalCount,
        allCompleted: completedCount === totalCount && totalCount > 0,
        weekTitles: slotWeekTitles,
        tomorrowTitle,
      };
    },
    [todayTasks, weekTitles]
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
