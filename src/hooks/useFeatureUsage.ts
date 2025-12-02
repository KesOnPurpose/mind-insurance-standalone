// ============================================================================
// USE FEATURE USAGE HOOK
// ============================================================================
// Track feature usage for analytics dashboard feature_adoption metric
// Automatically logs when users interact with key features
// ============================================================================

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type FeatureName =
  | 'chat_nette'
  | 'chat_mio'
  | 'chat_me'
  | 'assessment'
  | 'avatar_assessment'
  | 'tactic_practice'
  | 'roadmap'
  | 'profile'
  | 'resources'
  | 'model_week'
  | 'calculator'
  | 'mind_insurance_hub'
  | 'weekly_insights'
  | 'vault'
  | 'championship';

export type FeatureCategory =
  | 'core_agent'
  | 'assessment'
  | 'practice'
  | 'content'
  | 'profile'
  | 'social';

const FEATURE_CATEGORY_MAP: Record<FeatureName, FeatureCategory> = {
  chat_nette: 'core_agent',
  chat_mio: 'core_agent',
  chat_me: 'core_agent',
  assessment: 'assessment',
  avatar_assessment: 'assessment',
  tactic_practice: 'practice',
  roadmap: 'content',
  profile: 'profile',
  resources: 'content',
  model_week: 'content',
  calculator: 'content',
  mind_insurance_hub: 'practice',
  weekly_insights: 'content',
  vault: 'content',
  championship: 'social',
};

/**
 * Hook to automatically track feature usage
 * Call trackFeature() when user interacts with a feature
 *
 * @param featureName - Name of the feature being tracked
 * @param autoTrackOnMount - Whether to automatically track on component mount
 * @returns trackFeature function for manual tracking
 */
export function useFeatureUsage(featureName: FeatureName, autoTrackOnMount = true) {
  const { user } = useAuth();

  const trackFeature = useCallback(async (contextData?: Record<string, any>) => {
    if (!user) return;

    try {
      const category = FEATURE_CATEGORY_MAP[featureName];

      await supabase.rpc('track_feature_usage', {
        p_user_id: user.id,
        p_feature_name: featureName,
        p_feature_category: category,
        p_context_data: contextData || {},
      });
    } catch (error) {
      // Silent fail - don't disrupt user experience
      console.error('[useFeatureUsage] Failed to track feature:', error);
    }
  }, [user, featureName]);

  // Auto-track on mount if enabled
  useEffect(() => {
    if (autoTrackOnMount && user) {
      trackFeature().catch(console.error);
    }
  }, [autoTrackOnMount, trackFeature, user]);

  return { trackFeature };
}

/**
 * Manual feature tracking function (for use outside React components)
 */
export async function trackFeatureUsage(
  userId: string,
  featureName: FeatureName,
  contextData?: Record<string, any>
): Promise<void> {
  try {
    const category = FEATURE_CATEGORY_MAP[featureName];

    await supabase.rpc('track_feature_usage', {
      p_user_id: userId,
      p_feature_name: featureName,
      p_feature_category: category,
      p_context_data: contextData || {},
    });
  } catch (error) {
    console.error('[trackFeatureUsage] Failed to track feature:', error);
  }
}
