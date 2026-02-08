// ============================================================================
// AFFECT DETECTION SERVICE
// Detects emotional state from user messages using linguistic pattern analysis.
// Runs BEFORE triage to add emotional context to the RAG pipeline.
//
// Two-layer approach:
//   Layer 1: Fast regex/keyword analysis (always runs, ~1ms)
//   Layer 2: LLM-based affect classification (optional, ~200ms)
//
// The combination catches both explicit emotional language and subtle
// linguistic markers like minimizing, intellectualizing, and flooding.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type PrimaryEmotion =
  | 'anger'
  | 'sadness'
  | 'fear'
  | 'shame'
  | 'confusion'
  | 'hope'
  | 'joy'
  | 'frustration'
  | 'grief'
  | 'relief'
  | 'disgust'
  | 'neutral';

export type EnergyLevel = 'high_arousal' | 'moderate' | 'low_energy' | 'shutdown';

export type ReadinessForChange =
  | 'precontemplation'
  | 'contemplation'
  | 'preparation'
  | 'action'
  | 'maintenance';

export interface LinguisticMarkers {
  minimizing: boolean;         // "I guess it's fine", "it's not that bad"
  overgeneralizing: boolean;   // "He ALWAYS does this", "NEVER listens"
  helplessness: boolean;       // "I don't even know why I try", "nothing works"
  breakthrough_signal: boolean; // "We actually talked", "I realized something"
  emotional_flooding: boolean;  // All caps, multiple exclamation marks, run-on
  humor_as_defense: boolean;   // "lol", "haha", deflecting with jokes
  intellectualizing: boolean;  // Clinical language to avoid feeling
  blame_external: boolean;     // "It's all their fault", "they made me"
  self_blame: boolean;         // "It's all my fault", "I ruined everything"
  catastrophizing: boolean;    // "It's over", "nothing will ever change"
  seeking_permission: boolean; // "Is it okay to feel...", "Am I wrong for..."
}

export interface AffectProfile {
  // Core affect
  emotional_intensity: number; // 1-10
  primary_emotion: PrimaryEmotion;
  secondary_emotion: PrimaryEmotion | null;
  energy_level: EnergyLevel;
  readiness_for_change: ReadinessForChange;

  // Linguistic analysis
  markers: LinguisticMarkers;

  // Recommended response approach
  recommended_depth: 'validation_only' | 'psychoeducation' | 'framework' | 'action';

  // Confidence
  confidence: number; // 0-1
  analysis_method: 'regex' | 'llm' | 'hybrid';
}

// ============================================================================
// EMOTION DETECTION PATTERNS
// ============================================================================

const EMOTION_PATTERNS: Record<PrimaryEmotion, RegExp[]> = {
  anger: [
    /\b(furious|angry|rage|pissed|mad|livid|irate|fuming|heated|seething)\b/i,
    /\b(sick of|fed up|can't stand|had enough|done with)\b/i,
    /!{2,}/,
  ],
  sadness: [
    /\b(sad|crying|tears|heartbroken|devastated|depressed|miserable|hopeless|crushed)\b/i,
    /\b(miss (him|her|them|us)|wish things were|mourn|griev)\b/i,
  ],
  fear: [
    /\b(scared|afraid|terrified|anxious|worried|panic|dread|nervous|frightened)\b/i,
    /\b(what if|i'm afraid|scared that|fear that|terrified of)\b/i,
  ],
  shame: [
    /\b(ashamed|embarrassed|humiliated|worthless|pathetic|disgusting|failure)\b/i,
    /\b(i'm (a|the) (worst|terrible|horrible|bad)|i don't deserve)\b/i,
  ],
  confusion: [
    /\b(confused|don't understand|don't know what|lost|mixed signals|makes no sense)\b/i,
    /\b(i don't get (it|why)|what (does|did) (that|this) mean|am i crazy)\b/i,
  ],
  hope: [
    /\b(hopeful|optimistic|better|progress|improving|positive|encouraged)\b/i,
    /\b(things are getting|we're starting to|i think we can|there's a chance)\b/i,
  ],
  joy: [
    /\b(happy|grateful|thankful|blessed|amazing|wonderful|great|love)\b/i,
    /\b(breakthrough|finally|it worked|so proud|incredible)\b/i,
  ],
  frustration: [
    /\b(frustrat|annoyed|irritated|exasperated|tiresome|tedious)\b/i,
    /\b(same thing|over and over|keeps happening|won't change|still doing)\b/i,
  ],
  grief: [
    /\b(griev|loss|lost|death|died|passed away|gone|mourning)\b/i,
    /\b(miss (my|our)|can't believe (they're|it's) gone|never (see|hear|hold))\b/i,
  ],
  relief: [
    /\b(relief|relieved|weight off|finally|breathe|let go)\b/i,
    /\b(it's over|we made it|survived|through the worst)\b/i,
  ],
  disgust: [
    /\b(disgust|gross|repulsed|sick|nauseated|revolting|vile)\b/i,
    /\b(makes me sick|can't look at|turns my stomach)\b/i,
  ],
  neutral: [],
};

// ============================================================================
// LINGUISTIC MARKER DETECTION
// ============================================================================

function detectLinguisticMarkers(message: string): LinguisticMarkers {
  const lower = message.toLowerCase();

  return {
    minimizing: /\b(i guess|it's (fine|okay|whatever|not that bad|no big deal)|doesn't matter|i'm (fine|okay|good)|not a big deal)\b/i.test(message),

    overgeneralizing: /\b(always|never|every time|all the time|constantly|nothing ever|everything is)\b/i.test(message) &&
      (message.includes('ALWAYS') || message.includes('NEVER') || /\b(always|never)\b/i.test(message)),

    helplessness: /\b(give up|no point|why (bother|try)|nothing (works|changes|helps)|can't (do|take|handle) (this|it) anymore|what's the point|pointless)\b/i.test(message),

    breakthrough_signal: /\b(we (actually|finally) (talked|communicated|listened)|i (realized|noticed|understood)|something (shifted|changed|clicked)|for the first time|breakthrough|progress)\b/i.test(message),

    emotional_flooding: (
      (message.match(/[A-Z]{3,}/g) || []).length >= 3 || // Multiple all-caps words
      (message.match(/!{2,}/g) || []).length >= 2 ||     // Multiple exclamation marks
      message.length > 500 ||                             // Very long message (stream of consciousness)
      (message.match(/\band\b/gi) || []).length >= 5      // Run-on "and...and...and"
    ),

    humor_as_defense: /\b(lol|lmao|haha|jk|just kidding|😂|🤣|i'm joking|but whatever|ha)\b/i.test(message) &&
      (/\b(sad|hurt|angry|scared|afraid|worried)\b/i.test(message) || lower.includes('but')),

    intellectualizing: /\b(attachment (style|theory)|cognitive|neural|psycholog|narcissis|codepend|trauma bond|gaslighting|stonewalling|four horsemen)\b/i.test(message) &&
      !(/ i (feel|felt|am feeling)\b/i.test(message)),

    blame_external: /\b(it's (all )?(his|her|their) fault|they (made|forced|caused)|because of (him|her|them)|they're the (one|reason|problem))\b/i.test(message),

    self_blame: /\b(it's (all )?my fault|i (ruined|destroyed|messed up|broke)|i'm the (problem|reason|one)|i caused|i deserve (this|it))\b/i.test(message),

    catastrophizing: /\b(it's over|done|finished|ruined|destroyed|never going to|end of|no hope|too late|beyond repair|can't be fixed)\b/i.test(message),

    seeking_permission: /\b(is it (okay|normal|wrong|bad) (to|that|if)|am i (wrong|crazy|overreacting)|should i (feel|be)|can i|is this normal)\b/i.test(message),
  };
}

// ============================================================================
// CORE DETECTION (Layer 1 - Fast Regex)
// ============================================================================

function detectEmotions(message: string): { primary: PrimaryEmotion; secondary: PrimaryEmotion | null; intensity: number } {
  const scores: Record<PrimaryEmotion, number> = {
    anger: 0, sadness: 0, fear: 0, shame: 0, confusion: 0,
    hope: 0, joy: 0, frustration: 0, grief: 0, relief: 0,
    disgust: 0, neutral: 0,
  };

  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = message.match(pattern);
      if (matches) {
        scores[emotion as PrimaryEmotion] += matches.length;
      }
    }
  }

  // Boost scores for emphasis indicators
  const capsWords = (message.match(/[A-Z]{2,}/g) || []).length;
  const exclamations = (message.match(/!/g) || []).length;
  const questionMarks = (message.match(/\?/g) || []).length;

  // Sort by score
  const sorted = Object.entries(scores)
    .filter(([key]) => key !== 'neutral')
    .sort((a, b) => b[1] - a[1]);

  const primary = sorted[0][1] > 0 ? sorted[0][0] as PrimaryEmotion : 'neutral';
  const secondary = sorted[1][1] > 0 ? sorted[1][0] as PrimaryEmotion : null;

  // Calculate intensity (1-10)
  let intensity = Math.min(sorted[0][1] * 2, 7); // Base from match count
  intensity += Math.min(capsWords * 0.5, 1.5);   // Caps boost
  intensity += Math.min(exclamations * 0.3, 1);   // Exclamation boost
  intensity += Math.min(questionMarks * 0.2, 0.5); // Question uncertainty
  intensity = Math.max(1, Math.min(10, Math.round(intensity)));

  return { primary, secondary, intensity };
}

function detectEnergyLevel(message: string, intensity: number, markers: LinguisticMarkers): EnergyLevel {
  if (markers.emotional_flooding || intensity >= 8) return 'high_arousal';
  if (markers.helplessness || message.length < 20) return 'shutdown';
  if (intensity <= 3 && markers.minimizing) return 'low_energy';
  return 'moderate';
}

function detectReadiness(message: string, markers: LinguisticMarkers): ReadinessForChange {
  if (markers.breakthrough_signal) return 'action';
  if (/\b(want to (try|change|work on|improve)|ready to|going to|plan to|i will)\b/i.test(message)) return 'preparation';
  if (/\b(i (know|realize|see|understand) (that|i need)|maybe i should|thinking about)\b/i.test(message)) return 'contemplation';
  if (markers.helplessness || /\b(nothing (wrong|to change)|fine the way|don't need)\b/i.test(message)) return 'precontemplation';
  return 'contemplation'; // Default
}

function determineResponseDepth(
  intensity: number,
  energy: EnergyLevel,
  readiness: ReadinessForChange,
  markers: LinguisticMarkers,
): AffectProfile['recommended_depth'] {
  // Flooded or shutdown → validation only (no teaching)
  if (energy === 'high_arousal' || energy === 'shutdown') return 'validation_only';
  if (markers.emotional_flooding) return 'validation_only';
  if (intensity >= 8) return 'validation_only';

  // Processing but not ready for action
  if (readiness === 'precontemplation' || readiness === 'contemplation') return 'psychoeducation';

  // Ready and motivated
  if (readiness === 'action' || readiness === 'maintenance') return 'action';

  // Default: teach frameworks
  return 'framework';
}

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Detect affect from a user message.
 * Layer 1 (regex) always runs. Layer 2 (LLM) is optional and enhances accuracy.
 */
export async function detectAffect(
  message: string,
  options: {
    useLLM?: boolean;
    conversationHistory?: string[];
  } = {},
): Promise<AffectProfile> {
  // Layer 1: Fast regex analysis
  const { primary, secondary, intensity } = detectEmotions(message);
  const markers = detectLinguisticMarkers(message);
  const energy = detectEnergyLevel(message, intensity, markers);
  const readiness = detectReadiness(message, markers);
  const depth = determineResponseDepth(intensity, energy, readiness, markers);

  let analysisMethod: AffectProfile['analysis_method'] = 'regex';
  let confidence = 0.6;
  let finalPrimary = primary;
  let finalSecondary = secondary;
  let finalIntensity = intensity;

  // Layer 2: Optional LLM enhancement
  if (options.useLLM && message.length > 30) {
    try {
      const llmResult = await detectAffectViaLLM(message, options.conversationHistory);
      if (llmResult) {
        finalPrimary = llmResult.primary_emotion;
        finalSecondary = llmResult.secondary_emotion;
        finalIntensity = llmResult.intensity;
        confidence = 0.85;
        analysisMethod = 'hybrid';
      }
    } catch {
      // LLM failed, use regex results
    }
  }

  // Boost confidence if multiple signals align
  if (markers.emotional_flooding && finalIntensity >= 7) confidence += 0.05;
  if (markers.breakthrough_signal && (finalPrimary === 'hope' || finalPrimary === 'joy')) confidence += 0.05;

  return {
    emotional_intensity: finalIntensity,
    primary_emotion: finalPrimary,
    secondary_emotion: finalSecondary,
    energy_level: energy,
    readiness_for_change: readiness,
    markers,
    recommended_depth: depth,
    confidence: Math.min(confidence, 1.0),
    analysis_method: analysisMethod,
  };
}

// ============================================================================
// LAYER 2: LLM-BASED AFFECT CLASSIFICATION
// ============================================================================

interface LLMAffectResult {
  primary_emotion: PrimaryEmotion;
  secondary_emotion: PrimaryEmotion | null;
  intensity: number;
}

async function detectAffectViaLLM(
  message: string,
  conversationHistory?: string[],
): Promise<LLMAffectResult | null> {
  const contextMessages = conversationHistory?.slice(-3).join('\n') || '';

  const { data, error } = await supabase.functions.invoke('detect-affect', {
    body: {
      message,
      context: contextMessages,
    },
  });

  if (error || !data) return null;

  return {
    primary_emotion: data.primary_emotion as PrimaryEmotion,
    secondary_emotion: data.secondary_emotion as PrimaryEmotion | null,
    intensity: data.intensity as number,
  };
}

// ============================================================================
// ESCALATION DETECTION
// ============================================================================

export interface EscalationProfile {
  is_escalating: boolean;
  escalation_rate: number; // 0-1, how fast intensity is rising
  trajectory: 'escalating' | 'stable' | 'de_escalating' | 'unknown';
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  recommended_intervention: string;
}

/**
 * Detect escalation patterns across a conversation.
 */
export function detectEscalation(
  affectHistory: AffectProfile[],
): EscalationProfile {
  if (affectHistory.length < 2) {
    return {
      is_escalating: false,
      escalation_rate: 0,
      trajectory: 'unknown',
      urgency_level: 'low',
      recommended_intervention: 'standard_coaching',
    };
  }

  // Calculate intensity trend
  const intensities = affectHistory.map(a => a.emotional_intensity);
  const recentThree = intensities.slice(-3);

  let trajectory: EscalationProfile['trajectory'] = 'stable';
  let escalationRate = 0;

  if (recentThree.length >= 2) {
    const diff = recentThree[recentThree.length - 1] - recentThree[0];
    escalationRate = Math.abs(diff) / recentThree.length / 10;

    if (diff > 2) trajectory = 'escalating';
    else if (diff < -2) trajectory = 'de_escalating';
    else trajectory = 'stable';
  }

  // Check for emotional type escalation (fear → anger → desperation)
  const lastAffect = affectHistory[affectHistory.length - 1];
  const dangerEmotions: PrimaryEmotion[] = ['anger', 'fear', 'shame', 'grief'];
  const dangerMarkers = lastAffect.markers.helplessness ||
    lastAffect.markers.catastrophizing ||
    lastAffect.energy_level === 'shutdown';

  let urgencyLevel: EscalationProfile['urgency_level'] = 'low';
  if (trajectory === 'escalating' && dangerMarkers) urgencyLevel = 'critical';
  else if (trajectory === 'escalating' && dangerEmotions.includes(lastAffect.primary_emotion)) urgencyLevel = 'high';
  else if (trajectory === 'escalating') urgencyLevel = 'medium';
  else if (dangerMarkers) urgencyLevel = 'medium';

  const interventions: Record<string, string> = {
    critical: 'immediate_grounding_and_safety_check',
    high: 'validation_and_de_escalation',
    medium: 'empathic_reflection_before_content',
    low: 'standard_coaching',
  };

  return {
    is_escalating: trajectory === 'escalating',
    escalation_rate: escalationRate,
    trajectory,
    urgency_level: urgencyLevel,
    recommended_intervention: interventions[urgencyLevel],
  };
}
