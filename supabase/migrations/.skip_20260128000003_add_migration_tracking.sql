-- ============================================================================
-- PHASE 2: Add Migration Tracking Columns
-- ============================================================================
-- Purpose: Track N8n workflow migration from old to new unified workflow
-- Old Workflow: 0qiaQWEaDXbCxkhK
-- New Workflow: exBaZHKCjDbZioa4
--
-- This migration adds tracking columns for soft migration with rollback capability
-- ============================================================================

-- ============================================================================
-- STEP 2.1: Add Migration Columns to agent_conversations
-- ============================================================================

-- Add source_workflow_id column (which workflow created this record)
ALTER TABLE agent_conversations ADD COLUMN IF NOT EXISTS
  source_workflow_id TEXT DEFAULT '0qiaQWEaDXbCxkhK';

-- Add target_workflow_id column (which workflow will serve this record)
ALTER TABLE agent_conversations ADD COLUMN IF NOT EXISTS
  target_workflow_id TEXT;

-- Add migration_batch column (batch identifier for rollback grouping)
ALTER TABLE agent_conversations ADD COLUMN IF NOT EXISTS
  migration_batch TEXT;

-- Add migrated_at timestamp (when the record was migrated)
ALTER TABLE agent_conversations ADD COLUMN IF NOT EXISTS
  migrated_at TIMESTAMPTZ;

-- Create index for efficient migration queries
CREATE INDEX IF NOT EXISTS idx_agent_conv_migration
  ON agent_conversations(source_workflow_id, target_workflow_id);

CREATE INDEX IF NOT EXISTS idx_agent_conv_batch
  ON agent_conversations(migration_batch);

-- ============================================================================
-- STEP 2.2: Create Migration Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_batch TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('prep', 'mark_source', 'set_target', 'migrate', 'validate', 'complete', 'rollback')),
  table_name TEXT NOT NULL,
  records_affected INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'success', 'failed', 'rolled_back')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Index for querying migration logs
CREATE INDEX IF NOT EXISTS idx_migration_log_batch ON chat_migration_log(migration_batch);
CREATE INDEX IF NOT EXISTS idx_migration_log_status ON chat_migration_log(status);
CREATE INDEX IF NOT EXISTS idx_migration_log_started ON chat_migration_log(started_at DESC);

-- ============================================================================
-- STEP 2.3: Mark All Existing Records with Source Workflow
-- ============================================================================

-- Mark all existing agent_conversations as from old workflow
UPDATE agent_conversations
SET source_workflow_id = '0qiaQWEaDXbCxkhK'
WHERE source_workflow_id IS NULL OR source_workflow_id = '';

-- Log the mark_source action
INSERT INTO chat_migration_log (
  migration_batch,
  phase,
  table_name,
  records_affected,
  status,
  metadata,
  completed_at
)
SELECT
  'batch_2026_01_28',
  'mark_source',
  'agent_conversations',
  COUNT(*),
  'success',
  jsonb_build_object(
    'source_workflow_id', '0qiaQWEaDXbCxkhK',
    'description', 'Marked all existing records with source workflow ID'
  ),
  now()
FROM agent_conversations
WHERE source_workflow_id = '0qiaQWEaDXbCxkhK';

-- ============================================================================
-- STEP 2.4: Set Target Workflow for All Records
-- ============================================================================

-- All records will be served by new unified workflow going forward
UPDATE agent_conversations
SET target_workflow_id = 'exBaZHKCjDbZioa4',
    migration_batch = 'batch_2026_01_28',
    migrated_at = now()
WHERE target_workflow_id IS NULL;

-- Log the set_target action
INSERT INTO chat_migration_log (
  migration_batch,
  phase,
  table_name,
  records_affected,
  status,
  metadata,
  completed_at
)
SELECT
  'batch_2026_01_28',
  'set_target',
  'agent_conversations',
  COUNT(*),
  'success',
  jsonb_build_object(
    'target_workflow_id', 'exBaZHKCjDbZioa4',
    'description', 'Set target workflow for all records'
  ),
  now()
FROM agent_conversations
WHERE migration_batch = 'batch_2026_01_28';

-- ============================================================================
-- STEP 2.5: Create Rollback Helper Function
-- ============================================================================

-- Function to rollback a specific migration batch
CREATE OR REPLACE FUNCTION rollback_migration_batch(batch_id TEXT)
RETURNS TABLE (
  records_rolled_back INTEGER,
  status TEXT
) AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Clear migration tracking for the batch
  UPDATE agent_conversations
  SET target_workflow_id = NULL,
      migration_batch = NULL,
      migrated_at = NULL
  WHERE migration_batch = batch_id;

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  -- Log the rollback
  INSERT INTO chat_migration_log (
    migration_batch,
    phase,
    table_name,
    records_affected,
    status,
    metadata,
    completed_at
  ) VALUES (
    batch_id,
    'rollback',
    'agent_conversations',
    affected_count,
    'rolled_back',
    jsonb_build_object('reason', 'Manual rollback requested'),
    now()
  );

  RETURN QUERY SELECT affected_count, 'rolled_back'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUMMARY: Log Migration Completion
-- ============================================================================

DO $$
DECLARE
  total_records INTEGER;
  migrated_records INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_records FROM agent_conversations;
  SELECT COUNT(*) INTO migrated_records FROM agent_conversations WHERE migration_batch IS NOT NULL;

  -- Log overall completion
  INSERT INTO chat_migration_log (
    migration_batch,
    phase,
    table_name,
    records_affected,
    status,
    metadata,
    completed_at
  ) VALUES (
    'batch_2026_01_28',
    'complete',
    'agent_conversations',
    migrated_records,
    'success',
    jsonb_build_object(
      'total_records', total_records,
      'migrated_records', migrated_records,
      'old_workflow', '0qiaQWEaDXbCxkhK',
      'new_workflow', 'exBaZHKCjDbZioa4'
    ),
    now()
  );

  RAISE NOTICE 'Migration tracking complete: % of % records migrated', migrated_records, total_records;
END $$;
