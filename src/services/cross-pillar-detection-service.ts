// ============================================================================
// CROSS-PILLAR DETECTION SERVICE
// Detects when the "real" problem lives in a different pillar than the one
// the user is presenting. 70% of "communication problems" have a root cause
// in another domain: physical (sleep deprivation), financial (money shame),
// mental (depression), or spiritual (purpose crisis).
//
// This is what makes the system say "I think the real issue isn't your
// communication - it's the financial stress that's making you both reactive."
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { AffectProfile } from './affect-detection-service';
import type { RAGProfileContext } from './relational-profile-service';

// ============================================================================
// TYPES
// ============================================================================

export interface CrossPillarSignals {
  detected_pillars: PillarSignal[];
  primary_pillar: string; // May not be 'relational'
  root_cause_hypothesis: string | null;
  cross_pillar_chunks_needed: boolean;
  trigger_matches: TriggerMatch[];
}

export interface PillarSignal {
  pillar: 'physical' | 'financial' | 'mental' | 'spiritual' | 'relational';
  confidence: number; // 0-1
  evidence: string[];
}

export interface TriggerMatch {
  trigger_event: string;
  keywords_matched: string[];
  affected_pillars: string[];
  presenting_symptom: string;
  root_cause: string;
  recommended_domains: string[];
}

// ============================================================================
// PILLAR DETECTION RULES
// ============================================================================

const PILLAR_SIGNALS: Record<string, { pillar: PillarSignal['pillar']; patterns: RegExp[]; weight: number }[]> = {
  physical: [
    { pillar: 'physical', patterns: [/\b(exhausted|tired|no energy|fatigue|drained|depleted|burnt out|burnout)\b/i], weight: 0.7 },
    { pillar: 'physical', patterns: [/\b(can't sleep|insomnia|sleep|not sleeping|up all night|waking up)\b/i], weight: 0.8 },
    { pillar: 'physical', patterns: [/\b(sick|illness|chronic|pain|hospital|surgery|diagnosed|medication|health)\b/i], weight: 0.6 },
    { pillar: 'physical', patterns: [/\b(pregnant|pregnancy|postpartum|baby|nursing|breastfeeding)\b/i], weight: 0.7 },
    { pillar: 'physical', patterns: [/\b(weight|eating|appetite|exercise|workout|gym)\b/i], weight: 0.4 },
    { pillar: 'physical', patterns: [/\b(headache|migraine|body ache|back pain|neck pain)\b/i], weight: 0.5 },
  ],
  financial: [
    { pillar: 'financial', patterns: [/\b(money|financial|debt|bills?|budget|afford|expensive|cost)\b/i], weight: 0.8 },
    { pillar: 'financial', patterns: [/\b(job|work|career|laid off|fired|unemployed|salary|income|paycheck)\b/i], weight: 0.7 },
    { pillar: 'financial', patterns: [/\b(rent|mortgage|house payment|foreclosure|eviction)\b/i], weight: 0.8 },
    { pillar: 'financial', patterns: [/\b(provider|breadwinner|can't provide|making ends meet)\b/i], weight: 0.7 },
    { pillar: 'financial', patterns: [/\b(spending|shopping|credit card|loan|bankruptcy|broke)\b/i], weight: 0.7 },
  ],
  mental: [
    { pillar: 'mental', patterns: [/\b(depress(ed|ion)|anxiety|anxious|panic|mental health)\b/i], weight: 0.8 },
    { pillar: 'mental', patterns: [/\b(therapy|therapist|counselor|psychiatrist|medication|meds|antidepressant)\b/i], weight: 0.6 },
    { pillar: 'mental', patterns: [/\b(bipolar|adhd|ocd|ptsd|borderline|diagnosis|disorder)\b/i], weight: 0.7 },
    { pillar: 'mental', patterns: [/\b(suicidal|self-harm|cutting|overdose|want to die|end it)\b/i], weight: 0.95 },
    { pillar: 'mental', patterns: [/\b(overwhelm|can't cope|falling apart|losing (my|it)|breaking down)\b/i], weight: 0.6 },
  ],
  spiritual: [
    { pillar: 'spiritual', patterns: [/\b(purpose|meaning|why am i|what's the point|existential|empty inside)\b/i], weight: 0.7 },
    { pillar: 'spiritual', patterns: [/\b(faith|god|church|pray|spiritual|soul|spirit|believe|religion)\b/i], weight: 0.6 },
    { pillar: 'spiritual', patterns: [/\b(lost|stuck|trapped|going nowhere|meaningless|what's it all for)\b/i], weight: 0.5 },
    { pillar: 'spiritual', patterns: [/\b(calling|destiny|legacy|impact|contribution|bigger than)\b/i], weight: 0.5 },
    { pillar: 'spiritual', patterns: [/\b(midlife|quarter-life|identity crisis|who am i|don't know who)\b/i], weight: 0.6 },
  ],
};

// ============================================================================
// CROSS-PILLAR CASCADE PATTERNS
// When physical/financial/mental stressors masquerade as relationship problems
// ============================================================================

const CASCADE_PATTERNS: Array<{
  trigger_pillars: string[];
  presenting_as: string;
  root_hypothesis: string;
  keywords: RegExp[];
}> = [
  {
    trigger_pillars: ['physical'],
    presenting_as: 'We keep fighting about everything',
    root_hypothesis: 'Sleep deprivation or physical exhaustion reducing emotional regulation capacity - the fights are a symptom, not the cause',
    keywords: [/\b(exhausted|tired|not sleeping|no sleep)\b/i, /\b(fight|argue|snap|irritable)\b/i],
  },
  {
    trigger_pillars: ['financial'],
    presenting_as: 'He/she is withdrawn and distant',
    root_hypothesis: 'Financial shame causing emotional withdrawal - the distance is a shame response, not a loss of love',
    keywords: [/\b(money|debt|job|work|financial)\b/i, /\b(distant|withdrawn|quiet|shut down|cold)\b/i],
  },
  {
    trigger_pillars: ['mental'],
    presenting_as: 'My partner doesn\'t care about anything',
    root_hypothesis: 'Depression manifesting as emotional flatness - what looks like apathy may be depression\'s anhedonia',
    keywords: [/\b(depress|nothing matters|doesn't care|no emotion|flat|numb)\b/i],
  },
  {
    trigger_pillars: ['financial', 'mental'],
    presenting_as: 'He\'s so controlling about everything',
    root_hypothesis: 'Financial anxiety creating controlling behavior as a coping mechanism - anxiety about money manifests as need for control',
    keywords: [/\b(money|financial|budget)\b/i, /\b(control|rules|permission|allow)\b/i],
  },
  {
    trigger_pillars: ['spiritual'],
    presenting_as: 'I feel stuck in my marriage',
    root_hypothesis: 'A purpose or identity crisis is being projected onto the relationship - the restlessness is internal, not relational',
    keywords: [/\b(stuck|trapped|purpose|meaning|more to life|is this it)\b/i],
  },
  {
    trigger_pillars: ['physical', 'mental'],
    presenting_as: 'Our sex life is dead',
    root_hypothesis: 'Physical or mental health factors (medication side effects, depression, chronic pain, hormonal changes) reducing desire - this may not be a relational issue',
    keywords: [/\b(medication|meds|depression|pain|tired|no desire|libido)\b/i, /\b(sex|intimate|desire|want|physical)\b/i],
  },
];

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Detect cross-pillar factors in a user's message.
 */
export async function detectCrossPillarFactors(
  message: string,
  profile?: RAGProfileContext,
  affect?: AffectProfile,
): Promise<CrossPillarSignals> {
  const signals: PillarSignal[] = [];
  const pillarScores: Record<string, { confidence: number; evidence: string[] }> = {};

  // Step 1: Detect pillar signals from message
  for (const [pillarName, rules] of Object.entries(PILLAR_SIGNALS)) {
    for (const rule of rules) {
      for (const pattern of rule.patterns) {
        const match = message.match(pattern);
        if (match) {
          if (!pillarScores[pillarName]) {
            pillarScores[pillarName] = { confidence: 0, evidence: [] };
          }
          pillarScores[pillarName].confidence = Math.max(pillarScores[pillarName].confidence, rule.weight);
          pillarScores[pillarName].evidence.push(match[0]);
        }
      }
    }
  }

  // Convert to signals array
  for (const [pillar, data] of Object.entries(pillarScores)) {
    signals.push({
      pillar: pillar as PillarSignal['pillar'],
      confidence: data.confidence,
      evidence: [...new Set(data.evidence)],
    });
  }

  // Step 2: Check cascade patterns
  let rootHypothesis: string | null = null;
  for (const cascade of CASCADE_PATTERNS) {
    const allKeywordsMatch = cascade.keywords.every(kw => kw.test(message));
    if (allKeywordsMatch) {
      rootHypothesis = cascade.root_hypothesis;
      break;
    }
  }

  // Step 3: Check database triggers
  const triggerMatches = await matchDatabaseTriggers(message);

  // Step 4: Determine primary pillar
  // Relational is always detected (we're in the relational pillar after all)
  signals.push({ pillar: 'relational', confidence: 0.5, evidence: ['default'] });

  signals.sort((a, b) => b.confidence - a.confidence);
  const primaryPillar = signals[0].pillar;
  const crossPillarNeeded = signals.some(s => s.pillar !== 'relational' && s.confidence >= 0.6);

  // Use trigger match hypothesis if no cascade pattern matched
  if (!rootHypothesis && triggerMatches.length > 0) {
    rootHypothesis = triggerMatches[0].root_cause;
  }

  return {
    detected_pillars: signals.filter(s => s.confidence >= 0.4),
    primary_pillar: primaryPillar,
    root_cause_hypothesis: rootHypothesis,
    cross_pillar_chunks_needed: crossPillarNeeded,
    trigger_matches: triggerMatches,
  };
}

// ============================================================================
// DATABASE TRIGGER MATCHING
// ============================================================================

async function matchDatabaseTriggers(message: string): Promise<TriggerMatch[]> {
  const { data, error } = await supabase
    .from('mio_cross_pillar_triggers')
    .select('*')
    .eq('is_active', true);

  if (error || !data) return [];

  const matches: TriggerMatch[] = [];
  const lower = message.toLowerCase();

  for (const trigger of data) {
    const matchedKeywords = (trigger.trigger_keywords as string[]).filter(
      kw => lower.includes(kw.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      matches.push({
        trigger_event: trigger.trigger_event,
        keywords_matched: matchedKeywords,
        affected_pillars: trigger.affected_pillars,
        presenting_symptom: trigger.common_presenting_symptom || '',
        root_cause: trigger.actual_root_cause || '',
        recommended_domains: trigger.recommended_domains || [],
      });
    }
  }

  // Sort by number of keyword matches (more = stronger signal)
  matches.sort((a, b) => b.keywords_matched.length - a.keywords_matched.length);

  return matches.slice(0, 3);
}

/**
 * Format cross-pillar context for the LLM system prompt.
 */
export function formatCrossPillarContext(signals: CrossPillarSignals): string {
  if (!signals.cross_pillar_chunks_needed && !signals.root_cause_hypothesis) return '';

  const lines: string[] = ['=== CROSS-PILLAR ANALYSIS ==='];

  if (signals.root_cause_hypothesis) {
    lines.push(`ROOT CAUSE HYPOTHESIS: ${signals.root_cause_hypothesis}`);
    lines.push('IMPORTANT: Address the underlying cause, not just the presenting symptom.');
  }

  const nonRelational = signals.detected_pillars.filter(s => s.pillar !== 'relational' && s.confidence >= 0.5);
  if (nonRelational.length > 0) {
    lines.push('\nOther pillars detected:');
    for (const signal of nonRelational) {
      lines.push(`  ${signal.pillar.toUpperCase()} (${(signal.confidence * 100).toFixed(0)}%): ${signal.evidence.join(', ')}`);
    }
  }

  if (signals.trigger_matches.length > 0) {
    lines.push('\nLife event triggers detected:');
    for (const trigger of signals.trigger_matches) {
      lines.push(`  ${trigger.trigger_event}: "${trigger.presenting_symptom}" → Actually: "${trigger.root_cause}"`);
    }
  }

  lines.push('\n=== END CROSS-PILLAR ANALYSIS ===');

  return lines.join('\n');
}
