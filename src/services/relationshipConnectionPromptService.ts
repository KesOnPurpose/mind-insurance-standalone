/**
 * RKPI Module: Connection Prompt Service
 * Manages relationship connection prompts (seed data, weekly suggestions).
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipConnectionPrompt,
  PromptCategory,
  IntimacyLevel,
  RelationshipKPIName,
  PromptAudience,
  KidAgeRange,
} from "@/types/relationship-kpis";

/**
 * Get all active connection prompts.
 */
export async function getActivePrompts(): Promise<RelationshipConnectionPrompt[]> {
  const { data, error } = await supabase
    .from("relationship_connection_prompts")
    .select("*")
    .eq("is_active", true)
    .order("prompt_category");

  if (error) throw error;
  return (data ?? []) as RelationshipConnectionPrompt[];
}

/**
 * Get prompts filtered by category.
 */
export async function getPromptsByCategory(
  category: PromptCategory
): Promise<RelationshipConnectionPrompt[]> {
  const { data, error } = await supabase
    .from("relationship_connection_prompts")
    .select("*")
    .eq("is_active", true)
    .eq("prompt_category", category)
    .order("intimacy_level");

  if (error) throw error;
  return (data ?? []) as RelationshipConnectionPrompt[];
}

/**
 * Get prompts filtered by intimacy level.
 */
export async function getPromptsByIntimacyLevel(
  level: IntimacyLevel
): Promise<RelationshipConnectionPrompt[]> {
  const { data, error } = await supabase
    .from("relationship_connection_prompts")
    .select("*")
    .eq("is_active", true)
    .eq("intimacy_level", level)
    .order("prompt_category");

  if (error) throw error;
  return (data ?? []) as RelationshipConnectionPrompt[];
}

/**
 * Get prompts relevant to a specific KPI (for post-check-in suggestions).
 */
export async function getPromptsForKPI(
  kpiName: RelationshipKPIName
): Promise<RelationshipConnectionPrompt[]> {
  const { data, error } = await supabase
    .from("relationship_connection_prompts")
    .select("*")
    .eq("is_active", true)
    .eq("focus_kpi", kpiName);

  if (error) throw error;
  return (data ?? []) as RelationshipConnectionPrompt[];
}

/**
 * Get a random prompt for the weekly dashboard widget.
 */
export async function getRandomPrompt(): Promise<RelationshipConnectionPrompt | null> {
  const prompts = await getActivePrompts();
  if (prompts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex];
}

/**
 * Get a random prompt targeted to the user's lowest-scoring KPI.
 * Falls back to a random prompt if no KPI-specific prompts exist.
 */
export async function getTargetedPrompt(
  lowestKpi: RelationshipKPIName | null
): Promise<RelationshipConnectionPrompt | null> {
  if (!lowestKpi) return getRandomPrompt();

  const kpiPrompts = await getPromptsForKPI(lowestKpi);
  if (kpiPrompts.length > 0) {
    const randomIndex = Math.floor(Math.random() * kpiPrompts.length);
    return kpiPrompts[randomIndex];
  }

  return getRandomPrompt();
}

/**
 * Get a random prompt matching the given filters (used by slot machine UI).
 */
export async function getFilteredRandomPrompt(filters: {
  audience: PromptAudience;
  category?: PromptCategory;
  intimacyLevel?: IntimacyLevel;
  kidAgeRange?: KidAgeRange;
}): Promise<RelationshipConnectionPrompt | null> {
  let query = supabase
    .from("relationship_connection_prompts")
    .select("*")
    .eq("is_active", true)
    .eq("audience", filters.audience);

  if (filters.category) query = query.eq("prompt_category", filters.category);
  if (filters.intimacyLevel) query = query.eq("intimacy_level", filters.intimacyLevel);
  if (filters.kidAgeRange) query = query.eq("kid_age_range", filters.kidAgeRange);

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return null;

  return data[Math.floor(Math.random() * data.length)] as RelationshipConnectionPrompt;
}
