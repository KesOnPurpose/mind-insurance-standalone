import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUserProgress,
  useStartTactic,
  useCompleteTactic,
  useSaveNotes,
  calculateWeekProgress,
} from '../progressService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TacticWithProgress } from '@/types/tactic';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('progressService', () => {
  let queryClient: QueryClient;

  const mockProgressData = [
    {
      user_id: 'test-user-id',
      tactic_id: 'T001',
      status: 'completed',
      started_at: '2024-01-10T10:00:00Z',
      completed_at: '2024-01-12T15:00:00Z',
      notes: 'Successfully completed market research',
    },
    {
      user_id: 'test-user-id',
      tactic_id: 'T002',
      status: 'in_progress',
      started_at: '2024-01-13T09:00:00Z',
      completed_at: null,
      notes: 'Working on property search',
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useUserProgress', () => {
    it('should fetch user progress successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProgressData,
            error: null,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useUserProgress('test-user-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProgressData);
      });

      expect(supabase.from).toHaveBeenCalledWith('gh_user_tactic_progress');
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch progress');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useUserProgress('test-user-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });
    });

    it('should handle empty progress data', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useUserProgress('test-user-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });
  });

  describe('useStartTactic', () => {
    it('should start tactic successfully', async () => {
      const newProgress = {
        user_id: 'test-user-id',
        tactic_id: 'T003',
        status: 'in_progress',
        started_at: '2024-01-15T10:00:00Z',
      };

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: newProgress,
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useStartTactic(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          userId: 'test-user-id',
          tacticId: 'T003',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Tactic started! 🚀');
      expect(supabase.from).toHaveBeenCalledWith('gh_user_tactic_progress');
    });

    it('should handle start tactic errors', async () => {
      const error = new Error('Failed to start tactic');
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useStartTactic(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            userId: 'test-user-id',
            tacticId: 'T003',
          });
        } catch (e) {
          expect(e).toEqual(error);
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to start tactic');
    });

    it('should invalidate queries after successful start', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { status: 'in_progress' },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useStartTactic(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          userId: 'test-user-id',
          tacticId: 'T004',
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['userProgress'] });
    });
  });

  describe('useCompleteTactic', () => {
    it('should complete tactic successfully', async () => {
      const completedProgress = {
        user_id: 'test-user-id',
        tactic_id: 'T002',
        status: 'completed',
        completed_at: '2024-01-15T16:00:00Z',
        notes: 'Finished property search',
      };

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: completedProgress,
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useCompleteTactic(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          userId: 'test-user-id',
          tacticId: 'T002',
          notes: 'Finished property search',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('🎉 Tactic completed! +1 to your journey', {
        duration: 3000,
      });
    });

    it('should complete tactic without notes', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { status: 'completed' },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useCompleteTactic(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          userId: 'test-user-id',
          tacticId: 'T005',
        });
      });

      expect(supabase.from).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle completion errors', async () => {
      const error = new Error('Failed to complete tactic');
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useCompleteTactic(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            userId: 'test-user-id',
            tacticId: 'T002',
          });
        } catch (e) {
          expect(e).toEqual(error);
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to complete tactic');
    });
  });

  describe('useSaveNotes', () => {
    it('should save notes for existing progress', async () => {
      // Mock checking for existing progress
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  status: 'in_progress',
                  started_at: '2024-01-13T09:00:00Z',
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock upsert
      vi.mocked(supabase.from).mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { notes: 'Updated notes' },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSaveNotes(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          userId: 'test-user-id',
          tacticId: 'T002',
          notes: 'Updated notes for property search',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Notes saved!', { duration: 2000 });
    });

    it('should create new progress if none exists', async () => {
      // Mock checking for existing progress (none found)
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock upsert
      vi.mocked(supabase.from).mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                status: 'in_progress',
                notes: 'New notes',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSaveNotes(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          userId: 'test-user-id',
          tacticId: 'T006',
          notes: 'New notes for new tactic',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Notes saved!', { duration: 2000 });
    });

    it('should handle save notes errors', async () => {
      // Mock checking for existing progress
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock upsert with error
      const error = new Error('Failed to save notes');
      vi.mocked(supabase.from).mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSaveNotes(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            userId: 'test-user-id',
            tacticId: 'T007',
            notes: 'Failed notes',
          });
        } catch (e) {
          expect(e).toEqual(error);
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to save notes');
    });
  });

  describe('calculateWeekProgress', () => {
    const mockTactics: TacticWithProgress[] = [
      {
        tactic_id: 'T001',
        tactic_name: 'Market Research',
        week_assignment: 1,
        estimated_time: '2 hours',
        status: 'completed',
        is_critical_path: true,
      },
      {
        tactic_id: 'T002',
        tactic_name: 'Financial Planning',
        week_assignment: 1,
        estimated_time: '3 hours',
        status: 'in_progress',
        is_critical_path: false,
      },
      {
        tactic_id: 'T003',
        tactic_name: 'Legal Setup',
        week_assignment: 1,
        estimated_time: '1 hour',
        status: null,
        is_critical_path: false,
      },
      {
        tactic_id: 'T004',
        tactic_name: 'Property Search',
        week_assignment: 2,
        estimated_time: '4 hours',
        status: null,
        is_critical_path: true,
      },
    ] as TacticWithProgress[];

    it('should calculate week progress correctly', () => {
      const week1Progress = calculateWeekProgress(mockTactics, 1);

      expect(week1Progress.weekNumber).toBe(1);
      expect(week1Progress.weekTitle).toBe('Foundation & Vision');
      expect(week1Progress.phase).toBe('foundation');
      expect(week1Progress.totalTactics).toBe(3);
      expect(week1Progress.completedTactics).toBe(1);
      expect(week1Progress.inProgressTactics).toBe(1);
      expect(week1Progress.estimatedHours).toBe(6);
      expect(week1Progress.progressPercentage).toBeCloseTo(33.33, 1);
      expect(week1Progress.isUnlocked).toBe(true);
    });

    it('should handle week with no tactics', () => {
      const week3Progress = calculateWeekProgress(mockTactics, 3);

      expect(week3Progress.totalTactics).toBe(0);
      expect(week3Progress.completedTactics).toBe(0);
      expect(week3Progress.inProgressTactics).toBe(0);
      expect(week3Progress.estimatedHours).toBe(0);
      expect(week3Progress.progressPercentage).toBe(0);
    });

    it('should parse different time formats', () => {
      const tacticsWithVariedTimes: TacticWithProgress[] = [
        { week_assignment: 1, estimated_time: '30 min' } as TacticWithProgress,
        { week_assignment: 1, estimated_time: '2 hours' } as TacticWithProgress,
        { week_assignment: 1, estimated_time: '90 minutes' } as TacticWithProgress,
        { week_assignment: 1, estimated_time: null } as TacticWithProgress,
        { week_assignment: 1, estimated_time: 'invalid' } as TacticWithProgress,
      ];

      const progress = calculateWeekProgress(tacticsWithVariedTimes, 1);

      // 30 min = 0.5, 2 hours = 2, 90 min = 1.5, null = 0.5, invalid = 0.5
      expect(progress.estimatedHours).toBe(5);
    });

    it('should determine correct phase for each week', () => {
      const weeks = [
        { week: 1, expectedPhase: 'foundation' },
        { week: 3, expectedPhase: 'foundation' },
        { week: 4, expectedPhase: 'market_entry' },
        { week: 6, expectedPhase: 'market_entry' },
        { week: 7, expectedPhase: 'acquisition' },
        { week: 9, expectedPhase: 'acquisition' },
        { week: 10, expectedPhase: 'operations' },
        { week: 12, expectedPhase: 'operations' },
        { week: 13, expectedPhase: 'growth' },
        { week: 15, expectedPhase: 'growth' },
      ];

      weeks.forEach(({ week, expectedPhase }) => {
        const progress = calculateWeekProgress([], week);
        expect(progress.phase).toBe(expectedPhase);
      });
    });

    it('should return correct week titles', () => {
      const weekTitles = {
        1: 'Foundation & Vision',
        2: 'Market Research',
        3: 'Financial Planning',
        4: 'Legal Setup',
        5: 'Licensing Process',
        6: 'Business Formation',
        7: 'Property Search',
        8: 'Creative Financing',
        9: 'Property Acquisition',
        10: 'Operations Setup',
        11: 'Marketing Launch',
        12: 'First Residents',
        13: 'Optimization',
        14: 'Scaling Preparation',
        15: 'Growth & Expansion',
        16: 'Week 16', // Default format for unknown weeks
      };

      Object.entries(weekTitles).forEach(([week, title]) => {
        const progress = calculateWeekProgress([], parseInt(week));
        expect(progress.weekTitle).toBe(title);
      });
    });
  });
});