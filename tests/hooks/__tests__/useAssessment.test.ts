import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAssessment } from '../useAssessment';
import * as assessmentService from '@/services/assessmentService';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/services/assessmentService', () => ({
  calculateScores: vi.fn(),
  saveAssessmentResults: vi.fn(),
  getUserAssessment: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

describe('useAssessment', () => {
  let queryClient: QueryClient;

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

  describe('Initial State', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => useAssessment(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.assessment).toBe(undefined);
      expect(result.current.hasAssessment).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('Fetching Assessment', () => {
    it('should fetch user assessment successfully', async () => {
      const mockAssessment = {
        user_id: 'test-user-id',
        overall_score: 75,
        readiness_level: 'fast_track',
        financial_score: 80,
        market_score: 70,
        operational_score: 75,
        mindset_score: 80,
      };

      vi.mocked(assessmentService.getUserAssessment).mockResolvedValue(mockAssessment);

      const { result } = renderHook(() => useAssessment(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.assessment).toEqual(mockAssessment);
      expect(result.current.hasAssessment).toBe(true);
      expect(assessmentService.getUserAssessment).toHaveBeenCalledWith('test-user-id');
    });

    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Failed to fetch assessment');
      vi.mocked(assessmentService.getUserAssessment).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAssessment(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.assessment).toBe(undefined);
      expect(result.current.hasAssessment).toBe(false);
    });

    it('should handle no assessment data (null response)', async () => {
      vi.mocked(assessmentService.getUserAssessment).mockResolvedValue(null);

      const { result } = renderHook(() => useAssessment(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.assessment).toBe(null);
      expect(result.current.hasAssessment).toBe(false);
    });
  });

  describe('Submitting Assessment', () => {
    it('should submit assessment successfully', async () => {
      const mockAnswers = {
        capital: 'more-50k',
        creditScore: '800+',
        incomeStability: 'multiple-streams',
        creativeFinancing: 'very-familiar',
        licensingFamiliarity: 'licensed',
        targetPopulations: ['seniors', 'veterans'],
        marketResearch: 'extensive',
        reimbursementRate: 'more-6k',
        caregivingExperience: 'licensed-professional',
        timeCommitment: '40+',
        supportTeam: ['business-partner', 'hire-manager'],
        propertyManagement: 10,
        primaryMotivation: 'Make a positive impact in my community',
        commitmentLevel: 10,
        timeline: 'now',
      };

      const mockScores = {
        financial_score: 95,
        market_score: 90,
        operational_score: 92,
        mindset_score: 100,
        overall_score: 94,
        readiness_level: 'expert_implementation' as const,
      };

      vi.mocked(assessmentService.calculateScores).mockReturnValue(mockScores);
      vi.mocked(assessmentService.saveAssessmentResults).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAssessment(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.submitAssessment(mockAnswers);

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      expect(assessmentService.calculateScores).toHaveBeenCalledWith(mockAnswers);
      expect(assessmentService.saveAssessmentResults).toHaveBeenCalledWith(
        'test-user-id',
        mockAnswers,
        mockScores
      );
    });

    it('should handle submission errors', async () => {
      const mockAnswers = {
        capital: 'less-5k',
        creditScore: 'below-580',
        incomeStability: 'no-stable',
        creativeFinancing: 'never-heard',
        licensingFamiliarity: 'not-familiar',
        targetPopulations: [],
        marketResearch: 'not-researched',
        reimbursementRate: 'no-idea',
        caregivingExperience: 'no-experience',
        timeCommitment: 'less-10',
        supportTeam: [],
        propertyManagement: 1,
        primaryMotivation: '',
        commitmentLevel: 1,
        timeline: 'no-timeline',
      };

      const mockError = new Error('Failed to save assessment');
      vi.mocked(assessmentService.saveAssessmentResults).mockRejectedValue(mockError);
      vi.mocked(assessmentService.calculateScores).mockReturnValue({
        financial_score: 20,
        market_score: 15,
        operational_score: 10,
        mindset_score: 5,
        overall_score: 13,
        readiness_level: 'foundation_building',
      });

      const { result } = renderHook(() => useAssessment(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.submitAssessment(mockAnswers);

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      // Error should be handled gracefully
      expect(assessmentService.calculateScores).toHaveBeenCalledWith(mockAnswers);
      expect(assessmentService.saveAssessmentResults).toHaveBeenCalled();
    });

    it('should invalidate queries after successful submission', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(assessmentService.calculateScores).mockReturnValue({
        financial_score: 50,
        market_score: 50,
        operational_score: 50,
        mindset_score: 50,
        overall_score: 50,
        readiness_level: 'accelerated_learning',
      });
      vi.mocked(assessmentService.saveAssessmentResults).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAssessment(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const mockAnswers = {
        capital: '15k-30k',
        creditScore: '670-739',
        incomeStability: 'full-time-w2',
        creativeFinancing: 'basic',
        licensingFamiliarity: 'some-research',
        targetPopulations: ['seniors'],
        marketResearch: 'basic-google',
        reimbursementRate: '2k-4k',
        caregivingExperience: 'some-experience',
        timeCommitment: '20-30',
        supportTeam: ['family-help'],
        propertyManagement: 5,
        primaryMotivation: 'Financial freedom',
        commitmentLevel: 7,
        timeline: '6-months',
      };

      result.current.submitAssessment(mockAnswers);

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['assessment', 'test-user-id'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['personalizedTactics'] });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', async () => {
      vi.unmock('@/contexts/AuthContext');
      vi.mock('@/contexts/AuthContext', () => ({
        useAuth: () => ({
          user: null,
        }),
      }));

      const { result } = renderHook(() => useAssessment(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.assessment).toBe(undefined);
      expect(result.current.hasAssessment).toBe(false);
    });

    it('should handle empty assessment answers', async () => {
      const emptyAnswers = {} as any;

      vi.mocked(assessmentService.calculateScores).mockReturnValue({
        financial_score: 0,
        market_score: 0,
        operational_score: 0,
        mindset_score: 0,
        overall_score: 0,
        readiness_level: 'foundation_building',
      });

      const { result } = renderHook(() => useAssessment(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.submitAssessment(emptyAnswers);

      await waitFor(() => {
        expect(assessmentService.calculateScores).toHaveBeenCalledWith(emptyAnswers);
      });
    });

    it('should handle very long motivation text', async () => {
      const longMotivation = 'A'.repeat(10000);
      const mockAnswers = {
        capital: '5k-15k',
        creditScore: '580-669',
        incomeStability: 'part-time',
        creativeFinancing: 'heard-not-understand',
        licensingFamiliarity: 'know-exist',
        targetPopulations: ['seniors'],
        marketResearch: 'basic-google',
        reimbursementRate: '1k-2k',
        caregivingExperience: 'some-experience',
        timeCommitment: '10-20',
        supportTeam: [],
        propertyManagement: 3,
        primaryMotivation: longMotivation,
        commitmentLevel: 5,
        timeline: '12-months',
      };

      vi.mocked(assessmentService.calculateScores).mockReturnValue({
        financial_score: 30,
        market_score: 25,
        operational_score: 20,
        mindset_score: 30,
        overall_score: 26,
        readiness_level: 'foundation_building',
      });

      const { result } = renderHook(() => useAssessment(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.submitAssessment(mockAnswers);

      await waitFor(() => {
        expect(assessmentService.calculateScores).toHaveBeenCalledWith(mockAnswers);
      });
    });
  });
});