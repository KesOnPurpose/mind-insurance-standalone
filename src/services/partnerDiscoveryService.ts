/**
 * Partner Discovery Service
 * Know Your Partner — CRUD operations for discovery sessions, insight cards,
 * interest items, pre-analysis engine, and gap detection.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  PartnerDiscoverySession,
  PartnerDiscoverySessionInsert,
  PartnerDiscoverySessionUpdate,
  PartnerInsightCard,
  PartnerInsightCardInsert,
  PartnerInsightCardUpdate,
  PartnerInterestItem,
  PartnerInterestItemInsert,
  PartnerInterestItemUpdate,
  DiscoveryChatMessage,
  DiscoveryChatRequest,
  DiscoveryChatResponse,
  PreAnalysisData,
  GapBadgeData,
  RelationshipDNAProfile,
} from '@/types/partner-discovery';
import type { RelationshipKPIName } from '@/types/relationship-kpis';

// ============================================================================
// DISCOVERY SESSIONS
// ============================================================================

/** Get all sessions for the current user */
export async function getDiscoverySessions(): Promise<PartnerDiscoverySession[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('partner_discovery_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PartnerDiscoverySession[];
}

/** Get or create a session for a specific KPI */
export async function getOrCreateSession(
  kpiName: RelationshipKPIName
): Promise<PartnerDiscoverySession> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Try to find existing discovery session (not deepening)
  const { data: existing, error: fetchError } = await supabase
    .from('partner_discovery_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('kpi_name', kpiName)
    .eq('session_type', 'discovery')
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return existing as PartnerDiscoverySession;

  // Create new session
  const { data: created, error: createError } = await supabase
    .from('partner_discovery_sessions')
    .insert({
      user_id: user.id,
      kpi_name: kpiName,
      session_status: 'not_started',
      conversation_history: [],
    })
    .select()
    .single();

  if (createError) throw createError;
  return created as PartnerDiscoverySession;
}

/** Create a deepening session linked to a specific insight card */
export async function createDeepeningSession(
  kpiName: RelationshipKPIName,
  contextCardId: string
): Promise<PartnerDiscoverySession> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('partner_discovery_sessions')
    .insert({
      user_id: user.id,
      kpi_name: kpiName,
      session_status: 'in_progress',
      session_type: 'deepening',
      context_card_id: contextCardId,
      conversation_history: [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as PartnerDiscoverySession;
}

/** Update a discovery session */
export async function updateSession(
  sessionId: string,
  update: PartnerDiscoverySessionUpdate
): Promise<PartnerDiscoverySession> {
  const { data, error } = await supabase
    .from('partner_discovery_sessions')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data as PartnerDiscoverySession;
}

/** Append a message to session conversation history */
export async function appendMessage(
  sessionId: string,
  message: DiscoveryChatMessage,
  currentHistory: DiscoveryChatMessage[]
): Promise<PartnerDiscoverySession> {
  const updatedHistory = [...currentHistory, message];
  return updateSession(sessionId, {
    conversation_history: updatedHistory,
    session_status: 'in_progress',
  });
}

// ============================================================================
// MIO DISCOVERY CHAT (Edge Function)
// ============================================================================

/** Send a message to MIO discovery chat Edge Function */
export async function sendDiscoveryMessage(
  request: DiscoveryChatRequest
): Promise<DiscoveryChatResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('mio-discovery-chat', {
    body: request,
  });

  if (error) throw error;
  return data as DiscoveryChatResponse;
}

// ============================================================================
// INSIGHT CARDS
// ============================================================================

/** Get insight cards for the current user, optionally filtered by KPI */
export async function getInsightCards(
  kpiName?: RelationshipKPIName
): Promise<PartnerInsightCard[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('partner_insight_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (kpiName) {
    query = query.eq('kpi_name', kpiName);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PartnerInsightCard[];
}

/** Get insight cards shared by partner */
export async function getPartnerSharedInsights(): Promise<PartnerInsightCard[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get active partnership to find partner ID
  const { data: partnership } = await supabase
    .from('relationship_partnerships')
    .select('user_id, partner_id')
    .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
    .eq('status', 'active')
    .maybeSingle();

  if (!partnership) return [];

  const partnerId = partnership.user_id === user.id
    ? partnership.partner_id
    : partnership.user_id;

  if (!partnerId) return [];

  const { data, error } = await supabase
    .from('partner_insight_cards')
    .select('*')
    .eq('user_id', partnerId)
    .eq('shared_with_partner', true)
    .order('shared_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PartnerInsightCard[];
}

/** Create insight cards from a completed session */
export async function createInsightCards(
  cards: PartnerInsightCardInsert[]
): Promise<PartnerInsightCard[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const rows = cards.map((c) => ({
    ...c,
    user_id: user.id,
  }));

  const { data, error } = await supabase
    .from('partner_insight_cards')
    .insert(rows)
    .select();

  if (error) throw error;
  return (data ?? []) as PartnerInsightCard[];
}

/** Update an insight card (e.g., toggle sharing) */
export async function updateInsightCard(
  cardId: string,
  update: PartnerInsightCardUpdate
): Promise<PartnerInsightCard> {
  const { data, error } = await supabase
    .from('partner_insight_cards')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single();

  if (error) throw error;
  return data as PartnerInsightCard;
}

/** Toggle sharing an insight card with partner */
export async function toggleShareInsightCard(
  cardId: string,
  share: boolean
): Promise<PartnerInsightCard> {
  return updateInsightCard(cardId, {
    shared_with_partner: share,
    shared_at: share ? new Date().toISOString() : undefined,
    is_private: !share,
  });
}

/** Add a reaction to a partner's shared insight card */
export async function reactToInsightCard(
  cardId: string,
  reaction: string
): Promise<PartnerInsightCard> {
  return updateInsightCard(cardId, {
    partner_reaction: reaction,
  });
}

/** Delete an insight card */
export async function deleteInsightCard(cardId: string): Promise<void> {
  const { error } = await supabase
    .from('partner_insight_cards')
    .delete()
    .eq('id', cardId);

  if (error) throw error;
}

// ============================================================================
// INTEREST / GIFT ITEMS
// ============================================================================

/** Get interest items about partner */
export async function getInterestItems(
  aboutUserId?: string
): Promise<PartnerInterestItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('partner_interest_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (aboutUserId) {
    query = query.eq('about_user_id', aboutUserId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PartnerInterestItem[];
}

/** Add a new interest/gift item */
export async function addInterestItem(
  item: PartnerInterestItemInsert
): Promise<PartnerInterestItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('partner_interest_items')
    .insert({ ...item, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as PartnerInterestItem;
}

/** Update an interest item */
export async function updateInterestItem(
  itemId: string,
  update: PartnerInterestItemUpdate
): Promise<PartnerInterestItem> {
  const { data, error } = await supabase
    .from('partner_interest_items')
    .update(update)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as PartnerInterestItem;
}

/** Delete an interest item */
export async function deleteInterestItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('partner_interest_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

// ============================================================================
// PRE-ANALYSIS ENGINE (Mind-Reading Layer)
// ============================================================================

/** Build pre-analysis data for a KPI based on user's existing scores and trends */
export async function getPreAnalysis(
  kpiName: RelationshipKPIName
): Promise<PreAnalysisData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get recent KPI scores for this user (last 8 check-ins)
  const { data: scores } = await supabase
    .from('relationship_kpi_scores')
    .select('kpi_name, score, created_at, check_in_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(80); // 10 KPIs * 8 check-ins

  if (!scores || scores.length === 0) return null;

  // Filter scores for this KPI
  const kpiScores = scores.filter((s) => s.kpi_name === kpiName);
  const currentScore = kpiScores[0]?.score ?? null;
  const previousScore = kpiScores[1]?.score ?? null;

  // Calculate trend
  let scoreTrend: PreAnalysisData['scoreTrend'] = null;
  if (currentScore !== null && previousScore !== null) {
    const diff = currentScore - previousScore;
    if (diff >= 2) scoreTrend = 'improving';
    else if (diff <= -2) scoreTrend = 'declining';
    else scoreTrend = 'stable';
  }

  // Find correlated KPIs (KPIs that moved in the same direction)
  const correlatedKpis: PreAnalysisData['correlatedKpis'] = [];
  if (scoreTrend === 'declining' || scoreTrend === 'improving') {
    const otherKpis = new Set(scores.map((s) => s.kpi_name).filter((n) => n !== kpiName));
    for (const otherKpi of otherKpis) {
      const otherScores = scores.filter((s) => s.kpi_name === otherKpi);
      if (otherScores.length >= 2) {
        const otherCurrent = otherScores[0].score;
        const otherPrevious = otherScores[1].score;
        const otherDiff = otherCurrent - otherPrevious;
        const thisDiff = currentScore! - previousScore!;
        // Same direction movement
        if ((thisDiff > 0 && otherDiff > 0) || (thisDiff < 0 && otherDiff < 0)) {
          correlatedKpis.push({
            name: otherKpi as RelationshipKPIName,
            correlation: thisDiff > 0 ? 'both improving' : 'both declining',
          });
        }
      }
    }
  }

  // Check partner shared cards for this KPI
  let partnerSharedCount = 0;
  let partnerInsightSummary: string | null = null;
  try {
    const partnerCards = await getPartnerSharedInsights();
    const kpiCards = partnerCards.filter((c) => c.kpi_name === kpiName);
    partnerSharedCount = kpiCards.length;
    if (kpiCards.length > 0) {
      partnerInsightSummary = kpiCards
        .slice(0, 3)
        .map((c) => c.insight_title)
        .join(', ');
    }
  } catch {
    // No partner or not paired - that's fine
  }

  // Generate suggested focus based on score level
  let suggestedFocus: string | null = null;
  if (currentScore !== null) {
    if (currentScore <= 3) {
      suggestedFocus = 'Understand what is missing and what you truly need';
    } else if (currentScore <= 6) {
      suggestedFocus = 'Refine what is working and identify specific gaps';
    } else {
      suggestedFocus = 'Celebrate what is thriving and deepen your understanding';
    }
  }

  return {
    kpiName,
    currentScore,
    previousScore,
    scoreTrend,
    correlatedKpis: correlatedKpis.slice(0, 3),
    partnerSharedCount,
    partnerInsightSummary,
    suggestedFocus,
  };
}

// ============================================================================
// GAP DETECTION (Dynamic Badges)
// ============================================================================

/** Calculate gap detection badge for a KPI */
export async function getGapBadge(
  kpiName: RelationshipKPIName,
  session: PartnerDiscoverySession | null,
  preAnalysis: PreAnalysisData | null
): Promise<GapBadgeData | null> {
  // Priority 1: Partner shared something for this KPI
  if (preAnalysis && preAnalysis.partnerSharedCount > 0) {
    return {
      type: 'partner_shared',
      label: 'Partner shared',
      description: `Your partner shared ${preAnalysis.partnerSharedCount} insight${preAnalysis.partnerSharedCount > 1 ? 's' : ''} about ${kpiName.replace(/_/g, ' ')}`,
    };
  }

  // Priority 2: MIO noticed a score change
  if (preAnalysis && preAnalysis.scoreTrend === 'declining') {
    return {
      type: 'mio_noticed',
      label: 'MIO noticed something',
      description: `Your score dropped from ${preAnalysis.previousScore} to ${preAnalysis.currentScore}`,
    };
  }

  // Priority 3: Ready for revisit (completed but scores changed since)
  if (session?.session_status === 'completed' && preAnalysis?.scoreTrend) {
    if (preAnalysis.scoreTrend !== 'stable') {
      return {
        type: 'revisit',
        label: 'Worth revisiting',
        description: 'Your scores have shifted since your last discovery session',
      };
    }
  }

  // Priority 4: Both aligned (completed + healthy scores)
  if (
    session?.session_status === 'completed' &&
    preAnalysis?.currentScore &&
    preAnalysis.currentScore >= 7
  ) {
    return {
      type: 'aligned',
      label: 'Looking good',
      description: 'You and your partner are aligned in this area',
    };
  }

  return null;
}

// ============================================================================
// RELATIONSHIP DNA PROFILE
// ============================================================================

/** Generate relationship DNA profile from completed sessions */
export async function generateRelationshipDNA(): Promise<RelationshipDNAProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get all completed sessions with their insight cards
  const { data: sessions } = await supabase
    .from('partner_discovery_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_status', 'completed');

  if (!sessions || sessions.length < 5) return null;

  const { data: cards } = await supabase
    .from('partner_insight_cards')
    .select('*')
    .eq('user_id', user.id);

  if (!cards) return null;

  // Group insights by type for DNA generation
  const preferences = cards.filter((c) => c.insight_type === 'preference');
  const boundaries = cards.filter((c) => c.insight_type === 'boundary');
  const loveLanguages = cards.filter((c) => c.insight_type === 'love_language');
  const dreams = cards.filter((c) => c.insight_type === 'dream');
  const triggers = cards.filter((c) => c.insight_type === 'trigger');
  const needs = cards.filter((c) => c.insight_type === 'need');

  // Build DNA from structured insights
  // In future, this will be a call to the Edge Function for AI synthesis
  // For now, extract from the cards directly
  return {
    coreNeed: needs[0]?.insight_text || preferences[0]?.insight_text || 'Complete more sessions to reveal',
    howYouGiveLove: loveLanguages.find((c) => c.insight_title.toLowerCase().includes('give'))?.insight_text
      || preferences.slice(0, 2).map((c) => c.insight_title).join(', ') || 'Continue discovering',
    howYouNeedLove: loveLanguages.find((c) => c.insight_title.toLowerCase().includes('need'))?.insight_text
      || needs.slice(0, 2).map((c) => c.insight_title).join(', ') || 'Continue discovering',
    superpower: preferences.find((c) => c.insight_title.toLowerCase().includes('strength'))?.insight_text
      || 'Your patterns will reveal this',
    blindSpot: triggers[0]?.insight_text || boundaries[0]?.insight_text || 'Keep exploring',
    lightsYouUp: dreams[0]?.insight_text || preferences.find((c) => c.insight_title.toLowerCase().includes('joy'))?.insight_text || 'More sessions will reveal this',
    shutsYouDown: triggers.find((c) => c.insight_title.toLowerCase().includes('shut'))?.insight_text
      || boundaries.find((c) => c.insight_title.toLowerCase().includes('avoid'))?.insight_text || 'Keep exploring',
    partnerProbablyDoesntKnow: cards.filter((c) => c.is_private).slice(0, 1)[0]?.insight_text || 'Share more to unlock this',
    generatedAt: new Date().toISOString(),
    sessionCount: sessions.length,
  };
}

// ============================================================================
// COUNTS & STATS
// ============================================================================

/** Get insight card counts grouped by KPI */
export async function getInsightCountsByKPI(): Promise<Record<string, { total: number; shared: number }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('partner_insight_cards')
    .select('kpi_name, shared_with_partner')
    .eq('user_id', user.id);

  if (error || !data) return {};

  const counts: Record<string, { total: number; shared: number }> = {};
  for (const card of data) {
    if (!counts[card.kpi_name]) {
      counts[card.kpi_name] = { total: 0, shared: 0 };
    }
    counts[card.kpi_name].total++;
    if (card.shared_with_partner) {
      counts[card.kpi_name].shared++;
    }
  }

  return counts;
}
