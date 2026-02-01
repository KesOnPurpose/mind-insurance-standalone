// ============================================================================
// RELATIONAL RAG METADATA MAPS
// Controlled vocabularies for the 10-domain relational framework system
// ============================================================================

// ============================================================================
// FRAMEWORK DOMAINS (10 domains, ~59 frameworks total)
// ============================================================================

export const FRAMEWORK_DOMAINS = {
  foundation_attachment: {
    label: 'Foundation & Attachment',
    domain_number: 1,
    description: 'Core attachment theory and relationship foundations',
    frameworks: [
      'attachment_theory_bowlby',
      'adult_attachment_hazan_shaver',
      'emotionally_focused_therapy',
      'gottman_method',
      'imago_relationship_therapy',
    ],
  },
  communication_conflict: {
    label: 'Communication & Conflict',
    domain_number: 2,
    description: 'Communication patterns, conflict resolution, and repair',
    frameworks: [
      'nonviolent_communication',
      'crucial_conversations',
      'gottman_four_horsemen',
      'terry_real_relational_life',
      'fair_fighting_rules',
    ],
  },
  trauma_nervous_system: {
    label: 'Trauma & Nervous System',
    domain_number: 3,
    description: 'Trauma-informed relationship frameworks and nervous system regulation',
    frameworks: [
      'polyvagal_theory',
      'window_of_tolerance',
      'internal_family_systems',
      'somatic_experiencing',
      'complex_trauma_cptsd',
      'body_keeps_the_score',
    ],
  },
  abuse_narcissism: {
    label: 'Abuse & Narcissism',
    domain_number: 4,
    description: 'Abuse dynamics, narcissistic patterns, coercive control',
    frameworks: [
      'bancroft_why_does_he',
      'narcissistic_abuse_recovery',
      'coercive_control_stark',
      'post_separation_abuse',
    ],
  },
  addiction_codependency: {
    label: 'Addiction & Codependency',
    domain_number: 5,
    description: 'Addiction impact on relationships, codependency, and recovery',
    frameworks: [
      'addiction_impact_relationships',
      'codependency_beattie',
      'recovery_and_relationship',
      'betrayal_trauma_steffens',
    ],
  },
  neurodivergence: {
    label: 'Neurodivergence in Relationships',
    domain_number: 6,
    description: 'ADHD, ASD, and neurodivergent dynamics in partnerships',
    frameworks: [
      'adhd_and_marriage_orlov',
      'asd_and_marriage',
      'rejection_sensitive_dysphoria',
    ],
  },
  modern_threats: {
    label: 'Modern Threats to Relationships',
    domain_number: 7,
    description: 'Digital-age challenges to intimate partnerships',
    frameworks: [
      'social_media_impact',
      'pornography_impact',
      'financial_infidelity',
      'work_addiction',
    ],
  },
  financial_mens: {
    label: 'Financial & Men\'s Issues',
    domain_number: 8,
    description: 'Financial stress, masculine identity, and emotional development',
    frameworks: [
      'financial_stress_marriage',
      'mens_emotional_development',
      'masculine_identity_modern',
    ],
  },
  cultural_context: {
    label: 'Cultural Context',
    domain_number: 9,
    description: 'Cultural, religious, and identity-based relationship dynamics',
    frameworks: [
      'religious_faith_based_marriage',
      'interracial_intercultural_marriage',
      'lgbtq_relationships',
      'immigration_and_marriage',
    ],
  },
  premarital_formation: {
    label: 'Premarital & Formation',
    domain_number: 10,
    description: 'Relationship formation, premarital preparation, and forgiveness',
    frameworks: [
      'prepare_enrich_olson',
      'boundaries_dating_cloud_townsend',
      'forgiveness_models',
    ],
  },
} as const;

export type FrameworkDomain = keyof typeof FRAMEWORK_DOMAINS;

// ============================================================================
// EVIDENCE TIERS (4-tier hierarchy)
// ============================================================================

export const EVIDENCE_TIERS = {
  gold: {
    label: 'Gold',
    description: 'Multiple RCTs, meta-analyses, systematic reviews',
    weight: 1.0,
    examples: ['Gottman Method', 'EFT', 'PREPARE/ENRICH'],
  },
  silver: {
    label: 'Silver',
    description: 'Peer-reviewed studies, controlled trials, validated instruments',
    weight: 0.75,
    examples: ['Polyvagal Theory', 'IFS', 'NVC'],
  },
  bronze: {
    label: 'Bronze',
    description: 'Clinical consensus, case studies, expert panels',
    weight: 0.5,
    examples: ['Coercive Control', 'Post-Separation Abuse', 'Work Addiction'],
  },
  copper: {
    label: 'Copper',
    description: 'Emerging research, expert opinion, clinical observation',
    weight: 0.25,
    examples: ['RSD in Relationships', 'Technology-Enhanced Intimacy'],
  },
} as const;

export type EvidenceTier = keyof typeof EVIDENCE_TIERS;

// ============================================================================
// TRIAGE COLORS (4-color clinical routing)
// ============================================================================

export const TRIAGE_COLORS = {
  red: {
    label: 'RED - Crisis/Safety',
    description: 'Immediate safety concern. Crisis resources required.',
    action: 'Provide crisis hotline numbers immediately. Do not attempt coaching.',
    max_coaching: false,
    referral_required: true,
    response_template: 'safety_first',
  },
  orange: {
    label: 'ORANGE - Professional Referral',
    description: 'Serious issue requiring professional intervention.',
    action: 'Provide professional referral. Limited supportive coaching only.',
    max_coaching: false,
    referral_required: true,
    response_template: 'referral_plus_support',
  },
  yellow: {
    label: 'YELLOW - Monitor + Coach',
    description: 'Concerning pattern. Coach with monitoring and soft referral.',
    action: 'Provide coaching with soft referral recommendation.',
    max_coaching: true,
    referral_required: false,
    response_template: 'coach_with_monitoring',
  },
  green: {
    label: 'GREEN - Full Coaching',
    description: 'Growth-oriented. Full MIO coaching appropriate.',
    action: 'Full MIO relational coaching engagement.',
    max_coaching: true,
    referral_required: false,
    response_template: 'full_coaching',
  },
} as const;

export type TriageColor = keyof typeof TRIAGE_COLORS;

// ============================================================================
// LIFE STAGES
// ============================================================================

export const LIFE_STAGES = [
  'dating',
  'engaged',
  'newlywed',
  'established',
  'crisis',
  'separation',
  'divorce',
  'remarriage',
] as const;

export type LifeStage = typeof LIFE_STAGES[number];

// ============================================================================
// ISSUE TYPES
// ============================================================================

export const ISSUE_TYPES = [
  'communication',
  'conflict',
  'intimacy',
  'trust',
  'abuse',
  'addiction',
  'trauma',
  'finance',
  'parenting',
  'infidelity',
  'emotional_disconnection',
  'power_imbalance',
  'cultural_conflict',
  'mental_health',
  'identity',
] as const;

export type IssueType = typeof ISSUE_TYPES[number];

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

export const RELATIONSHIP_TYPES = [
  'heterosexual',
  'same_sex',
  'interracial',
  'interfaith',
  'long_distance',
  'blended_family',
  'military',
  'intercultural',
] as const;

export type RelationshipType = typeof RELATIONSHIP_TYPES[number];

// ============================================================================
// CULTURAL CONTEXT FLAGS
// ============================================================================

export const CULTURAL_CONTEXT_FLAGS = [
  'western_bias',          // Framework assumes Western cultural norms
  'faith_sensitive',       // Touches on religious/spiritual dynamics
  'collectivist_adaptation', // Needs adaptation for collectivist cultures
  'immigration_aware',     // Considers immigration/displacement stress
  'lgbtq_affirming',       // Inclusive of LGBTQ+ relationships
  'gender_role_sensitive', // Addresses gendered expectations
  'socioeconomic_aware',   // Considers economic factors
  'racial_awareness',      // Addresses racial dynamics
] as const;

export type CulturalContextFlag = typeof CULTURAL_CONTEXT_FLAGS[number];

// ============================================================================
// FRAMEWORK SECTION TYPES (Universal Template)
// ============================================================================

export const FRAMEWORK_SECTIONS = [
  'core_theory',
  'relationship_application',
  'key_interventions',
  'contraindications',
  'integration_points',
  'evidence_base',
] as const;

export type FrameworkSection = typeof FRAMEWORK_SECTIONS[number];

// ============================================================================
// CONTRAINDICATION CATEGORIES (from 52-rule matrix)
// ============================================================================

export const CONTRAINDICATION_CATEGORIES = [
  // Safety-critical
  'active_abuse',
  'active_violence',
  'active_suicidal_ideation',
  'active_homicidal_ideation',
  'active_psychosis',

  // Clinical boundaries
  'active_addiction',
  'active_eating_disorder',
  'untreated_ptsd',
  'untreated_bipolar',
  'personality_disorder_unmanaged',
  'dissociative_episodes',

  // Relationship-specific
  'coercive_control_present',
  'stalking_present',
  'child_abuse_present',
  'elder_abuse_present',
  'trafficking_indicators',

  // Context-specific
  'recent_trauma_less_3_months',
  'active_legal_proceedings',
  'mandated_separation',
  'protective_order_in_place',

  // Framework-specific
  'couples_therapy_contraindicated',  // e.g., in active abuse
  'attachment_pursuit_dangerous',     // e.g., pursuing abusive partner
  'emotional_processing_premature',   // e.g., stabilization needed first
  'forgiveness_pressure_harmful',     // e.g., ongoing abuse
] as const;

export type ContraindicationCategory = typeof CONTRAINDICATION_CATEGORIES[number];

// ============================================================================
// FRAMEWORK → METADATA MAPPING
// Maps each framework to its default metadata assignments
// ============================================================================

export interface FrameworkMetadata {
  domain: FrameworkDomain;
  framework_name: string;
  evidence_tier: EvidenceTier;
  default_triage_color: TriageColor;
  contraindication_tags: readonly string[];
  cultural_context_flags: readonly string[];
  integration_points: readonly string[];
  issue_types: readonly string[];
  life_stages: readonly string[];
}

export const FRAMEWORK_METADATA: Record<string, FrameworkMetadata> = {
  // Domain 1: Foundation & Attachment
  attachment_theory_bowlby: {
    domain: 'foundation_attachment',
    framework_name: 'attachment_theory_bowlby',
    evidence_tier: 'gold',
    default_triage_color: 'green',
    contraindication_tags: ['active_abuse', 'active_psychosis'],
    cultural_context_flags: ['western_bias'],
    integration_points: ['emotionally_focused_therapy', 'adult_attachment_hazan_shaver', 'polyvagal_theory'],
    issue_types: ['emotional_disconnection', 'trust', 'intimacy', 'identity'],
    life_stages: ['dating', 'engaged', 'newlywed', 'established', 'crisis', 'rebuilding'],
  },
  adult_attachment_hazan_shaver: {
    domain: 'foundation_attachment',
    framework_name: 'adult_attachment_hazan_shaver',
    evidence_tier: 'gold',
    default_triage_color: 'green',
    contraindication_tags: ['active_abuse'],
    cultural_context_flags: ['western_bias'],
    integration_points: ['attachment_theory_bowlby', 'emotionally_focused_therapy', 'gottman_method'],
    issue_types: ['emotional_disconnection', 'trust', 'intimacy', 'communication'],
    life_stages: ['dating', 'engaged', 'newlywed', 'established', 'crisis'],
  },
  emotionally_focused_therapy: {
    domain: 'foundation_attachment',
    framework_name: 'emotionally_focused_therapy',
    evidence_tier: 'gold',
    default_triage_color: 'yellow',
    contraindication_tags: ['active_abuse', 'active_violence', 'active_addiction'],
    cultural_context_flags: ['western_bias'],
    integration_points: ['attachment_theory_bowlby', 'gottman_method', 'polyvagal_theory'],
    issue_types: ['emotional_disconnection', 'communication', 'trust', 'intimacy', 'conflict'],
    life_stages: ['established', 'crisis', 'rebuilding'],
  },
  gottman_method: {
    domain: 'foundation_attachment',
    framework_name: 'gottman_method',
    evidence_tier: 'gold',
    default_triage_color: 'green',
    contraindication_tags: ['active_abuse', 'active_violence', 'couples_therapy_contraindicated'],
    cultural_context_flags: [],
    integration_points: ['emotionally_focused_therapy', 'attachment_theory_bowlby', 'gottman_four_horsemen'],
    issue_types: ['communication', 'conflict', 'trust', 'intimacy', 'emotional_disconnection'],
    life_stages: ['newlywed', 'established', 'crisis', 'rebuilding', 'empty_nest'],
  },
  imago_relationship_therapy: {
    domain: 'foundation_attachment',
    framework_name: 'imago_relationship_therapy',
    evidence_tier: 'silver',
    default_triage_color: 'green',
    contraindication_tags: ['active_abuse', 'active_addiction'],
    cultural_context_flags: [],
    integration_points: ['attachment_theory_bowlby', 'emotionally_focused_therapy', 'internal_family_systems'],
    issue_types: ['communication', 'emotional_disconnection', 'conflict', 'intimacy'],
    life_stages: ['established', 'crisis', 'rebuilding'],
  },

  // Domain 2: Communication & Conflict
  nonviolent_communication: {
    domain: 'communication_conflict',
    framework_name: 'nonviolent_communication',
    evidence_tier: 'silver',
    default_triage_color: 'green',
    contraindication_tags: ['active_abuse', 'coercive_control_present'],
    cultural_context_flags: [],
    integration_points: ['gottman_method', 'crucial_conversations', 'emotionally_focused_therapy'],
    issue_types: ['communication', 'conflict', 'power_imbalance', 'parenting'],
    life_stages: ['dating', 'engaged', 'newlywed', 'established', 'crisis', 'rebuilding'],
  },
  crucial_conversations: {
    domain: 'communication_conflict',
    framework_name: 'crucial_conversations',
    evidence_tier: 'silver',
    default_triage_color: 'green',
    contraindication_tags: ['active_abuse'],
    cultural_context_flags: [],
    integration_points: ['nonviolent_communication', 'gottman_method', 'fair_fighting_rules'],
    issue_types: ['communication', 'conflict', 'trust', 'finance', 'parenting'],
    life_stages: ['established', 'crisis', 'rebuilding', 'blended'],
  },
  gottman_four_horsemen: {
    domain: 'communication_conflict',
    framework_name: 'gottman_four_horsemen',
    evidence_tier: 'gold',
    default_triage_color: 'yellow',
    contraindication_tags: ['active_abuse'],
    cultural_context_flags: [],
    integration_points: ['gottman_method', 'nonviolent_communication', 'emotionally_focused_therapy'],
    issue_types: ['conflict', 'communication', 'emotional_disconnection', 'trust'],
    life_stages: ['established', 'crisis', 'rebuilding'],
  },
  terry_real_relational_life: {
    domain: 'communication_conflict',
    framework_name: 'terry_real_relational_life',
    evidence_tier: 'silver',
    default_triage_color: 'yellow',
    contraindication_tags: ['active_abuse'],
    cultural_context_flags: ['western_bias'],
    integration_points: ['gottman_method', 'internal_family_systems', 'attachment_theory_bowlby'],
    issue_types: ['communication', 'conflict', 'power_imbalance', 'identity', 'emotional_disconnection'],
    life_stages: ['established', 'crisis', 'rebuilding'],
  },
  fair_fighting_rules: {
    domain: 'communication_conflict',
    framework_name: 'fair_fighting_rules',
    evidence_tier: 'bronze',
    default_triage_color: 'green',
    contraindication_tags: ['active_abuse', 'active_violence'],
    cultural_context_flags: [],
    integration_points: ['gottman_four_horsemen', 'nonviolent_communication', 'crucial_conversations'],
    issue_types: ['conflict', 'communication', 'parenting'],
    life_stages: ['dating', 'engaged', 'newlywed', 'established', 'crisis'],
  },

  // Domain 3: Trauma & Nervous System
  polyvagal_theory: {
    domain: 'trauma_nervous_system',
    framework_name: 'polyvagal_theory',
    evidence_tier: 'silver',
    default_triage_color: 'yellow',
    contraindication_tags: ['active_psychosis', 'dissociative_episodes'],
    cultural_context_flags: ['western_bias'],
    integration_points: ['window_of_tolerance', 'somatic_experiencing', 'attachment_theory_bowlby'],
    issue_types: ['trauma', 'emotional_disconnection', 'conflict'],
    life_stages: ['established', 'crisis'],
  },
  window_of_tolerance: {
    domain: 'trauma_nervous_system',
    framework_name: 'window_of_tolerance',
    evidence_tier: 'silver',
    default_triage_color: 'yellow',
    contraindication_tags: ['active_psychosis'],
    cultural_context_flags: ['western_bias'],
    integration_points: ['polyvagal_theory', 'somatic_experiencing', 'complex_trauma_cptsd'],
    issue_types: ['trauma', 'conflict', 'emotional_disconnection'],
    life_stages: ['established', 'crisis'],
  },
  internal_family_systems: {
    domain: 'trauma_nervous_system',
    framework_name: 'internal_family_systems',
    evidence_tier: 'silver',
    default_triage_color: 'yellow',
    contraindication_tags: ['active_psychosis', 'dissociative_episodes'],
    cultural_context_flags: ['western_bias'],
    integration_points: ['attachment_theory_bowlby', 'complex_trauma_cptsd', 'polyvagal_theory'],
    issue_types: ['trauma', 'identity', 'emotional_disconnection'],
    life_stages: ['established', 'crisis', 'separation'],
  },
  somatic_experiencing: {
    domain: 'trauma_nervous_system',
    framework_name: 'somatic_experiencing',
    evidence_tier: 'silver',
    default_triage_color: 'yellow',
    contraindication_tags: ['active_psychosis', 'dissociative_episodes'],
    cultural_context_flags: ['western_bias'],
    integration_points: ['polyvagal_theory', 'body_keeps_the_score', 'window_of_tolerance'],
    issue_types: ['trauma', 'intimacy', 'emotional_disconnection'],
    life_stages: ['established', 'crisis'],
  },
  complex_trauma_cptsd: {
    domain: 'trauma_nervous_system',
    framework_name: 'complex_trauma_cptsd',
    evidence_tier: 'silver',
    default_triage_color: 'orange',
    contraindication_tags: ['couples_therapy_contraindicated', 'emotional_processing_premature'],
    cultural_context_flags: ['western_bias', 'collectivist_adaptation'],
    integration_points: ['attachment_theory_bowlby', 'internal_family_systems', 'polyvagal_theory'],
    issue_types: ['trauma', 'trust', 'emotional_disconnection', 'identity'],
    life_stages: ['established', 'crisis', 'separation'],
  },
  body_keeps_the_score: {
    domain: 'trauma_nervous_system',
    framework_name: 'body_keeps_the_score',
    evidence_tier: 'gold',
    default_triage_color: 'yellow',
    contraindication_tags: ['active_psychosis'],
    cultural_context_flags: ['western_bias'],
    integration_points: ['polyvagal_theory', 'somatic_experiencing', 'complex_trauma_cptsd'],
    issue_types: ['trauma', 'intimacy', 'emotional_disconnection'],
    life_stages: ['established', 'crisis'],
  },

  // Domain 4: Abuse & Narcissism
  bancroft_why_does_he: {
    domain: 'abuse_narcissism',
    framework_name: 'bancroft_why_does_he',
    evidence_tier: 'bronze',
    default_triage_color: 'red',
    contraindication_tags: ['couples_therapy_contraindicated', 'forgiveness_pressure_harmful'],
    cultural_context_flags: ['western_bias', 'gender_role_sensitive'],
    integration_points: ['coercive_control_stark', 'narcissistic_abuse_recovery'],
    issue_types: ['abuse', 'power_imbalance', 'trust'],
    life_stages: ['crisis', 'separation', 'divorce'],
  },
  narcissistic_abuse_recovery: {
    domain: 'abuse_narcissism',
    framework_name: 'narcissistic_abuse_recovery',
    evidence_tier: 'bronze',
    default_triage_color: 'orange',
    contraindication_tags: ['couples_therapy_contraindicated', 'forgiveness_pressure_harmful', 'attachment_pursuit_dangerous'],
    cultural_context_flags: ['western_bias'],
    integration_points: ['bancroft_why_does_he', 'complex_trauma_cptsd', 'coercive_control_stark'],
    issue_types: ['abuse', 'identity', 'trust', 'mental_health'],
    life_stages: ['crisis', 'separation', 'divorce'],
  },
  coercive_control_stark: {
    domain: 'abuse_narcissism',
    framework_name: 'coercive_control_stark',
    evidence_tier: 'bronze',
    default_triage_color: 'red',
    contraindication_tags: ['couples_therapy_contraindicated', 'forgiveness_pressure_harmful'],
    cultural_context_flags: ['western_bias', 'gender_role_sensitive', 'collectivist_adaptation'],
    integration_points: ['bancroft_why_does_he', 'post_separation_abuse'],
    issue_types: ['abuse', 'power_imbalance', 'trust'],
    life_stages: ['crisis', 'separation'],
  },
  post_separation_abuse: {
    domain: 'abuse_narcissism',
    framework_name: 'post_separation_abuse',
    evidence_tier: 'bronze',
    default_triage_color: 'red',
    contraindication_tags: ['forgiveness_pressure_harmful', 'couples_therapy_contraindicated'],
    cultural_context_flags: ['western_bias'],
    integration_points: ['coercive_control_stark', 'narcissistic_abuse_recovery'],
    issue_types: ['abuse', 'power_imbalance'],
    life_stages: ['separation', 'divorce'],
  },

  // Domain 5: Addiction & Codependency
  addiction_impact_relationships: {
    domain: 'addiction_codependency',
    framework_name: 'addiction_impact_relationships',
    evidence_tier: 'gold',
    default_triage_color: 'orange',
    contraindication_tags: ['couples_therapy_contraindicated', 'active_addiction'],
    cultural_context_flags: ['western_bias', 'faith_sensitive'],
    integration_points: ['codependency_beattie', 'betrayal_trauma_steffens'],
    issue_types: ['addiction', 'trust', 'emotional_disconnection'],
    life_stages: ['established', 'crisis'],
  },
  codependency_beattie: {
    domain: 'addiction_codependency',
    framework_name: 'codependency_beattie',
    evidence_tier: 'bronze',
    default_triage_color: 'yellow',
    contraindication_tags: ['attachment_pursuit_dangerous'],
    cultural_context_flags: ['western_bias', 'collectivist_adaptation'],
    integration_points: ['addiction_impact_relationships', 'attachment_theory_bowlby'],
    issue_types: ['addiction', 'identity', 'power_imbalance'],
    life_stages: ['established', 'crisis'],
  },
  recovery_and_relationship: {
    domain: 'addiction_codependency',
    framework_name: 'recovery_and_relationship',
    evidence_tier: 'silver',
    default_triage_color: 'yellow',
    contraindication_tags: ['active_addiction'],
    cultural_context_flags: ['western_bias', 'faith_sensitive'],
    integration_points: ['addiction_impact_relationships', 'codependency_beattie'],
    issue_types: ['addiction', 'trust', 'communication'],
    life_stages: ['crisis', 'established'],
  },
  betrayal_trauma_steffens: {
    domain: 'addiction_codependency',
    framework_name: 'betrayal_trauma_steffens',
    evidence_tier: 'silver',
    default_triage_color: 'orange',
    contraindication_tags: ['forgiveness_pressure_harmful'],
    cultural_context_flags: ['western_bias', 'faith_sensitive'],
    integration_points: ['complex_trauma_cptsd', 'addiction_impact_relationships'],
    issue_types: ['addiction', 'trauma', 'trust', 'infidelity'],
    life_stages: ['crisis', 'separation'],
  },

  // Domain 6: Neurodivergence
  adhd_and_marriage_orlov: {
    domain: 'neurodivergence',
    framework_name: 'adhd_and_marriage_orlov',
    evidence_tier: 'silver',
    default_triage_color: 'green',
    contraindication_tags: [],
    cultural_context_flags: ['western_bias'],
    integration_points: ['gottman_method', 'nonviolent_communication'],
    issue_types: ['communication', 'conflict', 'emotional_disconnection'],
    life_stages: ['established', 'newlywed', 'crisis'],
  },
  asd_and_marriage: {
    domain: 'neurodivergence',
    framework_name: 'asd_and_marriage',
    evidence_tier: 'bronze',
    default_triage_color: 'green',
    contraindication_tags: [],
    cultural_context_flags: ['western_bias'],
    integration_points: ['nonviolent_communication', 'attachment_theory_bowlby'],
    issue_types: ['communication', 'intimacy', 'emotional_disconnection'],
    life_stages: ['established', 'newlywed'],
  },
  rejection_sensitive_dysphoria: {
    domain: 'neurodivergence',
    framework_name: 'rejection_sensitive_dysphoria',
    evidence_tier: 'copper',
    default_triage_color: 'green',
    contraindication_tags: [],
    cultural_context_flags: ['western_bias'],
    integration_points: ['adhd_and_marriage_orlov', 'attachment_theory_bowlby'],
    issue_types: ['conflict', 'emotional_disconnection', 'identity'],
    life_stages: ['dating', 'established', 'crisis'],
  },

  // Domain 7: Modern Threats
  social_media_impact: {
    domain: 'modern_threats',
    framework_name: 'social_media_impact',
    evidence_tier: 'bronze',
    default_triage_color: 'yellow',
    contraindication_tags: [],
    cultural_context_flags: [],
    integration_points: ['gottman_method', 'attachment_theory_bowlby'],
    issue_types: ['trust', 'infidelity', 'communication'],
    life_stages: ['dating', 'newlywed', 'established'],
  },
  pornography_impact: {
    domain: 'modern_threats',
    framework_name: 'pornography_impact',
    evidence_tier: 'silver',
    default_triage_color: 'orange',
    contraindication_tags: ['forgiveness_pressure_harmful'],
    cultural_context_flags: ['faith_sensitive'],
    integration_points: ['betrayal_trauma_steffens', 'addiction_impact_relationships'],
    issue_types: ['addiction', 'intimacy', 'trust', 'infidelity'],
    life_stages: ['established', 'crisis'],
  },
  financial_infidelity: {
    domain: 'modern_threats',
    framework_name: 'financial_infidelity',
    evidence_tier: 'bronze',
    default_triage_color: 'yellow',
    contraindication_tags: [],
    cultural_context_flags: ['gender_role_sensitive'],
    integration_points: ['financial_stress_marriage', 'gottman_method'],
    issue_types: ['trust', 'finance', 'power_imbalance'],
    life_stages: ['established', 'crisis'],
  },
  work_addiction: {
    domain: 'modern_threats',
    framework_name: 'work_addiction',
    evidence_tier: 'bronze',
    default_triage_color: 'yellow',
    contraindication_tags: [],
    cultural_context_flags: ['western_bias', 'gender_role_sensitive'],
    integration_points: ['addiction_impact_relationships', 'codependency_beattie'],
    issue_types: ['addiction', 'emotional_disconnection', 'intimacy'],
    life_stages: ['established'],
  },

  // Domain 8: Financial & Men's
  financial_stress_marriage: {
    domain: 'financial_mens',
    framework_name: 'financial_stress_marriage',
    evidence_tier: 'silver',
    default_triage_color: 'yellow',
    contraindication_tags: [],
    cultural_context_flags: ['socioeconomic_aware', 'gender_role_sensitive'],
    integration_points: ['gottman_method', 'financial_infidelity'],
    issue_types: ['finance', 'conflict', 'power_imbalance'],
    life_stages: ['newlywed', 'established', 'crisis'],
  },
  mens_emotional_development: {
    domain: 'financial_mens',
    framework_name: 'mens_emotional_development',
    evidence_tier: 'bronze',
    default_triage_color: 'green',
    contraindication_tags: [],
    cultural_context_flags: ['western_bias', 'gender_role_sensitive'],
    integration_points: ['attachment_theory_bowlby', 'emotionally_focused_therapy'],
    issue_types: ['emotional_disconnection', 'communication', 'identity'],
    life_stages: ['dating', 'established'],
  },
  masculine_identity_modern: {
    domain: 'financial_mens',
    framework_name: 'masculine_identity_modern',
    evidence_tier: 'bronze',
    default_triage_color: 'green',
    contraindication_tags: [],
    cultural_context_flags: ['western_bias', 'gender_role_sensitive'],
    integration_points: ['mens_emotional_development', 'attachment_theory_bowlby'],
    issue_types: ['identity', 'emotional_disconnection', 'power_imbalance'],
    life_stages: ['dating', 'established'],
  },

  // Domain 9: Cultural Context
  religious_faith_based_marriage: {
    domain: 'cultural_context',
    framework_name: 'religious_faith_based_marriage',
    evidence_tier: 'bronze',
    default_triage_color: 'green',
    contraindication_tags: ['forgiveness_pressure_harmful'],
    cultural_context_flags: ['faith_sensitive'],
    integration_points: ['gottman_method', 'forgiveness_models'],
    issue_types: ['cultural_conflict', 'power_imbalance', 'identity'],
    life_stages: ['dating', 'newlywed', 'established'],
  },
  interracial_intercultural_marriage: {
    domain: 'cultural_context',
    framework_name: 'interracial_intercultural_marriage',
    evidence_tier: 'bronze',
    default_triage_color: 'green',
    contraindication_tags: [],
    cultural_context_flags: ['racial_awareness', 'collectivist_adaptation'],
    integration_points: ['nonviolent_communication', 'attachment_theory_bowlby'],
    issue_types: ['cultural_conflict', 'identity', 'communication'],
    life_stages: ['dating', 'newlywed', 'established'],
  },
  lgbtq_relationships: {
    domain: 'cultural_context',
    framework_name: 'lgbtq_relationships',
    evidence_tier: 'silver',
    default_triage_color: 'green',
    contraindication_tags: [],
    cultural_context_flags: ['lgbtq_affirming'],
    integration_points: ['attachment_theory_bowlby', 'emotionally_focused_therapy'],
    issue_types: ['identity', 'cultural_conflict', 'mental_health'],
    life_stages: ['dating', 'newlywed', 'established'],
  },
  immigration_and_marriage: {
    domain: 'cultural_context',
    framework_name: 'immigration_and_marriage',
    evidence_tier: 'bronze',
    default_triage_color: 'yellow',
    contraindication_tags: [],
    cultural_context_flags: ['immigration_aware', 'collectivist_adaptation'],
    integration_points: ['complex_trauma_cptsd', 'attachment_theory_bowlby'],
    issue_types: ['cultural_conflict', 'trauma', 'power_imbalance'],
    life_stages: ['newlywed', 'established'],
  },

  // Domain 10: Premarital & Formation
  prepare_enrich_olson: {
    domain: 'premarital_formation',
    framework_name: 'prepare_enrich_olson',
    evidence_tier: 'gold',
    default_triage_color: 'green',
    contraindication_tags: [],
    cultural_context_flags: ['western_bias'],
    integration_points: ['gottman_method', 'attachment_theory_bowlby'],
    issue_types: ['communication', 'conflict', 'intimacy'],
    life_stages: ['dating', 'engaged'],
  },
  boundaries_dating_cloud_townsend: {
    domain: 'premarital_formation',
    framework_name: 'boundaries_dating_cloud_townsend',
    evidence_tier: 'bronze',
    default_triage_color: 'green',
    contraindication_tags: [],
    cultural_context_flags: ['faith_sensitive', 'western_bias'],
    integration_points: ['attachment_theory_bowlby', 'codependency_beattie'],
    issue_types: ['communication', 'identity', 'power_imbalance'],
    life_stages: ['dating', 'engaged'],
  },
  forgiveness_models: {
    domain: 'premarital_formation',
    framework_name: 'forgiveness_models',
    evidence_tier: 'gold',
    default_triage_color: 'green',
    contraindication_tags: ['forgiveness_pressure_harmful', 'active_abuse', 'coercive_control_present'],
    cultural_context_flags: ['faith_sensitive', 'western_bias'],
    integration_points: ['gottman_method', 'emotionally_focused_therapy'],
    issue_types: ['trust', 'infidelity', 'conflict'],
    life_stages: ['established', 'crisis', 'remarriage'],
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getFrameworksByDomain(domain: FrameworkDomain): string[] {
  return [...FRAMEWORK_DOMAINS[domain].frameworks];
}

export function getFrameworkMetadata(frameworkName: string): FrameworkMetadata | undefined {
  return FRAMEWORK_METADATA[frameworkName];
}

export function getDomainForFramework(frameworkName: string): FrameworkDomain | undefined {
  return FRAMEWORK_METADATA[frameworkName]?.domain;
}

export function getEvidenceWeight(tier: EvidenceTier): number {
  return EVIDENCE_TIERS[tier].weight;
}

export function getAllFrameworkNames(): string[] {
  return Object.keys(FRAMEWORK_METADATA);
}

export function getFrameworksByTriageColor(color: TriageColor): string[] {
  return Object.entries(FRAMEWORK_METADATA)
    .filter(([, meta]) => meta.default_triage_color === color)
    .map(([name]) => name);
}
