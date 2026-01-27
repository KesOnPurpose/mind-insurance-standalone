// ============================================================================
// LOCAL BINDER SERVICE
// ============================================================================
// Service layer for city and county-level compliance binders.
// Provides access to local compliance binders (system-level, pre-populated).
// Supports both cities (Pittsburgh, Linden) and counties (Queens County).
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  StateCode,
  LocalBinder,
  LocalBinderOption,
  LocationType,
  BinderSectionHeader,
} from '@/types/compliance';
import { STATE_NAMES } from '@/types/compliance';

// ============================================================================
// TYPES
// ============================================================================

interface LocalBinderRow {
  id: string;
  location_name: string;
  location_type: LocationType;
  state_code: string;
  title: string;
  content: string;
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
 * Transform database row to LocalBinder type
 */
function transformToLocalBinder(row: LocalBinderRow): LocalBinder {
  return {
    id: row.id,
    location_name: row.location_name,
    location_type: row.location_type,
    state_code: row.state_code as StateCode,
    title: row.title,
    content: row.content,
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
 * Get all local binders
 * Optionally filter by state code
 */
export async function getLocalBinders(stateCode?: StateCode): Promise<LocalBinder[]> {
  let query = supabase
    .from('local_compliance_binders')
    .select('*')
    .order('location_name');

  if (stateCode) {
    query = query.eq('state_code', stateCode);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[LocalBinderService] Error fetching local binders:', error);
    return [];
  }

  return (data || []).map((row) => transformToLocalBinder(row as LocalBinderRow));
}

/**
 * Get a single local binder by location name and state code
 */
export async function getLocalBinder(
  locationName: string,
  stateCode: StateCode
): Promise<LocalBinder | null> {
  const { data, error } = await supabase
    .from('local_compliance_binders')
    .select('*')
    .eq('location_name', locationName)
    .eq('state_code', stateCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[LocalBinderService] Error fetching local binder:', error);
    throw error;
  }

  return data ? transformToLocalBinder(data as LocalBinderRow) : null;
}

/**
 * Get a single local binder by ID
 */
export async function getLocalBinderById(id: string): Promise<LocalBinder | null> {
  const { data, error } = await supabase
    .from('local_compliance_binders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[LocalBinderService] Error fetching local binder by ID:', error);
    throw error;
  }

  return data ? transformToLocalBinder(data as LocalBinderRow) : null;
}

/**
 * Get all local binders for a specific state
 * Returns cities and counties within the state
 */
export async function getLocationsForState(stateCode: StateCode): Promise<LocalBinder[]> {
  const { data, error } = await supabase
    .from('local_compliance_binders')
    .select('*')
    .eq('state_code', stateCode)
    .order('location_type')
    .order('location_name');

  if (error) {
    console.error('[LocalBinderService] Error fetching locations for state:', error);
    return [];
  }

  return (data || []).map((row) => transformToLocalBinder(row as LocalBinderRow));
}

/**
 * Get all locations that have binders
 * Returns a summary list for navigation/selection
 */
export async function getLocationsWithBinders(): Promise<LocalBinderOption[]> {
  const { data, error } = await supabase
    .from('local_compliance_binders')
    .select('location_name, location_type, state_code, word_count')
    .order('state_code')
    .order('location_name');

  if (error) {
    console.error('[LocalBinderService] Error fetching locations with binders:', error);
    return [];
  }

  return (data || []).map((row: { location_name: string; location_type: LocationType; state_code: string; word_count: number | null }) => ({
    location_name: row.location_name,
    location_type: row.location_type,
    state_code: row.state_code as StateCode,
    state_name: STATE_NAMES[row.state_code as StateCode] || row.state_code,
    word_count: row.word_count ?? undefined,
  }));
}

/**
 * Get states that have local binders available
 * Returns unique list of state codes with local content
 */
export async function getStatesWithLocalBinders(): Promise<StateCode[]> {
  const { data, error } = await supabase
    .from('local_compliance_binders')
    .select('state_code');

  if (error) {
    console.error('[LocalBinderService] Error fetching states with local binders:', error);
    return [];
  }

  // Get unique state codes
  const uniqueStates = new Set((data || []).map((row: { state_code: string }) => row.state_code));
  return Array.from(uniqueStates) as StateCode[];
}

/**
 * Check if a state has any local binders
 */
export async function hasLocalBinders(stateCode: StateCode): Promise<boolean> {
  const { count, error } = await supabase
    .from('local_compliance_binders')
    .select('*', { count: 'exact', head: true })
    .eq('state_code', stateCode);

  if (error) {
    console.error('[LocalBinderService] Error checking local binders:', error);
    return false;
  }

  return (count || 0) > 0;
}

/**
 * Get count of local binders
 * Optionally filter by state or location type
 */
export async function getLocalBinderCount(
  stateCode?: StateCode,
  locationType?: LocationType
): Promise<number> {
  let query = supabase
    .from('local_compliance_binders')
    .select('*', { count: 'exact', head: true });

  if (stateCode) {
    query = query.eq('state_code', stateCode);
  }

  if (locationType) {
    query = query.eq('location_type', locationType);
  }

  const { count, error } = await query;

  if (error) {
    console.error('[LocalBinderService] Error counting local binders:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Search local binders by content
 */
export async function searchLocalBinders(
  query: string,
  stateCode?: StateCode
): Promise<LocalBinder[]> {
  if (!query || query.length < 2) return [];

  let dbQuery = supabase
    .from('local_compliance_binders')
    .select('*')
    .ilike('content', `%${query}%`)
    .order('location_name')
    .limit(10);

  if (stateCode) {
    dbQuery = dbQuery.eq('state_code', stateCode);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error('[LocalBinderService] Error searching local binders:', error);
    return [];
  }

  return (data || []).map((row) => transformToLocalBinder(row as LocalBinderRow));
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get local binder statistics
 */
export async function getLocalBinderStats(): Promise<{
  total_binders: number;
  total_word_count: number;
  cities_count: number;
  counties_count: number;
  states_count: number;
  states_covered: StateCode[];
}> {
  const { data, error } = await supabase
    .from('local_compliance_binders')
    .select('state_code, location_type, word_count');

  if (error) {
    console.error('[LocalBinderService] Error fetching stats:', error);
    return {
      total_binders: 0,
      total_word_count: 0,
      cities_count: 0,
      counties_count: 0,
      states_count: 0,
      states_covered: [],
    };
  }

  const stateSet = new Set<StateCode>();
  let citiesCount = 0;
  let countiesCount = 0;
  let statesCount = 0;
  let totalWordCount = 0;

  (data || []).forEach((row: { state_code: string; location_type: LocationType; word_count: number | null }) => {
    stateSet.add(row.state_code as StateCode);
    totalWordCount += row.word_count || 0;
    if (row.location_type === 'city') {
      citiesCount++;
    } else if (row.location_type === 'county') {
      countiesCount++;
    } else if (row.location_type === 'state') {
      statesCount++;
    }
  });

  return {
    total_binders: data?.length || 0,
    total_word_count: totalWordCount,
    cities_count: citiesCount,
    counties_count: countiesCount,
    states_count: statesCount,
    states_covered: Array.from(stateSet),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getLocalBinders,
  getLocalBinder,
  getLocalBinderById,
  getLocationsForState,
  getLocationsWithBinders,
  getStatesWithLocalBinders,
  hasLocalBinders,
  getLocalBinderCount,
  searchLocalBinders,
  getLocalBinderStats,
};
