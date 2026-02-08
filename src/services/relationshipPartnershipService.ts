/**
 * RKPI Module: Partnership Service
 * Manages relationship partnerships — creation, invitation, acceptance, pairing.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RelationshipPartnership,
  RelationshipPartnershipInsert,
  RelationshipPartnershipUpdate,
} from "@/types/relationship-kpis";

/**
 * Get the active partnership for the current user (as initiator or partner).
 */
export async function getActivePartnership(): Promise<RelationshipPartnership | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_partnerships")
    .select("*")
    .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as RelationshipPartnership | null;
}

/**
 * Get all partnerships for the current user (any status).
 */
export async function getUserPartnerships(): Promise<RelationshipPartnership[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_partnerships")
    .select("*")
    .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RelationshipPartnership[];
}

/**
 * Create a new partnership invitation.
 * The current user becomes the initiator (user_id).
 */
export async function createPartnership(
  input: RelationshipPartnershipInsert
): Promise<RelationshipPartnership> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("relationship_partnerships")
    .insert({
      user_id: user.id,
      partner_email: input.partner_email,
      partner_phone: input.partner_phone ?? null,
      partner_name: input.partner_name ?? null,
      invitation_status: "pending",
      status: "active",
      invitation_sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipPartnership;
}

/**
 * Accept a partnership invitation by token.
 * Sets the current user as the partner_id and updates invitation_status.
 */
export async function acceptInvitation(
  invitationToken: string
): Promise<RelationshipPartnership> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Look up the partnership by token
  const { data: partnership, error: lookupError } = await supabase
    .from("relationship_partnerships")
    .select("*")
    .eq("invitation_token", invitationToken)
    .eq("invitation_status", "pending")
    .eq("status", "active")
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!partnership) throw new Error("Invalid or expired invitation");

  // Prevent self-pairing
  if (partnership.user_id === user.id) {
    throw new Error("You cannot accept your own invitation");
  }

  // Check expiration
  if (partnership.invitation_expires_at && new Date(partnership.invitation_expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from("relationship_partnerships")
      .update({ invitation_status: "expired" })
      .eq("id", partnership.id);
    throw new Error("This invitation has expired");
  }

  // Accept: set partner_id and update status
  const { data, error } = await supabase
    .from("relationship_partnerships")
    .update({
      partner_id: user.id,
      invitation_status: "accepted",
    })
    .eq("id", partnership.id)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipPartnership;
}

/**
 * Decline a partnership invitation by token.
 */
export async function declineInvitation(
  invitationToken: string
): Promise<void> {
  const { error } = await supabase
    .from("relationship_partnerships")
    .update({ invitation_status: "declined" })
    .eq("invitation_token", invitationToken)
    .eq("invitation_status", "pending");

  if (error) throw error;
}

/**
 * Update a partnership (initiator only for most fields).
 */
export async function updatePartnership(
  partnershipId: string,
  updates: RelationshipPartnershipUpdate
): Promise<RelationshipPartnership> {
  const { data, error } = await supabase
    .from("relationship_partnerships")
    .update(updates)
    .eq("id", partnershipId)
    .select()
    .single();

  if (error) throw error;
  return data as RelationshipPartnership;
}

/**
 * End a partnership (set status to 'ended').
 */
export async function endPartnership(partnershipId: string): Promise<void> {
  const { error } = await supabase
    .from("relationship_partnerships")
    .update({ status: "ended" })
    .eq("id", partnershipId);

  if (error) throw error;
}

/**
 * Pause a partnership.
 */
export async function pausePartnership(partnershipId: string): Promise<void> {
  const { error } = await supabase
    .from("relationship_partnerships")
    .update({ status: "paused" })
    .eq("id", partnershipId);

  if (error) throw error;
}

/**
 * Resume a paused partnership.
 */
export async function resumePartnership(partnershipId: string): Promise<void> {
  const { error } = await supabase
    .from("relationship_partnerships")
    .update({ status: "active" })
    .eq("id", partnershipId);

  if (error) throw error;
}

/**
 * Look up a partnership by invitation token (public, for invite landing page).
 */
export async function getPartnershipByToken(
  token: string
): Promise<RelationshipPartnership | null> {
  const { data, error } = await supabase
    .from("relationship_partnerships")
    .select("*")
    .eq("invitation_token", token)
    .maybeSingle();

  if (error) throw error;
  return data as RelationshipPartnership | null;
}
