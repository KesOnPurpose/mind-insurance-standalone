// ============================================================================
// VAPI UPDATE ASSISTANT - Admin Utility
// ============================================================================
// One-time administrative function to update Vapi assistant prompts
// Adds {{recentChats}} variable for cross-channel memory (chat → voice)
//
// Usage: POST with { action: "add_recent_chats" }
// This will add the recentChats variable section to both Claude and GPT4 assistants
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Assistant IDs from vapiService.ts
const ASSISTANT_IDS = {
  claude: '2e0dcaa8-4e9c-4c72-99f6-a19d87475147',
  gpt4: 'cab72f23-7e8d-4c84-a1ed-e0895ccb5bd7'
};

// Pronunciation guide for the system prompt
// Ensures the AI knows how to spell the name for TTS to pronounce correctly
const PRONUNCIATION_GUIDE = `
## VOICE PRONUNCIATION GUIDE (CRITICAL)

Your name is "Nette" (short for Lynette), but for voice calls you must spell it as "Net" so the text-to-speech pronounces it correctly. The name rhymes with "bet" or "pet", NOT "Neddy" or "Betty".

**When speaking (voice calls):**
- Always spell your name as "Net" in your responses (TTS will pronounce it correctly)
- Example: "Hi, I'm Net, your group home expert!" ✓
- NOT: "I'm Nette" (TTS mispronounces this as "Neddy") ✗

**When written context (chat, text):**
- The written form of your name is "Nette"
- In chat interfaces, use "Nette"

Remember: You ARE Nette, you just SPELL it as "Net" for voice so it sounds right.`;

// The section to add for cross-channel memory
const RECENT_CHATS_SECTION = `

## RECENT CHAT CONVERSATIONS (Cross-Channel Memory)

If the user has previously chatted with you (Text Nette), this section contains a summary of those conversations. Use this context to provide continuity across voice and chat channels.

{{recentChats}}

**Usage Guidelines:**
- If recentChats is empty, the user hasn't chatted recently - that's fine, proceed normally
- If recentChats contains conversation history, reference it naturally when relevant
- Don't explicitly say "I see from your chat history..." - just demonstrate that you remember
- Example: If they discussed licensing in chat, you can say "How's the licensing research going?"`;

interface VapiAssistant {
  id: string;
  name: string;
  model: {
    provider: string;
    model: string;
    systemPrompt?: string;
    messages?: Array<{
      role: string;
      content: string;
    }>;
  };
}

// Fetch current assistant configuration from Vapi
async function fetchAssistant(assistantId: string, apiKey: string): Promise<VapiAssistant | null> {
  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch assistant ${assistantId}:`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching assistant ${assistantId}:`, error);
    return null;
  }
}

// Update assistant with new prompt
async function updateAssistant(
  assistantId: string,
  apiKey: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update assistant ${assistantId}:`, response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error updating assistant ${assistantId}:`, error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapiPrivateKey = Deno.env.get('VAPI_PRIVATE_KEY');

    if (!vapiPrivateKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'VAPI_PRIVATE_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, user_id } = body;

    if (action === 'get_current') {
      // Fetch current assistant configurations
      const claude = await fetchAssistant(ASSISTANT_IDS.claude, vapiPrivateKey);
      const gpt4 = await fetchAssistant(ASSISTANT_IDS.gpt4, vapiPrivateKey);

      return new Response(
        JSON.stringify({
          success: true,
          assistants: { claude, gpt4 }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fix name pronunciation: Use "Net" in spoken firstMessage for correct pronunciation
    // "Nette" is short for Lynette, pronounced like "Net" (rhymes with "bet")
    // ElevenLabs and other TTS engines mispronounce "Nette" as "Neddy" or "Naya"
    if (action === 'fix_name_pronunciation') {
      const results = {
        claude: { success: false, message: '', currentFirstMessage: '' },
        gpt4: { success: false, message: '', currentFirstMessage: '' }
      };

      for (const [variant, assistantId] of Object.entries(ASSISTANT_IDS)) {
        console.log(`Processing ${variant} assistant for name pronunciation...`);

        const assistant = await fetchAssistant(assistantId, vapiPrivateKey) as unknown as { firstMessage?: string };

        if (!assistant) {
          results[variant as keyof typeof results] = {
            success: false,
            message: 'Failed to fetch assistant',
            currentFirstMessage: ''
          };
          continue;
        }

        const currentFirstMessage = (assistant as { firstMessage?: string }).firstMessage || '';
        results[variant as keyof typeof results].currentFirstMessage = currentFirstMessage;

        // Check if "Net" is already used (already fixed)
        if (currentFirstMessage.includes("I'm Net,") || currentFirstMessage.includes("I'm Net ")) {
          results[variant as keyof typeof results] = {
            success: true,
            message: 'Already using "Net" in firstMessage - pronunciation is correct',
            currentFirstMessage
          };
          continue;
        }

        // Replace various forms of the name with "Net" for correct pronunciation
        // This handles: "Nette", "Netty", "Nettie" → "Net"
        let updatedFirstMessage = currentFirstMessage
          .replace(/\bNette\b/g, 'Net')
          .replace(/\bNetty\b/g, 'Net')
          .replace(/\bNettie\b/g, 'Net');

        // If no change was made, the name isn't in firstMessage
        if (updatedFirstMessage === currentFirstMessage) {
          results[variant as keyof typeof results] = {
            success: true,
            message: 'Name not found in firstMessage - may use different greeting',
            currentFirstMessage
          };
          continue;
        }

        const updateSuccess = await updateAssistant(assistantId, vapiPrivateKey, {
          firstMessage: updatedFirstMessage
        });

        results[variant as keyof typeof results] = {
          success: updateSuccess,
          message: updateSuccess
            ? `Fixed pronunciation: "${currentFirstMessage.substring(0, 60)}..." → "${updatedFirstMessage.substring(0, 60)}..."`
            : 'Update failed',
          currentFirstMessage
        };
      }

      return new Response(
        JSON.stringify({
          success: results.claude.success && results.gpt4.success,
          results,
          note: 'The name "Net" will be spoken by TTS. In text/written form, the name is still "Nette" (short for Lynette).'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add pronunciation guide to system prompt so AI spells name as "Net" in voice responses
    // This ensures the TTS engine pronounces the name correctly (rhymes with "bet", not "Neddy")
    if (action === 'add_pronunciation_guide') {
      const results = {
        claude: { success: false, message: '', promptPreview: '' },
        gpt4: { success: false, message: '', promptPreview: '' }
      };

      for (const [variant, assistantId] of Object.entries(ASSISTANT_IDS)) {
        console.log(`Processing ${variant} assistant for pronunciation guide...`);

        const assistant = await fetchAssistant(assistantId, vapiPrivateKey);

        if (!assistant) {
          results[variant as keyof typeof results] = {
            success: false,
            message: 'Failed to fetch assistant',
            promptPreview: ''
          };
          continue;
        }

        // Get current system prompt
        let currentPrompt = '';

        if (assistant.model?.systemPrompt) {
          currentPrompt = assistant.model.systemPrompt;
        } else if (assistant.model?.messages) {
          const systemMessage = assistant.model.messages.find(m => m.role === 'system');
          if (systemMessage) {
            currentPrompt = systemMessage.content;
          }
        }

        // Check if pronunciation guide already exists
        if (currentPrompt.includes('VOICE PRONUNCIATION GUIDE')) {
          results[variant as keyof typeof results] = {
            success: true,
            message: 'Pronunciation guide already present in system prompt',
            promptPreview: currentPrompt.substring(0, 200) + '...'
          };
          continue;
        }

        // Add pronunciation guide at the BEGINNING of the system prompt
        // This ensures it's seen first and prioritized by the AI
        const updatedPrompt = PRONUNCIATION_GUIDE + '\n\n' + currentPrompt;

        // Build update payload based on current structure
        const updatePayload: Record<string, unknown> = {};

        if (assistant.model?.systemPrompt !== undefined) {
          updatePayload.model = {
            ...assistant.model,
            systemPrompt: updatedPrompt
          };
        } else if (assistant.model?.messages) {
          const updatedMessages = assistant.model.messages.map(m =>
            m.role === 'system' ? { ...m, content: updatedPrompt } : m
          );
          updatePayload.model = {
            ...assistant.model,
            messages: updatedMessages
          };
        }

        const updateSuccess = await updateAssistant(assistantId, vapiPrivateKey, updatePayload);

        results[variant as keyof typeof results] = {
          success: updateSuccess,
          message: updateSuccess
            ? 'Pronunciation guide added to system prompt'
            : 'Update failed',
          promptPreview: updateSuccess ? updatedPrompt.substring(0, 300) + '...' : ''
        };
      }

      return new Response(
        JSON.stringify({
          success: results.claude.success && results.gpt4.success,
          results,
          note: 'The pronunciation guide tells the AI to spell "Nette" as "Net" in voice responses for correct TTS pronunciation.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'add_recent_chats') {
      const results = {
        claude: { success: false, message: '' },
        gpt4: { success: false, message: '' }
      };

      // Process each assistant
      for (const [variant, assistantId] of Object.entries(ASSISTANT_IDS)) {
        console.log(`Processing ${variant} assistant...`);

        // Fetch current configuration
        const assistant = await fetchAssistant(assistantId, vapiPrivateKey);

        if (!assistant) {
          results[variant as keyof typeof results] = {
            success: false,
            message: 'Failed to fetch assistant'
          };
          continue;
        }

        // Get current system prompt
        let currentPrompt = '';

        if (assistant.model?.systemPrompt) {
          currentPrompt = assistant.model.systemPrompt;
        } else if (assistant.model?.messages) {
          const systemMessage = assistant.model.messages.find(m => m.role === 'system');
          if (systemMessage) {
            currentPrompt = systemMessage.content;
          }
        }

        // Check if recentChats section already exists
        if (currentPrompt.includes('{{recentChats}}')) {
          results[variant as keyof typeof results] = {
            success: true,
            message: 'recentChats variable already present'
          };
          continue;
        }

        // Add the recent chats section
        const updatedPrompt = currentPrompt + RECENT_CHATS_SECTION;

        // Build update payload based on current structure
        const updatePayload: Record<string, unknown> = {};

        if (assistant.model?.systemPrompt !== undefined) {
          updatePayload.model = {
            ...assistant.model,
            systemPrompt: updatedPrompt
          };
        } else if (assistant.model?.messages) {
          const updatedMessages = assistant.model.messages.map(m =>
            m.role === 'system' ? { ...m, content: updatedPrompt } : m
          );
          updatePayload.model = {
            ...assistant.model,
            messages: updatedMessages
          };
        }

        // Update the assistant
        const updateSuccess = await updateAssistant(assistantId, vapiPrivateKey, updatePayload);

        results[variant as keyof typeof results] = {
          success: updateSuccess,
          message: updateSuccess ? 'Updated successfully' : 'Update failed'
        };
      }

      return new Response(
        JSON.stringify({
          success: results.claude.success && results.gpt4.success,
          results
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get voice context for a user (lightweight endpoint for cross-channel memory)
    // Used by vapiService as fallback when client-side RLS query fails
    // UPDATED: Now queries agent_conversations directly (PRIMARY SOURCE)
    if (action === 'get_voice_context') {
      if (!user_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'user_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://hpyodaugrkctagkrfofj.supabase.co';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Query recent conversations directly from agent_conversations (PRIMARY SOURCE)
        // This is where mio-chat Edge Function writes all conversations
        const response = await fetch(
          `${supabaseUrl}/rest/v1/agent_conversations?user_id=eq.${user_id}&order=created_at.desc&limit=10&select=agent_type,user_message,agent_response,created_at`,
          {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const conversations = await response.json();

        // Format as context string for voice
        // Include both user message and a snippet of agent response for context
        interface ConversationRecord {
          agent_type: string;
          user_message: string;
          agent_response: string;
          created_at: string;
        }

        const contextForVoice = (conversations || [])
          .map((c: ConversationRecord) => {
            const userMsg = c.user_message?.substring(0, 100) || '';
            const agentResp = c.agent_response?.substring(0, 150) || '';
            return `[${c.agent_type?.toUpperCase() || 'CHAT'}] User: ${userMsg}${c.user_message?.length > 100 ? '...' : ''}\nResponse: ${agentResp}${c.agent_response?.length > 150 ? '...' : ''}`;
          })
          .join('\n---\n');

        console.log(`[get_voice_context] Generated context for user ${user_id}: ${conversations?.length || 0} messages`);

        return new Response(
          JSON.stringify({
            success: true,
            context_for_voice: contextForVoice,
            message_count: conversations?.length || 0
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (fetchError) {
        console.error('[get_voice_context] Error:', fetchError);
        return new Response(
          JSON.stringify({ success: false, error: String(fetchError), context_for_voice: '' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Debug: Test context fetch for a specific user (verbose version)
    // UPDATED: Now queries agent_conversations directly (PRIMARY SOURCE)
    if (action === 'test_context_fetch') {
      if (!user_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'user_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://hpyodaugrkctagkrfofj.supabase.co';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Query agent_conversations directly (PRIMARY SOURCE)
        const response = await fetch(
          `${supabaseUrl}/rest/v1/agent_conversations?user_id=eq.${user_id}&order=created_at.desc&limit=20&select=id,agent_type,session_id,user_message,agent_response,created_at`,
          {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const conversations = await response.json();

        // Build context preview similar to get_voice_context
        interface ConversationRecord {
          id: string;
          agent_type: string;
          session_id: string;
          user_message: string;
          agent_response: string;
          created_at: string;
        }

        const contextPreview = (conversations || [])
          .slice(0, 5)
          .map((c: ConversationRecord) => `[${c.agent_type}] ${c.user_message?.substring(0, 50)}...`)
          .join('\n');

        return new Response(
          JSON.stringify({
            success: true,
            user_id,
            source_table: 'agent_conversations',
            context_found: (conversations?.length || 0) > 0,
            total_messages: conversations?.length || 0,
            unique_sessions: [...new Set((conversations || []).map((c: ConversationRecord) => c.session_id))].length,
            agent_types: [...new Set((conversations || []).map((c: ConversationRecord) => c.agent_type))],
            context_preview: contextPreview,
            sample_records: (conversations || []).slice(0, 3).map((c: ConversationRecord) => ({
              id: c.id,
              agent_type: c.agent_type,
              session_id: c.session_id,
              user_message_preview: c.user_message?.substring(0, 100),
              agent_response_preview: c.agent_response?.substring(0, 100),
              created_at: c.created_at
            }))
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (fetchError) {
        return new Response(
          JSON.stringify({ success: false, error: String(fetchError) }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unknown action. Use "get_current", "add_pronunciation_guide", "fix_name_pronunciation", "add_recent_chats", "get_voice_context", or "test_context_fetch"'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[vapi-update-assistant] Exception:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
