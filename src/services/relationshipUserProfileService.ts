/**
 * RIE Phase 1B: Relationship User Profile Service
 * CRUD for extended relationship profiles.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipUserProfile,
  RelationshipUserProfileInsert,
  RelationshipUserProfileUpdate,
} from "@/types/relationship-user-profile";

/**
 * Get the current user's relationship profile.
 */
export async function getMyProfile(): Promise<RelationshipUserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data as RelationshipUserProfile | null;
}

/**
 * Create a relationship profile for the current user.
 */
export async function createMyProfile(
  input: RelationshipUserProfileInsert
): Promise<RelationshipUserProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_user_profiles")
    .insert({
      user_id: user.id,
      love_languages: input.love_languages ?? [],
      attachment_style: input.attachment_style ?? null,
      communication_style: input.communication_style ?? null,
      preferred_check_in_day: input.preferred_check_in_day ?? "sunday",
      preferred_check_in_time: input.preferred_check_in_time ?? "20:00",
      relationship_goals: input.relationship_goals ?? [],
      relationship_start_date: input.relationship_start_date ?? null,
      relationship_type: input.relationship_type ?? "married",
      partner_resistance_type: input.partner_resistance_type ?? null,
      solo_stage: input.solo_stage ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipUserProfile;
}

/**
 * Update the current user's relationship profile.
 */
export async function updateMyProfile(
  updates: RelationshipUserProfileUpdate
): Promise<RelationshipUserProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_user_profiles")
    .update(updates)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipUserProfile;
}

/**
 * Upsert the profile (create if not exists, update if exists).
 */
export async function upsertMyProfile(
  input: RelationshipUserProfileInsert
): Promise<RelationshipUserProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_user_profiles")
    .upsert(
      {
        user_id: user.id,
        love_languages: input.love_languages ?? [],
        attachment_style: input.attachment_style ?? null,
        communication_style: input.communication_style ?? null,
        preferred_check_in_day: input.preferred_check_in_day ?? "sunday",
        preferred_check_in_time: input.preferred_check_in_time ?? "20:00",
        relationship_goals: input.relationship_goals ?? [],
        relationship_start_date: input.relationship_start_date ?? null,
        relationship_type: input.relationship_type ?? "married",
        partner_resistance_type: input.partner_resistance_type ?? null,
        solo_stage: input.solo_stage ?? null,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipUserProfile;
}
