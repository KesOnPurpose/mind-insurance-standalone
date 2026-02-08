/**
 * RIE Phase 1C: Daily Pulse Service
 * CRUD for quick daily emotional check-ins.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipDailyPulse,
  DailyPulseInsert,
  DailyPulseUpdate,
} from "@/types/relationship-daily-pulse";

/**
 * Get today's pulse for the current user (if it exists).
 */
export async function getTodaysPulse(): Promise<RelationshipDailyPulse | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("relationship_daily_pulses")
    .select("*")
    .eq("user_id", user.id)
    .eq("pulse_date", today)
    .maybeSingle();

  if (error) throw error;
  return data as RelationshipDailyPulse | null;
}

/**
 * Get recent pulses for the current user.
 */
export async function getRecentPulses(
  days = 14
): Promise<RelationshipDailyPulse[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("relationship_daily_pulses")
    .select("*")
    .eq("user_id", user.id)
    .gte("pulse_date", startDate.toISOString().split("T")[0])
    .order("pulse_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RelationshipDailyPulse[];
}

/**
 * Submit today's pulse (upsert — one per day).
 */
export async function submitPulse(
  input: DailyPulseInsert
): Promise<RelationshipDailyPulse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = input.pulse_date ?? new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("relationship_daily_pulses")
    .upsert(
      {
        user_id: user.id,
        partnership_id: input.partnership_id ?? null,
        pulse_date: today,
        mood_rating: input.mood_rating,
        connection_rating: input.connection_rating,
        micro_moment: input.micro_moment ?? null,
        gratitude_note: input.gratitude_note ?? null,
        flagged_kpis: input.flagged_kpis ?? [],
        shared_with_partner: input.shared_with_partner ?? true,
      },
      { onConflict: "user_id,pulse_date" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipDailyPulse;
}

/**
 * Update today's pulse.
 */
export async function updatePulse(
  id: string,
  updates: DailyPulseUpdate
): Promise<RelationshipDailyPulse> {
  const { data, error } = await supabase
    .from("relationship_daily_pulses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipDailyPulse;
}

/**
 * Get partner's shared pulses for the past N days.
 */
export async function getPartnerPulses(
  partnershipId: string,
  days = 14
): Promise<RelationshipDailyPulse[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("relationship_daily_pulses")
    .select("*")
    .eq("partnership_id", partnershipId)
    .eq("shared_with_partner", true)
    .neq("user_id", user.id)
    .gte("pulse_date", startDate.toISOString().split("T")[0])
    .order("pulse_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RelationshipDailyPulse[];
}
