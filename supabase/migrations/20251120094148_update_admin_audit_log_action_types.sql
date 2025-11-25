-- ============================================================================
-- FIX ADMIN AUDIT LOG ACTION TYPE CONSTRAINT
-- ============================================================================
-- Purpose: Expand allowed action_type values to match auditLogger.ts service
-- Issue: The original CHECK constraint was too restrictive, causing 400 errors
-- Solution: Drop old constraint and add comprehensive action type list
-- ============================================================================

-- Drop the existing CHECK constraint on action_type
ALTER TABLE public.admin_audit_log
DROP CONSTRAINT IF EXISTS admin_audit_log_action_type_check;

-- Add new CHECK constraint with all action types used by auditLogger.ts
ALTER TABLE public.admin_audit_log
ADD CONSTRAINT admin_audit_log_action_type_check
CHECK (action_type IN (
  -- Original action types
  'user_view',
  'user_edit',
  'user_delete',
  'user_export',
  'content_view',
  'content_edit',
  'content_publish',
  'content_delete',
  'analytics_view',
  'analytics_export',
  'system_config',
  'system_health_check',

  -- New action types from auditLogger.ts
  'view_dashboard',
  'view_cache_analytics',
  'view_performance_metrics',
  'view_rag_quality',
  'view_handoff_accuracy',
  'view_agent_comparison',
  'view_user_analytics',
  'view_conversation_volume',
  'view_response_time',
  'export_csv',
  'export_json',
  'filter_change',
  'permission_denied'
));

-- Add comment explaining the action types
COMMENT ON CONSTRAINT admin_audit_log_action_type_check ON public.admin_audit_log IS
  'Comprehensive list of admin action types tracked by the audit logging system. Includes user management, content operations, analytics views, data exports, and security events.';

-- Create index on action_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type_filter
ON public.admin_audit_log(action_type)
WHERE action_type IN ('export_csv', 'export_json', 'permission_denied');

COMMENT ON INDEX idx_admin_audit_log_action_type_filter IS
  'Optimized index for security-sensitive audit log queries (exports and permission denials)';
