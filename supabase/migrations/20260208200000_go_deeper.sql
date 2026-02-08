-- Go Deeper: Allow deepening sessions on existing insight cards
-- Drops the 1-session-per-KPI constraint and adds tracking columns

-- Allow multiple sessions per KPI (discovery + deepening)
ALTER TABLE partner_discovery_sessions
  DROP CONSTRAINT IF EXISTS partner_discovery_sessions_user_id_kpi_name_key;

ALTER TABLE partner_discovery_sessions
  ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'discovery',
  ADD COLUMN IF NOT EXISTS context_card_id UUID REFERENCES partner_insight_cards(id);

-- Thread insight cards to their parent
ALTER TABLE partner_insight_cards
  ADD COLUMN IF NOT EXISTS parent_card_id UUID REFERENCES partner_insight_cards(id);
