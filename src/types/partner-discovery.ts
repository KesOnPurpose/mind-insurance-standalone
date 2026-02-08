/**
 * Partner Discovery Types
 * Know Your Partner — MIO-guided discovery conversations per KPI
 *
 * Maps to 3 database tables:
 *   partner_discovery_sessions, partner_insight_cards, partner_interest_items
 */

import type { RelationshipKPIName } from './relationship-kpis';

// ============================================================================
// Enums & Literal Types
// ============================================================================

export type DiscoverySessionStatus = 'not_started' | 'in_progress' | 'completed';

export type InsightCardType =
  | 'preference'
  | 'boundary'
  | 'love_language'
  | 'memory'
  | 'dream'
  | 'trigger'
  | 'need';

export type InterestCategory =
  | 'gift_idea'
  | 'hobby'
  | 'food'
  | 'experience'
  | 'general';

export type PartnerReaction = 'heart' | 'wow' | 'noted' | 'text';

/** Gap detection badge type for KPI discovery cards */
export type GapBadgeType =
  | 'mio_noticed'       // Score dropped, trend shift, or partner gap detected
  | 'partner_shared'    // Partner shared insight cards for this KPI
  | 'revisit'           // Completed but new data suggests revisiting
  | 'aligned'           // Both completed discovery + scores healthy
  | null;

// ============================================================================
// Chat Message Types
// ============================================================================

export interface DiscoveryChatMessage {
  role: 'user' | 'mio';
  content: string;
  timestamp: string;
}

// ============================================================================
// Table 1: partner_discovery_sessions
// ============================================================================

export interface PartnerDiscoverySession {
  id: string;
  user_id: string;
  kpi_name: RelationshipKPIName;
  session_status: DiscoverySessionStatus;
  conversation_history: DiscoveryChatMessage[];
  started_at: string | null;
  completed_at: string | null;
  summary: string | null;
  session_type: 'discovery' | 'deepening';
  context_card_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerDiscoverySessionInsert {
  kpi_name: RelationshipKPIName;
  session_status?: DiscoverySessionStatus;
  conversation_history?: DiscoveryChatMessage[];
  started_at?: string;
  session_type?: 'discovery' | 'deepening';
  context_card_id?: string | null;
}

export interface PartnerDiscoverySessionUpdate {
  session_status?: DiscoverySessionStatus;
  conversation_history?: DiscoveryChatMessage[];
  completed_at?: string;
  summary?: string;
}

// ============================================================================
// Table 2: partner_insight_cards
// ============================================================================

export interface PartnerInsightCard {
  id: string;
  user_id: string;
  session_id: string | null;
  kpi_name: RelationshipKPIName;
  insight_title: string;
  insight_text: string;
  insight_type: InsightCardType;
  is_private: boolean;
  shared_with_partner: boolean;
  shared_at: string | null;
  partner_reaction: string | null;
  parent_card_id: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerInsightCardInsert {
  session_id?: string | null;
  kpi_name: RelationshipKPIName;
  insight_title: string;
  insight_text: string;
  insight_type?: InsightCardType;
  is_private?: boolean;
  parent_card_id?: string | null;
  source?: string;
}

export interface PartnerInsightCardUpdate {
  insight_title?: string;
  insight_text?: string;
  insight_type?: InsightCardType;
  is_private?: boolean;
  shared_with_partner?: boolean;
  shared_at?: string;
  partner_reaction?: string;
}

// ============================================================================
// Table 3: partner_interest_items
// ============================================================================

export interface PartnerInterestItem {
  id: string;
  user_id: string;
  about_user_id: string;
  item_text: string;
  item_category: InterestCategory;
  source: string;
  is_purchased: boolean;
  notes: string | null;
  created_at: string;
}

export interface PartnerInterestItemInsert {
  about_user_id: string;
  item_text: string;
  item_category?: InterestCategory;
  source?: string;
  notes?: string;
}

export interface PartnerInterestItemUpdate {
  item_text?: string;
  item_category?: InterestCategory;
  is_purchased?: boolean;
  notes?: string;
}

// ============================================================================
// Pre-Analysis Types (Mind-Reading Layer)
// ============================================================================

export interface PreAnalysisData {
  kpiName: RelationshipKPIName;
  currentScore: number | null;
  previousScore: number | null;
  scoreTrend: 'improving' | 'stable' | 'declining' | null;
  correlatedKpis: { name: RelationshipKPIName; correlation: string }[];
  partnerSharedCount: number;
  partnerInsightSummary: string | null;
  suggestedFocus: string | null;
}

// ============================================================================
// Gap Detection Badge Data
// ============================================================================

export interface GapBadgeData {
  type: GapBadgeType;
  label: string;
  description: string;
}

// ============================================================================
// Relationship DNA Profile
// ============================================================================

export interface RelationshipDNAProfile {
  coreNeed: string;
  howYouGiveLove: string;
  howYouNeedLove: string;
  superpower: string;
  blindSpot: string;
  lightsYouUp: string;
  shutsYouDown: string;
  partnerProbablyDoesntKnow: string;
  generatedAt: string;
  sessionCount: number;
}

// ============================================================================
// Edge Function Request/Response
// ============================================================================

export interface DiscoveryChatRequest {
  session_id: string;
  user_id: string;
  kpi_name: RelationshipKPIName;
  message: string;
  conversation_history: DiscoveryChatMessage[];
  context_card?: {
    id: string;
    title: string;
    text: string;
    type: InsightCardType;
  };
}

export interface DiscoveryChatResponse {
  reply: string;
  suggested_insights?: ProposedInsightCard[];
  session_complete?: boolean;
}

export interface ProposedInsightCard {
  title: string;
  text: string;
  type: InsightCardType;
}

// ============================================================================
// KPI Discovery Card (UI)
// ============================================================================

export interface KPIDiscoveryCardData {
  kpiName: RelationshipKPIName;
  label: string;
  description: string;
  category: string;
  session: PartnerDiscoverySession | null;
  insightCount: number;
  sharedCount: number;
  gapBadge: GapBadgeData | null;
  preAnalysis: PreAnalysisData | null;
}
