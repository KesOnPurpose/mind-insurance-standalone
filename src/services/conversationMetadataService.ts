import { supabase } from "@/integrations/supabase/client";
import { CoachType } from "@/types/coach";

export interface ConversationMetadata {
  id: string;
  conversation_id: string;
  user_id: string;
  title: string;
  preview_text: string | null;
  coach_type: CoachType;
  message_count: number;
  is_archived: boolean;
  created_at: string;
  last_message_at: string;
  updated_at: string;
}

export interface CreateConversationParams {
  userId: string;
  conversationId: string;
  title: string;
  coachType?: CoachType;
  previewText?: string;
}

/**
 * Generate a conversation title from the first user message
 */
export function generateConversationTitle(firstUserMessage: string): string {
  // Clean and truncate
  const cleaned = firstUserMessage.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');

  // If short enough, use as-is
  if (cleaned.length <= 40) return cleaned;

  // Truncate at word boundary
  const truncated = cleaned.substring(0, 40);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 20 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Wait for session to be available (handles race condition on page load)
 */
async function waitForSession(maxAttempts: number = 5, delayMs: number = 200): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('[ConversationMetadata] Session available on attempt', i + 1);
      return true;
    }
    console.log('[ConversationMetadata] Session not ready, attempt', i + 1, 'of', maxAttempts);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return false;
}

/**
 * Fetch all non-archived conversations for a user, sorted by last message date
 */
export async function getConversationsList(userId: string): Promise<ConversationMetadata[]> {
  console.log('[ConversationMetadata] Fetching conversations for user:', userId);

  // Wait for session to be available (handles race condition on page load)
  const sessionReady = await waitForSession();

  // Check auth session state for RLS debugging
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  console.log('[ConversationMetadata] Session check:', {
    hasSession: !!session,
    sessionReady,
    sessionUserId: session?.user?.id || 'none',
    requestedUserId: userId,
    userIdMatch: session?.user?.id === userId
  });

  // If no session after waiting, return empty (user will need to re-authenticate)
  if (!session) {
    console.error('[ConversationMetadata] No session available after waiting - RLS will block access');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('conversation_metadata')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('[ConversationMetadata] Error fetching list:', error);
      console.error('[ConversationMetadata] This may be an RLS policy issue if session is missing');
      return [];
    }

    console.log('[ConversationMetadata] Found', data?.length || 0, 'conversations');
    return (data || []) as ConversationMetadata[];
  } catch (err) {
    console.error('[ConversationMetadata] Unexpected error:', err);
    return [];
  }
}

/**
 * Create a new conversation metadata entry
 */
export async function createConversation(params: CreateConversationParams): Promise<ConversationMetadata | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_metadata')
      .insert({
        conversation_id: params.conversationId,
        user_id: params.userId,
        title: params.title,
        preview_text: params.previewText || null,
        coach_type: params.coachType || 'nette',
        message_count: 1,
        is_archived: false,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[ConversationMetadata] Error creating:', error);
      return null;
    }

    console.log('[ConversationMetadata] Created:', data.id);
    return data as ConversationMetadata;
  } catch (err) {
    console.error('[ConversationMetadata] Unexpected error:', err);
    return null;
  }
}

/**
 * Update conversation title (for user renaming)
 */
export async function updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversation_metadata')
      .update({ title })
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('[ConversationMetadata] Error updating title:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[ConversationMetadata] Unexpected error:', err);
    return false;
  }
}

/**
 * Archive a conversation (soft delete)
 */
export async function archiveConversation(conversationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversation_metadata')
      .update({ is_archived: true })
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('[ConversationMetadata] Error archiving:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[ConversationMetadata] Unexpected error:', err);
    return false;
  }
}

/**
 * Update conversation after a new message (preview text, message count, last message timestamp)
 */
export async function updateLastMessage(
  conversationId: string,
  preview: string,
  coachType?: CoachType
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {
      preview_text: preview.substring(0, 100),
      last_message_at: new Date().toISOString()
    };

    // Update coach type if provided (to track latest coach in handoffs)
    if (coachType) {
      updateData.coach_type = coachType;
    }

    const { error } = await supabase
      .from('conversation_metadata')
      .update(updateData)
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('[ConversationMetadata] Error updating last message:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[ConversationMetadata] Unexpected error:', err);
    return false;
  }
}

/**
 * Increment message count for a conversation
 */
export async function incrementMessageCount(conversationId: string): Promise<boolean> {
  try {
    // Get current count first
    const { data: current, error: fetchError } = await supabase
      .from('conversation_metadata')
      .select('message_count')
      .eq('conversation_id', conversationId)
      .single();

    if (fetchError || !current) {
      console.error('[ConversationMetadata] Error fetching count:', fetchError);
      return false;
    }

    // Increment
    const { error } = await supabase
      .from('conversation_metadata')
      .update({ message_count: (current.message_count || 0) + 1 })
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('[ConversationMetadata] Error incrementing count:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[ConversationMetadata] Unexpected error:', err);
    return false;
  }
}

/**
 * Get a single conversation by conversation_id
 */
export async function getConversation(conversationId: string): Promise<ConversationMetadata | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_metadata')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (error) {
      console.error('[ConversationMetadata] Error fetching:', error);
      return null;
    }

    return data as ConversationMetadata;
  } catch (err) {
    console.error('[ConversationMetadata] Unexpected error:', err);
    return null;
  }
}
