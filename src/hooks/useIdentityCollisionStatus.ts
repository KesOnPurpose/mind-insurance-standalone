import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// IDENTITY COLLISION STATUS HOOK
// ============================================================================
// Checks if user has completed Identity Collision Assessment
// Used by IdentityCollisionGuard to enforce assessment-first flow for Mind Insurance
// ============================================================================

export interface IntroSelections {
  categories: string[];  // e.g., ['career', 'relationships', 'health']
  patterns: string[];    // e.g., ['past_prison', 'success_sabotage']
  selected_at?: string;  // ISO timestamp
}

export interface IdentityCollisionStatus {
  hasPattern: boolean;
  primaryPattern: 'past_prison' | 'success_sabotage' | 'compass_crisis' | null;
  confidence?: number;
  impactArea?: string;
  source: 'user_profiles' | 'avatar_assessments' | 'identity_collision_assessments' | null;
  // NEW: Intro selections from pre-assessment screens
  introSelections?: IntroSelections;
}

export function useIdentityCollisionStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ['identityCollisionStatus', userId],
    queryFn: async (): Promise<IdentityCollisionStatus> => {
      if (!userId) {
        return { hasPattern: false, primaryPattern: null, source: null };
      }

      // 1. Check user_profiles.collision_patterns first (fastest, denormalized)
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('collision_patterns')
        .eq('id', userId)
        .single();

      if (!profileError && profile?.collision_patterns) {
        const patterns = profile.collision_patterns as Record<string, unknown>;

        // Guard against empty objects {} - treat same as null
        // This prevents infinite redirect loops for users whose save failed
        if (Object.keys(patterns).length > 0) {
          const primaryPattern = patterns.primary_pattern as string | undefined;

          if (primaryPattern) {
            const normalizedPattern = primaryPattern.toLowerCase().replace(/ /g, '_') as
              'past_prison' | 'success_sabotage' | 'compass_crisis';

            // Calculate confidence from pattern scores if not explicitly set
            // The score represents the raw assessment score (0-100 scale typically)
            let confidence = patterns.confidence as number | undefined;

            if (confidence === undefined) {
              // Look for pattern-specific scores (e.g., success_sabotage_score: 33)
              const patternScoreKey = `${normalizedPattern}_score`;
              const patternScore = patterns[patternScoreKey] as number | undefined;

              if (patternScore !== undefined) {
                // Pattern scores are already on a reasonable scale
                // Higher score = stronger Identity Collision grip
                // Scale to 0-100 if needed (scores appear to be out of ~40 max based on data)
                confidence = Math.min(100, Math.round((patternScore / 40) * 100));
              }
            }

            // Extract intro_selections if present (from pre-assessment screens)
            const introSelectionsRaw = patterns.intro_selections as Record<string, unknown> | undefined;
            const introSelections: IntroSelections | undefined = introSelectionsRaw ? {
              categories: (introSelectionsRaw.categories as string[]) || [],
              patterns: (introSelectionsRaw.patterns as string[]) || [],
              selected_at: introSelectionsRaw.selected_at as string | undefined,
            } : undefined;

            return {
              hasPattern: true,
              primaryPattern: normalizedPattern,
              confidence,
              impactArea: patterns.impact_area as string | undefined,
              source: 'user_profiles',
              introSelections,
            };
          }
        }
        // If patterns is empty {} or has no primary_pattern, fall through to check other tables
      }

      // 2. Check avatar_assessments table (existing deep assessment data)
      const { data: avatarAssessment, error: avatarError } = await supabase
        .from('avatar_assessments')
        .select('primary_pattern, past_prison_score, success_sabotage_score, compass_crisis_score')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!avatarError && avatarAssessment?.primary_pattern) {
        const normalizedPattern = avatarAssessment.primary_pattern.toLowerCase().replace(/ /g, '_') as
          'past_prison' | 'success_sabotage' | 'compass_crisis';

        // Calculate confidence from scores
        const scores = {
          past_prison: avatarAssessment.past_prison_score || 0,
          success_sabotage: avatarAssessment.success_sabotage_score || 0,
          compass_crisis: avatarAssessment.compass_crisis_score || 0,
        };
        const total = scores.past_prison + scores.success_sabotage + scores.compass_crisis;
        const highest = Math.max(scores.past_prison, scores.success_sabotage, scores.compass_crisis);
        const confidence = total > 0 ? Math.round((highest / total) * 100) : 0;

        return {
          hasPattern: true,
          primaryPattern: normalizedPattern,
          confidence,
          source: 'avatar_assessments',
        };
      }

      // 3. Check identity_collision_assessments table (quick assessment data)
      const { data: collisionAssessment, error: collisionError } = await supabase
        .from('identity_collision_assessments')
        .select('dominant_pattern, pattern_confidence, responses')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!collisionError && collisionAssessment?.dominant_pattern) {
        const normalizedPattern = collisionAssessment.dominant_pattern.toLowerCase().replace(/ /g, '_') as
          'past_prison' | 'success_sabotage' | 'compass_crisis';

        const responses = collisionAssessment.responses as Record<string, unknown> | null;
        const impactArea = responses?.impact_area as string | undefined;

        return {
          hasPattern: true,
          primaryPattern: normalizedPattern,
          confidence: collisionAssessment.pattern_confidence || undefined,
          impactArea,
          source: 'identity_collision_assessments',
        };
      }

      // No pattern found in any source
      return { hasPattern: false, primaryPattern: null, source: null };
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute - pattern doesn't change often
    retry: 1,
  });
}

// Helper to check if user has completed any collision assessment
export function hasCompletedCollisionAssessment(status: IdentityCollisionStatus | null | undefined): boolean {
  return !!status?.hasPattern;
}

// Helper to get pattern display name
export function getPatternDisplayName(pattern: string | null | undefined): string {
  if (!pattern) return 'Unknown';

  const patternNames: Record<string, string> = {
    'past_prison': 'Past Prison',
    'success_sabotage': 'Success Sabotage',
    'compass_crisis': 'Compass Crisis',
  };

  return patternNames[pattern.toLowerCase().replace(/ /g, '_')] || pattern;
}

// Helper to get pattern description
export function getPatternDescription(pattern: string | null | undefined): string {
  if (!pattern) return '';

  const descriptions: Record<string, string> = {
    'past_prison': 'Your past experiences, upbringing, or environment are creating invisible barriers that hold you back from your potential. You carry guilt, limiting beliefs, or identity ceilings from your history.',
    'success_sabotage': 'You pull back right when breakthrough is near. Your amygdala (your brain\'s threat-detection center) associates success with danger, causing you to unconsciously sabotage progress at critical moments.',
    'compass_crisis': 'You lack clear direction or feel pulled in multiple directions. Without a defined path, you struggle with decision paralysis and comparison to others.',
  };

  return descriptions[pattern.toLowerCase().replace(/ /g, '_')] || '';
}
