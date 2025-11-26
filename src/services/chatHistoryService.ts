import { supabase } from "@/integrations/supabase/client";
import { CoachType } from "@/types/coach";

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  coachType: CoachType;
}

interface RawChatHistory {
  id: number;
  session_id: string;
  message: {
    type: 'human' | 'ai';
    content: string;
  };
  created_at: string;
}

/**
 * Extract the actual user message from the n8n formatted content
 * The human messages contain system prompts - we need to extract just the user's message
 */
function extractUserMessage(content: string): string {
  // Look for "# USER'S NEW MESSAGE:" or similar markers
  const userMessageMarker = "# USER'S NEW MESSAGE:";
  const markerIndex = content.indexOf(userMessageMarker);

  if (markerIndex !== -1) {
    // Extract everything after the marker
    let userMessage = content.substring(markerIndex + userMessageMarker.length).trim();

    // Remove any trailing system content (usually starts with "# " or "---")
    const nextSectionIndex = userMessage.search(/\n#\s|\n---/);
    if (nextSectionIndex !== -1) {
      userMessage = userMessage.substring(0, nextSectionIndex).trim();
    }

    return userMessage;
  }

  // If no marker found, return the original content (might be a simple message)
  return content;
}

/**
 * Detect which coach/agent a message is from based on content patterns
 */
function detectCoachType(content: string, isAi: boolean): CoachType {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('mio') || lowerContent.includes('mind insurance') ||
      lowerContent.includes('pattern') || lowerContent.includes('sabotage') ||
      lowerContent.includes('past prison') || lowerContent.includes('protect practice')) {
    return 'mio';
  }

  if (lowerContent.includes('financing') || lowerContent.includes('credit') ||
      lowerContent.includes('money evolution') || lowerContent.includes('roi') ||
      lowerContent.includes('seller financing')) {
    return 'me';
  }

  // Default to nette for group home related content
  return 'nette';
}

/**
 * Fetch chat history for a user from the n8n_chat_histories table
 */
export async function fetchChatHistory(
  userId: string,
  agent: CoachType,
  limit: number = 50
): Promise<ChatHistoryMessage[]> {
  try {
    // The session_id in n8n_chat_histories is formatted as "{conversation_id}:{agent}"
    // or just the user_id for older records
    // We need to fetch messages for this user and agent combination

    const { data, error } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .or(`session_id.eq.${userId},session_id.like.%:${agent}`)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[ChatHistory] Error fetching history:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[ChatHistory] No history found for user:', userId);
      return [];
    }

    console.log('[ChatHistory] Found', data.length, 'messages');

    // Transform to ChatHistoryMessage format
    const messages: ChatHistoryMessage[] = data.map((record: RawChatHistory, index: number) => {
      const isAi = record.message.type === 'ai';
      const content = isAi
        ? record.message.content
        : extractUserMessage(record.message.content);

      return {
        id: record.id.toString(),
        role: isAi ? 'assistant' : 'user',
        content: content,
        timestamp: new Date(record.created_at),
        coachType: detectCoachType(record.message.content, isAi)
      };
    });

    // Filter out system messages and empty content
    return messages.filter(m => m.content && m.content.trim().length > 0);

  } catch (err) {
    console.error('[ChatHistory] Unexpected error:', err);
    return [];
  }
}

/**
 * Fetch the most recent conversation for a specific agent
 */
export async function fetchRecentConversation(
  userId: string,
  agent: CoachType,
  limit: number = 20
): Promise<ChatHistoryMessage[]> {
  try {
    // Build the session pattern to match
    // Session IDs are formatted as: "{conv_id}:{agent}"
    const sessionPattern = `%:${agent}`;

    const { data, error } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .like('session_id', sessionPattern)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[ChatHistory] Error fetching recent conversation:', error);
      return [];
    }

    if (!data || data.length === 0) {
      // Try falling back to user_id based session
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('n8n_chat_histories')
        .select('*')
        .eq('session_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackError || !fallbackData || fallbackData.length === 0) {
        return [];
      }

      return transformMessages(fallbackData);
    }

    return transformMessages(data);

  } catch (err) {
    console.error('[ChatHistory] Unexpected error:', err);
    return [];
  }
}

function transformMessages(data: RawChatHistory[]): ChatHistoryMessage[] {
  // Reverse to get chronological order
  const chronological = [...data].reverse();

  return chronological.map((record: RawChatHistory) => {
    const isAi = record.message.type === 'ai';
    const content = isAi
      ? record.message.content
      : extractUserMessage(record.message.content);

    return {
      id: record.id.toString(),
      role: isAi ? 'assistant' as const : 'user' as const,
      content: content,
      timestamp: new Date(record.created_at),
      coachType: detectCoachType(record.message.content, isAi)
    };
  }).filter(m => m.content && m.content.trim().length > 0);
}
