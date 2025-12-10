import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// ASSESSMENT INVITATIONS HOOK
// ============================================================================
// Manages assessment invitations for Mind Insurance users
// Assessments are invitation-only (except Identity Collision gate)
// ============================================================================

export type AssessmentType = 'identity_collision' | 'avatar_deep' | 'inner_wiring_discovery' | 'mental_pillar';
export type InvitedBy = 'admin' | 'coach' | 'mio_chat' | 'mio_feedback' | 'system';
export type InvitationStatus = 'pending' | 'started' | 'completed' | 'declined';

export interface AssessmentInvitation {
  id: string;
  user_id: string;
  assessment_type: AssessmentType;
  invited_by: InvitedBy;
  invited_by_user_id: string | null;
  reason: string | null;
  conversation_id: string | null;
  status: InvitationStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

// Assessment type display info
export const ASSESSMENT_INFO: Record<AssessmentType, {
  name: string;
  description: string;
  estimatedMinutes: number;
  icon: string;
  path: string;
}> = {
  identity_collision: {
    name: 'Identity Collision Assessment',
    description: 'Discover which pattern is blocking your growth',
    estimatedMinutes: 5,
    icon: '🎯',
    path: '/mind-insurance/assessment',
  },
  inner_wiring_discovery: {
    name: 'Inner Wiring Discovery',
    description: 'Discover how you naturally process challenges and restore energy',
    estimatedMinutes: 7,
    icon: '⚡',
    path: '/mind-insurance/inner-wiring',
  },
  avatar_deep: {
    name: 'Identity Collision Avatar Assessment',
    description: 'Meet your full avatar persona with breakthrough path',
    estimatedMinutes: 15,
    icon: '🎭',
    path: '/avatar-assessment',
  },
  mental_pillar: {
    name: 'Mental Pillar Baseline Assessment',
    description: 'Measure 4 competencies: Pattern Awareness, Identity Alignment, Belief Mastery, Mental Resilience',
    estimatedMinutes: 12,
    icon: '🧠',
    path: '/mind-insurance/mental-pillar-assessment',
  },
};

/**
 * Fetch pending invitations for the current user
 */
export function useUserInvitations(userId: string | undefined) {
  return useQuery({
    queryKey: ['assessmentInvitations', userId],
    queryFn: async (): Promise<AssessmentInvitation[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('assessment_invitations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AssessmentInvitations] Error fetching:', error);
        // Return empty array if table doesn't exist yet
        if (error.code === '42P01') return [];
        throw error;
      }

      return (data || []) as AssessmentInvitation[];
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch pending invitations count (for badge)
 */
export function usePendingInvitationsCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['pendingInvitationsCount', userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('assessment_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('[AssessmentInvitations] Error counting:', error);
        if (error.code === '42P01') return 0;
        throw error;
      }

      return count || 0;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

/**
 * Check if user has any invitations (for showing/hiding Assessments tab)
 */
export function useHasAnyInvitations(userId: string | undefined) {
  return useQuery({
    queryKey: ['hasAnyInvitations', userId],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;

      const { count, error } = await supabase
        .from('assessment_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('[AssessmentInvitations] Error checking:', error);
        if (error.code === '42P01') return false;
        throw error;
      }

      return (count || 0) > 0;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

/**
 * Update invitation status
 */
export function useUpdateInvitationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invitationId,
      status,
    }: {
      invitationId: string;
      status: InvitationStatus;
    }) => {
      const updates: Partial<AssessmentInvitation> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'started') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('assessment_invitations')
        .update(updates)
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessmentInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['pendingInvitationsCount'] });
      queryClient.invalidateQueries({ queryKey: ['hasAnyInvitations'] });
    },
  });
}

/**
 * Create new invitation (admin/coach use)
 */
export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      assessmentType,
      invitedBy,
      invitedByUserId,
      reason,
      conversationId,
      metadata,
    }: {
      userId: string;
      assessmentType: AssessmentType;
      invitedBy: InvitedBy;
      invitedByUserId?: string;
      reason?: string;
      conversationId?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('assessment_invitations')
        .insert({
          user_id: userId,
          assessment_type: assessmentType,
          invited_by: invitedBy,
          invited_by_user_id: invitedByUserId || null,
          reason: reason || null,
          conversation_id: conversationId || null,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessmentInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['pendingInvitationsCount'] });
      queryClient.invalidateQueries({ queryKey: ['hasAnyInvitations'] });
    },
  });
}

/**
 * Fetch all invitations (admin use)
 */
export function useAllInvitations(filters?: {
  status?: InvitationStatus;
  assessmentType?: AssessmentType;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['allAssessmentInvitations', filters],
    queryFn: async (): Promise<AssessmentInvitation[]> => {
      let query = supabase
        .from('assessment_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.assessmentType) {
        query = query.eq('assessment_type', filters.assessmentType);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AssessmentInvitations] Error fetching all:', error);
        if (error.code === '42P01') return [];
        throw error;
      }

      return (data || []) as AssessmentInvitation[];
    },
    staleTime: 30 * 1000,
  });
}
