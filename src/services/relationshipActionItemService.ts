/**
 * RKPI Module: Action Item Service
 * Manages relationship action items from check-ins.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipActionItem,
  RelationshipActionItemInsert,
  RelationshipActionItemUpdate,
} from "@/types/relationship-kpis";

/**
 * Get all action items for a specific check-in.
 */
export async function getActionItemsForCheckIn(
  checkInId: string
): Promise<RelationshipActionItem[]> {
  const { data, error } = await supabase
    .from("relationship_action_items")
    .select("*")
    .eq("check_in_id", checkInId)
    .order("created_at");

  if (error) throw error;
  return (data ?? []) as RelationshipActionItem[];
}

/**
 * Get all incomplete (pending) action items for the current user.
 */
export async function getPendingActionItems(): Promise<RelationshipActionItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_action_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RelationshipActionItem[];
}

/**
 * Create a new action item.
 */
export async function createActionItem(
  input: RelationshipActionItemInsert
): Promise<RelationshipActionItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_action_items")
    .insert({
      check_in_id: input.check_in_id,
      user_id: user.id,
      item_text: input.item_text,
      assigned_to: input.assigned_to ?? "self",
      related_kpi: input.related_kpi ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipActionItem;
}

/**
 * Batch create action items for a check-in.
 */
export async function batchCreateActionItems(
  checkInId: string,
  items: Array<{
    text: string;
    assignedTo?: string;
    relatedKpi?: string | null;
  }>
): Promise<RelationshipActionItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (items.length === 0) return [];

  const rows = items.map((item) => ({
    check_in_id: checkInId,
    user_id: user.id,
    item_text: item.text,
    assigned_to: item.assignedTo ?? "self",
    related_kpi: item.relatedKpi ?? null,
  }));

  const { data, error } = await supabase
    .from("relationship_action_items")
    .insert(rows)
    .select();

  if (error) throw error;
  return (data ?? []) as RelationshipActionItem[];
}

/**
 * Update an action item.
 */
export async function updateActionItem(
  actionItemId: string,
  updates: RelationshipActionItemUpdate
): Promise<RelationshipActionItem> {
  const { data, error } = await supabase
    .from("relationship_action_items")
    .update(updates)
    .eq("id", actionItemId)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipActionItem;
}

/**
 * Toggle an action item's completion status.
 */
export async function toggleActionItemComplete(
  actionItemId: string,
  completed: boolean
): Promise<RelationshipActionItem> {
  const { data, error } = await supabase
    .from("relationship_action_items")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", actionItemId)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipActionItem;
}

/**
 * Delete an action item.
 */
export async function deleteActionItem(actionItemId: string): Promise<void> {
  const { error } = await supabase
    .from("relationship_action_items")
    .delete()
    .eq("id", actionItemId);

  if (error) throw error;
}

/**
 * Get action item completion stats for the current user.
 */
export async function getActionItemStats(): Promise<{
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_action_items")
    .select("completed")
    .eq("user_id", user.id);

  if (error) throw error;

  const items = data ?? [];
  const total = items.length;
  const completed = items.filter((i) => i.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, pending, completionRate };
}
