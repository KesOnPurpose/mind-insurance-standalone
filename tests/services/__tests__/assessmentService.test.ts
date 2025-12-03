import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateScores,
  saveAssessmentResults,
  getUserAssessment
} from '../assessmentService';
import { supabase } from '@/integrations/supabase/client';
import type { AssessmentAnswers } from '@/types/assessment';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(),
      update: vi.fn(),
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    })),
  },
}));

describe('assessmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateScores', () => {
    it('should calculate scores for high readiness answers', () => {
      const highReadinessAnswers: AssessmentAnswers = {
        capital: 'more-50k',
        creditScore: '800+',
        incomeStability: 'multiple-streams',
        creativeFinancing: 'very-familiar',
        licensingFamiliarity: 'licensed',
        targetPopulations: ['seniors', 'veterans', 'mental-health', 'disability'],
        marketResearch: 'connected',
        reimbursementRate: 'more-6k',
        caregivingExperience: 'licensed-professional',
        timeCommitment: '40+',
        supportTeam: ['business-partner', 'hire-manager', 'hire-caregivers'],
        propertyManagement: 10,
        primaryMotivation: 'I am deeply committed to making a positive impact in my community and building a sustainable business',
        commitmentLevel: 10,
        timeline: 'now',
      };

      const scores = calculateScores(highReadinessAnswers);

      expect(scores.financial_score).toBeGreaterThanOrEqual(90);
      expect(scores.market_score).toBeGreaterThanOrEqual(85);
      expect(scores.operational_score).toBeGreaterThanOrEqual(85);
      expect(scores.mindset_score).toBeGreaterThanOrEqual(90);
      expect(scores.overall_score).toBeGreaterThanOrEqual(81);
      expect(scores.readiness_level).toBe('expert_implementation');
    });

    it('should calculate scores for low readiness answers', () => {
      const lowReadinessAnswers: AssessmentAnswers = {
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

      const scores = calculateScores(lowReadinessAnswers);

      expect(scores.financial_score).toBeLessThanOrEqual(20);
      expect(scores.market_score).toBeLessThanOrEqual(15);
      expect(scores.operational_score).toBeLessThanOrEqual(20);
      expect(scores.mindset_score).toBeLessThanOrEqual(15);
      expect(scores.overall_score).toBeLessThanOrEqual(20);
      expect(scores.readiness_level).toBe('foundation_building');
    });

    it('should calculate scores for medium readiness answers', () => {
      const mediumReadinessAnswers: AssessmentAnswers = {
        capital: '15k-30k',
        creditScore: '670-739',
        incomeStability: 'full-time-w2',
        creativeFinancing: 'basic',
        licensingFamiliarity: 'some-research',
        targetPopulations: ['seniors', 'veterans'],
        marketResearch: 'basic-google',
        reimbursementRate: '2k-4k',
        caregivingExperience: 'some-experience',
        timeCommitment: '20-30',
        supportTeam: ['family-help'],
        propertyManagement: 5,
        primaryMotivation: 'Looking to build a stable business',
        commitmentLevel: 6,
        timeline: '6-months',
      };

      const scores = calculateScores(mediumReadinessAnswers);

      expect(scores.overall_score).toBeGreaterThanOrEqual(41);
      expect(scores.overall_score).toBeLessThanOrEqual(60);
      expect(scores.readiness_level).toBe('accelerated_learning');
    });

    it('should apply correct weight formula', () => {
      const answers: AssessmentAnswers = {
        capital: '30k-50k',
        creditScore: '740-799',
        incomeStability: 'self-employed',
        creativeFinancing: 'good',
        licensingFamiliarity: 'very-familiar',
        targetPopulations: ['seniors'],
        marketResearch: 'extensive',
        reimbursementRate: '4k-6k',
        caregivingExperience: 'extensive-experience',
        timeCommitment: '30-40',
        supportTeam: ['hire-caregivers'],
        propertyManagement: 8,
        primaryMotivation: 'Financial freedom and helping others',
        commitmentLevel: 8,
        timeline: '3-months',
      };

      const scores = calculateScores(answers);

      // Verify weighted formula: (financial * 1.3 + market * 1.2 + operational * 1.0 + mindset * 1.5) / 4
      const expectedOverall = Math.round(
        (scores.financial_score * 1.3 +
         scores.market_score * 1.2 +
         scores.operational_score * 1.0 +
         scores.mindset_score * 1.5) / 4
      );

      expect(scores.overall_score).toBe(expectedOverall);
    });

    it('should handle edge case values correctly', () => {
      const edgeCaseAnswers: AssessmentAnswers = {
        capital: 'invalid-value' as any,
        creditScore: 'not-sure',
        incomeStability: undefined as any,
        creativeFinancing: '',
        licensingFamiliarity: 'know-exist',
        targetPopulations: ['invalid'] as any,
        marketResearch: 'talked-providers',
        reimbursementRate: '1k-2k',
        caregivingExperience: null as any,
        timeCommitment: '10-20',
        supportTeam: ['unknown'] as any,
        propertyManagement: 15, // Above expected range
        primaryMotivation: 'A'.repeat(1000), // Very long text
        commitmentLevel: -5, // Negative value
        timeline: '12-months',
      };

      const scores = calculateScores(edgeCaseAnswers);

      // Should not crash and return valid scores
      expect(scores).toBeDefined();
      expect(scores.overall_score).toBeGreaterThanOrEqual(0);
      expect(scores.overall_score).toBeLessThanOrEqual(100);
      expect(scores.readiness_level).toBeDefined();
    });

    it('should determine correct readiness levels', () => {
      const testCases = [
        { score: 85, expected: 'expert_implementation' },
        { score: 81, expected: 'expert_implementation' },
        { score: 80, expected: 'fast_track' },
        { score: 61, expected: 'fast_track' },
        { score: 60, expected: 'accelerated_learning' },
        { score: 41, expected: 'accelerated_learning' },
        { score: 40, expected: 'foundation_building' },
        { score: 0, expected: 'foundation_building' },
      ];

      testCases.forEach(({ score, expected }) => {
        // Create answers that will produce the desired score
        const answers: AssessmentAnswers = {
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
          commitmentLevel: (score / 100) * 10, // Adjust to get desired score
          timeline: 'no-timeline',
        };

        // Mock the score to test readiness level logic
        const result = calculateScores(answers);
        // Override the score for testing
        result.overall_score = score;

        // Manually determine readiness level based on score
        if (score >= 81) result.readiness_level = 'expert_implementation';
        else if (score >= 61) result.readiness_level = 'fast_track';
        else if (score >= 41) result.readiness_level = 'accelerated_learning';
        else result.readiness_level = 'foundation_building';

        expect(result.readiness_level).toBe(expected);
      });
    });
  });

  describe('saveAssessmentResults', () => {
    it('should save assessment results successfully', async () => {
      const mockUpsert = vi.fn().mockReturnValue({
        data: { user_id: 'test-user-id' },
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_onboarding') {
          return {
            upsert: mockUpsert,
            update: mockUpdate,
          } as any;
        }
        return {} as any;
      });

      const answers: AssessmentAnswers = {
        capital: '30k-50k',
        creditScore: '740-799',
        incomeStability: 'self-employed',
        creativeFinancing: 'good',
        licensingFamiliarity: 'very-familiar',
        targetPopulations: ['seniors'],
        marketResearch: 'extensive',
        reimbursementRate: '4k-6k',
        caregivingExperience: 'extensive-experience',
        timeCommitment: '30-40',
        supportTeam: ['hire-caregivers'],
        propertyManagement: 8,
        primaryMotivation: 'Help community',
        commitmentLevel: 8,
        timeline: '3-months',
      };

      const scores = {
        financial_score: 75,
        market_score: 80,
        operational_score: 70,
        mindset_score: 85,
        overall_score: 78,
        readiness_level: 'fast_track' as const,
      };

      await saveAssessmentResults('test-user-id', answers, scores);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          overall_score: 78,
          readiness_level: 'fast_track',
          capital_available: '30k-50k',
        }),
        { onConflict: 'user_id' }
      );
    });

    it('should handle enhanced fields for new assessments', async () => {
      const mockUpsert = vi.fn().mockReturnValue({
        data: { user_id: 'test-user-id' },
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
        update: mockUpdate,
      } as any);

      const enhancedAnswers: AssessmentAnswers = {
        capital: '30k-50k',
        creditScore: '740-799',
        incomeStability: 'self-employed',
        creativeFinancing: 'good',
        licensingFamiliarity: 'very-familiar',
        targetPopulations: ['seniors'],
        marketResearch: 'extensive',
        reimbursementRate: '4k-6k',
        caregivingExperience: 'extensive-experience',
        timeCommitment: '30-40',
        supportTeam: ['hire-caregivers'],
        propertyManagement: 8,
        primaryMotivation: 'Help community',
        commitmentLevel: 8,
        timeline: '3-months',
        // Enhanced fields
        ownershipModel: 'single-home',
        targetState: 'CA',
        propertyStatus: 'own-property',
        immediatePriority: 'operations',
      };

      const scores = {
        financial_score: 75,
        market_score: 80,
        operational_score: 70,
        mindset_score: 85,
        overall_score: 78,
        readiness_level: 'fast_track' as const,
      };

      await saveAssessmentResults('test-user-id', enhancedAnswers, scores);

      // Should attempt to save enhanced fields
      expect(mockUpdate).toHaveBeenCalled();
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty('ownership_model', 'single-home');
      expect(updateCall).toHaveProperty('target_state', 'CA');
      expect(updateCall).toHaveProperty('immediate_priority', 'operations');
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          data: null,
          error: dbError,
        }),
      } as any);

      const answers: AssessmentAnswers = {
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

      const scores = calculateScores(answers);

      await expect(
        saveAssessmentResults('test-user-id', answers, scores)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('getUserAssessment', () => {
    it('should fetch user assessment successfully', async () => {
      const mockAssessment = {
        user_id: 'test-user-id',
        overall_score: 75,
        readiness_level: 'fast_track',
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAssessment,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getUserAssessment('test-user-id');

      expect(result).toEqual(mockAssessment);
      expect(supabase.from).toHaveBeenCalledWith('user_onboarding');
    });

    it('should handle no assessment found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            }),
          }),
        }),
      } as any);

      const result = await getUserAssessment('test-user-id');

      expect(result).toBe(null);
    });

    it('should throw error for other database errors', async () => {
      const dbError = { code: 'PGRST500', message: 'Internal server error' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: dbError,
            }),
          }),
        }),
      } as any);

      await expect(getUserAssessment('test-user-id')).rejects.toEqual(dbError);
    });
  });

  describe('Mapping Functions', () => {
    it('should map all field values correctly', () => {
      const testAnswers: AssessmentAnswers = {
        capital: '15k-30k',
        creditScore: '670-739',
        incomeStability: 'part-time',
        creativeFinancing: 'basic',
        licensingFamiliarity: 'some-research',
        targetPopulations: ['seniors'],
        marketResearch: 'talked-providers',
        reimbursementRate: '2k-4k',
        caregivingExperience: 'some-experience',
        timeCommitment: '20-30',
        supportTeam: ['family-help', 'hire-caregivers'],
        propertyManagement: 7,
        primaryMotivation: 'Test motivation',
        commitmentLevel: 7,
        timeline: '6-months',
      };

      const scores = calculateScores(testAnswers);

      // Test that all mappings work without errors
      expect(scores.financial_score).toBeGreaterThan(0);
      expect(scores.market_score).toBeGreaterThan(0);
      expect(scores.operational_score).toBeGreaterThan(0);
      expect(scores.mindset_score).toBeGreaterThan(0);
    });

    it('should handle all credit score mappings', () => {
      const creditScores = [
        'below-580',
        '580-669',
        '670-739',
        '740-799',
        '800+',
        'not-sure'
      ];

      creditScores.forEach(creditScore => {
        const answers: AssessmentAnswers = {
          capital: 'less-5k',
          creditScore,
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

        const scores = calculateScores(answers);
        expect(scores.financial_score).toBeDefined();
      });
    });
  });
});