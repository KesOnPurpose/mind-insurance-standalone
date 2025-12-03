import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTodayPractices,
  createPractice,
  updatePractice,
  calculatePracticePoints,
  isWithinTimeWindow,
  getUserStats,
  getPracticesByDateRange,
  deletePractice,
  getDailyCompletionStatus,
} from '../practiceService';
import { supabase } from '@/integrations/supabase/client';
import type { DailyPractice, PracticeType } from '@/types/practices';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('practiceService', () => {
  const mockPractices: DailyPractice[] = [
    {
      id: '1',
      user_id: 'test-user-id',
      practice_date: '2024-01-15',
      practice_type: 'P' as PracticeType,
      data: { content: 'Test practice P' },
      completed: true,
      completed_at: '2024-01-15T08:00:00Z',
      points_earned: 4,
      is_late: false,
      created_at: '2024-01-15T08:00:00Z',
      updated_at: '2024-01-15T08:00:00Z',
    },
    {
      id: '2',
      user_id: 'test-user-id',
      practice_date: '2024-01-15',
      practice_type: 'R' as PracticeType,
      data: { content: 'Test practice R' },
      completed: false,
      completed_at: null,
      points_earned: 0,
      is_late: false,
      created_at: '2024-01-15T08:30:00Z',
      updated_at: '2024-01-15T08:30:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to control time-based tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTodayPractices', () => {
    it('should fetch today practices successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockPractices,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getTodayPractices('test-user-id');

      expect(result).toEqual(mockPractices);
      expect(supabase.from).toHaveBeenCalledWith('daily_practices');
    });

    it('should handle different timezones', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      await getTodayPractices('test-user-id', 'Asia/Tokyo');

      // Should use correct date for timezone
      expect(supabase.from).toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Database error');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error,
              }),
            }),
          }),
        }),
      } as any);

      await expect(getTodayPractices('test-user-id')).rejects.toThrow('Database error');
    });
  });

  describe('createPractice', () => {
    it('should create practice successfully', async () => {
      const newPractice = {
        user_id: 'test-user-id',
        practice_date: '2024-01-15',
        practice_type: 'T' as PracticeType,
        data: { content: 'Test content' },
      };

      const createdPractice = {
        ...newPractice,
        id: '3',
        completed: true,
        completed_at: '2024-01-15T12:00:00Z',
        points_earned: 2,
        is_late: false,
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdPractice,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await createPractice(newPractice);

      expect(result).toEqual(createdPractice);
      expect(supabase.from).toHaveBeenCalledWith('daily_practices');
    });

    it('should calculate correct points for each practice type', async () => {
      const practiceTypes: PracticeType[] = ['P', 'R', 'O', 'T', 'E', 'C', 'T2'];
      const expectedPoints = [4, 3, 3, 2, 4, 2, 2];

      for (let i = 0; i < practiceTypes.length; i++) {
        const practice = {
          user_id: 'test-user-id',
          practice_date: '2024-01-15',
          practice_type: practiceTypes[i],
          data: { content: 'Test' },
        };

        vi.mocked(supabase.from).mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...practice, points_earned: expectedPoints[i] },
                error: null,
              }),
            }),
          }),
        } as any);

        const result = await createPractice(practice);
        expect(result.points_earned).toBe(expectedPoints[i]);
      }
    });

    it('should handle creation errors', async () => {
      const error = new Error('Insert failed');
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      await expect(createPractice({
        user_id: 'test-user-id',
        practice_date: '2024-01-15',
        practice_type: 'P',
        data: {},
      })).rejects.toThrow('Insert failed');
    });
  });

  describe('updatePractice', () => {
    it('should update practice successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { practice_type: 'P' },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      await updatePractice('1', { completed: true });

      expect(supabase.from).toHaveBeenCalledWith('daily_practices');
    });

    it('should recalculate points when updating completion', async () => {
      const mockFrom = vi.fn();
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { practice_type: 'E' },
              error: null,
            }),
          }),
        }),
      });
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      vi.mocked(supabase).from = mockFrom;

      await updatePractice('1', { completed: true });

      const updateCall = mockFrom.mock.calls[1][0];
      expect(updateCall).toBe('daily_practices');
    });

    it('should handle update errors', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { practice_type: 'P' },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: new Error('Update failed'),
          }),
        }),
      } as any);

      await expect(updatePractice('1', { completed: false })).rejects.toThrow('Update failed');
    });
  });

  describe('calculatePracticePoints', () => {
    it('should return correct base points for each practice type', () => {
      const testCases: { type: PracticeType; expected: number }[] = [
        { type: 'P', expected: 4 },
        { type: 'R', expected: 3 },
        { type: 'O', expected: 3 },
        { type: 'T', expected: 2 },
        { type: 'E', expected: 4 },
        { type: 'C', expected: 2 },
        { type: 'T2', expected: 2 },
      ];

      testCases.forEach(({ type, expected }) => {
        const points = calculatePracticePoints(type, false);
        expect(points).toBe(expected);
      });
    });

    it('should always return base points (no late penalty)', () => {
      const points = calculatePracticePoints('P', true);
      expect(points).toBe(4); // Should be 4, not reduced
    });

    it('should handle unknown practice type', () => {
      const points = calculatePracticePoints('UNKNOWN' as PracticeType, false);
      expect(points).toBe(0);
    });
  });

  describe('isWithinTimeWindow', () => {
    it('should check morning window correctly', () => {
      // Set time to 8 AM
      vi.setSystemTime(new Date('2024-01-15T08:00:00'));

      expect(isWithinTimeWindow('P')).toBe(true);
      expect(isWithinTimeWindow('R')).toBe(true);
      expect(isWithinTimeWindow('O')).toBe(true);
      expect(isWithinTimeWindow('T')).toBe(false);
      expect(isWithinTimeWindow('E')).toBe(false);
      expect(isWithinTimeWindow('C')).toBe(false);
      expect(isWithinTimeWindow('T2')).toBe(false);
    });

    it('should check afternoon window correctly', () => {
      // Set time to 1 PM
      vi.setSystemTime(new Date('2024-01-15T13:00:00'));

      expect(isWithinTimeWindow('P')).toBe(false);
      expect(isWithinTimeWindow('R')).toBe(false);
      expect(isWithinTimeWindow('O')).toBe(false);
      expect(isWithinTimeWindow('T')).toBe(true);
      expect(isWithinTimeWindow('E')).toBe(true);
      expect(isWithinTimeWindow('C')).toBe(false);
      expect(isWithinTimeWindow('T2')).toBe(false);
    });

    it('should check evening window correctly', () => {
      // Set time to 6 PM
      vi.setSystemTime(new Date('2024-01-15T18:00:00'));

      expect(isWithinTimeWindow('P')).toBe(false);
      expect(isWithinTimeWindow('R')).toBe(false);
      expect(isWithinTimeWindow('O')).toBe(false);
      expect(isWithinTimeWindow('T')).toBe(false);
      expect(isWithinTimeWindow('E')).toBe(false);
      expect(isWithinTimeWindow('C')).toBe(true);
      expect(isWithinTimeWindow('T2')).toBe(true);
    });

    it('should handle different timezones', () => {
      vi.setSystemTime(new Date('2024-01-15T15:00:00Z')); // 3 PM UTC

      // Should adjust for timezone
      const result = isWithinTimeWindow('P', 'America/New_York');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getUserStats', () => {
    it('should calculate user statistics correctly', async () => {
      const completedPractices = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        user_id: 'test-user-id',
        practice_date: `2024-01-${(i % 30) + 1}`.padEnd(10, '0').slice(0, 10),
        practice_type: (['P', 'R', 'O', 'T', 'E', 'C', 'T2'][i % 7]) as PracticeType,
        completed: true,
        points_earned: [4, 3, 3, 2, 4, 2, 2][i % 7],
        data: {},
      }));

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'daily_practices') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: completedPractices,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'practice_streaks') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    current_streak: 7,
                    longest_streak: 14,
                  },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const stats = await getUserStats('test-user-id');

      expect(stats.totalPractices).toBe(50);
      expect(stats.currentStreak).toBe(7);
      expect(stats.longestStreak).toBe(14);
      expect(stats.totalPoints).toBeGreaterThan(0);
      expect(stats.championshipLevel).toBeDefined();
      expect(stats.practiceBreakdown).toBeDefined();
    });

    it('should determine championship levels correctly', async () => {
      const testCases = [
        { points: 12000, expected: 'platinum' },
        { points: 6000, expected: 'gold' },
        { points: 3000, expected: 'silver' },
        { points: 500, expected: 'bronze' },
      ];

      for (const { points, expected } of testCases) {
        vi.mocked(supabase.from).mockImplementation((table: string) => {
          if (table === 'daily_practices') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: [{ points_earned: points, practice_date: '2024-01-15', practice_type: 'P' }],
                      error: null,
                    }),
                  }),
                }),
              }),
            } as any;
          }
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          } as any;
        });

        const stats = await getUserStats('test-user-id');
        expect(stats.championshipLevel).toBe(expected);
      }
    });

    it('should handle no practices found', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'daily_practices') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        } as any;
      });

      const stats = await getUserStats('test-user-id');

      expect(stats.totalPractices).toBe(0);
      expect(stats.totalPoints).toBe(0);
      expect(stats.averagePointsPerDay).toBe(0);
      expect(stats.completionRate).toBe(0);
      expect(stats.championshipLevel).toBe('bronze');
    });
  });

  describe('getDailyCompletionStatus', () => {
    it('should calculate daily completion status correctly', async () => {
      const dayPractices = [
        { ...mockPractices[0], practice_type: 'P', completed: true, points_earned: 4 },
        { ...mockPractices[0], practice_type: 'R', completed: true, points_earned: 3 },
        { ...mockPractices[0], practice_type: 'O', completed: true, points_earned: 3 },
        { ...mockPractices[0], practice_type: 'T', completed: false, points_earned: 0 },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: dayPractices,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const status = await getDailyCompletionStatus('test-user-id', '2024-01-15');

      expect(status.practicesCompleted).toContain('P');
      expect(status.practicesCompleted).toContain('R');
      expect(status.practicesCompleted).toContain('O');
      expect(status.practicesMissed).toContain('T');
      expect(status.practicesMissed).toContain('E');
      expect(status.practicesMissed).toContain('C');
      expect(status.practicesMissed).toContain('T2');
      expect(status.totalEarnedPoints).toBe(10);
      expect(status.completionPercentage).toBe(43); // 3/7 practices
      expect(status.windowsCompleted).toBe(1); // Only morning window complete
      expect(status.isFullyComplete).toBe(false);
    });

    it('should identify fully complete day', async () => {
      const allPractices = ['P', 'R', 'O', 'T', 'E', 'C', 'T2'].map(type => ({
        ...mockPractices[0],
        practice_type: type as PracticeType,
        completed: true,
        points_earned: calculatePracticePoints(type as PracticeType, false),
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: allPractices,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const status = await getDailyCompletionStatus('test-user-id', '2024-01-15');

      expect(status.isFullyComplete).toBe(true);
      expect(status.completionPercentage).toBe(100);
      expect(status.windowsCompleted).toBe(3);
      expect(status.practicesMissed).toHaveLength(0);
    });
  });
});