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
    
    switch (trigger_type) {
      case 'week_progression':
        // Flush all Nette responses for this user
        deletedCount = await cache.deletePattern(`nette:${user_id}:*`);
        console.log(`[Cache] Cleared ${deletedCount} Nette cache entries for user ${user_id}`);
        break;
        
      case 'practice_completion':
        // Flush MIO practice-specific cache
        deletedCount = await cache.deletePattern(`mio:${user_id}:practice:*`);
        console.log(`[Cache] Cleared ${deletedCount} MIO cache entries for user ${user_id}`);
        break;
        
      case 'profile_update':
        // Flush user context and all agent caches
        const netteCount = await cache.deletePattern(`nette:${user_id}:*`);
        const mioCount = await cache.deletePattern(`mio:${user_id}:*`);
        const meCount = await cache.deletePattern(`me:${user_id}:*`);
        
        await cache.delete(CacheKeys.netteUserContext(user_id));
        await cache.delete(CacheKeys.mioUserContext(user_id));
        await cache.delete(CacheKeys.meUserContext(user_id));
        
        deletedCount = netteCount + mioCount + meCount + 3;
        console.log(`[Cache] Cleared all caches for user ${user_id} (${deletedCount} entries)`);
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
