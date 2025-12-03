import { supabase } from '@/integrations/supabase/client';

export interface DeprecationMapping {
  deprecated_tactic_id: string;
  replacement_tactic_id: string;
  deprecation_reason: string;
  migration_strategy: 'auto_migrate' | 'manual_review' | 'show_both';
}

/**
 * Automatically migrate user progress from deprecated tactics to their replacements
 *
 * Strategy:
 * - Finds all progress on deprecated tactics for the user
 * - Checks if replacement tactic already has progress
 * - If not, copies progress from deprecated to replacement
 * - Preserves notes and timestamps
 *
 * @param userId - User ID to migrate progress for
 * @returns Number of tactics migrated
 */
export async function migrateUserProgress(userId: string): Promise<number> {
  // Get all deprecation mappings with auto_migrate strategy
  const { data: mappings, error: mappingError } = await supabase
    .from('gh_tactic_deprecation_map')
    .select('*')
    .eq('migration_strategy', 'auto_migrate');

  if (mappingError || !mappings) {
    console.error('Error fetching deprecation mappings:', mappingError);
    return 0;
  }

  let migratedCount = 0;

  for (const mapping of mappings) {
    // Check if user has progress on deprecated tactic
    const { data: oldProgress } = await supabase
      .from('gh_user_tactic_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('tactic_id', mapping.deprecated_tactic_id)
      .single();

    if (!oldProgress) continue; // No progress on deprecated tactic

    // Check if replacement tactic already has progress
    const { data: newProgress } = await supabase
      .from('gh_user_tactic_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('tactic_id', mapping.replacement_tactic_id)
      .single();

    if (newProgress) continue; // Replacement already has progress, don't overwrite

    // Migrate progress to replacement tactic
    const { error: insertError } = await supabase
      .from('gh_user_tactic_progress')
      .insert({
        user_id: userId,
        tactic_id: mapping.replacement_tactic_id,
        status: oldProgress.status,
        started_at: oldProgress.started_at,
        completed_at: oldProgress.completed_at,
        notes: oldProgress.notes
          ? `Migrated from deprecated tactic: ${oldProgress.notes}`
          : `Migrated from ${mapping.deprecated_tactic_id}`,
      });

    if (!insertError) {
      migratedCount++;
    } else {
      console.error(`Error migrating ${mapping.deprecated_tactic_id}:`, insertError);
    }
  }

  return migratedCount;
}

/**
 * Get deprecation information for a list of tactic IDs
 *
 * @param tacticIds - Array of tactic IDs to check
 * @returns Array of deprecation mappings for any deprecated tactics in the list
 */
export async function getDeprecatedTactics(
  tacticIds: string[]
): Promise<DeprecationMapping[]> {
  const { data, error } = await supabase
    .from('gh_tactic_deprecation_map')
    .select('*')
    .in('deprecated_tactic_id', tacticIds);

  if (error) {
    console.error('Error fetching deprecated tactics:', error);
    return [];
  }

  return data || [];
}

/**
 * Get the replacement tactic for a deprecated tactic
 *
 * @param deprecatedTacticId - ID of the deprecated tactic
 * @returns Deprecation mapping if exists, null otherwise
 */
export async function getReplacementTactic(
  deprecatedTacticId: string
): Promise<DeprecationMapping | null> {
  const { data, error } = await supabase
    .from('gh_tactic_deprecation_map')
    .select('*')
    .eq('deprecated_tactic_id', deprecatedTacticId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Check if a tactic has been deprecated
 *
 * @param tacticId - Tactic ID to check
 * @returns True if deprecated, false otherwise
 */
export async function isTacticDeprecated(tacticId: string): Promise<boolean> {
  const mapping = await getReplacementTactic(tacticId);
  return mapping !== null;
}
