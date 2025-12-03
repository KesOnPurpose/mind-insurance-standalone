// ============================================================================
// ERROR TRACKER SERVICE
// ============================================================================
// Centralized error logging for analytics dashboard error_rate metric
// Logs errors to agent_errors table for real-time monitoring
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

export type AgentType = 'nette' | 'mio' | 'me';
export type ErrorType = 'llm_error' | 'rag_error' | 'network_error' | 'validation_error' | 'unknown';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface TrackErrorOptions {
  agentType: AgentType;
  errorType: ErrorType;
  errorMessage: string;
  severity?: ErrorSeverity;
  errorCode?: string;
  stackTrace?: string;
  conversationId?: string;
  requestData?: Record<string, any>;
}

/**
 * Track an error in the agent_errors table for analytics
 * Fire-and-forget - never throws, only logs to console on failure
 *
 * @param options Error tracking options
 * @returns Promise<void> - resolves silently
 */
export async function trackError(options: TrackErrorOptions): Promise<void> {
  try {
    // Get current user (may be null if error before auth)
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('agent_errors').insert({
      user_id: user?.id || null,
      agent_type: options.agentType,
      error_type: options.errorType,
      error_message: options.errorMessage,
      severity: options.severity || 'medium',
      error_code: options.errorCode,
      stack_trace: options.stackTrace,
      conversation_id: options.conversationId,
      request_data: options.requestData || {},
    });

    // Silent success - error logged
  } catch (error) {
    // Silent fail - log to console but never throw to prevent error loops
    console.error('[ErrorTracker] Failed to log error:', error);
  }
}

/**
 * Resolve an error by marking it as resolved
 *
 * @param errorId UUID of the error to resolve
 * @returns Promise<void>
 */
export async function resolveError(errorId: string): Promise<void> {
  try {
    await supabase
      .from('agent_errors')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', errorId);
  } catch (error) {
    console.error('[ErrorTracker] Failed to resolve error:', error);
  }
}

/**
 * Higher-level wrapper for tracking chat errors
 */
export function trackChatError(
  agentType: AgentType,
  error: Error,
  conversationId?: string,
  requestData?: Record<string, any>
): Promise<void> {
  return trackError({
    agentType,
    errorType: 'llm_error',
    errorMessage: error.message,
    severity: 'high',
    stackTrace: error.stack,
    conversationId,
    requestData,
  });
}

/**
 * Higher-level wrapper for tracking RAG errors
 */
export function trackRAGError(
  agentType: AgentType,
  error: Error,
  conversationId?: string,
  requestData?: Record<string, any>
): Promise<void> {
  return trackError({
    agentType,
    errorType: 'rag_error',
    errorMessage: error.message,
    severity: 'medium',
    stackTrace: error.stack,
    conversationId,
    requestData,
  });
}

/**
 * Higher-level wrapper for tracking network errors
 */
export function trackNetworkError(
  agentType: AgentType,
  error: Error,
  requestData?: Record<string, any>
): Promise<void> {
  return trackError({
    agentType,
    errorType: 'network_error',
    errorMessage: error.message,
    severity: 'medium',
    stackTrace: error.stack,
    requestData,
  });
}

/**
 * Higher-level wrapper for tracking validation errors (lower severity)
 */
export function trackValidationError(
  agentType: AgentType,
  errorMessage: string,
  requestData?: Record<string, any>
): Promise<void> {
  return trackError({
    agentType,
    errorType: 'validation_error',
    errorMessage,
    severity: 'low',
    requestData,
  });
}
