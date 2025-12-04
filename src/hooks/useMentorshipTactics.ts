import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Mentorship tactic data structure for Model Week integration
 */
export interface MentorshipTactic {
  tactic_id: string;
  tactic_name: string;
  category: string;
  duration_minutes_realistic: number | null;
  tactic_source: string | null;
}

/**
 * Hook to fetch only mentorship tactics for the Model Week tactic selector.
 * Filters tactics where tactic_source='mentorship' OR tactic_id starts with 'M'.
 * Results are cached for 10 minutes.
 */
export function useMentorshipTactics() {
  return useQuery({
    queryKey: ['mentorship-tactics'],
    queryFn: async (): Promise<MentorshipTactic[]> => {
      const { data, error } = await supabase
        .from('gh_tactic_instructions')
        .select('tactic_id, tactic_name, category, duration_minutes_realistic, tactic_source')
        .or('tactic_source.eq.mentorship,tactic_id.ilike.M%')
        .order('category', { ascending: true })
        .order('tactic_name', { ascending: true });

      if (error) {
        console.error('[useMentorshipTactics] Error fetching tactics:', error);
        throw error;
      }

      return (data || []) as MentorshipTactic[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });
}

/**
 * Get unique categories from mentorship tactics
 */
export function getUniqueCategories(tactics: MentorshipTactic[]): string[] {
  return [...new Set(tactics.map(t => t.category))].filter(Boolean).sort();
}
