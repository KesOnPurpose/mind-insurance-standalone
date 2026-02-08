/**
 * RIE Phase 2A: Season Service
 * Manages season catalog lookups and user-season assignments.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipSeasonCatalog,
  RelationshipUserSeason,
  UserSeasonInsert,
  UserSeasonUpdate,
  UserSeasonWithCatalog,
  SeasonCategory,
  LifeStage,
  SeasonSignal,
} from "@/types/relationship-seasons";

// ============================================================================
// Season Catalog (read-only for users)
// ============================================================================

/**
 * Get all active seasons, optionally filtered by category.
 */
export async function getSeasonCatalog(
  category?: SeasonCategory
): Promise<RelationshipSeasonCatalog[]> {
  let query = supabase
    .from("relationship_season_catalog")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("display_order");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RelationshipSeasonCatalog[];
}

/**
 * Get a single season by ID.
 */
export async function getSeasonById(
  id: string
): Promise<RelationshipSeasonCatalog | null> {
  const { data, error } = await supabase
    .from("relationship_season_catalog")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as RelationshipSeasonCatalog | null;
}

/**
 * Get seasons filtered by life stage.
 * Returns seasons matching the life stage + all 'any' life stage seasons.
 */
export async function getSeasonsByLifeStage(
  lifeStage: LifeStage
): Promise<RelationshipSeasonCatalog[]> {
  const { data, error } = await supabase
    .from("relationship_season_catalog")
    .select("*")
    .eq("is_active", true)
    .or(`life_stage.eq.${lifeStage},life_stage.eq.any`)
    .order("category")
    .order("display_order");

  if (error) throw error;
  return (data ?? []) as RelationshipSeasonCatalog[];
}

/**
 * Get seasons filtered by both life stage and category.
 */
export async function getSeasonsByLifeStageAndCategory(
  lifeStage: LifeStage,
  category: SeasonCategory
): Promise<RelationshipSeasonCatalog[]> {
  const { data, error } = await supabase
    .from("relationship_season_catalog")
    .select("*")
    .eq("is_active", true)
    .eq("category", category)
    .or(`life_stage.eq.${lifeStage},life_stage.eq.any`)
    .order("display_order");

  if (error) throw error;
  return (data ?? []) as RelationshipSeasonCatalog[];
}

/**
 * Combined catalog filter with optional life stage and category.
 */
export async function getFilteredCatalog(
  lifeStage?: LifeStage,
  category?: SeasonCategory
): Promise<RelationshipSeasonCatalog[]> {
  let query = supabase
    .from("relationship_season_catalog")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("display_order");

  if (lifeStage && lifeStage !== "any") {
    query = query.or(`life_stage.eq.${lifeStage},life_stage.eq.any`);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RelationshipSeasonCatalog[];
}

// ============================================================================
// User Seasons
// ============================================================================

/**
 * Get the current user's active seasons (ended_at IS NULL).
 */
export async function getMyActiveSeasons(): Promise<UserSeasonWithCatalog[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_user_seasons")
    .select("*, season:relationship_season_catalog(*)")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .order("started_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as UserSeasonWithCatalog[];
}

/**
 * Get all of the current user's season history.
 */
export async function getMySeasonHistory(): Promise<UserSeasonWithCatalog[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_user_seasons")
    .select("*, season:relationship_season_catalog(*)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as UserSeasonWithCatalog[];
}

/**
 * Assign a season to the current user.
 */
export async function addSeason(
  input: UserSeasonInsert
): Promise<RelationshipUserSeason> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_user_seasons")
    .insert({
      user_id: user.id,
      season_id: input.season_id,
      partnership_id: input.partnership_id ?? null,
      status: input.status ?? "current",
      healing_progress: input.healing_progress ?? 50,
      started_at: input.started_at ?? new Date().toISOString(),
      notes: input.notes ?? null,
      intensity: input.intensity ?? 3,
      is_private: input.is_private ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipUserSeason;
}

/**
 * Bulk insert multiple seasons at once (for onboarding wizard).
 */
export async function addUserSeasonBatch(
  inputs: UserSeasonInsert[]
): Promise<RelationshipUserSeason[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const rows = inputs.map((input) => ({
    user_id: user.id,
    season_id: input.season_id,
    partnership_id: input.partnership_id ?? null,
    status: input.status ?? "current",
    healing_progress: input.healing_progress ?? 50,
    started_at: input.started_at ?? new Date().toISOString(),
    notes: input.notes ?? null,
    intensity: input.intensity ?? 3,
    is_private: input.is_private ?? false,
  }));

  const { data, error } = await supabase
    .from("relationship_user_seasons")
    .insert(rows)
    .select();

  if (error) throw error;
  return (data ?? []) as RelationshipUserSeason[];
}

/**
 * Update healing progress for a specific user season.
 */
export async function updateHealingProgress(
  userSeasonId: string,
  progress: number
): Promise<RelationshipUserSeason> {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  const { data, error } = await supabase
    .from("relationship_user_seasons")
    .update({ healing_progress: clamped })
    .eq("id", userSeasonId)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipUserSeason;
}

/**
 * End (close) a user season.
 */
export async function endSeason(
  userSeasonId: string,
  updates?: UserSeasonUpdate
): Promise<RelationshipUserSeason> {
  const { data, error } = await supabase
    .from("relationship_user_seasons")
    .update({
      ended_at: new Date().toISOString(),
      ...updates,
    })
    .eq("id", userSeasonId)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipUserSeason;
}

/**
 * Update a user season (notes, intensity, status, healing_progress).
 */
export async function updateUserSeason(
  userSeasonId: string,
  updates: UserSeasonUpdate
): Promise<RelationshipUserSeason> {
  const { data, error } = await supabase
    .from("relationship_user_seasons")
    .update(updates)
    .eq("id", userSeasonId)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipUserSeason;
}

/**
 * Delete a user season entry.
 */
export async function removeUserSeason(
  userSeasonId: string
): Promise<void> {
  const { error } = await supabase
    .from("relationship_user_seasons")
    .delete()
    .eq("id", userSeasonId);

  if (error) throw error;
}

/**
 * Get user seasons filtered by status.
 */
export async function getUserSeasonsByStatus(
  status: "current" | "past_healed" | "past_unhealed"
): Promise<UserSeasonWithCatalog[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_user_seasons")
    .select("*, season:relationship_season_catalog(*)")
    .eq("user_id", user.id)
    .eq("status", status)
    .order("started_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as UserSeasonWithCatalog[];
}

// ============================================================================
// Season Signals
// ============================================================================

/**
 * Get active (non-dismissed) season signals for the current user.
 */
export async function getSeasonSignals(): Promise<SeasonSignal[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_season_signals")
    .select("*")
    .eq("user_id", user.id)
    .eq("dismissed", false)
    .order("detected_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SeasonSignal[];
}

/**
 * Dismiss a season signal.
 */
export async function dismissSignal(signalId: string): Promise<void> {
  const { error } = await supabase
    .from("relationship_season_signals")
    .update({ dismissed: true })
    .eq("id", signalId);

  if (error) throw error;
}
