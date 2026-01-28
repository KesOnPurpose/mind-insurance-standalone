-- Migration: Add 'paused' status to mio_weekly_protocols
-- Purpose: Support pausing MIO protocols when Coach V2 protocols are assigned
-- Date: 2025-12-10

-- The existing CHECK constraint only allows: 'active', 'completed', 'skipped', 'muted', 'expired'
-- We need to add 'paused' to support Coach Protocol V2 integration

-- Step 1: Drop the existing constraint
ALTER TABLE mio_weekly_protocols
DROP CONSTRAINT IF EXISTS mio_weekly_protocols_status_check;

-- Step 2: Add new constraint with 'paused' included
ALTER TABLE mio_weekly_protocols
ADD CONSTRAINT mio_weekly_protocols_status_check
CHECK (status IN ('active', 'completed', 'skipped', 'muted', 'expired', 'paused'));

-- Add comment for documentation
COMMENT ON COLUMN mio_weekly_protocols.status IS
'Protocol status: active (in progress), completed, skipped (user skipped), muted (coach muted), expired (past week), paused (paused by coach protocol v2 assignment)';
