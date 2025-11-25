import { supabase } from '@/integrations/supabase/client';
import type { MetricType, TimeRange, AgentType } from '@/types/adminAnalytics';

export const TTL_CONFIG = {
  dashboard_kpis: 5 * 60 * 1000,
  cache_hit_rate: 10 * 60 * 1000,
  avg_response_time: 10 * 60 * 1000,
  rag_quality: 15 * 60 * 1000,
  handoff_accuracy: 15 * 60 * 1000,
  performance_metrics: 60 * 60 * 1000,
  conversation_volume: 10 * 60 * 1000,
  response_time_metrics: 10 * 60 * 1000,
  user_analytics: 30 * 60 * 1000,
} as const;

export function getCacheKey(
  metricType: MetricType,
  timeRange: TimeRange,
  filters?: Record<string, any>
): string {
  const filterStr = filters && Object.keys(filters).length > 0
    ? ':' + Object.entries(filters)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('|')
    : '';

  return `${metricType}:${timeRange}${filterStr}`;
}

export async function getCachedMetric(
  metricType: MetricType,
  timeRange: TimeRange,
  filters?: Record<string, any>
): Promise<any | null> {
  try {
    const cacheKey = getCacheKey(metricType, timeRange, filters);
    const { data, error } = await supabase
      .from('admin_metrics_cache')
      .select('metric_value, expires_at')
      .eq('metric_key', cacheKey)
      .single();

    if (error || !data) {
      return null;
    }

    const expiresAt = new Date(data.expires_at).getTime();
    const now = new Date().getTime();

    if (now > expiresAt) {
      deleteExpiredCache(cacheKey).catch(() => {});
      return null;
    }

    updateLastAccessedAt(cacheKey).catch(() => {});
    return data.metric_value;
  } catch (error) {
    console.error('[Metrics Cache] Error retrieving cached metric:', error);
    return null;
  }
}

export async function setCachedMetric(
  metricType: MetricType,
  timeRange: TimeRange,
  filters: Record<string, any> | undefined,
  metricValue: any,
  ttl: number
): Promise<void> {
  try {
    const cacheKey = getCacheKey(metricType, timeRange, filters);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);

    const { error } = await supabase
      .from('admin_metrics_cache')
      .upsert(
        {
          metric_key: cacheKey,
          metric_value: metricValue,
          expires_at: expiresAt.toISOString(),
          calculated_at: now.toISOString(),
          last_accessed_at: now.toISOString(),
        },
        { onConflict: 'metric_key' }
      );

    if (error) {
      console.error('[Metrics Cache] Error caching metric:', error);
    }
  } catch (error) {
    console.error('[Metrics Cache] Error in setCachedMetric:', error);
  }
}

export async function invalidateCache(
  metricType: MetricType,
  timeRange?: TimeRange
): Promise<void> {
  try {
    const pattern = timeRange ? `${metricType}:${timeRange}%` : `${metricType}%`;
    const { error } = await supabase
      .from('admin_metrics_cache')
      .delete()
      .ilike('metric_key', pattern);

    if (error) {
      console.error('[Metrics Cache] Error invalidating cache:', error);
    }
  } catch (error) {
    console.error('[Metrics Cache] Error in invalidateCache:', error);
  }
}

export async function getCacheStats(): Promise<{
  total_entries: number;
  valid_entries: number;
  expired_entries: number;
  oldest_cached_at: string | null;
  newest_cached_at: string | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from('admin_metrics_cache')
      .select('metric_key, expires_at, calculated_at');

    if (error || !data) {
      return null;
    }

    const now = new Date().getTime();
    let validCount = 0;
    let expiredCount = 0;
    let oldestDate: string | null = null;
    let newestDate: string | null = null;

    data.forEach((entry) => {
      const expiresAt = new Date(entry.expires_at).getTime();
      if (now > expiresAt) {
        expiredCount++;
      } else {
        validCount++;
      }

      const calcDate = new Date(entry.calculated_at);
      if (!oldestDate || new Date(oldestDate) > calcDate) {
        oldestDate = entry.calculated_at;
      }
      if (!newestDate || new Date(newestDate) < calcDate) {
        newestDate = entry.calculated_at;
      }
    });

    return {
      total_entries: data.length,
      valid_entries: validCount,
      expired_entries: expiredCount,
      oldest_cached_at: oldestDate,
      newest_cached_at: newestDate,
    };
  } catch (error) {
    console.error('[Metrics Cache] Error getting cache stats:', error);
    return null;
  }
}

export async function cleanupExpiredCache(): Promise<number> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('admin_metrics_cache')
      .delete()
      .lt('expires_at', now)
      .select('metric_key');

    if (error) {
      console.error('[Metrics Cache] Error cleaning up expired cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('[Metrics Cache] Error in cleanupExpiredCache:', error);
    return 0;
  }
}

async function deleteExpiredCache(cacheKey: string): Promise<void> {
  try {
    await supabase
      .from('admin_metrics_cache')
      .delete()
      .eq('metric_key', cacheKey);
  } catch (error) {
    console.error('[Metrics Cache] Error deleting expired cache:', error);
  }
}

async function updateLastAccessedAt(cacheKey: string): Promise<void> {
  try {
    await supabase
      .from('admin_metrics_cache')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('metric_key', cacheKey);
  } catch (error) {
    console.error('[Metrics Cache] Error updating last_accessed_at:', error);
  }
}

export async function getCacheHitRate(): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('admin_metrics_cache')
      .select('calculated_at', { count: 'exact' })
      .gte('calculated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (error || !data) {
      return null;
    }

    return data.length > 0 ? (validCacheCount / data.length) * 100 : 0;
  } catch (error) {
    console.error('[Metrics Cache] Error calculating hit rate:', error);
    return null;
  }
}

let validCacheCount = 0;

export function resetCacheHitRateCounter(): void {
  validCacheCount = 0;
}
