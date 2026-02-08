// ============================================================================
// HyDE SERVICE (Hypothetical Document Embeddings)
// Instead of embedding the user's raw question, we first generate what an
// ideal answer WOULD look like, then embed THAT. This dramatically improves
// retrieval accuracy (20-40% in benchmarks) because the hypothetical answer
// is semantically closer to the actual knowledge chunks than a short question.
//
// Pipeline:
//   User Question → Generate Hypothetical Answer → Embed Answer → Vector Search
//
// Fallback: If generation fails, falls back to direct question embedding.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { RAGProfileContext } from './relational-profile-service';
import type { TriageDecision } from './relational-triage-service';

// ============================================================================
// TYPES
// ============================================================================

export interface HyDEResult {
  hypothetical_answer: string;
  method: 'hyde' | 'direct';
  generation_time_ms: number;
}

// ============================================================================
// HYPOTHETICAL ANSWER GENERATION
// ============================================================================

const HYDE_SYSTEM_PROMPT = `You are a world-class relational therapist with expertise in:
- Gottman Method (Four Horsemen, Sound Relationship House)
- Emotionally Focused Therapy (Sue Johnson)
- Attachment Theory (Bowlby, Hazan & Shaver)
- Internal Family Systems (Richard Schwartz)
- Nonviolent Communication (Marshall Rosenberg)
- Trauma-Informed approaches (Polyvagal Theory, Window of Tolerance)
- Cultural and faith-sensitive relationship dynamics

Given a person's question about their relationship, write a comprehensive therapeutic response that:
1. Names the likely pattern/dynamic at play
2. References specific frameworks and techniques
3. Provides concrete, actionable guidance
4. Addresses the emotional undercurrent, not just the surface issue

Write 150-250 words. Be specific and clinical. Reference framework names directly.
Do NOT include pleasantries, greetings, or meta-commentary. Jump straight to the therapeutic content.`;

function buildHyDEPrompt(
  userMessage: string,
  profile?: RAGProfileContext,
  triage?: TriageDecision,
): string {
  const parts: string[] = [];

  parts.push(`USER'S QUESTION: "${userMessage}"`);

  if (profile && profile.profile_completeness > 0.1) {
    const contextParts: string[] = [];
    if (profile.attachment_style !== 'unassessed') {
      contextParts.push(`Attachment: ${profile.attachment_style}`);
    }
    if (profile.partner_attachment_style !== 'unknown') {
      contextParts.push(`Partner attachment: ${profile.partner_attachment_style}`);
    }
    if (profile.primary_pattern !== 'unassessed') {
      contextParts.push(`Pattern: ${profile.primary_pattern}`);
    }
    if (profile.key_issues.length > 0) {
      contextParts.push(`Issues: ${profile.key_issues.join(', ')}`);
    }
    if (profile.life_stage) {
      contextParts.push(`Stage: ${profile.life_stage}`);
    }
    if (contextParts.length > 0) {
      parts.push(`\nKNOWN CONTEXT: ${contextParts.join(' | ')}`);
    }
  }

  if (triage) {
    parts.push(`\nTRIAGE: ${triage.triage_color} | Domains: ${triage.recommended_domains.join(', ')} | Frameworks: ${triage.recommended_frameworks.join(', ')}`);
  }

  parts.push('\nWrite the ideal therapeutic response for this person:');

  return parts.join('\n');
}

/**
 * Generate a hypothetical ideal answer for HyDE embedding.
 * Uses Supabase Edge Function to call Claude/OpenAI.
 */
export async function generateHypotheticalAnswer(
  userMessage: string,
  profile?: RAGProfileContext,
  triage?: TriageDecision,
): Promise<HyDEResult> {
  const startTime = Date.now();

  try {
    // Build the prompt
    const prompt = buildHyDEPrompt(userMessage, profile, triage);

    // Call via Supabase Edge Function (keeps API keys server-side)
    const { data, error } = await supabase.functions.invoke('generate-hyde', {
      body: {
        system_prompt: HYDE_SYSTEM_PROMPT,
        user_prompt: prompt,
        max_tokens: 400,
        temperature: 0.3, // Low temp for focused, factual output
      },
    });

    if (error || !data?.text) {
      console.warn('HyDE generation via Edge Function failed, falling back to direct:', error?.message);
      return {
        hypothetical_answer: userMessage,
        method: 'direct',
        generation_time_ms: Date.now() - startTime,
      };
    }

    return {
      hypothetical_answer: data.text,
      method: 'hyde',
      generation_time_ms: Date.now() - startTime,
    };
  } catch (err) {
    console.warn('HyDE generation failed, using direct embedding:', err);
    return {
      hypothetical_answer: userMessage,
      method: 'direct',
      generation_time_ms: Date.now() - startTime,
    };
  }
}

/**
 * Combine user message with hypothetical answer for embedding.
 * Uses a weighted approach: 30% original question + 70% hypothetical.
 * Since we can only embed one string, we concatenate with the hypothetical
 * answer weighted by appearing first (embedding models weight earlier tokens more).
 */
export function composeEmbeddingInput(
  userMessage: string,
  hydeResult: HyDEResult,
): string {
  if (hydeResult.method === 'direct') {
    return userMessage;
  }

  // Place hypothetical first (more semantic weight) + original question for grounding
  return `${hydeResult.hypothetical_answer}\n\n---\nOriginal question: ${userMessage}`;
}
