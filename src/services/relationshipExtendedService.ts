/**
 * RIE Phases 3–6: Extended Services
 * Solo profiles, safe space, learning, date nights, journal.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipSoloProfile,
  SoloProfileInsert,
  SoloProfileUpdate,
  RelationshipSafeSpaceSession,
  SafeSpaceSessionInsert,
  SafeSpaceSessionUpdate,
  RelationshipLearningModule,
  RelationshipLearningProgress,
  LearningProgressInsert,
  LearningProgressUpdate,
  LearningModuleWithProgress,
  RelationshipDateNight,
  DateNightInsert,
  DateNightUpdate,
  RelationshipJournalEntry,
  JournalEntryInsert,
  JournalEntryUpdate,
} from "@/types/relationship-extended";

// ============================================================================
// Phase 3: Solo User Protocol
// ============================================================================

export async function getMySoloProfile(): Promise<RelationshipSoloProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_solo_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data as RelationshipSoloProfile | null;
}

export async function upsertSoloProfile(
  input: SoloProfileInsert
): Promise<RelationshipSoloProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_solo_profiles")
    .upsert(
      {
        user_id: user.id,
        resistance_type: input.resistance_type ?? null,
        solo_stage: input.solo_stage ?? 1,
        self_assessment_mode: input.self_assessment_mode ?? true,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipSoloProfile;
}

export async function updateSoloProfile(
  updates: SoloProfileUpdate
): Promise<RelationshipSoloProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_solo_profiles")
    .update(updates)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipSoloProfile;
}

// ============================================================================
// Phase 4: Safe Space Conversations
// ============================================================================

export async function getSafeSpaceSessions(
  partnershipId: string
): Promise<RelationshipSafeSpaceSession[]> {
  const { data, error } = await supabase
    .from("relationship_safe_space_sessions")
    .select("*")
    .eq("partnership_id", partnershipId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RelationshipSafeSpaceSession[];
}

export async function createSafeSpaceSession(
  input: SafeSpaceSessionInsert
): Promise<RelationshipSafeSpaceSession> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_safe_space_sessions")
    .insert({
      partnership_id: input.partnership_id,
      initiated_by: user.id,
      topic: input.topic,
      category: input.category ?? "general",
      prompts_used: input.prompts_used ?? [],
      related_kpis: input.related_kpis ?? [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipSafeSpaceSession;
}

export async function updateSafeSpaceSession(
  id: string,
  updates: SafeSpaceSessionUpdate
): Promise<RelationshipSafeSpaceSession> {
  const { data, error } = await supabase
    .from("relationship_safe_space_sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipSafeSpaceSession;
}

// ============================================================================
// Phase 5: Learning Hub
// ============================================================================

export async function getLearningModules(): Promise<RelationshipLearningModule[]> {
  const { data, error } = await supabase
    .from("relationship_learning_modules")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("display_order");

  if (error) throw error;
  return (data ?? []) as RelationshipLearningModule[];
}

export async function getMyLearningProgress(): Promise<RelationshipLearningProgress[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_learning_progress")
    .select("*")
    .eq("user_id", user.id);

  if (error) throw error;
  return (data ?? []) as RelationshipLearningProgress[];
}

export async function getModulesWithProgress(): Promise<LearningModuleWithProgress[]> {
  const [modules, progress] = await Promise.all([
    getLearningModules(),
    getMyLearningProgress(),
  ]);

  const progressMap = new Map(progress.map((p) => [p.module_id, p]));

  return modules.map((m) => ({
    ...m,
    progress: progressMap.get(m.id) ?? null,
  }));
}

export async function upsertLearningProgress(
  input: LearningProgressInsert
): Promise<RelationshipLearningProgress> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_learning_progress")
    .upsert(
      {
        user_id: user.id,
        module_id: input.module_id,
        status: input.status ?? "in_progress",
        progress_percent: input.progress_percent ?? 0,
      },
      { onConflict: "user_id,module_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipLearningProgress;
}

export async function updateLearningProgress(
  id: string,
  updates: LearningProgressUpdate
): Promise<RelationshipLearningProgress> {
  const { data, error } = await supabase
    .from("relationship_learning_progress")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipLearningProgress;
}

// ============================================================================
// Phase 6: Date Night Generator
// ============================================================================

export async function getMyDateNights(
  limit = 20
): Promise<RelationshipDateNight[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_date_nights")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RelationshipDateNight[];
}

export async function createDateNight(
  input: DateNightInsert
): Promise<RelationshipDateNight> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_date_nights")
    .insert({
      user_id: user.id,
      partnership_id: input.partnership_id ?? null,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? "romantic",
      target_kpis: input.target_kpis ?? [],
      budget_range: input.budget_range ?? "free",
      scheduled_for: input.scheduled_for ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipDateNight;
}

export async function updateDateNight(
  id: string,
  updates: DateNightUpdate
): Promise<RelationshipDateNight> {
  const { data, error } = await supabase
    .from("relationship_date_nights")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipDateNight;
}

// ============================================================================
// Phase 6: Relationship Journal
// ============================================================================

export async function getMyJournalEntries(
  limit = 30
): Promise<RelationshipJournalEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RelationshipJournalEntry[];
}

export async function createJournalEntry(
  input: JournalEntryInsert
): Promise<RelationshipJournalEntry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_journal_entries")
    .insert({
      user_id: user.id,
      partnership_id: input.partnership_id ?? null,
      entry_type: input.entry_type ?? "reflection",
      title: input.title ?? null,
      content: input.content,
      mood_rating: input.mood_rating ?? null,
      related_kpis: input.related_kpis ?? [],
      is_private: input.is_private ?? true,
      shared_with_partner: input.shared_with_partner ?? false,
      prompt_used: input.prompt_used ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipJournalEntry;
}

export async function updateJournalEntry(
  id: string,
  updates: JournalEntryUpdate
): Promise<RelationshipJournalEntry> {
  const { data, error } = await supabase
    .from("relationship_journal_entries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipJournalEntry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("relationship_journal_entries")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Get partner's shared journal entries.
 */
export async function getPartnerSharedEntries(
  partnershipId: string,
  limit = 20
): Promise<RelationshipJournalEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_journal_entries")
    .select("*")
    .eq("partnership_id", partnershipId)
    .eq("shared_with_partner", true)
    .eq("is_private", false)
    .neq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RelationshipJournalEntry[];
}
