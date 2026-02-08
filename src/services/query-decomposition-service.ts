// ============================================================================
// QUERY DECOMPOSITION SERVICE
// Breaks complex user messages into focused sub-queries, each targeting a
// specific relational domain. This catches connections the user didn't
// explicitly state.
//
// Example: "We fight about money and he shuts down"
//   → Sub-query 1: "financial conflict in relationships" (financial_mens)
//   → Sub-query 2: "stonewalling withdrawal pattern" (communication_conflict)
//   → Sub-query 3: "pursuer-withdrawer dynamic" (foundation_attachment)
//
// Each sub-query gets its own embedding and vector search, results are
// merged and deduplicated by chunk ID.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { RAGProfileContext } from './relational-profile-service';
import type { TriageDecision } from './relational-triage-service';

// ============================================================================
// TYPES
// ============================================================================

export interface SubQuery {
  query_text: string;
  target_domain: string;
  reasoning: string;
  priority: number; // 1-3, 1 = highest
}

export interface DecompositionResult {
  sub_queries: SubQuery[];
  is_complex: boolean; // True if decomposition was meaningful
  method: 'rule_based' | 'llm' | 'passthrough';
  original_query: string;
}

// ============================================================================
// DOMAIN SIGNAL MAP
// Maps linguistic signals to framework domains for rule-based decomposition
// ============================================================================

const DOMAIN_SIGNALS: Record<string, { domain: string; patterns: RegExp[]; boost_query: string }> = {
  financial: {
    domain: 'financial_mens',
    patterns: [/\b(money|debt|spend|bills?|budget|income|salary|afford|financial|broke|job|work|paycheck|provider)\b/i],
    boost_query: 'financial stress and conflict in relationships',
  },
  communication: {
    domain: 'communication_conflict',
    patterns: [/\b(talk|communicate|listen|express|words|conversation|silent treatment|shut(s)? down|won't talk|yell|scream)\b/i],
    boost_query: 'communication breakdown patterns in couples',
  },
  attachment: {
    domain: 'foundation_attachment',
    patterns: [/\b(needy|clingy|distant|avoidant|anxious|withdraw|push away|pull away|space|smother|chase|run)\b/i],
    boost_query: 'attachment style dynamics in romantic relationships',
  },
  intimacy: {
    domain: 'foundation_attachment',
    patterns: [/\b(sex|intimate|passion|desire|touch|affection|bedroom|physical|closeness|turned on|libido)\b/i],
    boost_query: 'sexual intimacy and desire discrepancy in couples',
  },
  trust: {
    domain: 'addiction_codependency',
    patterns: [/\b(trust|cheat|affair|lie|lying|secret|suspicious|betray|unfaithful|found out|messages)\b/i],
    boost_query: 'trust betrayal and recovery in relationships',
  },
  trauma: {
    domain: 'trauma_nervous_system',
    patterns: [/\b(trauma|triggered|flashback|childhood|abuse history|ptsd|nervous system|overwhelm|freeze|fight or flight)\b/i],
    boost_query: 'trauma responses affecting relationship dynamics',
  },
  parenting: {
    domain: 'foundation_attachment',
    patterns: [/\b(kids?|children|parent|co-?parent|custody|step|discipline|school|baby|teenager)\b/i],
    boost_query: 'parenting disagreements and co-parenting stress',
  },
  abuse: {
    domain: 'abuse_narcissism',
    patterns: [/\b(abuse|control|manipulat|narciss|gasligh|isolat|threaten|hit|scared of)\b/i],
    boost_query: 'identifying abuse patterns and safety planning',
  },
  cultural: {
    domain: 'cultural_context',
    patterns: [/\b(culture|religion|church|faith|god|pastor|family tradition|race|interracial|background|values|beliefs)\b/i],
    boost_query: 'cultural and religious factors in relationship conflict',
  },
  addiction: {
    domain: 'addiction_codependency',
    patterns: [/\b(addict|drink|alcohol|drug|gambling|porn|substance|sober|recovery|relapse|high|using)\b/i],
    boost_query: 'addiction impact on intimate relationships',
  },
  identity: {
    domain: 'financial_mens',
    patterns: [/\b(who am i|lost myself|identity|purpose|self-esteem|confidence|worth|man enough|emasculated)\b/i],
    boost_query: 'identity crisis and self-worth in relationships',
  },
  modern_threats: {
    domain: 'modern_threats',
    patterns: [/\b(social media|instagram|phone|screen|online|tiktok|gaming|video game|always on (his|her) phone)\b/i],
    boost_query: 'technology and social media impact on relationships',
  },
};

// ============================================================================
// RULE-BASED DECOMPOSITION (Fast, always available)
// ============================================================================

function decomposeViaRules(
  message: string,
  profile?: RAGProfileContext,
): SubQuery[] {
  const queries: SubQuery[] = [];
  const detectedDomains = new Set<string>();

  // Detect domains from message
  for (const [signalName, signal] of Object.entries(DOMAIN_SIGNALS)) {
    for (const pattern of signal.patterns) {
      if (pattern.test(message)) {
        if (!detectedDomains.has(signal.domain)) {
          detectedDomains.add(signal.domain);
          queries.push({
            query_text: signal.boost_query,
            target_domain: signal.domain,
            reasoning: `Detected ${signalName} signal in message`,
            priority: queries.length + 1,
          });
        }
        break;
      }
    }
  }

  // Add profile-informed queries
  if (profile) {
    // If user has known attachment pattern, always search for it
    if (profile.primary_pattern !== 'unassessed' && !detectedDomains.has('foundation_attachment')) {
      queries.push({
        query_text: `${profile.primary_pattern.replace(/_/g, ' ')} dynamic in relationships`,
        target_domain: 'foundation_attachment',
        reasoning: `User's known pattern: ${profile.primary_pattern}`,
        priority: queries.length + 1,
      });
    }

    // If user has known triggers, add a trigger-specific query
    if (profile.known_triggers.length > 0) {
      const triggerQuery = `relationship triggers: ${profile.known_triggers.slice(0, 3).join(', ')}`;
      queries.push({
        query_text: triggerQuery,
        target_domain: 'trauma_nervous_system',
        reasoning: 'User has known triggers that may be relevant',
        priority: queries.length + 1,
      });
    }
  }

  return queries.slice(0, 4); // Max 4 sub-queries
}

// ============================================================================
// LLM-BASED DECOMPOSITION (More accurate, requires Edge Function)
// ============================================================================

async function decomposeViaLLM(
  message: string,
  profile?: RAGProfileContext,
  triage?: TriageDecision,
): Promise<SubQuery[] | null> {
  const profileContext = profile ? `
User context: attachment=${profile.attachment_style}, pattern=${profile.primary_pattern}, issues=${profile.key_issues.join(',')}, stage=${profile.life_stage}` : '';

  const triageContext = triage ? `
Triage: ${triage.triage_color}, domains=${triage.recommended_domains.join(',')}` : '';

  try {
    const { data, error } = await supabase.functions.invoke('decompose-query', {
      body: {
        message,
        profile_context: profileContext,
        triage_context: triageContext,
      },
    });

    if (error || !data?.sub_queries) return null;

    return (data.sub_queries as SubQuery[]).slice(0, 4);
  } catch {
    return null;
  }
}

// ============================================================================
// MAIN DECOMPOSITION FUNCTION
// ============================================================================

/**
 * Decompose a user message into focused sub-queries.
 * Uses rule-based decomposition by default, LLM for complex messages.
 */
export async function decomposeQuery(
  message: string,
  options: {
    profile?: RAGProfileContext;
    triage?: TriageDecision;
    useLLM?: boolean;
  } = {},
): Promise<DecompositionResult> {
  // Always run rule-based first
  const ruleQueries = decomposeViaRules(message, options.profile);

  // If message is short/simple or only 1 domain detected, passthrough
  if (ruleQueries.length <= 1 && message.split(' ').length < 15) {
    return {
      sub_queries: [],
      is_complex: false,
      method: 'passthrough',
      original_query: message,
    };
  }

  // Try LLM decomposition for complex messages
  if (options.useLLM && ruleQueries.length >= 2) {
    const llmQueries = await decomposeViaLLM(message, options.profile, options.triage);
    if (llmQueries && llmQueries.length > 0) {
      return {
        sub_queries: llmQueries,
        is_complex: true,
        method: 'llm',
        original_query: message,
      };
    }
  }

  return {
    sub_queries: ruleQueries,
    is_complex: ruleQueries.length >= 2,
    method: 'rule_based',
    original_query: message,
  };
}
