// ============================================================================
// RELATIONAL INTERSECTIONALITY ENGINE
// Handles multi-issue, multi-domain situations where frameworks overlap
//
// Core concept: When a user presents with trauma + addiction + financial stress,
// MIO must prioritize frameworks in the right order and compose a response
// that addresses the 2 most pressing concerns (the "2-Focus" principle).
//
// The Priority Stack determines which issues get addressed first.
// The 2-Focus Composer selects the top 2 domains for the response.
// The Integration Map shows how frameworks connect across domains.
// ============================================================================

import {
  type TriageColor,
  type EvidenceTier,
  type FrameworkDomain,
  type IssueType,
  type LifeStage,
  FRAMEWORK_METADATA,
  FRAMEWORK_DOMAINS,
  EVIDENCE_TIERS,
} from './relational-metadata-maps';

import {
  type TriageDecision,
  type TriageContext,
} from './relational-triage-service';

// ============================================================================
// TYPES
// ============================================================================

export interface IntersectionalityAnalysis {
  // Priority-ordered domains
  priority_stack: PriorityEntry[];

  // The 2-Focus selection
  primary_focus: FocusSelection;
  secondary_focus: FocusSelection | null;

  // Integration map between selected domains
  integration_bridges: IntegrationBridge[];

  // Composite response strategy
  response_strategy: ResponseStrategy;

  // Complexity score (1-10, higher = more complex situation)
  complexity_score: number;

  // Audit
  reasoning: string[];
}

export interface PriorityEntry {
  domain: FrameworkDomain;
  issue_types: IssueType[];
  priority_score: number;
  triage_color: TriageColor;
  primary_framework: string;
  reasoning: string;
}

export interface FocusSelection {
  domain: FrameworkDomain;
  frameworks: string[];
  issue_types: IssueType[];
  approach: string;
  evidence_tier: EvidenceTier;
}

export interface IntegrationBridge {
  from_framework: string;
  to_framework: string;
  from_domain: FrameworkDomain;
  to_domain: FrameworkDomain;
  bridge_concept: string;
  application_note: string;
}

export interface ResponseStrategy {
  // How to structure the MIO response
  opening_frame: string;
  primary_intervention: string;
  secondary_support: string;
  integration_statement: string;
  follow_up_focus: FrameworkDomain;

  // What NOT to do
  avoid: string[];

  // Homework assignment structure
  homework_type: 'single_focus' | 'dual_integration' | 'none';
}

// ============================================================================
// PRIORITY HIERARCHY
// Determines which issues get addressed first
// Safety > Clinical > Relational > Growth
// ============================================================================

const ISSUE_PRIORITY_MAP: Record<IssueType, {
  base_priority: number;
  category: 'safety' | 'clinical' | 'relational' | 'growth';
}> = {
  abuse:                    { base_priority: 100, category: 'safety' },
  addiction:                { base_priority: 90,  category: 'clinical' },
  trauma:                   { base_priority: 85,  category: 'clinical' },
  mental_health:            { base_priority: 80,  category: 'clinical' },
  infidelity:               { base_priority: 70,  category: 'relational' },
  trust:                    { base_priority: 65,  category: 'relational' },
  power_imbalance:          { base_priority: 60,  category: 'relational' },
  conflict:                 { base_priority: 55,  category: 'relational' },
  emotional_disconnection:  { base_priority: 50,  category: 'relational' },
  intimacy:                 { base_priority: 45,  category: 'relational' },
  communication:            { base_priority: 40,  category: 'relational' },
  finance:                  { base_priority: 35,  category: 'relational' },
  parenting:                { base_priority: 30,  category: 'relational' },
  cultural_conflict:        { base_priority: 25,  category: 'relational' },
  identity:                 { base_priority: 20,  category: 'growth' },
};

// ============================================================================
// DOMAIN PRIORITY RULES
// Which domains take precedence in multi-domain situations
// ============================================================================

const DOMAIN_PRIORITY: Record<FrameworkDomain, number> = {
  abuse_narcissism: 100,        // Safety-first
  trauma_nervous_system: 90,    // Clinical stabilization
  addiction_codependency: 85,   // Active addiction blocks all other work
  foundation_attachment: 50,    // Core relationship dynamics
  communication_conflict: 45,   // Day-to-day functioning
  modern_threats: 40,           // Contemporary challenges
  financial_mens: 35,           // Economic/identity factors
  neurodivergence: 30,          // Neurotype considerations
  cultural_context: 25,         // Cultural lens
  premarital_formation: 20,     // Formation/growth
};

// ============================================================================
// INTEGRATION BRIDGES
// Pre-defined connections between frameworks across domains
// ============================================================================

const KNOWN_BRIDGES: IntegrationBridge[] = [
  // Trauma ↔ Attachment
  {
    from_framework: 'polyvagal_theory',
    to_framework: 'emotionally_focused_therapy',
    from_domain: 'trauma_nervous_system',
    to_domain: 'foundation_attachment',
    bridge_concept: 'Nervous system regulation enables attachment security',
    application_note: 'Regulate first (polyvagal), then explore attachment patterns (EFT)',
  },
  {
    from_framework: 'complex_trauma_cptsd',
    to_framework: 'attachment_theory_bowlby',
    from_domain: 'trauma_nervous_system',
    to_domain: 'foundation_attachment',
    bridge_concept: 'Complex trauma creates insecure attachment patterns',
    application_note: 'Address trauma origins before attempting attachment repair',
  },
  // Abuse ↔ Trauma
  {
    from_framework: 'coercive_control_stark',
    to_framework: 'complex_trauma_cptsd',
    from_domain: 'abuse_narcissism',
    to_domain: 'trauma_nervous_system',
    bridge_concept: 'Coercive control creates complex trauma responses',
    application_note: 'Safety plan first, then trauma processing after separation',
  },
  {
    from_framework: 'narcissistic_abuse_recovery',
    to_framework: 'internal_family_systems',
    from_domain: 'abuse_narcissism',
    to_domain: 'trauma_nervous_system',
    bridge_concept: 'Narcissistic abuse fragments internal system; IFS helps integration',
    application_note: 'Identify protective parts activated by abuse before integration work',
  },
  // Addiction ↔ Attachment
  {
    from_framework: 'addiction_impact_relationships',
    to_framework: 'attachment_theory_bowlby',
    from_domain: 'addiction_codependency',
    to_domain: 'foundation_attachment',
    bridge_concept: 'Addiction disrupts attachment bonds; recovery restores them',
    application_note: 'Support partner attachment needs while maintaining recovery boundaries',
  },
  // Addiction ↔ Trauma
  {
    from_framework: 'betrayal_trauma_steffens',
    to_framework: 'complex_trauma_cptsd',
    from_domain: 'addiction_codependency',
    to_domain: 'trauma_nervous_system',
    bridge_concept: 'Betrayal from addiction creates trauma responses in partner',
    application_note: 'Validate partner trauma before pushing couples work',
  },
  // Communication ↔ Neurodivergence
  {
    from_framework: 'nonviolent_communication',
    to_framework: 'adhd_and_marriage_orlov',
    from_domain: 'communication_conflict',
    to_domain: 'neurodivergence',
    bridge_concept: 'NVC principles need ADHD-specific adaptations',
    application_note: 'Shorter check-ins, written agreements, reduced demand for sustained attention',
  },
  // Gottman ↔ Cultural Context
  {
    from_framework: 'gottman_method',
    to_framework: 'religious_faith_based_marriage',
    from_domain: 'foundation_attachment',
    to_domain: 'cultural_context',
    bridge_concept: 'Gottman principles enhanced with shared faith values',
    application_note: 'Use Gottman structure with faith-based meaning-making',
  },
  // Financial ↔ Modern Threats
  {
    from_framework: 'financial_stress_marriage',
    to_framework: 'financial_infidelity',
    from_domain: 'financial_mens',
    to_domain: 'modern_threats',
    bridge_concept: 'Financial stress can escalate to financial betrayal',
    application_note: 'Address transparency and shared financial vision early',
  },
  // Codependency ↔ Boundaries
  {
    from_framework: 'codependency_beattie',
    to_framework: 'boundaries_dating_cloud_townsend',
    from_domain: 'addiction_codependency',
    to_domain: 'premarital_formation',
    bridge_concept: 'Codependency recovery requires healthy boundary development',
    application_note: 'Build internal boundaries before external ones',
  },
];

// ============================================================================
// MAIN ENGINE
// ============================================================================

export function analyzeIntersectionality(
  triageDecision: TriageDecision,
  context: TriageContext,
): IntersectionalityAnalysis {
  const reasoning: string[] = [];

  // ---- STEP 1: Build Priority Stack ----
  const priorityStack = buildPriorityStack(
    triageDecision,
    context,
  );
  reasoning.push(`Priority stack: ${priorityStack.map(p => `${p.domain}(${p.priority_score})`).join(' > ')}`);

  // ---- STEP 2: Select 2-Focus ----
  const primaryFocus = selectFocus(priorityStack[0], triageDecision);
  reasoning.push(`Primary focus: ${primaryFocus.domain} → [${primaryFocus.frameworks.join(', ')}]`);

  let secondaryFocus: FocusSelection | null = null;
  if (priorityStack.length > 1 && priorityStack[1].priority_score > 15) {
    secondaryFocus = selectFocus(priorityStack[1], triageDecision);
    reasoning.push(`Secondary focus: ${secondaryFocus.domain} → [${secondaryFocus.frameworks.join(', ')}]`);
  } else {
    reasoning.push('No secondary focus needed (single-domain situation)');
  }

  // ---- STEP 3: Find Integration Bridges ----
  const bridges = findBridges(primaryFocus, secondaryFocus);
  if (bridges.length > 0) {
    reasoning.push(`Integration bridges found: ${bridges.map(b => `${b.from_framework}↔${b.to_framework}`).join(', ')}`);
  }

  // ---- STEP 4: Build Response Strategy ----
  const strategy = buildResponseStrategy(
    primaryFocus,
    secondaryFocus,
    bridges,
    triageDecision.triage_color,
  );

  // ---- STEP 5: Calculate Complexity ----
  const complexityScore = calculateComplexity(
    priorityStack,
    triageDecision,
    bridges,
  );
  reasoning.push(`Complexity score: ${complexityScore}/10`);

  return {
    priority_stack: priorityStack,
    primary_focus: primaryFocus,
    secondary_focus: secondaryFocus,
    integration_bridges: bridges,
    response_strategy: strategy,
    complexity_score: complexityScore,
    reasoning,
  };
}

// ============================================================================
// PRIORITY STACK BUILDER
// ============================================================================

function buildPriorityStack(
  triageDecision: TriageDecision,
  context: TriageContext,
): PriorityEntry[] {
  const domainScores: Map<FrameworkDomain, {
    score: number;
    issues: IssueType[];
    triage: TriageColor;
    framework: string;
    reasoning: string;
  }> = new Map();

  // Score each recommended domain
  for (const domain of triageDecision.recommended_domains) {
    const domainMeta = FRAMEWORK_DOMAINS[domain];
    let score = DOMAIN_PRIORITY[domain] || 0;
    const issues: IssueType[] = [];
    let dominantTriage: TriageColor = 'green';
    const colorPriority: Record<string, number> = { red: 4, orange: 3, yellow: 2, green: 1 };

    // Boost by issue overlap
    const domainFrameworks = domainMeta.frameworks;
    for (const fwName of domainFrameworks) {
      const meta = FRAMEWORK_METADATA[fwName];
      if (!meta) continue;

      // Check if this framework's issues overlap with detected issues
      const searchIssues = triageDecision.search_params.filter_issue_types || [];
      for (const issue of meta.issue_types) {
        if (searchIssues.includes(issue)) {
          score += ISSUE_PRIORITY_MAP[issue as IssueType]?.base_priority || 0;
          if (!issues.includes(issue as IssueType)) {
            issues.push(issue as IssueType);
          }
        }
      }

      // Track highest triage color in this domain
      if ((colorPriority[meta.default_triage_color] || 0) > (colorPriority[dominantTriage] || 0)) {
        dominantTriage = meta.default_triage_color;
      }
    }

    // Life stage boost
    if (context.life_stage) {
      const lifeStageFrameworks = domainFrameworks.filter(fw => {
        const meta = FRAMEWORK_METADATA[fw];
        return meta && meta.life_stages.includes(context.life_stage!);
      });
      score += lifeStageFrameworks.length * 5;
    }

    // Triage escalation boost
    if (dominantTriage === 'red') score += 50;
    else if (dominantTriage === 'orange') score += 30;

    // Pick best framework for this domain
    const bestFramework = triageDecision.recommended_frameworks.find(fw => {
      const meta = FRAMEWORK_METADATA[fw];
      return meta && meta.domain === domain;
    }) || domainFrameworks[0];

    domainScores.set(domain, {
      score,
      issues,
      triage: dominantTriage,
      framework: bestFramework,
      reasoning: `Score ${score}: ${issues.length} issue overlaps, triage=${dominantTriage}`,
    });
  }

  // Sort by score descending
  const sorted = [...domainScores.entries()]
    .sort(([, a], [, b]) => b.score - a.score)
    .map(([domain, data]) => ({
      domain,
      issue_types: data.issues,
      priority_score: data.score,
      triage_color: data.triage as TriageColor,
      primary_framework: data.framework,
      reasoning: data.reasoning,
    }));

  return sorted;
}

// ============================================================================
// FOCUS SELECTION
// ============================================================================

function selectFocus(
  entry: PriorityEntry,
  triageDecision: TriageDecision,
): FocusSelection {
  const domainMeta = FRAMEWORK_DOMAINS[entry.domain];

  // Select frameworks from this domain that aren't excluded
  const availableFrameworks = domainMeta.frameworks.filter(
    fw => !triageDecision.excluded_frameworks.includes(fw)
  );

  // Pick top 2 frameworks (prioritize recommended ones)
  const recommendedInDomain = triageDecision.recommended_frameworks.filter(
    fw => availableFrameworks.includes(fw)
  );
  const selectedFrameworks = recommendedInDomain.length > 0
    ? recommendedInDomain.slice(0, 2)
    : availableFrameworks.slice(0, 2);

  // Determine best evidence tier among selected
  let bestTier: EvidenceTier = 'copper';
  const tierOrder: EvidenceTier[] = ['gold', 'silver', 'bronze', 'copper'];
  for (const fw of selectedFrameworks) {
    const meta = FRAMEWORK_METADATA[fw];
    if (meta && tierOrder.indexOf(meta.evidence_tier) < tierOrder.indexOf(bestTier)) {
      bestTier = meta.evidence_tier;
    }
  }

  // Build approach description
  const approach = buildApproachDescription(entry, selectedFrameworks);

  return {
    domain: entry.domain,
    frameworks: selectedFrameworks,
    issue_types: entry.issue_types,
    approach,
    evidence_tier: bestTier,
  };
}

function buildApproachDescription(entry: PriorityEntry, frameworks: string[]): string {
  const domainLabel = FRAMEWORK_DOMAINS[entry.domain].label;

  if (entry.triage_color === 'red') {
    return `Safety-first ${domainLabel}: Stabilize and provide crisis resources using ${frameworks.join(' + ')}`;
  }
  if (entry.triage_color === 'orange') {
    return `Professional support for ${domainLabel}: Referral + limited coaching using ${frameworks.join(' + ')}`;
  }
  if (entry.triage_color === 'yellow') {
    return `Monitored coaching for ${domainLabel}: Active coaching with awareness using ${frameworks.join(' + ')}`;
  }
  return `Full coaching for ${domainLabel}: Growth-oriented exploration using ${frameworks.join(' + ')}`;
}

// ============================================================================
// BRIDGE FINDER
// ============================================================================

function findBridges(
  primary: FocusSelection,
  secondary: FocusSelection | null,
): IntegrationBridge[] {
  if (!secondary) return [];

  const bridges: IntegrationBridge[] = [];

  for (const bridge of KNOWN_BRIDGES) {
    // Check if bridge connects the two focus domains
    const connectsPrimaryToSecondary = (
      (primary.domain === bridge.from_domain && secondary.domain === bridge.to_domain) ||
      (primary.domain === bridge.to_domain && secondary.domain === bridge.from_domain)
    );

    if (!connectsPrimaryToSecondary) continue;

    // Check if the specific frameworks are in our selections
    const fromInSelection = (
      primary.frameworks.includes(bridge.from_framework) ||
      secondary.frameworks.includes(bridge.from_framework)
    );
    const toInSelection = (
      primary.frameworks.includes(bridge.to_framework) ||
      secondary.frameworks.includes(bridge.to_framework)
    );

    // Prefer exact matches but also include domain-level bridges
    if (fromInSelection || toInSelection) {
      bridges.push(bridge);
    }
  }

  // If no exact bridges found, create a generic domain bridge
  if (bridges.length === 0) {
    bridges.push({
      from_framework: primary.frameworks[0],
      to_framework: secondary.frameworks[0],
      from_domain: primary.domain,
      to_domain: secondary.domain,
      bridge_concept: `${FRAMEWORK_DOMAINS[primary.domain].label} informs ${FRAMEWORK_DOMAINS[secondary.domain].label}`,
      application_note: 'Address the primary concern first, then integrate insights from the secondary domain',
    });
  }

  return bridges;
}

// ============================================================================
// RESPONSE STRATEGY BUILDER
// ============================================================================

function buildResponseStrategy(
  primary: FocusSelection,
  secondary: FocusSelection | null,
  bridges: IntegrationBridge[],
  triageColor: TriageColor,
): ResponseStrategy {
  const primaryLabel = FRAMEWORK_DOMAINS[primary.domain].label;
  const secondaryLabel = secondary ? FRAMEWORK_DOMAINS[secondary.domain].label : null;

  // Opening frame based on triage
  let openingFrame: string;
  switch (triageColor) {
    case 'red':
      openingFrame = 'Acknowledge the crisis. Validate feelings. Provide immediate safety resources.';
      break;
    case 'orange':
      openingFrame = 'Validate the seriousness. Recommend professional support. Offer limited perspective.';
      break;
    case 'yellow':
      openingFrame = `Acknowledge the concern. Frame through ${primaryLabel} lens. Offer coaching with awareness.`;
      break;
    case 'green':
    default:
      openingFrame = `Affirm the growth mindset. Explore through ${primaryLabel} framework.`;
      break;
  }

  // Primary intervention
  const primaryIntervention = primary.frameworks.length > 0
    ? `Apply ${primary.frameworks.join(' + ')} concepts to address ${primary.issue_types.join(', ')}`
    : `Explore ${primaryLabel} patterns`;

  // Secondary support
  let secondarySupport = 'N/A - single focus response';
  if (secondary) {
    secondarySupport = `Connect to ${secondaryLabel} through ${secondary.frameworks.join(' + ')}`;
  }

  // Integration statement
  let integrationStatement = '';
  if (bridges.length > 0) {
    integrationStatement = bridges[0].application_note;
  } else if (secondary) {
    integrationStatement = `Your ${primaryLabel.toLowerCase()} patterns are connected to ${secondaryLabel?.toLowerCase()}. We can explore that connection in future sessions.`;
  }

  // Avoids list
  const avoid: string[] = [];
  if (triageColor === 'red' || triageColor === 'orange') {
    avoid.push('Do not minimize or normalize the situation');
    avoid.push('Do not suggest couples therapy if abuse is present');
    avoid.push('Do not push forgiveness prematurely');
  }
  if (primary.issue_types.includes('abuse')) {
    avoid.push('Do not blame the victim');
    avoid.push('Do not recommend reconciliation without safety assessment');
  }
  if (primary.issue_types.includes('addiction')) {
    avoid.push('Do not enable denial');
    avoid.push('Do not prioritize relationship over individual recovery');
  }
  if (primary.issue_types.includes('trauma')) {
    avoid.push('Do not push trauma processing before stabilization');
    avoid.push('Do not use confrontational techniques');
  }

  // Homework type
  let homeworkType: 'single_focus' | 'dual_integration' | 'none' = 'none';
  if (triageColor === 'green') {
    homeworkType = secondary ? 'dual_integration' : 'single_focus';
  } else if (triageColor === 'yellow') {
    homeworkType = 'single_focus';
  }

  // Follow-up focus
  const followUpFocus = secondary ? secondary.domain : primary.domain;

  return {
    opening_frame: openingFrame,
    primary_intervention: primaryIntervention,
    secondary_support: secondarySupport,
    integration_statement: integrationStatement,
    follow_up_focus: followUpFocus,
    avoid,
    homework_type: homeworkType,
  };
}

// ============================================================================
// COMPLEXITY CALCULATOR
// ============================================================================

function calculateComplexity(
  priorityStack: PriorityEntry[],
  triageDecision: TriageDecision,
  bridges: IntegrationBridge[],
): number {
  let score = 0;

  // Number of active domains (1-3 points)
  score += Math.min(priorityStack.length, 3);

  // Number of active issues (1-3 points)
  const allIssues = new Set(priorityStack.flatMap(p => p.issue_types));
  score += Math.min(allIssues.size, 3);

  // Triage severity (0-2 points)
  const colorPoints: Record<string, number> = { red: 2, orange: 1.5, yellow: 1, green: 0 };
  score += colorPoints[triageDecision.triage_color] || 0;

  // Contraindication count (0-2 points)
  score += Math.min(triageDecision.active_contraindications.length * 0.5, 2);

  // Cap at 10
  return Math.min(Math.round(score * 10) / 10, 10);
}

// ============================================================================
// COMPOSE SYSTEM PROMPT AUGMENTATION
// Generates the system prompt addition for the MIO chatbot
// based on the intersectionality analysis
// ============================================================================

export function composeSystemPromptAugmentation(
  analysis: IntersectionalityAnalysis,
  triageDecision: TriageDecision,
): string {
  const parts: string[] = [];

  // Header
  parts.push('## Relational Coaching Context');
  parts.push('');

  // Triage status
  parts.push(`**Triage Level**: ${triageDecision.triage_color.toUpperCase()}`);
  parts.push(`**Complexity**: ${analysis.complexity_score}/10`);
  parts.push('');

  // Response template preamble (if crisis/referral)
  if (triageDecision.response_template.preamble) {
    parts.push('### Required Preamble');
    parts.push(triageDecision.response_template.preamble);
    parts.push('');
  }

  // Primary focus
  parts.push(`### Primary Focus: ${FRAMEWORK_DOMAINS[analysis.primary_focus.domain].label}`);
  parts.push(`- Frameworks: ${analysis.primary_focus.frameworks.join(', ')}`);
  parts.push(`- Approach: ${analysis.primary_focus.approach}`);
  parts.push(`- Evidence tier: ${analysis.primary_focus.evidence_tier}`);
  parts.push('');

  // Secondary focus
  if (analysis.secondary_focus) {
    parts.push(`### Secondary Focus: ${FRAMEWORK_DOMAINS[analysis.secondary_focus.domain].label}`);
    parts.push(`- Frameworks: ${analysis.secondary_focus.frameworks.join(', ')}`);
    parts.push(`- Approach: ${analysis.secondary_focus.approach}`);
    parts.push('');
  }

  // Integration
  if (analysis.integration_bridges.length > 0) {
    parts.push('### Integration');
    for (const bridge of analysis.integration_bridges) {
      parts.push(`- ${bridge.bridge_concept}`);
      parts.push(`  - Application: ${bridge.application_note}`);
    }
    parts.push('');
  }

  // Strategy
  parts.push('### Response Strategy');
  parts.push(`1. **Opening**: ${analysis.response_strategy.opening_frame}`);
  parts.push(`2. **Primary**: ${analysis.response_strategy.primary_intervention}`);
  if (analysis.secondary_focus) {
    parts.push(`3. **Secondary**: ${analysis.response_strategy.secondary_support}`);
  }
  if (analysis.response_strategy.integration_statement) {
    parts.push(`4. **Integration**: ${analysis.response_strategy.integration_statement}`);
  }
  parts.push('');

  // Constraints
  if (analysis.response_strategy.avoid.length > 0) {
    parts.push('### Do NOT');
    for (const item of analysis.response_strategy.avoid) {
      parts.push(`- ${item}`);
    }
    parts.push('');
  }

  // Response limits
  if (!triageDecision.response_template.allow_homework) {
    parts.push('**No homework assignments for this triage level.**');
  }
  if (!triageDecision.response_template.allow_reframe) {
    parts.push('**No cognitive reframes. Focus on safety and validation only.**');
  }

  return parts.join('\n');
}
