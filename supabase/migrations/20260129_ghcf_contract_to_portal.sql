-- =============================================================================
-- GHCF Contract-to-Portal Automation - Database Foundation
-- Session: 2026-01-29-ghcf-contract-to-portal-init
-- =============================================================================
-- This migration adds:
--   FEAT-GHCF-001-A: 7 new columns on gh_approved_users
--   FEAT-GHCF-001-B: ghl_enrollment_log table (webhook audit log)
--   FEAT-GHCF-001-C: check_email_approved RPC
--   FEAT-GHCF-001-D: RLS policies + grants
--   UPSERT RPCs for contract + payment webhooks
--   UNIQUE constraint on gh_approved_users.email for ON CONFLICT
-- =============================================================================

-- ---------------------------------------------------------------------------
-- FEAT-GHCF-001-A: ALTER gh_approved_users - Add 7 columns
-- ---------------------------------------------------------------------------
ALTER TABLE gh_approved_users
  ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT,
  ADD COLUMN IF NOT EXISTS whop_membership_id TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS enrollment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ghl_pipeline_stage TEXT;

-- Indexes for webhook lookups
CREATE INDEX IF NOT EXISTS idx_gh_approved_users_ghl_contact
  ON gh_approved_users(ghl_contact_id);
CREATE INDEX IF NOT EXISTS idx_gh_approved_users_email
  ON gh_approved_users(email);

-- UNIQUE constraint on email for ON CONFLICT upsert
-- Use DO NOTHING to handle case where constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'gh_approved_users_email_unique'
  ) THEN
    ALTER TABLE gh_approved_users
      ADD CONSTRAINT gh_approved_users_email_unique UNIQUE (email);
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- FEAT-GHCF-001-B: CREATE TABLE ghl_enrollment_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ghl_enrollment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  webhook_type TEXT NOT NULL,
  ghl_contact_id TEXT,
  email TEXT,
  full_name TEXT,
  raw_payload JSONB NOT NULL,
  processing_status TEXT DEFAULT 'received',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ghl_enrollment_log_idempotency
  ON ghl_enrollment_log(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ghl_enrollment_log_email
  ON ghl_enrollment_log(email);

-- ---------------------------------------------------------------------------
-- FEAT-GHCF-001-C: check_email_approved RPC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_email_approved(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM gh_approved_users
    WHERE LOWER(email) = LOWER(p_email)
      AND is_active = true
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- UPSERT RPCs for webhook processing
-- ---------------------------------------------------------------------------

-- UPSERT for contract webhook (COALESCE preserves existing values)
CREATE OR REPLACE FUNCTION upsert_approved_user_contract(
  p_email TEXT,
  p_full_name TEXT,
  p_ghl_contact_id TEXT,
  p_contract_signed_at TIMESTAMPTZ,
  p_enrollment_source TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO gh_approved_users (email, full_name, ghl_contact_id, contract_signed_at, enrollment_source, enrollment_status, is_active)
  VALUES (LOWER(p_email), p_full_name, p_ghl_contact_id, p_contract_signed_at, p_enrollment_source, 'contract_signed', true)
  ON CONFLICT (email) DO UPDATE SET
    full_name = COALESCE(gh_approved_users.full_name, EXCLUDED.full_name),
    ghl_contact_id = COALESCE(gh_approved_users.ghl_contact_id, EXCLUDED.ghl_contact_id),
    contract_signed_at = COALESCE(gh_approved_users.contract_signed_at, EXCLUDED.contract_signed_at),
    enrollment_source = COALESCE(gh_approved_users.enrollment_source, EXCLUDED.enrollment_source),
    enrollment_status = 'contract_signed',
    is_active = true,
    updated_at = now();
END;
$$;

-- UPSERT for payment webhook
CREATE OR REPLACE FUNCTION upsert_approved_user_payment(
  p_email TEXT,
  p_full_name TEXT,
  p_ghl_contact_id TEXT,
  p_whop_membership_id TEXT,
  p_payment_verified_at TIMESTAMPTZ,
  p_enrollment_source TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO gh_approved_users (email, full_name, ghl_contact_id, whop_membership_id, payment_verified_at, enrollment_source, enrollment_status, is_active)
  VALUES (LOWER(p_email), p_full_name, p_ghl_contact_id, p_whop_membership_id, p_payment_verified_at, p_enrollment_source, 'payment_verified', true)
  ON CONFLICT (email) DO UPDATE SET
    full_name = COALESCE(gh_approved_users.full_name, EXCLUDED.full_name),
    ghl_contact_id = COALESCE(gh_approved_users.ghl_contact_id, EXCLUDED.ghl_contact_id),
    whop_membership_id = COALESCE(gh_approved_users.whop_membership_id, EXCLUDED.whop_membership_id),
    payment_verified_at = COALESCE(gh_approved_users.payment_verified_at, EXCLUDED.payment_verified_at),
    enrollment_source = COALESCE(gh_approved_users.enrollment_source, EXCLUDED.enrollment_source),
    enrollment_status = 'payment_verified',
    is_active = true,
    updated_at = now();
END;
$$;

-- ---------------------------------------------------------------------------
-- FEAT-GHCF-001-D: RLS Policies + Grants
-- ---------------------------------------------------------------------------

-- ghl_enrollment_log: Only service role can read/write (no client access)
ALTER TABLE ghl_enrollment_log ENABLE ROW LEVEL SECURITY;
-- No policies = service role only (anon/authenticated get NOTHING)

-- Grant execute on RPC to anon (for /create-account pre-signup polling)
GRANT EXECUTE ON FUNCTION check_email_approved(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_email_approved(TEXT) TO authenticated;

-- Grant execute on UPSERT RPCs to service_role only (edge functions)
-- These are SECURITY DEFINER so they run as table owner regardless
-- No explicit grant needed for service_role (it bypasses RLS)
