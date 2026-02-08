-- ============================================================================
-- Know Your Partner: 3 New Tables for MIO Discovery Sessions
-- Migration: 20260208_partner_discovery
-- ============================================================================

-- Table 1: partner_discovery_sessions
-- MIO-guided conversations per KPI
CREATE TABLE IF NOT EXISTS partner_discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kpi_name TEXT NOT NULL,
  session_status TEXT NOT NULL DEFAULT 'not_started',
  conversation_history JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, kpi_name)
);

ALTER TABLE partner_discovery_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions"
  ON partner_discovery_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- Table 2: partner_insight_cards
-- Structured insights extracted from sessions
CREATE TABLE IF NOT EXISTS partner_insight_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES partner_discovery_sessions(id) ON DELETE SET NULL,
  kpi_name TEXT NOT NULL,
  insight_title TEXT NOT NULL,
  insight_text TEXT NOT NULL,
  insight_type TEXT NOT NULL DEFAULT 'preference',
  is_private BOOLEAN DEFAULT true,
  shared_with_partner BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  partner_reaction TEXT,
  source TEXT DEFAULT 'mio_session',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE partner_insight_cards ENABLE ROW LEVEL SECURITY;

-- Users can manage their own cards
CREATE POLICY "Users manage own cards"
  ON partner_insight_cards
  FOR ALL
  USING (auth.uid() = user_id);

-- Partners can read shared cards
CREATE POLICY "Partners read shared cards"
  ON partner_insight_cards
  FOR SELECT
  USING (
    shared_with_partner = true AND
    EXISTS (
      SELECT 1 FROM relationship_partnerships
      WHERE status = 'active'
      AND (
        (user_id = auth.uid() AND partner_id = partner_insight_cards.user_id)
        OR (partner_id = auth.uid() AND user_id = partner_insight_cards.user_id)
      )
    )
  );

-- Table 3: partner_interest_items
-- Gift ideas & interests tracker
CREATE TABLE IF NOT EXISTS partner_interest_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  about_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  item_category TEXT NOT NULL DEFAULT 'general',
  source TEXT DEFAULT 'manual',
  is_purchased BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE partner_interest_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own items"
  ON partner_interest_items
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_user ON partner_discovery_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_insight_cards_user ON partner_insight_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_insight_cards_kpi ON partner_insight_cards(user_id, kpi_name);
CREATE INDEX IF NOT EXISTS idx_insight_cards_shared ON partner_insight_cards(shared_with_partner) WHERE shared_with_partner = true;
CREATE INDEX IF NOT EXISTS idx_interest_items_user ON partner_interest_items(user_id);
CREATE INDEX IF NOT EXISTS idx_interest_items_about ON partner_interest_items(about_user_id);
