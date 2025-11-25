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

  // Group Home specifics (from user_profiles or user_onboarding)
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

  // Business Profile (from user_onboarding - progressive capture)
  business_name?: string;
  entity_type?: string;
  target_state_reason?: string;
  property_status?: string;
  property_type?: string;
  funding_source?: string;
  startup_capital_actual?: number;
  monthly_revenue_target?: number;
  monthly_expense_estimate?: number;
  break_even_timeline?: string;
  service_model?: string;
  marketing_strategy?: string;
  referral_sources?: string[];
  profile_completeness?: number;

  // Assessment Scores (from user_onboarding)
  financial_score?: number;
  market_score?: number;
  operational_score?: number;
  mindset_score?: number;
  overall_score?: number;
  readiness_level?: string;

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

  // PROTECT practice behavioral data (for MIO handoffs)
  recent_practices?: Array<{
    practice_date: string;
    practice_type: string;
    completed_at: string;
    energy_levels?: {
      morning?: number;
      afternoon?: number;
      evening?: number;
    };
    trigger_resets?: number;
    identity_statement?: string;
  }>;
  practice_timing_pattern?: 'early' | 'late' | 'inconsistent' | 'normal';
  energy_trend?: 'declining' | 'stable' | 'improving';
  days_since_last_practice?: number;
  dropout_risk_score?: number; // 0-100, higher = higher risk
  dropout_risk_level?: 'low' | 'medium' | 'high' | 'critical';
  dropout_risk_factors?: string[];
}

/**
 * Phase 4: Calculate dropout risk score based on behavioral signals
 */
function calculateDropoutRisk(context: {
  current_week: number;
  current_day: number;
  days_since_last_practice?: number;
  practice_timing_pattern?: string;
  energy_trend?: string;
  recent_practices?: Array<any>;
  current_streak?: number;
}): { score: number; level: string; factors: string[] } {
  let riskScore = 0;
  const factors: string[] = [];

  // Week 3 danger zone (days 15-21)
  if (context.current_week === 3) {
    riskScore += 20;
    factors.push('Week 3 danger zone (highest dropout period)');
  }

  // 3-day gap rule
  if (context.days_since_last_practice && context.days_since_last_practice >= 3) {
    riskScore += 30;
    factors.push(`${context.days_since_last_practice}-day practice gap (CRITICAL)`);
  } else if (context.days_since_last_practice && context.days_since_last_practice === 2) {
    riskScore += 15;
    factors.push('2-day practice gap (warning)');
  }

  // Energy depletion signals
  if (context.energy_trend === 'declining') {
    riskScore += 15;
    factors.push('Declining energy trend (burnout risk)');
  }

  // Timing pattern risks
  if (context.practice_timing_pattern === 'early') {
    riskScore += 10;
    factors.push('Early morning practice pattern (energy depletion signal)');
  } else if (context.practice_timing_pattern === 'late') {
    riskScore += 10;
    factors.push('Late night practice pattern (procrastination signal)');
  } else if (context.practice_timing_pattern === 'inconsistent') {
    riskScore += 15;
    factors.push('Inconsistent practice timing (stability issue)');
  }

  // Streak analysis
  if (context.current_streak === 0) {
    riskScore += 10;
    factors.push('No active streak');
  }

  // Practice frequency analysis (last 5 practices)
  if (context.recent_practices && context.recent_practices.length < 3) {
    riskScore += 15;
    factors.push(`Only ${context.recent_practices.length} practices in recent history`);
  }

  // Determine risk level
  let riskLevel: string;
  if (riskScore >= 70) {
    riskLevel = 'critical';
  } else if (riskScore >= 50) {
    riskLevel = 'high';
  } else if (riskScore >= 30) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  return { score: riskScore, level: riskLevel, factors };
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

  // Load user onboarding data (business profile + assessment)
  const { data: onboarding } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .single();

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

  // Load recent PROTECT practices (for MIO agent only)
  let recentPractices = null;
  let practiceTimingPattern = null;
  let energyTrend = null;
  let daysSinceLastPractice = null;

  if (agent === 'mio') {
    const { data: practices } = await supabase
      .from('daily_practices')
      .select('*')
      .eq('user_id', userId)
      .order('practice_date', { ascending: false })
      .limit(5);

    if (practices && practices.length > 0) {
      recentPractices = practices.map((p: any) => ({
        practice_date: p.practice_date,
        practice_type: p.practice_type,
        completed_at: p.completed_at,
        energy_levels: p.data?.energy_levels,
        trigger_resets: p.data?.trigger_resets,
        identity_statement: p.data?.identity_statement
      }));

      // Analyze practice timing patterns
      const completionHours = practices
        .filter((p: any) => p.completed_at)
        .map((p: any) => new Date(p.completed_at).getHours());

      if (completionHours.length > 0) {
        const avgHour = completionHours.reduce((a, b) => a + b, 0) / completionHours.length;
        const hourVariance = Math.max(...completionHours) - Math.min(...completionHours);

        if (hourVariance > 8) {
          practiceTimingPattern = 'inconsistent';
        } else if (avgHour < 7) {
          practiceTimingPattern = 'early';
        } else if (avgHour > 21) {
          practiceTimingPattern = 'late';
        } else {
          practiceTimingPattern = 'normal';
        }
      }

      // Analyze energy trend (from Energy Audit practices)
      const energyPractices = practices.filter((p: any) =>
        p.practice_type === 'energy_audit' && p.data?.energy_levels
      );

      if (energyPractices.length >= 2) {
        const firstAvg = Object.values(energyPractices[energyPractices.length - 1].data.energy_levels || {})
          .reduce((a: any, b: any) => a + b, 0) / 3;
        const lastAvg = Object.values(energyPractices[0].data.energy_levels || {})
          .reduce((a: any, b: any) => a + b, 0) / 3;

        if (lastAvg < firstAvg - 1) {
          energyTrend = 'declining';
        } else if (lastAvg > firstAvg + 1) {
          energyTrend = 'improving';
        } else {
          energyTrend = 'stable';
        }
      }

      // Calculate days since last practice
      const lastPracticeDate = new Date(practices[0].practice_date);
      const today = new Date();
      daysSinceLastPractice = Math.floor((today.getTime() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // Phase 4: Calculate dropout risk (MIO agent only)
  let dropoutRiskScore = null;
  let dropoutRiskLevel = null;
  let dropoutRiskFactors = null;

  if (agent === 'mio' && recentPractices) {
    const riskAnalysis = calculateDropoutRisk({
      current_week: profile.current_week || 1,
      current_day: profile.current_day || 1,
      days_since_last_practice: daysSinceLastPractice,
      practice_timing_pattern: practiceTimingPattern,
      energy_trend: energyTrend,
      recent_practices: recentPractices,
      current_streak: profile.current_streak || 0
    });

    dropoutRiskScore = riskAnalysis.score;
    dropoutRiskLevel = riskAnalysis.level;
    dropoutRiskFactors = riskAnalysis.factors;
  }

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

    // Group Home specifics (merge profile and onboarding, prefer onboarding for business profile)
    target_city: profile.target_city,
    target_state: onboarding?.target_state || profile.target_state,
    target_demographics: onboarding?.target_populations || profile.target_demographics || [],
    property_acquisition_type: profile.property_acquisition_type,
    license_status: onboarding?.license_status || profile.license_status,
    property_beds: onboarding?.bed_count || profile.property_beds,
    timeline_days: profile.timeline_days,
    startup_capital: onboarding?.capital_available || profile.startup_capital,
    credit_score_range: onboarding?.credit_score_range || profile.credit_score_range,
    real_estate_experience: onboarding?.caregiving_experience || profile.real_estate_experience,

    // Business Profile (from user_onboarding - progressive capture)
    business_name: onboarding?.business_name,
    entity_type: onboarding?.entity_type,
    target_state_reason: onboarding?.target_state_reason,
    property_status: onboarding?.property_status,
    property_type: onboarding?.property_type,
    funding_source: onboarding?.funding_source,
    startup_capital_actual: onboarding?.startup_capital_actual,
    monthly_revenue_target: onboarding?.monthly_revenue_target,
    monthly_expense_estimate: onboarding?.monthly_expense_estimate,
    break_even_timeline: onboarding?.break_even_timeline,
    service_model: onboarding?.service_model,
    marketing_strategy: onboarding?.marketing_strategy,
    referral_sources: onboarding?.referral_sources,
    profile_completeness: onboarding?.profile_completeness || 0,

    // Assessment Scores (from user_onboarding)
    financial_score: onboarding?.financial_score,
    market_score: onboarding?.market_score,
    operational_score: onboarding?.operational_score,
    mindset_score: onboarding?.mindset_score,
    overall_score: onboarding?.overall_score,
    readiness_level: onboarding?.readiness_level,

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

    // PROTECT practice behavioral data (MIO agent only)
    recent_practices: recentPractices,
    practice_timing_pattern: practiceTimingPattern,
    energy_trend: energyTrend,
    days_since_last_practice: daysSinceLastPractice,
    dropout_risk_score: dropoutRiskScore,
    dropout_risk_level: dropoutRiskLevel,
    dropout_risk_factors: dropoutRiskFactors,
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

  // Business Profile Section
  if (context.profile_completeness && context.profile_completeness > 0) {
    prompt += `\nBUSINESS PROFILE (${context.profile_completeness}% complete):\n`;

    if (context.business_name) {
      prompt += `- Business Name: ${context.business_name}\n`;
    }

    if (context.entity_type) {
      prompt += `- Entity Type: ${context.entity_type.toUpperCase().replace('-', ' ')}\n`;
    }

    if (context.target_state) {
      prompt += `- Target State: ${context.target_state}\n`;
    }

    if (context.property_beds) {
      prompt += `- Planned Beds: ${context.property_beds}\n`;
    }

    if (context.property_status) {
      prompt += `- Property Status: ${context.property_status.replace(/-/g, ' ')}\n`;
    }

    if (context.license_status) {
      prompt += `- License Status: ${context.license_status.replace(/-/g, ' ')}\n`;
    }

    if (context.funding_source) {
      prompt += `- Funding Source: ${context.funding_source.replace(/-/g, ' ')}\n`;
    }

    if (context.startup_capital_actual) {
      prompt += `- Startup Capital: $${context.startup_capital_actual.toLocaleString()}\n`;
    }

    if (context.monthly_revenue_target) {
      prompt += `- Monthly Revenue Target: $${context.monthly_revenue_target.toLocaleString()}\n`;
    }

    if (context.service_model) {
      prompt += `- Service Model: ${context.service_model.replace(/-/g, ' ')}\n`;
    }
  } else {
    // Fallback to older fields if no business profile yet
    if (context.target_state) {
      prompt += `- Target State: ${context.target_state}\n`;
    }

    if (context.startup_capital) {
      prompt += `- Startup Capital: ${context.startup_capital}\n`;
    }
  }

  if (context.target_demographics && context.target_demographics.length > 0) {
    prompt += `- Target Demographics: ${context.target_demographics.join(', ')}\n`;
  }

  if (context.property_acquisition_type) {
    prompt += `- Acquisition Strategy: ${context.property_acquisition_type}\n`;
  }

  // Assessment Scores
  if (context.overall_score) {
    prompt += `\nASSESSMENT SCORES:\n`;
    prompt += `- Overall: ${context.overall_score}/100 (${context.readiness_level?.replace(/_/g, ' ')})\n`;
    if (context.financial_score) prompt += `- Financial: ${context.financial_score}/100\n`;
    if (context.market_score) prompt += `- Market: ${context.market_score}/100\n`;
    if (context.operational_score) prompt += `- Operational: ${context.operational_score}/100\n`;
    if (context.mindset_score) prompt += `- Mindset: ${context.mindset_score}/100\n`;
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

  // PROTECT practice behavioral data (MIO agent only)
  if (context.recent_practices && context.recent_practices.length > 0) {
    prompt += `\nRECENT PROTECT PRACTICES:\n`;
    context.recent_practices.forEach((p, i) => {
      const practiceType = p.practice_type.replace(/_/g, ' ').toUpperCase();
      const completedTime = new Date(p.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      prompt += `${i + 1}. ${practiceType} - ${p.practice_date} at ${completedTime}\n`;

      if (p.energy_levels) {
        const { morning, afternoon, evening } = p.energy_levels;
        prompt += `   Energy: Morning ${morning}/10, Afternoon ${afternoon}/10, Evening ${evening}/10\n`;
      }

      if (p.trigger_resets) {
        prompt += `   Trigger Resets: ${p.trigger_resets} times\n`;
      }
    });

    if (context.practice_timing_pattern) {
      const timingWarning = context.practice_timing_pattern === 'early' ? '⚠️ EARLY morning pattern (pre-7am) - possible energy depletion signal'
                          : context.practice_timing_pattern === 'late' ? '⚠️ LATE night pattern (post-9pm) - possible avoidance/procrastination'
                          : context.practice_timing_pattern === 'inconsistent' ? '⚠️ INCONSISTENT timing (8+ hour variance) - stability issue'
                          : '';
      if (timingWarning) {
        prompt += `\n${timingWarning}\n`;
      }
    }

    if (context.energy_trend) {
      const energyWarning = context.energy_trend === 'declining' ? '⚠️ DECLINING energy trend - burnout risk'
                          : context.energy_trend === 'improving' ? '✅ IMPROVING energy trend'
                          : '';
      if (energyWarning) {
        prompt += `${energyWarning}\n`;
      }
    }

    if (context.days_since_last_practice !== null && context.days_since_last_practice > 0) {
      prompt += `⚠️ ${context.days_since_last_practice} days since last practice\n`;
    }

    // Phase 4: Dropout risk scoring
    if (context.dropout_risk_score !== null && context.dropout_risk_level) {
      prompt += `\nDROPOUT RISK ANALYSIS:\n`;
      const riskEmoji = context.dropout_risk_level === 'critical' ? '🚨'
                      : context.dropout_risk_level === 'high' ? '⚠️'
                      : context.dropout_risk_level === 'medium' ? '⚡'
                      : '✅';
      prompt += `${riskEmoji} Risk Level: ${context.dropout_risk_level.toUpperCase()} (Score: ${context.dropout_risk_score}/100)\n`;

      if (context.dropout_risk_factors && context.dropout_risk_factors.length > 0) {
        prompt += `Risk Factors:\n`;
        context.dropout_risk_factors.forEach((factor, i) => {
          prompt += `  ${i + 1}. ${factor}\n`;
        });
      }
    }
  }

  return prompt;
}
