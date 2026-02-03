-- Subscription actions log for tracking cancel/pause/resume events
-- Used by the manage-subscription edge function
CREATE TABLE IF NOT EXISTS subscription_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text,
  membership_id text,
  action text NOT NULL,
  cancel_reason text,
  cancel_reason_text text,
  whop_response_status integer,
  whop_response_error text,
  created_at timestamptz DEFAULT now()
);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_subscription_actions_log_user_id
  ON subscription_actions_log(user_id);

-- Index for querying by membership
CREATE INDEX IF NOT EXISTS idx_subscription_actions_log_membership_id
  ON subscription_actions_log(membership_id);

-- RLS: Only service role can insert (edge function uses service role)
ALTER TABLE subscription_actions_log ENABLE ROW LEVEL SECURITY;

-- No public read/write policies — this table is only accessed by the edge function via service role
