// ============================================================================
// RELATIONAL TRIAGE SERVICE
// 4-color clinical routing system for MIO relational coaching
//
// Pipeline: User Message → Keyword Triage → Contraindication Detection →
//           Context Enrichment → Response Routing → Framework Selection
//
// Safety-first: RED/ORANGE override all other signals
// ============================================================================

import {
  type TriageResult,
  type TriageKeyword,
  scanForTriageKeywords,
  CRISIS_RESOURCES,
} from './relational-safety-keywords';

import {
  type TriageColor,
  type EvidenceTier,
  type FrameworkDomain,
  type FrameworkMetadata,
  type IssueType,
  type LifeStage,
  type ContraindicationCategory,
  TRIAGE_COLORS,
  EVIDENCE_TIERS,
  FRAMEWORK_METADATA,
  FRAMEWORK_DOMAINS,
  getFrameworkMetadata,
  getFrameworksByTriageColor,
} from './relational-metadata-maps';

// ============================================================================
// TYPES
// ============================================================================

export interface TriageContext {
  user_message: string;
  user_id?: string;
  life_stage?: LifeStage;
  known_issue_types?: IssueType[];
  known_contraindications?: ContraindicationCategory[];
  cultural_flags?: string[];
  conversation_history?: string[];
  relationship_season?: string;
}

export interface TriageDecision {
  // Core triage result
  triage_color: TriageColor;
  confidence: number; // 0-1

  // Keyword scan results
  keyword_matches: TriageKeyword[];
  keyword_triage: TriageResult;

  // Contraindication analysis
  active_contraindications: string[];
  excluded_frameworks: string[];

  // Framework routing
  recommended_domains: FrameworkDomain[];
  recommended_frameworks: string[];
  evidence_floor: EvidenceTier;

  // RAG search parameters (pass directly to search_mio_relational)
  search_params: RelationalSearchParams;

  // Response template
  response_template: ResponseTemplate;

  // Audit trail
  decision_chain: string[];
}

export interface RelationalSearchParams {
  filter_domains: string[] | null;
  filter_frameworks: string[] | null;
  filter_evidence_tiers: string[] | null;
  filter_triage_colors: string[] | null;
  exclude_contraindications: string[] | null;
  filter_life_stages: string[] | null;
  filter_issue_types: string[] | null;
  filter_cultural_flags: string[] | null;
  match_threshold: number;
  match_count: number;
}

export interface ResponseTemplate {
  type: 'crisis_response' | 'referral_with_support' | 'coached_monitoring' | 'full_coaching';
  preamble: string;
  include_crisis_resources: boolean;
  include_professional_referral: boolean;
  max_framework_depth: 'surface' | 'moderate' | 'deep';
  allow_homework: boolean;
  allow_reframe: boolean;
  follow_up_urgency: 'immediate' | 'within_24h' | 'next_session' | 'standard';
}

// ============================================================================
// CONTRADICTION RESOLUTION
// ============================================================================

interface ContradictionRule {
  framework_a: string;
  framework_b: string;
  condition: string;
  resolution: {
    when_true: { use: string; reason: string };
    when_false: { use: string; reason: string };
  };
  priority: number;
}

const CONTRADICTION_RULES: ContradictionRule[] = [
  // Rule 1: Gottman "Turn Toward" vs Boundaries (abuse context)
  {
    framework_a: 'gottman_method',
    framework_b: 'bancroft_why_does_he',
    condition: 'abuse_indicators_present',
    resolution: {
      when_true: { use: 'bancroft_why_does_he', reason: 'Safety overrides relationship repair when abuse is present' },
      when_false: { use: 'gottman_method', reason: 'Neglect/distance pattern, not abuse - repair is appropriate' },
    },
    priority: 10,
  },
  // Rule 2: Forgiveness Models vs Active Abuse
  {
    framework_a: 'forgiveness_models',
    framework_b: 'coercive_control_stark',
    condition: 'active_abuse',
    resolution: {
      when_true: { use: 'coercive_control_stark', reason: 'Forgiveness is harmful when abuse is ongoing' },
      when_false: { use: 'forgiveness_models', reason: 'Post-resolution forgiveness supports healing' },
    },
    priority: 10,
  },
  // Rule 3: Attachment Pursuit vs Safety
  {
    framework_a: 'emotionally_focused_therapy',
    framework_b: 'post_separation_abuse',
    condition: 'separation_with_abuse_history',
    resolution: {
      when_true: { use: 'post_separation_abuse', reason: 'Pursuing attachment with abusive partner is dangerous' },
      when_false: { use: 'emotionally_focused_therapy', reason: 'Safe attachment repair is appropriate' },
    },
    priority: 9,
  },
  // Rule 4: Couples Therapy vs Individual First
  {
    framework_a: 'gottman_method',
    framework_b: 'addiction_impact_relationships',
    condition: 'active_addiction',
    resolution: {
      when_true: { use: 'addiction_impact_relationships', reason: 'Individual recovery must precede couples work' },
      when_false: { use: 'gottman_method', reason: 'Recovery stable - couples work appropriate' },
    },
    priority: 8,
  },
  // Rule 5: Cultural Sensitivity Override
  {
    framework_a: 'boundaries_dating_cloud_townsend',
    framework_b: 'religious_faith_based_marriage',
    condition: 'faith_context_primary',
    resolution: {
      when_true: { use: 'religious_faith_based_marriage', reason: 'Faith-based framework aligns with user values' },
      when_false: { use: 'boundaries_dating_cloud_townsend', reason: 'Secular boundaries framework is appropriate' },
    },
    priority: 5,
  },
];

// ============================================================================
// ISSUE TYPE DETECTION
// ============================================================================

const ISSUE_KEYWORD_MAP: Record<IssueType, string[]> = {
  communication: ['communicate', 'talking', 'listen', 'conversation', 'express', 'words', 'saying', 'understand each other', 'miscommunication'],
  conflict: ['fight', 'argue', 'argument', 'disagreement', 'yelling', 'screaming', 'angry', 'furious', 'blow up'],
  intimacy: ['sex', 'intimate', 'physical', 'touch', 'desire', 'passion', 'bedroom', 'affection', 'closeness'],
  trust: ['trust', 'lie', 'lying', 'deceive', 'honest', 'betrayed', 'suspicious', 'secret', 'transparent'],
  abuse: ['abuse', 'hitting', 'controlling', 'manipulate', 'fear', 'scared', 'threaten', 'hurt me', 'violent'],
  addiction: ['addict', 'drinking', 'drugs', 'gambling', 'porn', 'substance', 'sober', 'recovery', 'relapse'],
  trauma: ['trauma', 'ptsd', 'flashback', 'trigger', 'childhood', 'abuse history', 'neglect', 'wound'],
  finance: ['money', 'debt', 'spending', 'budget', 'financial', 'bills', 'income', 'salary', 'expensive'],
  parenting: ['kids', 'children', 'parent', 'co-parent', 'custody', 'step', 'discipline', 'school'],
  infidelity: ['cheat', 'affair', 'unfaithful', 'other woman', 'other man', 'betrayal', 'found out'],
  emotional_disconnection: ['distant', 'disconnected', 'lonely', 'alone', 'roommate', 'numb', 'cold', 'withdrawn', 'checked out'],
  power_imbalance: ['control', 'dominate', 'submit', 'power', 'equal', 'dependent', 'one-sided', 'unfair'],
  cultural_conflict: ['culture', 'religion', 'family tradition', 'race', 'background', 'values', 'beliefs', 'heritage'],
  mental_health: ['depressed', 'anxiety', 'panic', 'bipolar', 'medication', 'therapy', 'diagnosis', 'mental health'],
  identity: ['who am i', 'lost myself', 'identity', 'purpose', 'self-esteem', 'confidence', 'worth'],
};

function detectIssueTypes(message: string): IssueType[] {
  const normalized = message.toLowerCase();
  const detected: IssueType[] = [];

  for (const [issueType, keywords] of Object.entries(ISSUE_KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        detected.push(issueType as IssueType);
        break; // One match per issue type is sufficient
      }
    }
  }

  return detected;
}

// ============================================================================
// CONTEXT CONDITION EVALUATION
// ============================================================================

function evaluateCondition(
  condition: string,
  context: TriageContext,
  triageResult: TriageResult,
  detectedIssues: IssueType[],
): boolean {
  const contraindications = context.known_contraindications || [];
  const matchedCategories = triageResult.matched_keywords.map(k => k.category);

  switch (condition) {
    case 'abuse_indicators_present':
      return (
        detectedIssues.includes('abuse') ||
        contraindications.includes('active_abuse') ||
        contraindications.includes('coercive_control_present') ||
        matchedCategories.includes('violence') ||
        matchedCategories.includes('abuse_pattern')
      );

    case 'active_abuse':
      return (
        contraindications.includes('active_abuse') ||
        contraindications.includes('active_violence') ||
        triageResult.triage_color === 'red'
      );

    case 'separation_with_abuse_history':
      return (
        (context.life_stage === 'separation' || context.life_stage === 'divorce') &&
        (contraindications.includes('active_abuse') ||
         contraindications.includes('coercive_control_present') ||
         matchedCategories.includes('violence'))
      );

    case 'active_addiction':
      return (
        contraindications.includes('active_addiction') ||
        matchedCategories.includes('substance')
      );

    case 'faith_context_primary':
      return (
        (context.cultural_flags || []).includes('faith_sensitive') ||
        context.user_message.toLowerCase().includes('church') ||
        context.user_message.toLowerCase().includes('faith') ||
        context.user_message.toLowerCase().includes('god') ||
        context.user_message.toLowerCase().includes('prayer') ||
        context.user_message.toLowerCase().includes('pastor')
      );

    default:
      return false;
  }
}

// ============================================================================
// FRAMEWORK RECOMMENDATION ENGINE
// ============================================================================

function recommendFrameworks(
  detectedIssues: IssueType[],
  context: TriageContext,
  triageColor: TriageColor,
  activeContraindications: string[],
): { domains: FrameworkDomain[]; frameworks: string[] } {
  const scoredFrameworks: Array<{ name: string; domain: FrameworkDomain; score: number }> = [];

  for (const [fwName, meta] of Object.entries(FRAMEWORK_METADATA)) {
    // Skip frameworks with active contraindications
    const hasContraindication = meta.contraindication_tags.some(
      tag => activeContraindications.includes(tag)
    );
    if (hasContraindication) continue;

    let score = 0;

    // Issue type overlap (PRIMARY signal — most important for routing)
    const issueOverlap = detectedIssues.filter(
      issue => meta.issue_types.includes(issue)
    ).length;
    score += issueOverlap * 25;

    // Life stage match
    if (context.life_stage && meta.life_stages.includes(context.life_stage)) {
      score += 15;
    }

    // Evidence tier bonus (reduced from ×10 to ×3 to prevent
    // gold-tier frameworks dominating when no issues are detected)
    const tierWeight = EVIDENCE_TIERS[meta.evidence_tier].weight;
    score += tierWeight * 3;

    // Triage color compatibility
    const colorPriority: Record<string, number> = { red: 4, orange: 3, yellow: 2, green: 1 };
    const fwColorLevel = colorPriority[meta.default_triage_color] || 1;
    const requestColorLevel = colorPriority[triageColor] || 1;

    // Boost frameworks that match the triage severity
    if (fwColorLevel === requestColorLevel) {
      score += 10;
    } else if (Math.abs(fwColorLevel - requestColorLevel) === 1) {
      score += 5;
    }

    // Cultural flag match
    if (context.cultural_flags) {
      const culturalOverlap = context.cultural_flags.filter(
        flag => meta.cultural_context_flags.includes(flag)
      ).length;
      score += culturalOverlap * 5;
    }

    // Domain-message text match bonus: boost frameworks whose domain name
    // keywords appear in the user message (helps route when issue detection is weak)
    const domainTextSignals: Record<string, string[]> = {
      foundation_attachment: ['attachment', 'secure base', 'anxious attach', 'avoidant', 'eft', 'emotionally focused', 'imago', 'gottman', 'sound relationship house'],
      communication_conflict: ['four horsemen', 'nvc', 'nonviolent', 'crucial conversation', 'fair fight', 'terry real', 'relational life', 'silent treatment', 'shut down', 'shuts down', 'won\'t talk', 'not talking', 'stop communicating'],
      trauma_nervous_system: ['trauma', 'nervous system', 'polyvagal', 'somatic', 'ifs', 'internal family', 'window of tolerance', 'ptsd', 'cptsd'],
      abuse_narcissism: ['narciss', 'coercive control', 'power and control', 'abuse cycle', 'lundy bancroft', 'why does he do that'],
      addiction_codependency: ['codepend', 'enmesh', 'twelve step', '12 step', 'al-anon', 'recovery', 'sobriety'],
      neurodivergence: ['adhd', 'autism', 'neurodiverg', 'sensory', 'executive function', 'spectrum'],
      modern_threats: ['social media', 'screen time', 'pornograph', 'online', 'digital', 'technoference', 'video game', 'gaming', 'phone addiction', 'always on his phone', 'always on her phone', 'tiktok', 'instagram'],
      financial_mens: ['financial therap', 'money script', 'men\'s work', 'masculine', 'provider', 'emasculated', 'breadwinner', 'lost my job', 'provider role', 'can\'t provide', 'man enough'],
      cultural_context: ['interracial', 'interfaith', 'intercultural', 'immigrant', 'military', 'lgbtq', 'same-sex'],
      premarital_formation: ['premarital', 'prepare/enrich', 'pre-marital', 'engagement', 'wedding prep'],
    };
    const normalizedMsg = context.user_message.toLowerCase();
    const domainSignals = domainTextSignals[meta.domain] || [];
    for (const signal of domainSignals) {
      if (normalizedMsg.includes(signal)) {
        score += 15;
        break; // One domain text match is enough
      }
    }

    if (score > 0) {
      scoredFrameworks.push({
        name: fwName,
        domain: meta.domain,
        score,
      });
    }
  }

  // Sort by score descending
  scoredFrameworks.sort((a, b) => b.score - a.score);

  // Top 5 frameworks, deduplicate domains
  const topFrameworks = scoredFrameworks.slice(0, 5).map(f => f.name);
  const uniqueDomains = [...new Set(scoredFrameworks.slice(0, 8).map(f => f.domain))];

  return {
    domains: uniqueDomains,
    frameworks: topFrameworks,
  };
}

// ============================================================================
// RESPONSE TEMPLATE BUILDER
// ============================================================================

function buildResponseTemplate(triageColor: TriageColor, triageResult: TriageResult): ResponseTemplate {
  switch (triageColor) {
    case 'red':
      return {
        type: 'crisis_response',
        preamble: buildCrisisPreamble(triageResult),
        include_crisis_resources: true,
        include_professional_referral: true,
        max_framework_depth: 'surface',
        allow_homework: false,
        allow_reframe: false,
        follow_up_urgency: 'immediate',
      };

    case 'orange':
      return {
        type: 'referral_with_support',
        preamble: buildReferralPreamble(triageResult),
        include_crisis_resources: true,
        include_professional_referral: true,
        max_framework_depth: 'moderate',
        allow_homework: false,
        allow_reframe: true,
        follow_up_urgency: 'within_24h',
      };

    case 'yellow':
      return {
        type: 'coached_monitoring',
        preamble: '',
        include_crisis_resources: false,
        include_professional_referral: false,
        max_framework_depth: 'moderate',
        allow_homework: true,
        allow_reframe: true,
        follow_up_urgency: 'next_session',
      };

    case 'green':
    default:
      return {
        type: 'full_coaching',
        preamble: '',
        include_crisis_resources: false,
        include_professional_referral: false,
        max_framework_depth: 'deep',
        allow_homework: true,
        allow_reframe: true,
        follow_up_urgency: 'standard',
      };
  }
}

function buildCrisisPreamble(triageResult: TriageResult): string {
  const parts: string[] = [
    'I hear you, and what you\'re sharing is really important.',
    'Your safety is the top priority right now.',
  ];

  if (triageResult.crisis_resources.length > 0) {
    parts.push('Here are some resources that can help right now:');
    for (const resource of triageResult.crisis_resources) {
      const contactParts: string[] = [];
      if ('phone' in resource && resource.phone) contactParts.push(`Call: ${resource.phone}`);
      if ('text' in resource && resource.text) contactParts.push(resource.text);
      parts.push(`- **${resource.name}**: ${contactParts.join(' | ')}`);
    }
  }

  parts.push('I\'m here to support you, and I want to make sure you\'re connected with the right help.');

  return parts.join('\n');
}

function buildReferralPreamble(triageResult: TriageResult): string {
  const parts: string[] = [
    'Thank you for trusting me with this.',
    'What you\'re describing is something that a trained professional can really help with.',
  ];

  if (triageResult.response_guidance) {
    parts.push(triageResult.response_guidance);
  }

  if (triageResult.crisis_resources.length > 0) {
    parts.push('Here are some resources:');
    for (const resource of triageResult.crisis_resources) {
      const contactParts: string[] = [];
      if ('phone' in resource && resource.phone) contactParts.push(`Call: ${resource.phone}`);
      if ('text' in resource && resource.text) contactParts.push(resource.text);
      if ('url' in resource && resource.url) contactParts.push(resource.url);
      parts.push(`- **${resource.name}**: ${contactParts.join(' | ')}`);
    }
  }

  parts.push('In the meantime, I can offer some perspective and support.');

  return parts.join('\n');
}

// ============================================================================
// MAIN TRIAGE PIPELINE
// ============================================================================

export function triageRelationalMessage(context: TriageContext): TriageDecision {
  const decisionChain: string[] = [];

  // ---- STEP 1: Keyword Triage Scan ----
  // Combine user message with conversation history for comprehensive scanning
  let fullScanText = context.user_message;
  if (context.conversation_history && context.conversation_history.length > 0) {
    fullScanText += ' ' + context.conversation_history.join(' ');
  }
  const keywordTriage = scanForTriageKeywords(fullScanText);
  decisionChain.push(
    `Keyword scan: ${keywordTriage.matched_keywords.length} matches → ${keywordTriage.triage_color}`
  );

  // ---- STEP 2: Issue Type Detection ----
  const detectedIssues = detectIssueTypes(context.user_message);
  const allIssues = [...new Set([...detectedIssues, ...(context.known_issue_types || [])])];
  decisionChain.push(`Issue types detected: [${allIssues.join(', ')}]`);

  // ---- STEP 3: Determine Active Contraindications ----
  const activeContraindications = [...(context.known_contraindications || [])];

  // Infer additional contraindications from triage results
  if (keywordTriage.triage_color === 'red') {
    const redCategories = keywordTriage.matched_keywords
      .filter(k => k.triage_color === 'red')
      .map(k => k.category);

    if (redCategories.includes('violence')) {
      if (!activeContraindications.includes('active_violence')) {
        activeContraindications.push('active_violence');
      }
      if (!activeContraindications.includes('couples_therapy_contraindicated')) {
        activeContraindications.push('couples_therapy_contraindicated');
      }
    }
    if (redCategories.includes('self_harm')) {
      if (!activeContraindications.includes('active_suicidal_ideation')) {
        activeContraindications.push('active_suicidal_ideation');
      }
    }
    if (redCategories.includes('child_safety')) {
      if (!activeContraindications.includes('child_abuse_present')) {
        activeContraindications.push('child_abuse_present');
      }
    }
  }

  if (keywordTriage.matched_keywords.some(k => k.category === 'substance')) {
    if (!activeContraindications.includes('active_addiction')) {
      activeContraindications.push('active_addiction');
    }
  }

  // Infer contraindications from ORANGE abuse patterns (coercive control, verbal abuse, etc.)
  if (keywordTriage.matched_keywords.some(k => k.category === 'abuse_pattern')) {
    if (!activeContraindications.includes('coercive_control_present')) {
      activeContraindications.push('coercive_control_present');
    }
    if (!activeContraindications.includes('couples_therapy_contraindicated')) {
      activeContraindications.push('couples_therapy_contraindicated');
    }
  }

  decisionChain.push(`Active contraindications: [${activeContraindications.join(', ')}]`);

  // ---- STEP 4: Resolve Framework Contradictions ----
  const contradictionResolutions: string[] = [];
  for (const rule of CONTRADICTION_RULES) {
    const conditionMet = evaluateCondition(
      rule.condition,
      context,
      keywordTriage,
      allIssues,
    );

    if (conditionMet) {
      const resolution = rule.resolution.when_true;
      contradictionResolutions.push(
        `${rule.framework_a} vs ${rule.framework_b}: Use ${resolution.use} (${resolution.reason})`
      );
    }
  }

  if (contradictionResolutions.length > 0) {
    decisionChain.push(`Contradiction resolutions: ${contradictionResolutions.join('; ')}`);
  }

  // ---- STEP 5: Determine Final Triage Color ----
  // Keyword triage is the primary signal; contraindications can escalate
  let finalColor: TriageColor = keywordTriage.triage_color;

  // Escalation rules: certain contraindications force higher severity
  const criticalContraindications = [
    'active_violence', 'active_abuse', 'active_suicidal_ideation',
    'active_homicidal_ideation', 'active_psychosis', 'child_abuse_present',
  ];

  if (activeContraindications.some(c => criticalContraindications.includes(c))) {
    if (finalColor === 'green' || finalColor === 'yellow') {
      finalColor = 'red';
      decisionChain.push('ESCALATED to RED: Critical contraindication detected');
    }
  }

  const clinicalContraindications = [
    'active_addiction', 'untreated_ptsd', 'untreated_bipolar',
    'personality_disorder_unmanaged', 'dissociative_episodes',
  ];

  if (
    activeContraindications.some(c => clinicalContraindications.includes(c)) &&
    finalColor === 'green'
  ) {
    finalColor = 'orange';
    decisionChain.push('ESCALATED to ORANGE: Clinical contraindication detected');
  }

  decisionChain.push(`Final triage color: ${finalColor}`);

  // ---- STEP 6: Recommend Frameworks ----
  const { domains, frameworks } = recommendFrameworks(
    allIssues,
    context,
    finalColor,
    activeContraindications,
  );

  // Determine excluded frameworks (those with matching contraindications)
  const excludedFrameworks: string[] = [];
  for (const [fwName, meta] of Object.entries(FRAMEWORK_METADATA)) {
    if (meta.contraindication_tags.some(tag => activeContraindications.includes(tag))) {
      excludedFrameworks.push(fwName);
    }
  }

  decisionChain.push(`Recommended frameworks: [${frameworks.join(', ')}]`);
  decisionChain.push(`Excluded frameworks: [${excludedFrameworks.join(', ')}]`);

  // ---- STEP 7: Determine Evidence Floor ----
  let evidenceFloor: EvidenceTier;
  switch (finalColor) {
    case 'red':
      evidenceFloor = 'bronze'; // Only use well-established frameworks for crisis
      break;
    case 'orange':
      evidenceFloor = 'bronze';
      break;
    case 'yellow':
      evidenceFloor = 'copper'; // Allow emerging research for monitored coaching
      break;
    case 'green':
    default:
      evidenceFloor = 'copper'; // All evidence tiers for growth coaching
      break;
  }

  // ---- STEP 8: Build Search Parameters ----
  const allowedTiers = getAllowedTiers(evidenceFloor);

  const searchParams: RelationalSearchParams = {
    filter_domains: domains.length > 0 ? domains : null,
    filter_frameworks: frameworks.length > 0 ? frameworks : null,
    filter_evidence_tiers: allowedTiers.length < 4 ? allowedTiers : null,
    filter_triage_colors: getTriageColorFilter(finalColor),
    exclude_contraindications: activeContraindications.length > 0 ? activeContraindications : null,
    filter_life_stages: context.life_stage ? [context.life_stage] : null,
    filter_issue_types: allIssues.length > 0 ? allIssues : null,
    filter_cultural_flags: context.cultural_flags && context.cultural_flags.length > 0
      ? context.cultural_flags : null,
    match_threshold: finalColor === 'red' ? 0.55 : 0.65, // Lower threshold for crisis (cast wider net)
    match_count: finalColor === 'red' ? 5 : 10,           // Fewer results for crisis (focused)
  };

  // ---- STEP 9: Build Response Template ----
  const responseTemplate = buildResponseTemplate(finalColor, keywordTriage);

  // ---- STEP 10: Calculate Confidence ----
  let confidence = 0.5; // Base confidence
  if (keywordTriage.matched_keywords.length > 0) confidence += 0.2;
  if (allIssues.length > 0) confidence += 0.1;
  if (context.life_stage) confidence += 0.05;
  if (context.known_contraindications && context.known_contraindications.length > 0) confidence += 0.1;
  if (contradictionResolutions.length > 0) confidence += 0.05;
  confidence = Math.min(confidence, 1.0);

  return {
    triage_color: finalColor,
    confidence,
    keyword_matches: keywordTriage.matched_keywords,
    keyword_triage: keywordTriage,
    active_contraindications: activeContraindications,
    excluded_frameworks: excludedFrameworks,
    recommended_domains: domains,
    recommended_frameworks: frameworks,
    evidence_floor: evidenceFloor,
    search_params: searchParams,
    response_template: responseTemplate,
    decision_chain: decisionChain,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getAllowedTiers(floor: EvidenceTier): string[] {
  const tierOrder: EvidenceTier[] = ['gold', 'silver', 'bronze', 'copper'];
  const floorIndex = tierOrder.indexOf(floor);
  return tierOrder.slice(0, floorIndex + 1);
}

function getTriageColorFilter(color: TriageColor): string[] | null {
  // For safety colors, include same and lower severity content
  // RED: Return red content (crisis-specific advice)
  // ORANGE: Return orange + yellow + green
  // YELLOW: Return yellow + green
  // GREEN: Return green only (or null for all)
  switch (color) {
    case 'red':
      return ['red', 'orange']; // Crisis + professional content
    case 'orange':
      return ['orange', 'yellow', 'green'];
    case 'yellow':
      return ['yellow', 'green'];
    case 'green':
      return null; // No filter = all content
  }
}

// ============================================================================
// BATCH TRIAGE (for conversation history analysis)
// ============================================================================

export function triageConversation(messages: string[]): {
  overall_triage: TriageColor;
  per_message: Array<{ message: string; triage_color: TriageColor }>;
  escalation_detected: boolean;
} {
  let highestSeverity: TriageColor = 'green';
  const colorPriority: Record<string, number> = { red: 4, orange: 3, yellow: 2, green: 1 };
  const results: Array<{ message: string; triage_color: TriageColor }> = [];

  for (const msg of messages) {
    const result = scanForTriageKeywords(msg);
    results.push({ message: msg, triage_color: result.triage_color });

    if ((colorPriority[result.triage_color] || 0) > (colorPriority[highestSeverity] || 0)) {
      highestSeverity = result.triage_color;
    }
  }

  // Check for escalation pattern (severity increasing over messages)
  let escalationDetected = false;
  if (results.length >= 3) {
    const lastThree = results.slice(-3);
    const severities = lastThree.map(r => colorPriority[r.triage_color] || 0);
    if (severities[2] > severities[1] && severities[1] > severities[0]) {
      escalationDetected = true;
    }
  }

  return {
    overall_triage: highestSeverity,
    per_message: results,
    escalation_detected: escalationDetected,
  };
}

// ============================================================================
// QUICK TRIAGE (lightweight check for real-time use)
// ============================================================================

export function quickTriage(message: string): {
  color: TriageColor;
  should_block: boolean;
  crisis_resources: typeof CRISIS_RESOURCES[keyof typeof CRISIS_RESOURCES][];
} {
  const result = scanForTriageKeywords(message);
  return {
    color: result.triage_color,
    should_block: result.should_block_coaching,
    crisis_resources: result.crisis_resources,
  };
}
