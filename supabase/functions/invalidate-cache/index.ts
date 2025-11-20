// ============================================================================
// CACHE INVALIDATION FUNCTION
// ============================================================================
// Handles cache invalidation for different trigger types:
// - week_progression: Clear Nette cache when user advances weeks
// - practice_completion: Clear MIO cache after practice completion
// - profile_update: Clear all user caches when profile changes
// - daily_cleanup: Log cleanup (handled by TTL expiration)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCache, CacheKeys } from '../_shared/cache-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, trigger_type } = await req.json();
    
    if (!user_id || !trigger_type) {
      throw new Error('Missing required fields: user_id and trigger_type');
    }

    const cache = getCache();
    
    console.log(`[Cache Invalidation] Trigger: ${trigger_type}, User: ${user_id}`);
    
    let deletedCount = 0;
    
    const startTime = Date.now();

    switch (trigger_type) {
      case 'week_progression':
        // Flush all Nette responses for this user
        // Pattern match acceptable here (infrequent event: ~1x/week per user)
        deletedCount = await cache.deletePattern(`nette:${user_id}:*`);
        console.log(`[Cache] Cleared ${deletedCount} Nette cache entries for user ${user_id} in ${Date.now() - startTime}ms`);
        break;

      case 'practice_completion':
        // Flush MIO practice-specific cache
        // Pattern match acceptable here (infrequent event: ~1x/day per user)
        deletedCount = await cache.deletePattern(`mio:${user_id}:practice:*`);
        console.log(`[Cache] Cleared ${deletedCount} MIO cache entries for user ${user_id} in ${Date.now() - startTime}ms`);
        break;

      case 'profile_update':
        // OPTIMIZED: Delete specific user context keys only
        // Rely on TTL expiration for agent response caches (5min-1hr)
        // This avoids expensive SCAN operations for rare profile updates
        const contextKeys = [
          CacheKeys.netteUserContext(user_id),
          CacheKeys.mioUserContext(user_id),
          CacheKeys.meUserContext(user_id)
        ];

        const deletePromises = contextKeys.map(key => cache.delete(key));
        await Promise.all(deletePromises);

        deletedCount = 3;
        console.log(`[Cache] Cleared user context caches for ${user_id} in ${Date.now() - startTime}ms`);
        console.log(`[Cache] Note: Agent response caches will expire via TTL (5min-1hr)`);
        break;
        
      case 'daily_cleanup':
        // This would be called by a cron job
        // For now, just log (cleanup happens via TTL expiration)
        console.log('[Cache] Daily cleanup triggered (handled by TTL expiration)');
        break;
        
      default:
        throw new Error(`Unknown trigger type: ${trigger_type}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        trigger_type, 
        user_id,
        deleted_count: deletedCount 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('[Cache Invalidation] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
