// ============================================================================
// AUDIT LOG TYPE DEFINITIONS
// ============================================================================
// Comprehensive type definitions for admin audit logging system
// Tracks all admin analytics actions with detailed metadata
// ============================================================================

/**
 * Comprehensive enumeration of all trackable admin actions
 * Maps to database enum 'audit_action_type'
 */
export type AuditActionType =
  | 'view_dashboard'
  | 'view_cache_analytics'
  | 'view_performance_metrics'
  | 'view_rag_quality'
  | 'view_handoff_accuracy'
  | 'view_agent_comparison'
  | 'view_user_analytics'
  | 'export_csv'
  | 'export_json'
  | 'filter_change'
  | 'permission_denied'
  | 'analytics_view'
  | 'analytics_export'
  | 'view_conversation_volume'
  | 'view_response_time';

/**
 * Core audit log entry structure
 * Persisted to admin_audit_log table in Supabase
 */
export interface AuditLogEntry {
  admin_user_id: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, any>;
}

/**
 * Optional metadata to include with audit logs
 * Provides context about the action and data accessed
 */
export interface AuditLogMetadata {
  time_range?: string;
  agent_type?: string;
  data_points?: number;
  filters?: Record<string, any>;
  old_value?: any;
  new_value?: any;
  format?: 'csv' | 'json';
  row_count?: number;
  error?: string;
  duration_ms?: number;
}

/**
 * Expanded audit log entry with metadata
 * Used for creating detailed audit entries
 */
export interface ExpandedAuditLogEntry extends AuditLogEntry {
  details?: AuditLogMetadata;
}

/**
 * Retrieved audit log record from database
 * Includes system-generated fields
 */
export interface AuditLogRecord extends AuditLogEntry {
  id: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Audit log summary for dashboard/reporting
 * Aggregates audit activity over time periods
 */
export interface AuditLogSummary {
  total_actions: number;
  actions_by_type: Record<AuditActionType, number>;
  top_admin_users: Array<{
    admin_user_id: string;
    action_count: number;
  }>;
  time_range: string;
}
