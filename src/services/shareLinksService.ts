// ============================================================================
// SHARE LINKS SERVICE
// ============================================================================
// Manages shareable links for compliance binders - enables sharing with
// attorneys, consultants, and other professionals for review.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { BinderShareLink, SharePermissions } from '@/types/compliance';

// ============================================================================
// CONSTANTS
// ============================================================================

const TOKEN_LENGTH = 32;
const DEFAULT_EXPIRY_DAYS = 7;
const MAX_EXPIRY_DAYS = 365;

// ============================================================================
// TYPES
// ============================================================================

export interface CreateShareLinkInput {
  binder_id: string;
  permissions?: Partial<SharePermissions>;
  expires_in_days?: number | null; // null = never expires
  recipient_email?: string;
  recipient_name?: string;
  notes?: string;
}

export interface UpdateShareLinkInput {
  permissions?: Partial<SharePermissions>;
  expires_at?: string | null;
  is_active?: boolean;
  notes?: string;
}

export interface SharedBinderAccess {
  binder: {
    id: string;
    name: string;
    state_code: string;
    city?: string;
    model_definition?: string;
    created_at: string;
    updated_at: string;
  };
  items: Array<{
    id: string;
    section_type: string;
    title?: string;
    chunk_content?: string;
    user_notes?: string;
    source_url?: string;
    regulation_code?: string;
    is_starred: boolean;
    created_at: string;
  }>;
  documents: Array<{
    id: string;
    document_type: string;
    file_name: string;
    file_url: string;
    description?: string;
    created_at: string;
  }>;
  permissions: SharePermissions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Calculate expiry date from days
 */
function calculateExpiryDate(days: number | null): string | null {
  if (days === null) return null;

  const date = new Date();
  date.setDate(date.getDate() + Math.min(days, MAX_EXPIRY_DAYS));
  return date.toISOString();
}

/**
 * Get default permissions
 */
function getDefaultPermissions(): SharePermissions {
  return {
    view_sections: true,
    view_documents: true,
    view_notes: true,
    download_documents: false,
    add_comments: false,
  };
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new share link for a binder
 */
export async function createShareLink(
  input: CreateShareLinkInput
): Promise<BinderShareLink> {
  // Get current user
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) {
    throw new Error('User not authenticated');
  }

  // Verify binder belongs to user
  const { data: binder, error: binderError } = await supabase
    .from('compliance_binders')
    .select('id, user_id')
    .eq('id', input.binder_id)
    .eq('user_id', user.user.id)
    .single();

  if (binderError || !binder) {
    throw new Error('Binder not found or access denied');
  }

  // Generate unique token
  const token = generateToken();

  // Calculate expiry
  const expiresAt = calculateExpiryDate(
    input.expires_in_days !== undefined ? input.expires_in_days : DEFAULT_EXPIRY_DAYS
  );

  // Merge permissions with defaults
  const permissions: SharePermissions = {
    ...getDefaultPermissions(),
    ...input.permissions,
  };

  // Create share link record
  const { data, error } = await supabase
    .from('binder_share_links')
    .insert({
      binder_id: input.binder_id,
      share_token: token,
      permissions,
      expires_at: expiresAt,
      recipient_email: input.recipient_email,
      recipient_name: input.recipient_name,
      notes: input.notes,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Create share link error:', error);
    throw new Error('Failed to create share link');
  }

  return data;
}

/**
 * Generate the full share URL
 */
export function getShareUrl(token: string): string {
  // Use the app's base URL
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://grouphome4newbies.com';
  return `${baseUrl}/compliance/binder/share/${token}`;
}

// ============================================================================
// RETRIEVE OPERATIONS
// ============================================================================

/**
 * Get all share links for a binder
 */
export async function getBinderShareLinks(binderId: string): Promise<BinderShareLink[]> {
  const { data, error } = await supabase
    .from('binder_share_links')
    .select('*')
    .eq('binder_id', binderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get share links error:', error);
    throw new Error('Failed to fetch share links');
  }

  return data || [];
}

/**
 * Get active share links for a binder
 */
export async function getActiveShareLinks(binderId: string): Promise<BinderShareLink[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('binder_share_links')
    .select('*')
    .eq('binder_id', binderId)
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get active share links error:', error);
    throw new Error('Failed to fetch share links');
  }

  return data || [];
}

/**
 * Validate a share token and get the shared binder
 * This is used by the public share page
 */
export async function validateShareToken(token: string): Promise<SharedBinderAccess | null> {
  const now = new Date().toISOString();

  // Get the share link
  const { data: link, error: linkError } = await supabase
    .from('binder_share_links')
    .select('*')
    .eq('share_token', token)
    .eq('is_active', true)
    .single();

  if (linkError || !link) {
    console.error('Share link not found or invalid');
    return null;
  }

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return null;
  }

  const permissions = link.permissions as SharePermissions;

  // Get binder data
  const { data: binder, error: binderError } = await supabase
    .from('compliance_binders')
    .select('id, name, state_code, city, model_definition, created_at, updated_at')
    .eq('id', link.binder_id)
    .single();

  if (binderError || !binder) {
    console.error('Binder not found');
    return null;
  }

  // Get items if permitted
  let items: SharedBinderAccess['items'] = [];
  if (permissions.view_sections) {
    const { data: itemsData } = await supabase
      .from('binder_items')
      .select(`
        id, section_type, title, chunk_content,
        ${permissions.view_notes ? 'user_notes,' : ''}
        source_url, regulation_code, is_starred, created_at
      `)
      .eq('binder_id', link.binder_id)
      .order('section_type')
      .order('sort_order');

    items = itemsData || [];
  }

  // Get documents if permitted
  let documents: SharedBinderAccess['documents'] = [];
  if (permissions.view_documents) {
    const { data: docsData } = await supabase
      .from('binder_documents')
      .select('id, document_type, file_name, file_url, description, created_at')
      .eq('binder_id', link.binder_id)
      .order('created_at', { ascending: false });

    documents = docsData || [];
  }

  // Update last accessed timestamp
  await supabase
    .from('binder_share_links')
    .update({
      last_accessed_at: now,
      access_count: (link.access_count || 0) + 1,
    })
    .eq('id', link.id);

  return {
    binder,
    items,
    documents,
    permissions,
  };
}

/**
 * Get share link by ID
 */
export async function getShareLinkById(linkId: string): Promise<BinderShareLink | null> {
  const { data, error } = await supabase
    .from('binder_share_links')
    .select('*')
    .eq('id', linkId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Get share link error:', error);
    throw new Error('Failed to fetch share link');
  }

  return data;
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update a share link
 */
export async function updateShareLink(
  linkId: string,
  input: UpdateShareLinkInput
): Promise<BinderShareLink> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.permissions !== undefined) {
    // Merge with existing permissions
    const { data: existing } = await supabase
      .from('binder_share_links')
      .select('permissions')
      .eq('id', linkId)
      .single();

    updateData.permissions = {
      ...(existing?.permissions as SharePermissions || getDefaultPermissions()),
      ...input.permissions,
    };
  }

  if (input.expires_at !== undefined) {
    updateData.expires_at = input.expires_at;
  }

  if (input.is_active !== undefined) {
    updateData.is_active = input.is_active;
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }

  const { data, error } = await supabase
    .from('binder_share_links')
    .update(updateData)
    .eq('id', linkId)
    .select()
    .single();

  if (error) {
    console.error('Update share link error:', error);
    throw new Error('Failed to update share link');
  }

  return data;
}

/**
 * Extend share link expiry
 */
export async function extendShareLinkExpiry(
  linkId: string,
  additionalDays: number
): Promise<BinderShareLink> {
  const { data: existing } = await supabase
    .from('binder_share_links')
    .select('expires_at')
    .eq('id', linkId)
    .single();

  let newExpiry: Date;
  if (existing?.expires_at) {
    // Extend from current expiry
    newExpiry = new Date(existing.expires_at);
  } else {
    // Extend from now
    newExpiry = new Date();
  }

  newExpiry.setDate(newExpiry.getDate() + Math.min(additionalDays, MAX_EXPIRY_DAYS));

  return updateShareLink(linkId, { expires_at: newExpiry.toISOString() });
}

/**
 * Deactivate a share link
 */
export async function deactivateShareLink(linkId: string): Promise<BinderShareLink> {
  return updateShareLink(linkId, { is_active: false });
}

/**
 * Reactivate a share link
 */
export async function reactivateShareLink(linkId: string): Promise<BinderShareLink> {
  return updateShareLink(linkId, { is_active: true });
}

/**
 * Regenerate share token (invalidates old link)
 */
export async function regenerateShareToken(linkId: string): Promise<BinderShareLink> {
  const newToken = generateToken();

  const { data, error } = await supabase
    .from('binder_share_links')
    .update({
      share_token: newToken,
      access_count: 0,
      last_accessed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', linkId)
    .select()
    .single();

  if (error) {
    console.error('Regenerate token error:', error);
    throw new Error('Failed to regenerate share token');
  }

  return data;
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a share link
 */
export async function deleteShareLink(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('binder_share_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    console.error('Delete share link error:', error);
    throw new Error('Failed to delete share link');
  }
}

/**
 * Delete all share links for a binder
 */
export async function deleteAllBinderShareLinks(binderId: string): Promise<void> {
  const { error } = await supabase
    .from('binder_share_links')
    .delete()
    .eq('binder_id', binderId);

  if (error) {
    console.error('Delete all share links error:', error);
    throw new Error('Failed to delete share links');
  }
}

/**
 * Delete expired share links
 */
export async function cleanupExpiredShareLinks(): Promise<number> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('binder_share_links')
    .delete()
    .lt('expires_at', now)
    .select('id');

  if (error) {
    console.error('Cleanup expired links error:', error);
    throw new Error('Failed to cleanup expired links');
  }

  return data?.length || 0;
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get share link statistics for a binder
 */
export async function getShareLinkStats(binderId: string): Promise<{
  total_links: number;
  active_links: number;
  expired_links: number;
  total_accesses: number;
  recent_accesses: number; // Last 7 days
}> {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('binder_share_links')
    .select('is_active, expires_at, access_count, last_accessed_at')
    .eq('binder_id', binderId);

  if (error) {
    console.error('Get share link stats error:', error);
    throw new Error('Failed to get share link statistics');
  }

  const links = data || [];
  let activeLinks = 0;
  let expiredLinks = 0;
  let totalAccesses = 0;
  let recentAccesses = 0;

  links.forEach((link) => {
    if (link.is_active && (!link.expires_at || new Date(link.expires_at) > now)) {
      activeLinks++;
    } else if (link.expires_at && new Date(link.expires_at) <= now) {
      expiredLinks++;
    }

    totalAccesses += link.access_count || 0;

    if (link.last_accessed_at && new Date(link.last_accessed_at) >= sevenDaysAgo) {
      recentAccesses++;
    }
  });

  return {
    total_links: links.length,
    active_links: activeLinks,
    expired_links: expiredLinks,
    total_accesses: totalAccesses,
    recent_accesses: recentAccesses,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Create
  createShareLink,
  getShareUrl,
  // Retrieve
  getBinderShareLinks,
  getActiveShareLinks,
  validateShareToken,
  getShareLinkById,
  // Update
  updateShareLink,
  extendShareLinkExpiry,
  deactivateShareLink,
  reactivateShareLink,
  regenerateShareToken,
  // Delete
  deleteShareLink,
  deleteAllBinderShareLinks,
  cleanupExpiredShareLinks,
  // Analytics
  getShareLinkStats,
  // Constants
  DEFAULT_EXPIRY_DAYS,
  MAX_EXPIRY_DAYS,
};
