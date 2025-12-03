import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePersonalizedTactics } from '../usePersonalizedTactics';
import * as tacticFilterService from '@/services/tacticFilterService';
import * as assessmentService from '@/services/assessmentService';
import * as progressService from '@/services/progressService';

// Mock dependencies
vi.mock('@/services/tacticFilterService', () => ({
  getPersonalizedTactics: vi.fn(),
  getRecommendedWeekCount: vi.fn(),
  getStartingWeek: vi.fn(),
  getNextRecommendedTactic: vi.fn(),
  getEnhancedPersonalizedTactics: vi.fn(),
  calculateTotalCost: vi.fn(),
}));

vi.mock('@/services/assessmentService', () => ({
  getUserAssessment: vi.fn(),
}));

vi.mock('@/services/progressService', () => ({
  useUserProgress: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

describe('usePersonalizedTactics', () => {
  let queryClient: QueryClient;

  const mockAssessment = {
    user_id: 'test-user-id',
    capital_available: '30k-50k',
    target_populations: ['seniors', 'veterans'],
    timeline: '6-months',
    caregiving_experience: 'some-experience',
    licensing_familiarity: 'somewhat-familiar',
    overall_score: 75,
    readiness_level: 'fast_track' as const,
    financial_score: 80,
    market_score: 70,
    operational_score: 75,
    mindset_score: 80,
    ownership_model: 'single-home',
    target_state: 'CA',
    budget_min_usd: 30000,
    budget_max_usd: 50000,
    immediate_priority: 'property_acquisition' as const,
    prioritized_populations: ['seniors'],
  };

  const mockTactics = [
    {
      tactic_id: 'T001',
      tactic_name: 'Market Research',
      week_assignment: 1,
      priority_score: 95,
      estimated_time: '2 hours',
      is_critical_path: true,
      cost_min: 0,
      cost_max: 100,
      prerequisites: [],
      can_start: true,
    },
    {
      tactic_id: 'T002',
      tactic_name: 'Property Search',
      week_assignment: 2,
      priority_score: 90,
      estimated_time: '4 hours',
      is_critical_path: true,
      cost_min: 500,
      cost_max: 1000,
      prerequisites: ['T001'],
      can_start: false,
    },
  ];

  const mockProgressData = [
    {
      user_id: 'test-user-id',
      tactic_id: 'T001',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      completed_at: '2024-01-02T00:00:00Z',
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

    // Default mock for useUserProgress
    vi.mocked(progressService.useUserProgress).mockReturnValue({
      data: mockProgressData,
      isLoading: false,
      error: null,
    } as any);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Initial State', () => {
    it('should return initial state correctly', () => {
      vi.mocked(assessmentService.getUserAssessment).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.tactics).toEqual([]);
      expect(result.current.hasAssessment).toBe(false);
      expect(result.current.totalTacticsCount).toBe(0);
      expect(result.current.recommendedWeeks).toBe(15);
      expect(result.current.startingWeek).toBe(1);
    });
  });

  describe('Enhanced Assessment Flow', () => {
    it('should use enhanced filtering for assessments with ownership_model', async () => {
      vi.mocked(assessmentService.getUserAssessment).mockResolvedValue(mockAssessment);
      vi.mocked(tacticFilterService.getEnhancedPersonalizedTactics).mockResolvedValue(mockTactics);
      vi.mocked(tacticFilterService.calculateTotalCost).mockReturnValue({
        total_min: 500,
        total_max: 1100,
        upfront_capital: 500,
        recurring_monthly: 100,
        one_time_fees: 500,
      });

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tactics).toEqual(mockTactics);
      expect(result.current.hasAssessment).toBe(true);
      expect(tacticFilterService.getEnhancedPersonalizedTactics).toHaveBeenCalledWith(
        expect.objectContaining({
          ownership_model: 'single-home',
          target_state: 'CA',
          budget_min_usd: 30000,
          budget_max_usd: 50000,
        }),
        'test-user-id',
        'property_acquisition'
      );
      expect(tacticFilterService.getPersonalizedTactics).not.toHaveBeenCalled();
    });

    it('should fall back to legacy filtering for older assessments', async () => {
      const legacyAssessment = {
        ...mockAssessment,
        ownership_model: undefined,
        target_state: undefined,
        budget_min_usd: undefined,
        budget_max_usd: undefined,
      };

      vi.mocked(assessmentService.getUserAssessment).mockResolvedValue(legacyAssessment);
      vi.mocked(tacticFilterService.getPersonalizedTactics).mockResolvedValue(mockTactics);
      vi.mocked(tacticFilterService.calculateTotalCost).mockReturnValue({
        total_min: 0,
        total_max: 0,
        upfront_capital: 0,
        recurring_monthly: 0,
        one_time_fees: 0,
      });

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tactics).toEqual(mockTactics);
      expect(tacticFilterService.getPersonalizedTactics).toHaveBeenCalledWith(
        expect.objectContaining({
          capital_available: '30k-50k',
          target_populations: ['seniors', 'veterans'],
          timeline: '6-months',
        })
      );
      expect(tacticFilterService.getEnhancedPersonalizedTactics).not.toHaveBeenCalled();
    });
  });

  describe('Calculated Metrics', () => {
    beforeEach(async () => {
      vi.mocked(assessmentService.getUserAssessment).mockResolvedValue(mockAssessment);
      vi.mocked(tacticFilterService.getEnhancedPersonalizedTactics).mockResolvedValue(mockTactics);
    });

    it('should calculate recommended weeks correctly', async () => {
      vi.mocked(tacticFilterService.getRecommendedWeekCount).mockReturnValue(12);

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recommendedWeeks).toBe(12);
      expect(tacticFilterService.getRecommendedWeekCount).toHaveBeenCalledWith(
        expect.objectContaining({
          overall_score: 75,
          readiness_level: 'fast_track',
        })
      );
    });

    it('should calculate starting week correctly', async () => {
      vi.mocked(tacticFilterService.getStartingWeek).mockReturnValue(3);

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.startingWeek).toBe(3);
      expect(tacticFilterService.getStartingWeek).toHaveBeenCalledWith(
        expect.objectContaining({
          overall_score: 75,
          readiness_level: 'fast_track',
        })
      );
    });

    it('should calculate cost breakdown', async () => {
      const costBreakdown = {
        total_min: 10000,
        total_max: 25000,
        upfront_capital: 15000,
        recurring_monthly: 2000,
        one_time_fees: 3000,
      };

      vi.mocked(tacticFilterService.calculateTotalCost).mockReturnValue(costBreakdown);

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.costBreakdown).toEqual(costBreakdown);
      expect(tacticFilterService.calculateTotalCost).toHaveBeenCalledWith(mockTactics);
    });

    it('should count blocked and critical path tactics', async () => {
      const tacticsWithBlocked = [
        { ...mockTactics[0], can_start: true },
        { ...mockTactics[1], can_start: false },
        {
          tactic_id: 'T003',
          tactic_name: 'Financing',
          can_start: false,
          is_critical_path: false,
        },
      ];

      vi.mocked(tacticFilterService.getEnhancedPersonalizedTactics).mockResolvedValue(
        tacticsWithBlocked as any
      );

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.blockedTactics).toBe(2);
      expect(result.current.criticalPathTactics).toBe(2);
    });
  });

  describe('Next Tactic Recommendation', () => {
    it('should fetch next recommended tactic', async () => {
      const nextTactic = mockTactics[0];
      vi.mocked(assessmentService.getUserAssessment).mockResolvedValue(mockAssessment);
      vi.mocked(tacticFilterService.getNextRecommendedTactic).mockResolvedValue(nextTactic);

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.nextTactic).toEqual(nextTactic);
      expect(tacticFilterService.getNextRecommendedTactic).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          overall_score: 75,
          readiness_level: 'fast_track',
        })
      );
    });

    it('should handle no next tactic available', async () => {
      vi.mocked(assessmentService.getUserAssessment).mockResolvedValue(mockAssessment);
      vi.mocked(tacticFilterService.getNextRecommendedTactic).mockResolvedValue(null);

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.nextTactic).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('should handle assessment fetch errors', async () => {
      const error = new Error('Failed to fetch assessment');
      vi.mocked(assessmentService.getUserAssessment).mockRejectedValue(error);

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tactics).toEqual([]);
      expect(result.current.hasAssessment).toBe(false);
    });

    it('should handle tactics fetch errors', async () => {
      vi.mocked(assessmentService.getUserAssessment).mockResolvedValue(mockAssessment);
      vi.mocked(tacticFilterService.getEnhancedPersonalizedTactics).mockRejectedValue(
        new Error('Failed to fetch tactics')
      );

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tactics).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle no user authentication', async () => {
      vi.unmock('@/contexts/AuthContext');
      vi.mock('@/contexts/AuthContext', () => ({
        useAuth: () => ({
          user: null,
        }),
      }));

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tactics).toEqual([]);
      expect(result.current.hasAssessment).toBe(false);
    });

    it('should handle empty assessment data', async () => {
      vi.mocked(assessmentService.getUserAssessment).mockResolvedValue(null);

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tactics).toEqual([]);
      expect(result.current.hasAssessment).toBe(false);
      expect(result.current.recommendedWeeks).toBe(15);
    });

    it('should handle empty tactics array', async () => {
      vi.mocked(assessmentService.getUserAssessment).mockResolvedValue(mockAssessment);
      vi.mocked(tacticFilterService.getEnhancedPersonalizedTactics).mockResolvedValue([]);
      vi.mocked(tacticFilterService.calculateTotalCost).mockReturnValue({
        total_min: 0,
        total_max: 0,
        upfront_capital: 0,
        recurring_monthly: 0,
        one_time_fees: 0,
      });

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tactics).toEqual([]);
      expect(result.current.totalTacticsCount).toBe(0);
      expect(result.current.blockedTactics).toBe(0);
      expect(result.current.criticalPathTactics).toBe(0);
    });

    it('should handle very large tactics array', async () => {
      const largeTacticsArray = Array.from({ length: 1000 }, (_, i) => ({
        ...mockTactics[0],
        tactic_id: `T${i}`,
        tactic_name: `Tactic ${i}`,
        is_critical_path: i % 2 === 0,
        can_start: i % 3 !== 0,
      }));

      vi.mocked(assessmentService.getUserAssessment).mockResolvedValue(mockAssessment);
      vi.mocked(tacticFilterService.getEnhancedPersonalizedTactics).mockResolvedValue(
        largeTacticsArray as any
      );

      const { result } = renderHook(() => usePersonalizedTactics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalTacticsCount).toBe(1000);
      expect(result.current.criticalPathTactics).toBe(500);
      expect(result.current.blockedTactics).toBe(333); // Every 3rd tactic is blocked
    });
  });
});