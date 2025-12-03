// ============================================================================
// AUDIT LOGGER SERVICE
// ============================================================================
// Fire-and-forget audit logging utility for tracking admin analytics actions
// All logging is asynchronous and non-blocking to preserve UI performance
// Failed audit logs are silently logged to console, never propagated to UI
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { AuditActionType, AuditLogMetadata } from '@/types/auditLog';

/**
 * Core analytics view logging function
 * Logs when admin accesses any analytics section/metric
 *
 * @param adminUserId - UUID of the admin user performing action
 * @param section - Analytics section being viewed (e.g., 'cache_hit_rate', 'rag_quality')
 * @param metadata - Optional context about the view (time range, agent type, filters)
 *
 * @fires Asynchronously - never blocks execution
 * @error Silently fails - logs to console, never throws
 */
export async function logAnalyticsView(
  adminUserId: string | undefined,
  section: string,
  metadata?: AuditLogMetadata
): Promise<void> {
  // Guard: Return early if no admin user present
  if (!adminUserId) return;

  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action_type: 'analytics_view',
      target_type: 'system',  // Analytics actions use 'system' target type
      target_id: section,
      details: metadata || {},
    });
  } catch (error) {
    // Silent fail - log to console but never throw to UI
    console.error('[AuditLogger] Failed to log analytics view:', error);
  }
}

/**
 * Data export logging function
 * Logs when admin exports analytics data in CSV or JSON format
 *
 * @param adminUserId - UUID of the admin user performing action
 * @param format - Export format ('csv' or 'json')
 * @param filters - Filters applied to exported data
 * @param rowCount - Number of rows in export (optional)
 *
 * @fires Asynchronously - never blocks execution
 * @error Silently fails - logs to console, never throws
 */
export async function logDataExport(
  adminUserId: string | undefined,
  format: 'csv' | 'json',
  filters: Record<string, any>,
  rowCount?: number
): Promise<void> {
  // Guard: Return early if no admin user present
  if (!adminUserId) return;

  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action_type: format === 'csv' ? 'export_csv' : 'export_json',
      target_type: 'system',  // Export actions use 'system' target type
      details: {
        format,
        filters,
        row_count: rowCount,
      },
    });
  } catch (error) {
    // Silent fail - log to console but never throw to UI
    console.error('[AuditLogger] Failed to log export:', error);
  }
}

/**
 * Filter change logging function
 * Logs when admin modifies analytics filters (time range, agent type, etc)
 *
 * @param adminUserId - UUID of the admin user performing action
 * @param section - Analytics section where filter was changed
 * @param oldValue - Previous filter value
 * @param newValue - New filter value
 *
 * @fires Asynchronously - never blocks execution
 * @error Silently fails - logs to console, never throws
 */
export async function logFilterChange(
  adminUserId: string | undefined,
  section: string,
  oldValue: any,
  newValue: any
): Promise<void> {
  // Guard: Return early if no admin user present
  if (!adminUserId) return;

  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action_type: 'filter_change',
      target_type: 'system',  // Filter changes use 'system' target type
      target_id: section,
      details: {
        old_value: oldValue,
        new_value: newValue,
      },
    });
  } catch (error) {
    // Silent fail - log to console but never throw to UI
    console.error('[AuditLogger] Failed to log filter change:', error);
  }
}

/**
 * Permission denied logging function
 * Logs when admin attempts unauthorized action (security audit trail)
 *
 * @param adminUserId - UUID of the admin user performing action
 * @param action - Action that was attempted
 * @param resource - Resource that was accessed (analytics section, export, etc)
 *
 * @fires Asynchronously - never blocks execution
 * @error Silently fails - logs to console, never throws
 */
export async function logPermissionDenied(
  adminUserId: string | undefined,
  action: string,
  resource: string
): Promise<void> {
  // Guard: Return early if no admin user present
  if (!adminUserId) return;

  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action_type: 'permission_denied',
      target_type: resource,
      details: {
        attempted_action: action,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Silent fail - log to console but never throw to UI
    console.error('[AuditLogger] Failed to log permission denial:', error);
  }
}

/**
 * Dashboard view logging function
 * Logs when admin accesses the main dashboard
 *
 * @param adminUserId - UUID of the admin user performing action
 * @param timeRange - Time range selected for dashboard view
 * @param metadata - Optional additional context
 *
 * @fires Asynchronously - never blocks execution
 * @error Silently fails - logs to console, never throws
 */
export async function logDashboardView(
  adminUserId: string | undefined,
  timeRange?: string,
  metadata?: AuditLogMetadata
): Promise<void> {
  // Guard: Return early if no admin user present
  if (!adminUserId) return;

  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action_type: 'view_dashboard',
      target_type: 'system',  // Dashboard views use 'system' target type
      target_id: 'main',
      details: {
        time_range: timeRange,
        ...metadata,
      },
    });
  } catch (error) {
    // Silent fail - log to console but never throw to UI
    console.error('[AuditLogger] Failed to log dashboard view:', error);
  }
}

/**
 * Specific cache analytics view logging
 * Logs when admin views cache hit rate analytics
 *
 * @param adminUserId - UUID of the admin user performing action
 * @param agentType - Agent type being analyzed (nette, mio, me, all)
 * @param timeRange - Time range for the analytics view
 * @param metadata - Optional additional context
 *
 * @fires Asynchronously - never blocks execution
 * @error Silently fails - logs to console, never throws
 */
export async function logCacheAnalyticsView(
  adminUserId: string | undefined,
  agentType?: string,
  timeRange?: string,
  metadata?: AuditLogMetadata
): Promise<void> {
  // Guard: Return early if no admin user present
  if (!adminUserId) return;

  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action_type: 'view_cache_analytics',
      target_type: 'system',  // Analytics views use 'system' target type
      target_id: agentType || 'all',
      details: {
        agent_type: agentType,
        time_range: timeRange,
        ...metadata,
      },
    });
  } catch (error) {
    // Silent fail - log to console but never throw to UI
    console.error('[AuditLogger] Failed to log cache analytics view:', error);
  }
}

/**
 * Performance metrics view logging
 * Logs when admin views performance/response time metrics
 *
 * @param adminUserId - UUID of the admin user performing action
 * @param agentType - Agent type being analyzed
 * @param timeRange - Time range for the view
 * @param metadata - Optional additional context
 *
 * @fires Asynchronously - never blocks execution
 * @error Silently fails - logs to console, never throws
 */
export async function logPerformanceMetricsView(
  adminUserId: string | undefined,
  agentType?: string,
  timeRange?: string,
  metadata?: AuditLogMetadata
): Promise<void> {
  // Guard: Return early if no admin user present
  if (!adminUserId) return;

  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action_type: 'view_performance_metrics',
      target_type: 'system',  // Performance metrics use 'system' target type
      target_id: agentType || 'all',
      details: {
        agent_type: agentType,
        time_range: timeRange,
        ...metadata,
      },
    });
  } catch (error) {
    // Silent fail - log to console but never throw to UI
    console.error('[AuditLogger] Failed to log performance metrics view:', error);
  }
}

/**
 * RAG quality view logging
 * Logs when admin views RAG quality/semantic similarity metrics
 *
 * @param adminUserId - UUID of the admin user performing action
 * @param agentType - Agent type being analyzed
 * @param timeRange - Time range for the view
 * @param metadata - Optional additional context
 *
 * @fires Asynchronously - never blocks execution
 * @error Silently fails - logs to console, never throws
 */
export async function logRAGQualityView(
  adminUserId: string | undefined,
  agentType?: string,
  timeRange?: string,
  metadata?: AuditLogMetadata
): Promise<void> {
  // Guard: Return early if no admin user present
  if (!adminUserId) return;

  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action_type: 'view_rag_quality',
      target_type: 'system',  // RAG quality views use 'system' target type
      target_id: agentType || 'all',
      details: {
        agent_type: agentType,
        time_range: timeRange,
        ...metadata,
      },
    });
  } catch (error) {
    // Silent fail - log to console but never throw to UI
    console.error('[AuditLogger] Failed to log RAG quality view:', error);
  }
}

/**
 * Handoff accuracy view logging
 * Logs when admin views agent handoff/routing accuracy metrics
 *
 * @param adminUserId - UUID of the admin user performing action
 * @param timeRange - Time range for the view
 * @param metadata - Optional additional context
 *
 * @fires Asynchronously - never blocks execution
 * @error Silently fails - logs to console, never throws
 */
export async function logHandoffAccuracyView(
  adminUserId: string | undefined,
  timeRange?: string,
  metadata?: AuditLogMetadata
): Promise<void> {
  // Guard: Return early if no admin user present
  if (!adminUserId) return;

  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action_type: 'view_handoff_accuracy',
      target_type: 'system',  // Handoff accuracy uses 'system' target type
      target_id: 'handoff_accuracy',
      details: {
        time_range: timeRange,
        ...metadata,
      },
    });
  } catch (error) {
    // Silent fail - log to console but never throw to UI
    console.error('[AuditLogger] Failed to log handoff accuracy view:', error);
  }
}

/**
 * User analytics view logging
 * Logs when admin views individual user analytics/conversation history
 *
 * @param adminUserId - UUID of the admin user performing action
 * @param userId - User ID being analyzed
 * @param timeRange - Time range for the view
 * @param metadata - Optional additional context
 *
 * @fires Asynchronously - never blocks execution
 * @error Silently fails - logs to console, never throws
 */
export async function logUserAnalyticsView(
  adminUserId: string | undefined,
  userId: string,
  timeRange?: string,
  metadata?: AuditLogMetadata
): Promise<void> {
  // Guard: Return early if no admin user present
  if (!adminUserId) return;

  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action_type: 'view_user_analytics',
      target_type: 'user',  // User analytics views use 'user' target type
      target_id: userId,
      details: {
        time_range: timeRange,
        ...metadata,
      },
    });
  } catch (error) {
    // Silent fail - log to console but never throw to UI
    console.error('[AuditLogger] Failed to log user analytics view:', error);
  }
}
