// ============================================================================
// STATE BINDER SERVICE
// ============================================================================
// Service layer for the Full Binder experience.
// Provides access to complete state compliance binders (one per state).
// This is the "$100M feature" - a clean, readable binder for each state.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  StateCode,
  StateBinder,
  StateBinderOption,
  BinderSectionHeader,
} from '@/types/compliance';
import { STATE_NAMES } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface StateBinderRow {
  id: string;
  state_code: string;
  state_name: string;
  title: string;
  content: string;
  effective_date: string | null;
  last_updated: string;
  word_count: number | null;
  section_headers: BinderSectionHeader[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract section headers from markdown content
 * Parses ## and ### headers for TOC navigation
 */
export function extractSectionHeaders(content: string): BinderSectionHeader[] {
  const headers: BinderSectionHeader[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Match ## and ### headers
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim();
      const id = `section-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      headers.push({ id, title, level });
    }
  });

  return headers;
}

/**
 * Count words in markdown content
 */
export function countWords(content: string): number {
  // Remove markdown syntax and count words
  const plainText = content
    .replace(/#{1,6}\s+/g, '')  // Remove headers
    .replace(/\*\*|__|~~|`/g, '')  // Remove formatting
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Replace links with text
    .replace(/\n+/g, ' ')  // Replace newlines with spaces
    .trim();

  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Transform database row to StateBinder type
 */
function transformToStateBinder(row: StateBinderRow): StateBinder {
  return {
    id: row.id,
    state_code: row.state_code as StateCode,
    state_name: row.state_name,
    title: row.title,
    content: row.content,
    effective_date: row.effective_date,
    last_updated: row.last_updated,
    word_count: row.word_count,
    section_headers: row.section_headers || [],
    metadata: row.metadata || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ============================================================================
// BINDER FETCH FUNCTIONS
// ============================================================================

/**
 * Get a single state's complete binder
 * This is the primary function - returns ONE full document for a state
 */
export async function getStateBinder(stateCode: StateCode): Promise<StateBinder | null> {
  const { data, error } = await supabase
    .from('state_compliance_binders')
    .select('*')
    .eq('state_code', stateCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - binder doesn't exist for this state
      return null;
    }
    console.error('[StateBinderService] Error fetching binder:', error);
    throw error;
  }

  return data ? transformToStateBinder(data as StateBinderRow) : null;
}

/**
 * Get all available states with binder status
 * Returns a list of states with whether they have a binder available
 */
export async function getAvailableStates(): Promise<StateBinderOption[]> {
  // Get all states that have binders
  const { data, error } = await supabase
    .from('state_compliance_binders')
    .select('state_code, state_name, last_updated, word_count')
    .order('state_name');

  if (error) {
    console.error('[StateBinderService] Error fetching available states:', error);
    // Return all states with no binders on error (graceful degradation)
    return Object.entries(STATE_NAMES).map(([code, name]) => ({
      state_code: code as StateCode,
      state_name: name,
      has_binder: false,
    }));
  }

  // Create a map of states with binders
  const binderMap = new Map<string, { last_updated: string; word_count: number | null }>();
  (data || []).forEach((row: { state_code: string; state_name: string; last_updated: string; word_count: number | null }) => {
    binderMap.set(row.state_code, {
      last_updated: row.last_updated,
      word_count: row.word_count,
    });
  });

  // Return all states with binder status
  return Object.entries(STATE_NAMES)
    .map(([code, name]) => {
      const binderInfo = binderMap.get(code);
      return {
        state_code: code as StateCode,
        state_name: name,
        has_binder: !!binderInfo,
        last_updated: binderInfo?.last_updated,
        word_count: binderInfo?.word_count ?? undefined,
      };
    })
    .sort((a, b) => a.state_name.localeCompare(b.state_name));
}

/**
 * Get count of states with binders
 */
export async function getBinderCount(): Promise<number> {
  const { count, error } = await supabase
    .from('state_compliance_binders')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('[StateBinderService] Error counting binders:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Search binders by content
 * Full-text search across all binder content
 */
export async function searchBinders(query: string): Promise<StateBinder[]> {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from('state_compliance_binders')
    .select('*')
    .textSearch('content', query, { type: 'websearch' })
    .order('state_name')
    .limit(10);

  if (error) {
    // Fallback to ilike search if full-text search fails
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('state_compliance_binders')
      .select('*')
      .ilike('content', `%${query}%`)
      .order('state_name')
      .limit(10);

    if (fallbackError) {
      console.error('[StateBinderService] Error searching binders:', fallbackError);
      return [];
    }

    return (fallbackData || []).map((row) => transformToStateBinder(row as StateBinderRow));
  }

  return (data || []).map((row) => transformToStateBinder(row as StateBinderRow));
}

// ============================================================================
// BINDER MANAGEMENT FUNCTIONS (Admin)
// ============================================================================

/**
 * Create or update a state binder
 * Used by admin/scripts to populate binders from PDFs
 */
export async function upsertStateBinder(
  stateCode: StateCode,
  title: string,
  content: string,
  effectiveDate?: string,
  metadata?: Record<string, unknown>
): Promise<StateBinder> {
  const stateName = STATE_NAMES[stateCode];
  const sectionHeaders = extractSectionHeaders(content);
  const wordCount = countWords(content);

  const { data, error } = await supabase
    .from('state_compliance_binders')
    .upsert(
      {
        state_code: stateCode,
        state_name: stateName,
        title,
        content,
        effective_date: effectiveDate || null,
        word_count: wordCount,
        section_headers: sectionHeaders,
        metadata: metadata || {},
        last_updated: new Date().toISOString(),
      },
      {
        onConflict: 'state_code',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('[StateBinderService] Error upserting binder:', error);
    throw error;
  }

  return transformToStateBinder(data as StateBinderRow);
}

/**
 * Delete a state binder (admin only)
 */
export async function deleteStateBinder(stateCode: StateCode): Promise<void> {
  const { error } = await supabase
    .from('state_compliance_binders')
    .delete()
    .eq('state_code', stateCode);

  if (error) {
    console.error('[StateBinderService] Error deleting binder:', error);
    throw error;
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get binder statistics
 */
export async function getBinderStats(): Promise<{
  total_binders: number;
  total_word_count: number;
  avg_word_count: number;
  states_with_binders: string[];
  states_without_binders: string[];
}> {
  const { data, error } = await supabase
    .from('state_compliance_binders')
    .select('state_code, word_count');

  if (error) {
    console.error('[StateBinderService] Error fetching stats:', error);
    return {
      total_binders: 0,
      total_word_count: 0,
      avg_word_count: 0,
      states_with_binders: [],
      states_without_binders: Object.keys(STATE_NAMES),
    };
  }

  const statesWithBinders = (data || []).map((row: { state_code: string }) => row.state_code);
  const totalWordCount = (data || []).reduce(
    (sum: number, row: { word_count: number | null }) => sum + (row.word_count || 0),
    0
  );

  return {
    total_binders: data?.length || 0,
    total_word_count: totalWordCount,
    avg_word_count: data?.length ? Math.round(totalWordCount / data.length) : 0,
    states_with_binders: statesWithBinders,
    states_without_binders: Object.keys(STATE_NAMES).filter(
      (code) => !statesWithBinders.includes(code)
    ),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getStateBinder,
  getAvailableStates,
  getBinderCount,
  searchBinders,
  upsertStateBinder,
  deleteStateBinder,
  getBinderStats,
  extractSectionHeaders,
  countWords,
};
