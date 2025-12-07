import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================================
// VAULT ASSESSMENTS HOOK
// ============================================================================
// Fetches all user assessments for display in Recording Vault
// Normalizes data from multiple tables into unified format
// ============================================================================

export interface VaultAssessment {
  id: string;
  type: 'identity_collision' | 'avatar' | 'temperament';
  title: string;
  primary_result: string;
  secondary_results?: Record<string, unknown>;
  scores?: Record<string, number>;
  completed_at: string;
  can_retake: boolean;
  confidence?: number;
  impact_area?: string;
}

interface VaultAssessmentsData {
  assessments: VaultAssessment[];
  stats: {
    total: number;
    byType: Record<string, number>;
  };
}

export function useVaultAssessments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vaultAssessments', user?.id],
    queryFn: async (): Promise<VaultAssessmentsData> => {
      if (!user?.id) {
        return { assessments: [], stats: { total: 0, byType: {} } };
      }

      const assessments: VaultAssessment[] = [];

      // 1. Fetch identity_collision_assessments
      const { data: collisionData, error: collisionError } = await supabase
        .from('identity_collision_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!collisionError && collisionData) {
        collisionData.forEach((row) => {
          const responses = row.responses as Record<string, unknown> | null;
          assessments.push({
            id: row.id,
            type: 'identity_collision',
            title: 'Identity Collision Assessment',
            primary_result: formatPatternName(row.dominant_pattern || ''),
            secondary_results: responses,
            scores: responses?.scores as Record<string, number> | undefined,
            completed_at: row.created_at || '',
            can_retake: true,
            confidence: row.pattern_confidence || undefined,
            impact_area: responses?.impact_area as string | undefined,
          });
        });
      }

      // 2. Fetch avatar_assessments
      const { data: avatarData, error: avatarError } = await supabase
        .from('avatar_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!avatarError && avatarData) {
        avatarData.forEach((row) => {
          // Skip if this is the same data as identity_collision (based on scores)
          const hasDetailedData = row.avatar_narrative || row.neural_protocol;

          if (hasDetailedData) {
            assessments.push({
              id: row.id,
              type: 'avatar',
              title: 'Avatar Assessment (Deep)',
              primary_result: formatPatternName(row.primary_pattern || ''),
              secondary_results: {
                temperament: row.temperament,
                avatar_type: row.avatar_type,
              },
              scores: {
                past_prison: row.past_prison_score || 0,
                success_sabotage: row.success_sabotage_score || 0,
                compass_crisis: row.compass_crisis_score || 0,
              },
              completed_at: row.completed_at || row.created_at || '',
              can_retake: true,
            });
          }
        });
      }

      // 3. Fetch temperament from user_profiles (if exists separately)
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('temperament_type, updated_at')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData?.temperament_type) {
        // Check if temperament was set independently (not via avatar assessment)
        const hasAvatarTemperament = avatarData?.some((a) => a.temperament);

        if (!hasAvatarTemperament) {
          assessments.push({
            id: `temperament-${user.id}`,
            type: 'temperament',
            title: 'Temperament Assessment',
            primary_result: formatTemperamentName(profileData.temperament_type),
            completed_at: profileData.updated_at || '',
            can_retake: true,
          });
        }
      }

      // Sort by date (newest first)
      assessments.sort((a, b) =>
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );

      // Calculate stats
      const stats = {
        total: assessments.length,
        byType: assessments.reduce((acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return { assessments, stats };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Helper functions
function formatPatternName(pattern: string): string {
  if (!pattern) return 'Unknown';

  const patternMap: Record<string, string> = {
    'past_prison': 'Past Prison',
    'PAST_PRISON': 'Past Prison',
    'success_sabotage': 'Success Sabotage',
    'SUCCESS_SABOTAGE': 'Success Sabotage',
    'compass_crisis': 'Compass Crisis',
    'COMPASS_CRISIS': 'Compass Crisis',
  };

  return patternMap[pattern] || pattern.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTemperamentName(temperament: string): string {
  if (!temperament) return 'Unknown';

  const temperamentMap: Record<string, string> = {
    'warrior': 'The Warrior',
    'WARRIOR': 'The Warrior',
    'sage': 'The Sage',
    'SAGE': 'The Sage',
    'builder': 'The Builder',
    'BUILDER': 'The Builder',
    'connector': 'The Connector',
    'CONNECTOR': 'The Connector',
  };

  return temperamentMap[temperament] || temperament.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default useVaultAssessments;
