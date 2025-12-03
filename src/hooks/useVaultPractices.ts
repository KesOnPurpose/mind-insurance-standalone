import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Pattern entry from Pattern Check practice (type='P')
 */
export interface PatternEntry {
  id: string;
  completed_at: string;
  caught_pattern: boolean;
  collision_type: string | null;
  situation_description: string | null;
  reframe_description: string | null;
}

/**
 * Victory entry from Celebrate Wins practice (type='C')
 */
export interface VictoryEntry {
  id: string;
  completed_at: string;
  championship_win: string | null;
  micro_victory: string | null;
  future_self_evidence: string | null;
  championship_gratitude: string | null;
  victory_celebration: string | null;
}

export interface PatternStats {
  caught: number;
  total: number;
  successRate: number;
}

/**
 * Get collision type display label
 */
export function getCollisionTypeLabel(type: string | null): string {
  if (!type) return 'Unknown';
  switch (type.toLowerCase()) {
    case 'past_prison':
    case 'pastprison':
      return 'Past Prison';
    case 'success_sabotage':
    case 'successsabotage':
      return 'Success Sabotage';
    case 'compass_crisis':
    case 'compasscrisis':
      return 'Compass Crisis';
    default:
      return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

/**
 * Get collision type color class
 */
export function getCollisionTypeColor(type: string | null): string {
  if (!type) return 'bg-gray-100 text-gray-700 border-gray-200';
  switch (type.toLowerCase()) {
    case 'past_prison':
    case 'pastprison':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'success_sabotage':
    case 'successsabotage':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'compass_crisis':
    case 'compasscrisis':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-purple-100 text-purple-700 border-purple-200';
  }
}

/**
 * Hook to fetch practice data for Patterns and Victories tabs in the Vault
 */
export function useVaultPractices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vaultPractices', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Fetch Pattern Check practices (type='P')
      const { data: patternsData, error: patternsError } = await supabase
        .from('daily_practices')
        .select('id, completed_at, data')
        .eq('user_id', user.id)
        .eq('practice_type', 'P')
        .eq('completed', true)
        .order('completed_at', { ascending: false });

      if (patternsError) {
        console.error('Error fetching patterns:', patternsError);
        throw patternsError;
      }

      // Fetch Celebrate Wins practices (type='C')
      const { data: victoriesData, error: victoriesError } = await supabase
        .from('daily_practices')
        .select('id, completed_at, data')
        .eq('user_id', user.id)
        .eq('practice_type', 'C')
        .eq('completed', true)
        .order('completed_at', { ascending: false });

      if (victoriesError) {
        console.error('Error fetching victories:', victoriesError);
        throw victoriesError;
      }

      // Transform patterns data
      const patterns: PatternEntry[] = (patternsData || []).map((p) => {
        const data = p.data as Record<string, unknown> || {};
        return {
          id: p.id,
          completed_at: p.completed_at || '',
          caught_pattern: Boolean(data.caught_pattern || data.caughtPattern),
          collision_type: (data.collision_type || data.collisionType || data.pattern_type || null) as string | null,
          situation_description: (data.situation_description || data.situationDescription || data.situation || null) as string | null,
          reframe_description: (data.reframe_description || data.reframeDescription || data.reframe || null) as string | null,
        };
      });

      // Transform victories data
      const victories: VictoryEntry[] = (victoriesData || []).map((v) => {
        const data = v.data as Record<string, unknown> || {};
        return {
          id: v.id,
          completed_at: v.completed_at || '',
          championship_win: (data.championship_win || data.championshipWin || data.win || null) as string | null,
          micro_victory: (data.micro_victory || data.microVictory || null) as string | null,
          future_self_evidence: (data.future_self_evidence || data.futureSelfEvidence || null) as string | null,
          championship_gratitude: (data.championship_gratitude || data.championshipGratitude || data.gratitude || null) as string | null,
          victory_celebration: (data.victory_celebration || data.victoryCelebration || data.celebration || null) as string | null,
        };
      });

      // Calculate pattern stats
      const patternsCaught = patterns.filter(p => p.caught_pattern).length;
      const patternStats: PatternStats = {
        caught: patternsCaught,
        total: patterns.length,
        successRate: patterns.length > 0 ? Math.round((patternsCaught / patterns.length) * 100) : 0,
      };

      return {
        patterns,
        victories,
        patternStats,
      };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

export default useVaultPractices;
