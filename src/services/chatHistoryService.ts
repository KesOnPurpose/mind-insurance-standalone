import { supabase } from "@/integrations/supabase/client";
import { CoachType } from "@/types/coach";

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  coachType: CoachType;
}

// Interface for agent_conversations table (PRIMARY SOURCE)
interface AgentConversation {
  id: string;
  user_id: string;
  agent_type: string;
  session_id: string;
  user_message: string;
  agent_response: string;
  created_at: string;
}

// Interface for legacy n8n_chat_histories table (FALLBACK)
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
 * Extract the actual user message from the n8n formatted content.
 * n8n prepends system context (USER PROFILE, READINESS ASSESSMENT, CROSS-CHANNEL ACTIVITY,
 * MIO INTELLIGENCE, INSTRUCTIONS, etc.) before the actual user message.
 * The user's real message is the text AFTER the last system block.
 */
function extractUserMessage(content: string): string {
  // Strategy 1: Look for [INSTRUCTIONS] block - user message follows after it
  const instructionsIndex = content.lastIndexOf('[INSTRUCTIONS]');
  if (instructionsIndex !== -1) {
    const afterInstructions = content.substring(instructionsIndex);
    const lines = afterInstructions.split('\n');

    // Skip the [INSTRUCTIONS] header and its bullet points (lines starting with -)
    let userMessageStartLine = -1;
    let passedInstructions = false;
    for (let i = 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === '') {
        passedInstructions = true;
        continue;
      }
      // Once we've passed a blank line and hit a non-bullet line, that's the user message
      if (passedInstructions && !trimmed.startsWith('-')) {
        userMessageStartLine = i;
        break;
      }
    }

    if (userMessageStartLine !== -1) {
      const userMessage = lines.slice(userMessageStartLine).join('\n').trim();
      if (userMessage.length > 0) {
        return userMessage;
      }
    }
  }

  // Strategy 2: Look for "# USER'S NEW MESSAGE:" marker (legacy format)
  const userMessageMarker = "# USER'S NEW MESSAGE:";
  const markerIndex = content.indexOf(userMessageMarker);
  if (markerIndex !== -1) {
    let userMessage = content.substring(markerIndex + userMessageMarker.length).trim();
    const nextSectionIndex = userMessage.search(/\n#\s|\n---/);
    if (nextSectionIndex !== -1) {
      userMessage = userMessage.substring(0, nextSectionIndex).trim();
    }
    return userMessage;
  }

  // Strategy 3: If content starts with "## USER PROFILE" or similar system context,
  // try to find the user message after all markdown heading sections
  if (content.trimStart().startsWith('## USER PROFILE') || content.trimStart().startsWith('# USER PROFILE')) {
    // Find the last section block and get text after it
    const lastBracketBlock = content.lastIndexOf('[');
    if (lastBracketBlock !== -1) {
      const closingBracket = content.indexOf(']', lastBracketBlock);
      if (closingBracket !== -1) {
        const afterLastBlock = content.substring(closingBracket + 1);
        // Skip bullet points that belong to the block
        const lines = afterLastBlock.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim();
          if (trimmed !== '' && !trimmed.startsWith('-') && !trimmed.startsWith('[') && !trimmed.startsWith('#')) {
            const userMessage = lines.slice(i).join('\n').trim();
            if (userMessage.length > 0) {
              return userMessage;
            }
          }
        }
      }
    }
  }

  // If no system context detected, return the original content
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
 * Transform agent_conversations records to ChatHistoryMessage format
 * Creates TWO messages per record (user + assistant)
 *
 * ANI-200-B: Deduplicates messages that share the same user_message content
 * within a short window. This prevents duplicates when the backend writes
 * a preliminary record (user message only) and then a complete record
 * (user message + agent response) for the same exchange.
 */
function transformAgentConversations(data: AgentConversation[], agent: CoachType): ChatHistoryMessage[] {
  const messages: ChatHistoryMessage[] = [];
  const seenUserMessages = new Set<string>();

  for (const record of data) {
    // ANI-200-B: Build a dedup key from role + trimmed content
    const userKey = record.user_message?.trim().toLowerCase();

    // Add user message (skip if we've already seen identical content)
    if (record.user_message && record.user_message.trim()) {
      if (!seenUserMessages.has(userKey!)) {
        seenUserMessages.add(userKey!);
        messages.push({
          id: `${record.id}-user`,
          role: 'user',
          content: record.user_message,
          timestamp: new Date(record.created_at),
          coachType: (record.agent_type as CoachType) || agent
        });
      }
    }

    // Add assistant response
    if (record.agent_response && record.agent_response.trim()) {
      messages.push({
        id: `${record.id}-assistant`,
        role: 'assistant',
        content: record.agent_response,
        timestamp: new Date(record.created_at),
        coachType: (record.agent_type as CoachType) || agent
      });
    }
  }

  return messages;
}

/**
 * Transform legacy n8n_chat_histories records to ChatHistoryMessage format
 */
function transformLegacyMessages(data: RawChatHistory[]): ChatHistoryMessage[] {
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

/**
 * Fetch chat history for a user
 * PRIMARY: Reads from agent_conversations (where mio-chat Edge Function writes)
 * FALLBACK: Reads from n8n_chat_histories (legacy data)
 */
export async function fetchChatHistory(
  userId: string,
  agent: CoachType,
  limit: number = 50
): Promise<ChatHistoryMessage[]> {
  try {
    console.log(`[ChatHistory] Fetching for user=${userId}, agent=${agent}, limit=${limit}`);

    // PRIMARY: Read from agent_conversations (where mio-chat Edge Function writes)
    const { data: agentData, error: agentError } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_type', agent)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (agentError) {
      console.error('[ChatHistory] Error querying agent_conversations:', agentError);
    }

    if (agentData && agentData.length > 0) {
      console.log(`[ChatHistory] Found ${agentData.length} messages in agent_conversations`);
      return transformAgentConversations(agentData as AgentConversation[], agent);
    }

    // FALLBACK: Try legacy n8n_chat_histories (for old data)
    console.log('[ChatHistory] No data in agent_conversations, trying legacy n8n_chat_histories');

    const { data: legacyData, error: legacyError } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .or(`session_id.eq.${userId},session_id.like.%:${agent}`)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (legacyError) {
      console.error('[ChatHistory] Error fetching from legacy table:', legacyError);
      return [];
    }

    if (!legacyData || legacyData.length === 0) {
      console.log('[ChatHistory] No history found for user:', userId);
      return [];
    }

    console.log('[ChatHistory] Found', legacyData.length, 'messages in legacy n8n_chat_histories');
    return transformLegacyMessages(legacyData as RawChatHistory[]);

  } catch (err) {
    console.error('[ChatHistory] Unexpected error:', err);
    return [];
  }
}

/**
 * Fetch the most recent conversation for a specific agent
 * PRIMARY: Reads from agent_conversations
 * FALLBACK: Reads from n8n_chat_histories
 */
export async function fetchRecentConversation(
  userId: string,
  agent: CoachType,
  limit: number = 20
): Promise<ChatHistoryMessage[]> {
  try {
    console.log(`[ChatHistory] Fetching recent for user=${userId}, agent=${agent}`);

    // PRIMARY: Read from agent_conversations
    const { data: agentData, error: agentError } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_type', agent)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (agentError) {
      console.error('[ChatHistory] Error querying agent_conversations:', agentError);
    }

    if (agentData && agentData.length > 0) {
      console.log(`[ChatHistory] Found ${agentData.length} recent messages in agent_conversations`);
      // Reverse to get chronological order (we queried descending for "most recent")
      const chronological = [...agentData].reverse();
      return transformAgentConversations(chronological as AgentConversation[], agent);
    }

    // FALLBACK: Try legacy n8n_chat_histories
    console.log('[ChatHistory] No recent data in agent_conversations, trying legacy');

    const sessionPattern = `%:${agent}`;
    const { data: legacyData, error: legacyError } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .ilike('session_id', sessionPattern)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (legacyError) {
      console.error('[ChatHistory] Error fetching recent conversation from legacy:', legacyError);
      return [];
    }

    if (!legacyData || legacyData.length === 0) {
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

      return transformLegacyMessages(fallbackData as RawChatHistory[]);
    }

    return transformLegacyMessages(legacyData as RawChatHistory[]);

  } catch (err) {
    console.error('[ChatHistory] Unexpected error:', err);
    return [];
  }
}

/**
 * Fetch chat history for a specific conversation by conversation_id
 * PRIMARY: Reads from agent_conversations (session_id is just UUID)
 * FALLBACK: Reads from n8n_chat_histories with multi-pattern strategy
 */
export async function fetchConversationById(
  userId: string,
  conversationId: string,
  limit: number = 100
): Promise<ChatHistoryMessage[]> {
  try {
    console.log('[ChatHistory] Fetching conversation by ID');
    console.log('[ChatHistory] User ID:', userId);
    console.log('[ChatHistory] Conversation ID:', conversationId);

    // PRIMARY: Read from agent_conversations
    // In agent_conversations, session_id is just the UUID (no :agent suffix)
    const { data: agentData, error: agentError } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('session_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (agentError) {
      console.error('[ChatHistory] Error querying agent_conversations by session_id:', agentError);
    }

    if (agentData && agentData.length > 0) {
      console.log(`[ChatHistory] Found ${agentData.length} messages in agent_conversations for session_id=${conversationId}`);
      const agent = (agentData[0] as AgentConversation).agent_type as CoachType || 'nette';
      return transformAgentConversations(agentData as AgentConversation[], agent);
    }

    // FALLBACK: Try agent_conversations with user_id filter (in case session_id doesn't match)
    const { data: userAgentData, error: userAgentError } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (!userAgentError && userAgentData && userAgentData.length > 0) {
      console.log(`[ChatHistory] Found ${userAgentData.length} messages in agent_conversations for user_id=${userId}`);
      const agent = (userAgentData[0] as AgentConversation).agent_type as CoachType || 'nette';
      return transformAgentConversations(userAgentData as AgentConversation[], agent);
    }

    // LEGACY FALLBACK: Try n8n_chat_histories with multi-pattern strategy
    console.log('[ChatHistory] No data in agent_conversations, trying legacy n8n_chat_histories');

    // Strategy 1: Pattern match "{conversation_id}:{agent}" format
    const sessionPattern = `${conversationId}:%`;
    console.log('[ChatHistory] Trying legacy pattern 1 (ilike):', sessionPattern);

    let { data, error } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .ilike('session_id', sessionPattern)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[ChatHistory] Error with legacy pattern 1:', error);
    }

    // Strategy 2: Try exact match if pattern match fails
    if (!data || data.length === 0) {
      console.log('[ChatHistory] Trying legacy exact match for conversation:', conversationId);
      const exactResult = await supabase
        .from('n8n_chat_histories')
        .select('*')
        .eq('session_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (!exactResult.error && exactResult.data && exactResult.data.length > 0) {
        data = exactResult.data;
        console.log('[ChatHistory] Found', data.length, 'messages with exact match');
      }
    }

    // Strategy 3: Try contains pattern "%{conversation_id}%" (case-insensitive)
    if (!data || data.length === 0) {
      console.log('[ChatHistory] Trying legacy contains pattern (ilike) for conversation:', conversationId);
      const containsResult = await supabase
        .from('n8n_chat_histories')
        .select('*')
        .ilike('session_id', `%${conversationId}%`)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (!containsResult.error && containsResult.data && containsResult.data.length > 0) {
        data = containsResult.data;
        console.log('[ChatHistory] Found', data.length, 'messages with contains pattern');
      }
    }

    // Strategy 4: Try with user_id prefix "{user_id}:{conversation_id}" (case-insensitive)
    if (!data || data.length === 0) {
      const userConvPattern = `${userId}:${conversationId}%`;
      console.log('[ChatHistory] Trying legacy user:conv pattern (ilike):', userConvPattern);
      const userConvResult = await supabase
        .from('n8n_chat_histories')
        .select('*')
        .ilike('session_id', userConvPattern)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (!userConvResult.error && userConvResult.data && userConvResult.data.length > 0) {
        data = userConvResult.data;
        console.log('[ChatHistory] Found', data.length, 'messages with user:conv pattern');
      }
    }

    // Strategy 5: Look up by {userId}:{agent} session_id pattern, filtered by conversation time window.
    // n8n stores ALL messages under one session_id like "{userId}:nette". The frontend creates
    // separate conversation_metadata entries with random UUIDs. We correlate by timestamp range.
    if (!data || data.length === 0) {
      console.log('[ChatHistory] Trying Strategy 5: userId:agent pattern with time window from conversation_metadata');

      // Get the conversation's time window from conversation_metadata
      const { data: convMeta, error: convMetaError } = await supabase
        .from('conversation_metadata')
        .select('created_at, last_message_at, coach_type')
        .eq('conversation_id', conversationId)
        .single();

      if (convMetaError) {
        console.error('[ChatHistory] Error fetching conversation_metadata:', convMetaError);
      }

      if (convMeta && convMeta.created_at && convMeta.last_message_at) {
        const agent = convMeta.coach_type || 'nette';
        const sessionPattern = `${userId}:${agent}`;

        // Add a small buffer (5 seconds before start, 5 seconds after end) to handle timing differences
        const windowStart = new Date(new Date(convMeta.created_at).getTime() - 5000).toISOString();
        const windowEnd = new Date(new Date(convMeta.last_message_at).getTime() + 5000).toISOString();

        console.log('[ChatHistory] Strategy 5 params:', { sessionPattern, windowStart, windowEnd });

        const timeWindowResult = await supabase
          .from('n8n_chat_histories')
          .select('*')
          .eq('session_id', sessionPattern)
          .gte('created_at', windowStart)
          .lte('created_at', windowEnd)
          .order('created_at', { ascending: true })
          .limit(limit);

        if (!timeWindowResult.error && timeWindowResult.data && timeWindowResult.data.length > 0) {
          data = timeWindowResult.data;
          console.log('[ChatHistory] Found', data.length, 'messages with Strategy 5 (userId:agent + time window)');
        } else {
          // If exact session_id match fails, try broader pattern match (userId:%)
          console.log('[ChatHistory] Strategy 5 exact failed, trying broader userId:% pattern');
          const broadResult = await supabase
            .from('n8n_chat_histories')
            .select('*')
            .ilike('session_id', `${userId}:%`)
            .gte('created_at', windowStart)
            .lte('created_at', windowEnd)
            .order('created_at', { ascending: true })
            .limit(limit);

          if (!broadResult.error && broadResult.data && broadResult.data.length > 0) {
            data = broadResult.data;
            console.log('[ChatHistory] Found', data.length, 'messages with Strategy 5 broad (userId:% + time window)');
          }
        }
      }
    }

    if (!data || data.length === 0) {
      console.log('[ChatHistory] No messages found for conversation after all strategies:', conversationId);
      return [];
    }

    console.log('[ChatHistory] Total messages found for conversation:', conversationId, '-', data.length);
    return transformLegacyMessages((data as RawChatHistory[]).reverse()); // reverse because we want chronological for transform

  } catch (err) {
    console.error('[ChatHistory] Unexpected error:', err);
    return [];
  }
}

/**
 * Get voice context for a user (recent chat summaries for cross-channel memory)
 * Used by Vapi/voice integration
 */
export async function getVoiceContext(
  userId: string,
  maxMessages: number = 10
): Promise<string> {
  try {
    console.log(`[ChatHistory] Getting voice context for user=${userId}`);

    // Query recent conversations from agent_conversations
    const { data, error } = await supabase
      .from('agent_conversations')
      .select('agent_type, user_message, agent_response, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(maxMessages);

    if (error) {
      console.error('[ChatHistory] Error fetching voice context:', error);
      return '';
    }

    if (!data || data.length === 0) {
      console.log('[ChatHistory] No conversations found for voice context');
      return '';
    }

    // Format as context string for voice
    const contextLines = data.map((c: { agent_type: string; user_message: string; agent_response: string }) =>
      `[${c.agent_type.toUpperCase()}] User: ${c.user_message.substring(0, 100)}${c.user_message.length > 100 ? '...' : ''}`
    );

    const contextForVoice = contextLines.join('\n');
    console.log(`[ChatHistory] Generated voice context (${contextLines.length} messages)`);

    return contextForVoice;
  } catch (err) {
    console.error('[ChatHistory] Error getting voice context:', err);
    return '';
  }
}
