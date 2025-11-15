// ============================================================================
// USER CONTEXT SERVICE
// ============================================================================
// Loads comprehensive user context for personalized AI responses
// Includes caching (1 hour TTL) to reduce database queries
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCache, CacheKeys, CacheTTL } from './cache-service.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface UserContext {
  user_id: string;
  
  // Profile basics
  email?: string;
  full_name?: string;
  
  // Journey position
  current_week: number;
  current_day: number;
  challenge_start_date?: string;
  
  // Subscription & Access
  tier_level: string; // free, bootcamp, community, elite
  tier_expires_at?: string;
  
  // Group Home specifics
  target_city?: string;
  target_state?: string;
  target_demographics?: string[];
  property_acquisition_type?: string; // rental_arbitrage, purchase, creative_finance
  license_status?: string;
  property_beds?: number;
  timeline_days?: number;
  startup_capital?: string;
  credit_score_range?: string;
  real_estate_experience?: string;
  
  // Pattern & Avatar
  avatar_type?: string;
  temperament?: string;
  collision_patterns?: {
    primary_pattern?: string;
    past_prison_score?: number;
    success_sabotage_score?: number;
    compass_crisis_score?: number;
  };
  
  // Progress
  completed_tactics_count: number;
  total_points: number;
  current_streak?: number;
  longest_streak?: number;
  
  // Recent activity
  last_practice_date?: string;
  recent_tactics?: Array<{
    tactic_id: string;
    tactic_name: string;
    status: string;
    started_at?: string;
    completed_at?: string;
  }>;
}

/**
 * Load comprehensive user context with caching
 */
export async function getUserContext(
  userId: string,
  agent: 'nette' | 'mio' | 'me',
  useCache: boolean = true
): Promise<UserContext> {
  // Check cache first
  if (useCache) {
    const cache = getCache();
    const cacheKey = agent === 'nette' ? CacheKeys.netteUserContext(userId)
                    : agent === 'mio' ? CacheKeys.mioUserContext(userId)
                    : CacheKeys.meUserContext(userId);
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        console.log('[UserContext] Cache hit');
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('[UserContext] Cache read error:', error);
    }
  }

  // Load fresh context
  console.log('[UserContext] Loading fresh context for user:', userId);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Load user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('[UserContext] Profile load error:', profileError);
    throw new Error('Failed to load user profile');
  }

  // Load recent tactics
  const { data: recentTactics } = await supabase
    .from('gh_user_tactic_progress')
    .select(`
      tactic_id,
      status,
      started_at,
      completed_at,
      gh_tactic_instructions!inner(tactic_name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Load avatar assessment (if completed)
  const { data: avatar } = await supabase
    .from('avatar_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  // Build context object
  const context: UserContext = {
    user_id: userId,
    email: profile.email,
    full_name: profile.full_name,
    
    // Journey position (current_week is auto-calculated in DB)
    current_week: profile.current_week || 1,
    current_day: profile.current_day || 1,
    challenge_start_date: profile.challenge_start_date,
    
    // Subscription
    tier_level: profile.tier_level || 'free',
    tier_expires_at: profile.tier_expires_at,
    
    // Group Home specifics
    target_city: profile.target_city,
    target_state: profile.target_state,
    target_demographics: profile.target_demographics || [],
    property_acquisition_type: profile.property_acquisition_type,
    license_status: profile.license_status,
    property_beds: profile.property_beds,
    timeline_days: profile.timeline_days,
    startup_capital: profile.startup_capital,
    credit_score_range: profile.credit_score_range,
    real_estate_experience: profile.real_estate_experience,
    
    // Pattern & Avatar
    avatar_type: avatar?.avatar_type || profile.avatar_type,
    temperament: avatar?.temperament || profile.temperament,
    collision_patterns: profile.collision_patterns,
    
    // Progress
    completed_tactics_count: profile.completed_tactics_count || 0,
    total_points: profile.total_points || 0,
    current_streak: profile.current_streak || 0,
    longest_streak: profile.longest_streak || 0,
    
    // Recent activity
    last_practice_date: profile.last_practice_date,
    recent_tactics: recentTactics?.map((t: any) => ({
      tactic_id: t.tactic_id,
      tactic_name: t.gh_tactic_instructions?.tactic_name || 'Unknown',
      status: t.status,
      started_at: t.started_at,
      completed_at: t.completed_at,
    })) || [],
  };

  // Cache the context
  if (useCache) {
    const cache = getCache();
    const cacheKey = agent === 'nette' ? CacheKeys.netteUserContext(userId)
                    : agent === 'mio' ? CacheKeys.mioUserContext(userId)
                    : CacheKeys.meUserContext(userId);
    
    try {
      await cache.set(cacheKey, JSON.stringify(context), CacheTTL.USER_CONTEXT);
    } catch (error) {
      console.error('[UserContext] Cache write error:', error);
    }
  }

  console.log('[UserContext] Loaded:', {
    week: context.current_week,
    tier: context.tier_level,
    state: context.target_state,
    completed: context.completed_tactics_count,
  });

  return context;
}

/**
 * Invalidate user context cache (call when profile updates)
 */
export async function invalidateUserContext(userId: string): Promise<void> {
  const cache = getCache();
  
  await Promise.all([
    cache.delete(CacheKeys.netteUserContext(userId)),
    cache.delete(CacheKeys.mioUserContext(userId)),
    cache.delete(CacheKeys.meUserContext(userId)),
  ]);

  console.log('[UserContext] Invalidated cache for user:', userId);
}

/**
 * Format user context for AI system prompt
 */
export function formatUserContextForPrompt(context: UserContext): string {
  let prompt = `USER CONTEXT:\n`;
  prompt += `- Week: ${context.current_week}/15 (Day ${context.current_day})\n`;
  prompt += `- Tier: ${context.tier_level.toUpperCase()}\n`;
  prompt += `- Completed Tactics: ${context.completed_tactics_count}/403\n`;
  prompt += `- Total Points: ${context.total_points}\n`;
  
  if (context.current_streak && context.current_streak > 0) {
    prompt += `- Current Streak: ${context.current_streak} days 🔥\n`;
  }

  if (context.target_state) {
    prompt += `- Target State: ${context.target_state}\n`;
  }

  if (context.target_demographics && context.target_demographics.length > 0) {
    prompt += `- Target Demographics: ${context.target_demographics.join(', ')}\n`;
  }

  if (context.property_acquisition_type) {
    prompt += `- Acquisition Strategy: ${context.property_acquisition_type}\n`;
  }

  if (context.startup_capital) {
    prompt += `- Startup Capital: ${context.startup_capital}\n`;
  }

  if (context.avatar_type) {
    prompt += `- Avatar: ${context.avatar_type}\n`;
  }

  if (context.temperament) {
    prompt += `- Temperament: ${context.temperament}\n`;
  }

  if (context.collision_patterns?.primary_pattern) {
    prompt += `- Primary Pattern: ${context.collision_patterns.primary_pattern}\n`;
  }

  if (context.recent_tactics && context.recent_tactics.length > 0) {
    prompt += `\nRECENT TACTICS:\n`;
    context.recent_tactics.slice(0, 5).forEach((t, i) => {
      const statusIcon = t.status === 'completed' ? '✅' 
                       : t.status === 'in_progress' ? '🔄' 
                       : '⏸️';
      prompt += `${i + 1}. ${statusIcon} ${t.tactic_name} (${t.tactic_id})\n`;
    });
  }

  return prompt;
}
