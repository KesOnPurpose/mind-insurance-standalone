import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionMetrics {
  daysMember: number;
  conversationsHeld: number;
  programsAccessed: number;
}

export function useSubscriptionMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SubscriptionMetrics>({
    daysMember: 0,
    conversationsHeld: 0,
    programsAccessed: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        // Fetch all metrics in parallel
        const [profileResult, conversationsResult, tacticsResult] = await Promise.all([
          // 1. Days as member — from user_profiles.created_at
          supabase
            .from('user_profiles')
            .select('created_at')
            .eq('id', user.id)
            .single(),

          // 2. Conversations — count from conversation_metadata
          supabase
            .from('conversation_metadata')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),

          // 3. Programs & resources — count distinct tactics accessed
          supabase
            .from('gh_user_tactic_progress')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        // Calculate days as member
        let daysMember = 0;
        if (profileResult.data?.created_at) {
          const createdAt = new Date(profileResult.data.created_at);
          const now = new Date();
          daysMember = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        }

        setMetrics({
          daysMember,
          conversationsHeld: conversationsResult.count || 0,
          programsAccessed: tacticsResult.count || 0,
        });
      } catch (err) {
        // Silently fail — metrics are non-critical, showing 0 is acceptable
        console.error('Failed to fetch subscription metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [user?.id]);

  return { metrics, isLoading };
}
