/**
 * MI Access Control Types
 *
 * These types support the mi_approved_users table and related functions.
 * After running migrations, regenerate main types with:
 * `supabase gen types typescript --project-id hpyodaugrkctagkrfofj > src/integrations/supabase/types.ts`
 */

// MI-specific tier enum (simpler than GH - no coach/owner)
export type MIUserTier = 'user' | 'admin' | 'super_admin';

// MI Approved Users table row
export interface MIApprovedUser {
  id: string;
  email: string;
  user_id: string | null;
  tier: MIUserTier;
  is_active: boolean;
  full_name: string | null;
  phone: string | null;
  notes: string | null;
  approved_at: string;
  approved_by: string | null;
  expires_at: string | null;
  last_access_at: string | null;
  created_at: string;
  updated_at: string;
}

// Insert type for mi_approved_users
export interface MIApprovedUserInsert {
  id?: string;
  email: string;
  user_id?: string | null;
  tier?: MIUserTier;
  is_active?: boolean;
  full_name?: string | null;
  phone?: string | null;
  notes?: string | null;
  approved_at?: string;
  approved_by?: string | null;
  expires_at?: string | null;
  last_access_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Update type for mi_approved_users
export interface MIApprovedUserUpdate {
  id?: string;
  email?: string;
  user_id?: string | null;
  tier?: MIUserTier;
  is_active?: boolean;
  full_name?: string | null;
  phone?: string | null;
  notes?: string | null;
  approved_at?: string;
  approved_by?: string | null;
  expires_at?: string | null;
  last_access_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Response from mi_get_current_user_access RPC
export interface MIAccessResponse {
  is_approved: boolean;
  tier: MIUserTier | null;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  approved_at: string | null;
  expires_at: string | null;
}

// Tier hierarchy for permission checks
export const MI_TIER_HIERARCHY: Record<MIUserTier, number> = {
  user: 1,
  admin: 2,
  super_admin: 3,
};

/**
 * Check if a tier meets the required tier level
 */
export function miHasTierAccess(userTier: MIUserTier | null, requiredTier: MIUserTier): boolean {
  if (!userTier) return false;
  return MI_TIER_HIERARCHY[userTier] >= MI_TIER_HIERARCHY[requiredTier];
}
