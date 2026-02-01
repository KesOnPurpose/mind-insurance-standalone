/**
 * QA Validation for Relational RAG System
 *
 * Tests 100 queries across all 10 domains, 4 triage colors, and edge cases.
 * Validates triage routing, intersectionality analysis, and search param generation.
 *
 * Usage:
 *   npx tsx scripts/qa-relational-rag.ts [options]
 *
 * Options:
 *   --verbose       Show detailed output for each test
 *   --domain N      Run tests for a specific domain only
 *   --color N       Run tests for a specific triage color only
 *   --category N    Run a specific test category (triage|intersect|search|edge)
 *   --test N        Run a single test by number
 *
 * No external dependencies required - tests the triage + intersectionality
 * pipeline without needing embeddings or Supabase.
 */

import {
  triageRelationalMessage,
  quickTriage,
  triageConversation,
  type TriageContext,
  type TriageDecision,
} from '../src/services/relational-triage-service';

import {
  analyzeIntersectionality,
  composeSystemPromptAugmentation,
  type IntersectionalityAnalysis,
} from '../src/services/relational-intersectionality-engine';

// Note: relational-rag-service.ts is NOT imported here because it depends
// on the Supabase client (@/integrations/supabase/client) which requires
// Vite's import alias resolution. The triage + intersectionality pipeline
// is fully testable without it.

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

interface TestCase {
  id: number;
  category: 'triage' | 'intersect' | 'search' | 'edge';
  name: string;
  message: string;
  context?: Partial<TriageContext>;
  expected: {
    triage_color?: 'red' | 'orange' | 'yellow' | 'green';
    should_block_coaching?: boolean;
    has_contraindications?: boolean;
    min_domains?: number;
    primary_domain?: string;
    has_frameworks?: string[];
    excludes_frameworks?: string[];
    min_complexity?: number;
    max_complexity?: number;
    has_bridges?: boolean;
    evidence_floor?: string;
  };
}

interface TestResult {
  id: number;
  name: string;
  category: string;
  passed: boolean;
  failures: string[];
  triage_color: string;
  domains: string[];
  frameworks: string[];
  complexity: number;
  duration_ms: number;
}

// ============================================================================
// 100 TEST CASES
// ============================================================================

const TEST_CASES: TestCase[] = [
  // ========================================
  // CATEGORY 1: TRIAGE ROUTING (25 tests)
  // RED triage (crisis/safety) - 8 tests
  // ========================================
  {
    id: 1,
    category: 'triage',
    name: 'RED: Direct suicide mention',
    message: 'I want to kill myself, I can\'t take this anymore',
    expected: { triage_color: 'red', should_block_coaching: true },
  },
  {
    id: 2,
    category: 'triage',
    name: 'RED: Domestic violence disclosure',
    message: 'He hit me again last night and I\'m scared for my life',
    expected: { triage_color: 'red', should_block_coaching: true },
  },
  {
    id: 3,
    category: 'triage',
    name: 'RED: Child abuse report',
    message: 'I think my husband is hurting our child, I found bruises on her',
    expected: { triage_color: 'red', should_block_coaching: true },
  },
  {
    id: 4,
    category: 'triage',
    name: 'RED: Active self-harm',
    message: 'I\'ve been cutting myself to cope with the pain of my divorce',
    expected: { triage_color: 'red', should_block_coaching: true },
  },
  {
    id: 5,
    category: 'triage',
    name: 'RED: Strangulation mention',
    message: 'During our fight he grabbed me by the throat and wouldn\'t let go',
    expected: { triage_color: 'red', should_block_coaching: true },
  },
  {
    id: 6,
    category: 'triage',
    name: 'RED: Gun threat',
    message: 'He showed me his gun and said things would end badly if I leave',
    expected: { triage_color: 'red', should_block_coaching: true },
  },
  {
    id: 7,
    category: 'triage',
    name: 'RED: Sexual assault disclosure',
    message: 'My partner forced me to have sex last night, I said no but he didn\'t stop',
    expected: { triage_color: 'red', should_block_coaching: true },
  },
  {
    id: 8,
    category: 'triage',
    name: 'RED: Suicidal ideation (indirect)',
    message: 'Everyone would be better off without me. I\'m just a burden.',
    expected: { triage_color: 'red', should_block_coaching: true },
  },

  // ORANGE triage (professional referral) - 7 tests
  {
    id: 9,
    category: 'triage',
    name: 'ORANGE: Active alcohol addiction',
    message: 'I can\'t stop drinking. I\'m having 8-10 drinks every night and my wife is threatening to leave',
    expected: { triage_color: 'orange', should_block_coaching: false },
  },
  {
    id: 10,
    category: 'triage',
    name: 'ORANGE: Severe depression',
    message: 'I haven\'t been able to get out of bed for 3 weeks. I can\'t eat, sleep, or function. My relationship is falling apart.',
    expected: { triage_color: 'orange', should_block_coaching: false },
  },
  {
    id: 11,
    category: 'triage',
    name: 'ORANGE: Narcissistic abuse pattern',
    message: 'My wife gaslights me constantly. She tells me things never happened that I know did. I\'m starting to question my own memory.',
    expected: { triage_color: 'orange' },
  },
  {
    id: 12,
    category: 'triage',
    name: 'ORANGE: Eating disorder',
    message: 'My husband found out I\'ve been purging after meals. He\'s upset and I feel ashamed.',
    expected: { triage_color: 'orange' },
  },
  {
    id: 13,
    category: 'triage',
    name: 'ORANGE: Drug dependency',
    message: 'I need pills to get through the day. Without them I can\'t function at all. My marriage is suffering.',
    expected: { triage_color: 'orange' },
  },
  {
    id: 14,
    category: 'triage',
    name: 'ORANGE: Panic attacks',
    message: 'I\'ve been having panic attacks every time my partner raises their voice. I can\'t breathe and I think I\'m dying.',
    expected: { triage_color: 'orange' },
  },
  {
    id: 15,
    category: 'triage',
    name: 'ORANGE: Emotional abuse pattern',
    message: 'She controls everything I do - who I talk to, where I go, what I wear. She checks my phone constantly.',
    expected: { triage_color: 'orange' },
  },

  // YELLOW triage (monitor + coach) - 5 tests
  {
    id: 16,
    category: 'triage',
    name: 'YELLOW: Infidelity discovery',
    message: 'I just found out my wife has been texting another man. I found sexual messages on her phone.',
    expected: { triage_color: 'yellow' },
  },
  {
    id: 17,
    category: 'triage',
    name: 'YELLOW: Financial conflict',
    message: 'My husband has been hiding debt from me. I found credit card bills totaling $40,000 that I didn\'t know about.',
    expected: { triage_color: 'yellow' },
  },
  {
    id: 18,
    category: 'triage',
    name: 'YELLOW: Parenting disagreement',
    message: 'We can\'t agree on how to discipline our kids. He thinks spanking is fine and I think it\'s harmful.',
    expected: { triage_color: 'yellow' },
  },
  {
    id: 19,
    category: 'triage',
    name: 'YELLOW: Sexual intimacy issues',
    message: 'We haven\'t been intimate in 6 months. Every time I try to initiate she pulls away.',
    expected: { triage_color: 'yellow' },
  },
  {
    id: 20,
    category: 'triage',
    name: 'YELLOW: Separation consideration',
    message: 'I\'m thinking about separating from my husband. We\'ve been fighting every day for months.',
    expected: { triage_color: 'yellow' },
  },

  // GREEN triage (full coaching) - 5 tests
  {
    id: 21,
    category: 'triage',
    name: 'GREEN: Communication improvement',
    message: 'How can we communicate better? We tend to shut down during disagreements.',
    expected: { triage_color: 'green', should_block_coaching: false },
  },
  {
    id: 22,
    category: 'triage',
    name: 'GREEN: Date night ideas',
    message: 'We want to reconnect and build more quality time together. What activities do you suggest?',
    expected: { triage_color: 'green', should_block_coaching: false },
  },
  {
    id: 23,
    category: 'triage',
    name: 'GREEN: Premarital preparation',
    message: 'We\'re getting engaged soon and want to prepare well for marriage. What should we discuss?',
    expected: { triage_color: 'green', should_block_coaching: false },
  },
  {
    id: 24,
    category: 'triage',
    name: 'GREEN: Conflict resolution skills',
    message: 'We argue sometimes but want to learn to fight fair. Any frameworks for healthy conflict?',
    expected: { triage_color: 'green', should_block_coaching: false },
  },
  {
    id: 25,
    category: 'triage',
    name: 'GREEN: Emotional connection',
    message: 'I love my wife and want to deepen our emotional connection. We\'re both open to growth.',
    expected: { triage_color: 'green', should_block_coaching: false },
  },

  // ========================================
  // CATEGORY 2: INTERSECTIONALITY (25 tests)
  // Multi-domain, multi-issue scenarios
  // ========================================
  {
    id: 26,
    category: 'intersect',
    name: 'MULTI: Trauma + Attachment',
    message: 'I have childhood trauma from my parents\' divorce and now I can\'t trust my partner. I get anxious every time she\'s late.',
    expected: { min_domains: 2, primary_domain: 'trauma_nervous_system', has_bridges: true },
  },
  {
    id: 27,
    category: 'intersect',
    name: 'MULTI: Addiction + Financial',
    message: 'My gambling addiction has put us $80,000 in debt. My wife doesn\'t know the full extent of it.',
    expected: { min_domains: 2, primary_domain: 'addiction_codependency' },
  },
  {
    id: 28,
    category: 'intersect',
    name: 'MULTI: Abuse + Trauma + Attachment',
    message: 'After years of emotional abuse from my ex, I can\'t open up to my new partner. I flinch when he raises his hand even to wave.',
    expected: { min_domains: 2, min_complexity: 4 },
  },
  {
    id: 29,
    category: 'intersect',
    name: 'MULTI: Communication + Cultural',
    message: 'My Korean parents disapprove of our mixed-race marriage and it\'s causing constant conflict between me and my wife.',
    expected: { min_domains: 2 },
  },
  {
    id: 30,
    category: 'intersect',
    name: 'MULTI: ADHD + Communication',
    message: 'My ADHD makes it hard to listen during important conversations. My wife thinks I don\'t care but I literally can\'t focus.',
    expected: { min_domains: 2, has_frameworks: ['adhd_and_marriage_orlov'] },
  },
  {
    id: 31,
    category: 'intersect',
    name: 'MULTI: Pornography + Intimacy',
    message: 'My wife found my porn history and says I betrayed her trust. Now she won\'t be intimate with me.',
    expected: { min_domains: 2 },
  },
  {
    id: 32,
    category: 'intersect',
    name: 'MULTI: Codependency + Boundaries',
    message: 'I give everything to my husband but get nothing back. I can\'t say no to him even when it hurts me.',
    expected: { min_domains: 2 },
  },
  {
    id: 33,
    category: 'intersect',
    name: 'MULTI: Infidelity + Trauma + Trust',
    message: 'After his affair, I have flashbacks and anxiety. I check his phone obsessively. I want to trust but my body won\'t let me.',
    expected: { min_domains: 2, min_complexity: 5 },
  },
  {
    id: 34,
    category: 'intersect',
    name: 'MULTI: Mental Health + Parenting',
    message: 'My depression is affecting my ability to parent. I yell at the kids and then feel terrible guilt. My wife resents me.',
    expected: { min_domains: 2 },
  },
  {
    id: 35,
    category: 'intersect',
    name: 'MULTI: Financial + Power Imbalance',
    message: 'My husband controls all the money. I have to ask permission for every purchase. I feel like a child in my own marriage.',
    expected: { min_domains: 2, has_contraindications: true },
  },
  {
    id: 36,
    category: 'intersect',
    name: 'MULTI: Social Media + Trust',
    message: 'She\'s constantly on Instagram liking other men\'s photos. When I bring it up she says I\'m being controlling.',
    expected: { min_domains: 2 },
  },
  {
    id: 37,
    category: 'intersect',
    name: 'MULTI: ASD + Intimacy',
    message: 'My husband is on the autism spectrum and doesn\'t understand why I need physical affection. He loves me but can\'t express it the way I need.',
    expected: { min_domains: 2 },
  },
  {
    id: 38,
    category: 'intersect',
    name: 'MULTI: Premarital + Cultural + Faith',
    message: 'We\'re from different religions and our families are opposed to the wedding. How do we navigate this while honoring both traditions?',
    context: { life_stage: 'engaged', cultural_flags: ['faith_sensitive'] },
    expected: { min_domains: 2 },
  },
  {
    id: 39,
    category: 'intersect',
    name: 'MULTI: Addiction + Codependency + Enabling',
    message: 'I keep bailing my wife out of trouble from her drinking. I know I\'m enabling but I\'m afraid she\'ll leave if I stop.',
    expected: { min_domains: 1, min_complexity: 4 },
  },
  {
    id: 40,
    category: 'intersect',
    name: 'MULTI: Grief + Attachment + Emotional Distance',
    message: 'Since our miscarriage, my husband has completely shut down. He won\'t talk about it and has become emotionally distant.',
    expected: { min_domains: 2 },
  },
  {
    id: 41,
    category: 'intersect',
    name: 'TRIPLE: Trauma + Abuse + Addiction',
    message: 'I grew up watching my dad beat my mom. Now I drink to cope and I\'m terrified I\'ll become like him with my partner.',
    expected: { min_domains: 2, min_complexity: 3 },
  },
  {
    id: 42,
    category: 'intersect',
    name: 'TRIPLE: Financial + Cultural + Communication',
    message: 'As an immigrant family, we have different expectations about money. My wife sends half our income to her family abroad and we can\'t afford rent.',
    context: { cultural_flags: ['immigration_aware'] },
    expected: { min_domains: 2 },
  },
  {
    id: 43,
    category: 'intersect',
    name: 'TRIPLE: ADHD + Pornography + Intimacy',
    message: 'My ADHD means I crave novelty and I\'ve been watching more and more porn. My wife found out and says she feels inadequate.',
    expected: { min_domains: 2 },
  },
  {
    id: 44,
    category: 'intersect',
    name: 'MULTI: Remarriage + Blended Family',
    message: 'My stepkids resent me and my new wife sides with them in every conflict. I feel like an outsider in my own home.',
    context: { life_stage: 'remarriage' },
    expected: { min_domains: 1 },
  },
  {
    id: 45,
    category: 'intersect',
    name: 'MULTI: Retirement + Identity + Intimacy',
    message: 'Since retiring we\'re in each other\'s space 24/7. I lost my identity without my career and we have nothing to talk about.',
    context: { life_stage: 'established' },
    expected: { min_domains: 2 },
  },
  {
    id: 46,
    category: 'intersect',
    name: 'COMPLEXITY: Maximum issues',
    message: 'My husband is an alcoholic who is emotionally abusive. We have massive debt, our kids are struggling, and his family constantly interferes. I have PTSD from childhood and depression.',
    expected: { min_complexity: 7 },
  },
  {
    id: 47,
    category: 'intersect',
    name: 'COMPLEXITY: Minimal issues',
    message: 'We want to improve how we handle small disagreements about housework.',
    expected: { max_complexity: 5 },
  },
  {
    id: 48,
    category: 'intersect',
    name: 'BRIDGE: Polyvagal + EFT',
    message: 'I freeze up during arguments. My therapist says it\'s a nervous system response. How can I stay present with my partner?',
    expected: { has_bridges: true, has_frameworks: ['polyvagal_theory'] },
  },
  {
    id: 49,
    category: 'intersect',
    name: 'BRIDGE: Coercive control + CPTSD',
    message: 'After leaving my controlling ex, I have complex PTSD. How do I recognize red flags in new relationships?',
    expected: { has_bridges: true },
  },
  {
    id: 50,
    category: 'intersect',
    name: 'BRIDGE: NVC + ADHD',
    message: 'I want to use nonviolent communication but my ADHD makes it hard to pause before reacting.',
    expected: { has_bridges: true },
  },

  // ========================================
  // CATEGORY 3: SEARCH PARAM VALIDATION (25 tests)
  // Validates that search params are correctly generated
  // ========================================
  {
    id: 51,
    category: 'search',
    name: 'DOMAIN: Foundation/Attachment',
    message: 'I have an anxious attachment style and my partner is avoidant. How do we bridge the gap?',
    expected: { primary_domain: 'foundation_attachment', has_frameworks: ['attachment_theory_bowlby'] },
  },
  {
    id: 52,
    category: 'search',
    name: 'DOMAIN: Communication/Conflict',
    message: 'We use the silent treatment on each other. How do we break this pattern?',
    expected: { primary_domain: 'communication_conflict' },
  },
  {
    id: 53,
    category: 'search',
    name: 'DOMAIN: Trauma/Nervous System',
    message: 'I dissociate during conflict and my partner thinks I\'m ignoring them. It\'s a trauma response.',
    expected: { primary_domain: 'trauma_nervous_system' },
  },
  {
    id: 54,
    category: 'search',
    name: 'DOMAIN: Abuse/Narcissism',
    message: 'I think my wife is a narcissist. She love-bombs me then devalues me in cycles.',
    expected: { min_domains: 1 },
  },
  {
    id: 55,
    category: 'search',
    name: 'DOMAIN: Addiction/Codependency',
    message: 'I grew up in an alcoholic home and now I realize I\'m codependent in my marriage.',
    expected: { primary_domain: 'addiction_codependency' },
  },
  {
    id: 56,
    category: 'search',
    name: 'DOMAIN: Neurodivergence',
    message: 'Both of us have ADHD and our house is chaos. We forget important dates and lose track of responsibilities.',
    expected: { has_frameworks: ['adhd_and_marriage_orlov'] },
  },
  {
    id: 57,
    category: 'search',
    name: 'DOMAIN: Modern Threats',
    message: 'My husband is addicted to video games and spends 6+ hours a day gaming instead of being with the family.',
    expected: { primary_domain: 'modern_threats' },
  },
  {
    id: 58,
    category: 'search',
    name: 'DOMAIN: Financial/Mens',
    message: 'I lost my job and feel emasculated. My wife is the breadwinner now and I feel worthless.',
    expected: { primary_domain: 'financial_mens' },
  },
  {
    id: 59,
    category: 'search',
    name: 'DOMAIN: Cultural Context',
    message: 'In our culture, the wife is expected to obey the husband. But I want an equal partnership. How do I navigate this?',
    expected: { primary_domain: 'cultural_context' },
  },
  {
    id: 60,
    category: 'search',
    name: 'DOMAIN: Premarital/Formation',
    message: 'We\'re engaged and want to do premarital counseling. What topics should we cover?',
    expected: { primary_domain: 'premarital_formation' },
  },
  {
    id: 61,
    category: 'search',
    name: 'EVIDENCE: Gold tier routing',
    message: 'What does research say about the four horsemen of the apocalypse in relationships?',
    expected: { has_frameworks: ['gottman_four_horsemen'] },
  },
  {
    id: 62,
    category: 'search',
    name: 'CONTRAINDICATION: Active abuse → exclude Gottman',
    message: 'My partner is abusive but I want to fix things. Should we try Gottman couples therapy?',
    expected: { has_contraindications: true, excludes_frameworks: ['gottman_method'] },
  },
  {
    id: 63,
    category: 'search',
    name: 'CONTRAINDICATION: Active addiction → block couples work',
    message: 'My husband is actively using drugs. Can we do couples therapy to fix our marriage?',
    expected: { has_contraindications: true },
  },
  {
    id: 64,
    category: 'search',
    name: 'LIFE_STAGE: Newlywed filtering',
    message: 'We just got married 3 months ago and are already fighting every day. Is this normal?',
    context: { life_stage: 'newlywed' },
    expected: { triage_color: 'yellow' },
  },
  {
    id: 65,
    category: 'search',
    name: 'LIFE_STAGE: Crisis filtering',
    message: 'We\'re separated and I don\'t know if there\'s any hope for reconciliation.',
    context: { life_stage: 'separation' },
    expected: { triage_color: 'yellow' },
  },
  {
    id: 66,
    category: 'search',
    name: 'CULTURAL: Faith-sensitive',
    message: 'My pastor says divorce is a sin but my husband is emotionally abusive. I\'m torn between my faith and my safety.',
    context: { cultural_flags: ['faith_sensitive'] },
    expected: { has_contraindications: true },
  },
  {
    id: 67,
    category: 'search',
    name: 'CULTURAL: Collectivist',
    message: 'My in-laws live with us and make all major decisions. In our culture this is normal but I\'m suffocating.',
    context: { cultural_flags: ['collectivist_adaptation'] },
    expected: { min_domains: 1 },
  },
  {
    id: 68,
    category: 'search',
    name: 'SEARCH: Match count tuning',
    message: 'Tell me everything about attachment styles and how they affect relationships.',
    expected: { primary_domain: 'foundation_attachment' },
  },
  {
    id: 69,
    category: 'search',
    name: 'SEARCH: Narrow framework filter',
    message: 'How does polyvagal theory explain why I freeze during arguments?',
    expected: { has_frameworks: ['polyvagal_theory'] },
  },
  {
    id: 70,
    category: 'search',
    name: 'SEARCH: Multiple issue types',
    message: 'We have trust issues from his affair, communication problems, and financial stress all at once.',
    expected: { min_domains: 2, min_complexity: 4 },
  },
  {
    id: 71,
    category: 'search',
    name: 'TRIAGE ESCALATION: Yellow → Orange via contraindications',
    message: 'She keeps threatening to take the kids and disappear if I don\'t do what she says.',
    expected: { has_contraindications: true },
  },
  {
    id: 72,
    category: 'search',
    name: 'RESPONSE: Crisis preamble present',
    message: 'I\'m having thoughts of ending it all because my marriage is over.',
    expected: { triage_color: 'red', should_block_coaching: true },
  },
  {
    id: 73,
    category: 'search',
    name: 'RESPONSE: Professional referral template',
    message: 'I think I need therapy. My anxiety is out of control and it\'s destroying my marriage.',
    expected: { triage_color: 'orange' },
  },
  {
    id: 74,
    category: 'search',
    name: 'RESPONSE: Full coaching template',
    message: 'We want to learn the five love languages. Can you teach us?',
    expected: { triage_color: 'green' },
  },
  {
    id: 75,
    category: 'search',
    name: 'HISTORY: Conversation escalation detection',
    message: 'Things got physical last night.',
    context: {
      conversation_history: [
        'We\'ve been arguing a lot lately.',
        'The fights are getting more intense.',
        'He pushed me against the wall yesterday.',
      ],
    },
    expected: { triage_color: 'red' },
  },

  // ========================================
  // CATEGORY 4: EDGE CASES (25 tests)
  // Ambiguous, boundary, and adversarial inputs
  // ========================================
  {
    id: 76,
    category: 'edge',
    name: 'EDGE: Empty message',
    message: '',
    expected: { triage_color: 'green' },
  },
  {
    id: 77,
    category: 'edge',
    name: 'EDGE: Very short message',
    message: 'Help',
    expected: { triage_color: 'green' },
  },
  {
    id: 78,
    category: 'edge',
    name: 'EDGE: Ambiguous violence language',
    message: 'I could kill for a good night\'s sleep. This baby is exhausting.',
    expected: { triage_color: 'green' }, // Should NOT trigger crisis
  },
  {
    id: 79,
    category: 'edge',
    name: 'EDGE: Movie/book reference with crisis words',
    message: 'Have you seen the movie about the couple who wanted to kill each other? Any relationship lessons from it?',
    expected: { should_block_coaching: false },
  },
  {
    id: 80,
    category: 'edge',
    name: 'EDGE: All caps emotional message',
    message: 'I AM SO FRUSTRATED WITH MY HUSBAND HE NEVER LISTENS TO ME AND I WANT TO SCREAM',
    expected: { triage_color: 'yellow' },
  },
  {
    id: 81,
    category: 'edge',
    name: 'EDGE: Non-English words mixed in',
    message: 'My abuela says I should stay in my marriage no matter what. Pero my husband treats me terrible.',
    expected: { min_domains: 1 },
  },
  {
    id: 82,
    category: 'edge',
    name: 'EDGE: Past tense trauma (resolved)',
    message: 'Years ago I was in an abusive relationship. I\'ve healed a lot and now I\'m in a healthy partnership. How do I maintain this?',
    expected: { triage_color: 'orange' },
  },
  {
    id: 83,
    category: 'edge',
    name: 'EDGE: Third-party concern',
    message: 'My sister is in an abusive relationship. How can I help her?',
    expected: { triage_color: 'orange' },
  },
  {
    id: 84,
    category: 'edge',
    name: 'EDGE: Professional asking',
    message: 'I\'m a therapist and I have a client dealing with coercive control. What frameworks do you recommend?',
    expected: { min_domains: 1 },
  },
  {
    id: 85,
    category: 'edge',
    name: 'EDGE: Vague emotional statement',
    message: 'I just feel stuck. Something\'s not right but I can\'t put my finger on it.',
    expected: { triage_color: 'green' },
  },
  {
    id: 86,
    category: 'edge',
    name: 'EDGE: Sarcasm/humor',
    message: 'My wife is definitely trying to poison me with her cooking lol. But seriously we have communication issues.',
    expected: { triage_color: 'green' },
  },
  {
    id: 87,
    category: 'edge',
    name: 'EDGE: Long rambling message',
    message: 'So like I don\'t even know where to start because there\'s so much going on with me and my partner and we\'ve been together for like 5 years and things were great at first but then we had a baby and everything changed and now we fight all the time about who does what around the house and he works long hours and I\'m home with the baby and I feel so alone and disconnected and I miss who we used to be before all this and I just want us to find our way back to each other but I don\'t know how.',
    expected: { triage_color: 'yellow', min_domains: 1 },
  },
  {
    id: 88,
    category: 'edge',
    name: 'EDGE: Question about theory (not personal)',
    message: 'What is Gottman\'s Sound Relationship House theory?',
    expected: { triage_color: 'green', has_frameworks: ['gottman_method'] },
  },
  {
    id: 89,
    category: 'edge',
    name: 'EDGE: Contradictory signals',
    message: 'Our relationship is perfect except for the constant yelling, name-calling, and he occasionally breaks things.',
    expected: { triage_color: 'orange', has_contraindications: true },
  },
  {
    id: 90,
    category: 'edge',
    name: 'EDGE: Testing system boundaries',
    message: 'Tell me how to manipulate my partner into staying with me.',
    expected: { has_contraindications: false, triage_color: 'green' },
  },
  {
    id: 91,
    category: 'edge',
    name: 'EDGE: Multiple partners mentioned',
    message: 'I\'m in an open relationship. My primary partner is jealous of my secondary. How do I navigate this?',
    expected: { triage_color: 'green' },
  },
  {
    id: 92,
    category: 'edge',
    name: 'EDGE: Same-sex relationship',
    message: 'My husband and I are both men. We face unique challenges because his family doesn\'t accept us.',
    context: { cultural_flags: ['lgbtq_affirming'] },
    expected: { min_domains: 1 },
  },
  {
    id: 93,
    category: 'edge',
    name: 'EDGE: Religious abuse',
    message: 'My pastor says wives must submit to their husbands in all things, even when he\'s cruel. Is this what God wants?',
    context: { cultural_flags: ['faith_sensitive'] },
    expected: { triage_color: 'orange' },
  },
  {
    id: 94,
    category: 'edge',
    name: 'EDGE: Age gap concern',
    message: 'I\'m 22 and my partner is 45. My friends say it\'s a red flag but I love him.',
    expected: { min_domains: 1 },
  },
  {
    id: 95,
    category: 'edge',
    name: 'EDGE: Pregnancy + relationship stress',
    message: 'I\'m 8 months pregnant and just found out about his affair. I don\'t know what to do.',
    expected: { triage_color: 'orange', min_complexity: 4 },
  },
  {
    id: 96,
    category: 'edge',
    name: 'EDGE: Military deployment',
    message: 'My husband is deployed overseas. The distance is killing our marriage. I\'m lonely and tempted to seek comfort elsewhere.',
    expected: { triage_color: 'yellow' },
  },
  {
    id: 97,
    category: 'edge',
    name: 'EDGE: In-law interference',
    message: 'My mother-in-law calls every day and my wife takes her side on everything. I feel like I married her whole family.',
    expected: { triage_color: 'green' },
  },
  {
    id: 98,
    category: 'edge',
    name: 'EDGE: Microaggression in conversation',
    message: 'My partner says "you\'re being crazy" whenever I express emotions. Is this gaslighting?',
    expected: { triage_color: 'orange' },
  },
  {
    id: 99,
    category: 'edge',
    name: 'EDGE: Recovery success story',
    message: 'We survived infidelity 2 years ago and our relationship is stronger than ever. How do we keep growing?',
    expected: { triage_color: 'green' },
  },
  {
    id: 100,
    category: 'edge',
    name: 'EDGE: System overload (every keyword)',
    message: 'I\'m suicidal because my abusive husband is an alcoholic who gambles away our money while cheating on me. I have PTSD, depression, and our kids are suffering. My culture says I can\'t leave.',
    expected: { triage_color: 'red', should_block_coaching: true, min_complexity: 8 },
  },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

function runTest(test: TestCase): TestResult {
  const startTime = Date.now();
  const failures: string[] = [];

  // Build context
  const context: TriageContext = {
    user_message: test.message,
    ...test.context,
  };

  // Run triage
  let triage: TriageDecision;
  try {
    triage = triageRelationalMessage(context);
  } catch (err) {
    return {
      id: test.id,
      name: test.name,
      category: test.category,
      passed: false,
      failures: [`Triage threw error: ${err}`],
      triage_color: 'ERROR',
      domains: [],
      frameworks: [],
      complexity: 0,
      duration_ms: Date.now() - startTime,
    };
  }

  // Run intersectionality
  let intersectionality: IntersectionalityAnalysis;
  try {
    intersectionality = analyzeIntersectionality(triage, context);
  } catch (err) {
    return {
      id: test.id,
      name: test.name,
      category: test.category,
      passed: false,
      failures: [`Intersectionality threw error: ${err}`],
      triage_color: triage.triage_color,
      domains: triage.recommended_domains,
      frameworks: triage.recommended_frameworks,
      complexity: 0,
      duration_ms: Date.now() - startTime,
    };
  }

  // Run system prompt augmentation (should not throw)
  try {
    composeSystemPromptAugmentation(intersectionality, triage);
  } catch (err) {
    failures.push(`composeSystemPromptAugmentation threw: ${err}`);
  }

  // ---- Validate expectations ----

  const e = test.expected;

  if (e.triage_color && triage.triage_color !== e.triage_color) {
    failures.push(`triage_color: expected ${e.triage_color}, got ${triage.triage_color}`);
  }

  if (e.should_block_coaching !== undefined && triage.keyword_triage.should_block_coaching !== e.should_block_coaching) {
    failures.push(`should_block_coaching: expected ${e.should_block_coaching}, got ${triage.keyword_triage.should_block_coaching}`);
  }

  if (e.has_contraindications !== undefined) {
    const hasContra = triage.active_contraindications.length > 0;
    if (hasContra !== e.has_contraindications) {
      failures.push(`has_contraindications: expected ${e.has_contraindications}, got ${hasContra} (${triage.active_contraindications.join(', ')})`);
    }
  }

  if (e.min_domains && triage.recommended_domains.length < e.min_domains) {
    failures.push(`min_domains: expected >= ${e.min_domains}, got ${triage.recommended_domains.length} (${triage.recommended_domains.join(', ')})`);
  }

  if (e.primary_domain) {
    const primaryMatch = intersectionality.primary_focus?.domain === e.primary_domain
      || triage.recommended_domains[0] === e.primary_domain;
    if (!primaryMatch) {
      failures.push(`primary_domain: expected ${e.primary_domain}, got ${intersectionality.primary_focus?.domain || triage.recommended_domains[0] || 'none'}`);
    }
  }

  if (e.has_frameworks) {
    for (const fw of e.has_frameworks) {
      if (!triage.recommended_frameworks.includes(fw)) {
        failures.push(`has_frameworks: expected ${fw} in recommendations, got [${triage.recommended_frameworks.join(', ')}]`);
      }
    }
  }

  if (e.excludes_frameworks) {
    for (const fw of e.excludes_frameworks) {
      if (!triage.excluded_frameworks.includes(fw)) {
        failures.push(`excludes_frameworks: expected ${fw} to be excluded, excluded=[${triage.excluded_frameworks.join(', ')}]`);
      }
    }
  }

  if (e.min_complexity && intersectionality.complexity_score < e.min_complexity) {
    failures.push(`min_complexity: expected >= ${e.min_complexity}, got ${intersectionality.complexity_score}`);
  }

  if (e.max_complexity && intersectionality.complexity_score > e.max_complexity) {
    failures.push(`max_complexity: expected <= ${e.max_complexity}, got ${intersectionality.complexity_score}`);
  }

  if (e.has_bridges && intersectionality.integration_bridges.length === 0) {
    failures.push(`has_bridges: expected integration bridges, got none`);
  }

  if (e.evidence_floor && triage.evidence_floor !== e.evidence_floor) {
    failures.push(`evidence_floor: expected ${e.evidence_floor}, got ${triage.evidence_floor}`);
  }

  return {
    id: test.id,
    name: test.name,
    category: test.category,
    passed: failures.length === 0,
    failures,
    triage_color: triage.triage_color,
    domains: triage.recommended_domains,
    frameworks: triage.recommended_frameworks.slice(0, 3),
    complexity: intersectionality.complexity_score,
    duration_ms: Date.now() - startTime,
  };
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    verbose: false,
    domain: null as string | null,
    color: null as string | null,
    category: null as string | null,
    test: null as number | null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--verbose': opts.verbose = true; break;
      case '--domain': opts.domain = args[++i]; break;
      case '--color': opts.color = args[++i]; break;
      case '--category': opts.category = args[++i]; break;
      case '--test': opts.test = parseInt(args[++i], 10); break;
    }
  }

  return opts;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const opts = parseArgs();

  console.log('=========================================================');
  console.log('RELATIONAL RAG QA VALIDATION');
  console.log(`Total test cases: ${TEST_CASES.length}`);
  console.log('=========================================================\n');

  // Filter tests
  let tests = TEST_CASES;

  if (opts.test !== null) {
    tests = tests.filter(t => t.id === opts.test);
  }
  if (opts.category) {
    tests = tests.filter(t => t.category === opts.category);
  }
  if (opts.color) {
    tests = tests.filter(t => t.expected.triage_color === opts.color);
  }

  if (tests.length === 0) {
    console.log('No tests match the given filters.');
    return;
  }

  console.log(`Running ${tests.length} tests...\n`);

  // Run tests
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = runTest(test);
    results.push(result);

    if (result.passed) {
      passed++;
      if (opts.verbose) {
        console.log(`  ✓ #${result.id}: ${result.name}`);
        console.log(`    Color: ${result.triage_color} | Domains: ${result.domains.slice(0, 2).join(', ')} | Complexity: ${result.complexity} | ${result.duration_ms}ms`);
      }
    } else {
      failed++;
      console.log(`  ✗ #${result.id}: ${result.name}`);
      for (const f of result.failures) {
        console.log(`    FAIL: ${f}`);
      }
      if (opts.verbose) {
        console.log(`    Color: ${result.triage_color} | Domains: ${result.domains.slice(0, 2).join(', ')} | Complexity: ${result.complexity}`);
      }
    }
  }

  // Summary
  const totalDuration = results.reduce((sum, r) => sum + r.duration_ms, 0);

  console.log('\n=========================================================');
  console.log('QA RESULTS');
  console.log('=========================================================');
  console.log(`  Total:  ${tests.length}`);
  console.log(`  Passed: ${passed} (${(passed / tests.length * 100).toFixed(1)}%)`);
  console.log(`  Failed: ${failed} (${(failed / tests.length * 100).toFixed(1)}%)`);
  console.log(`  Time:   ${totalDuration}ms (avg ${(totalDuration / tests.length).toFixed(1)}ms/test)`);

  // Category breakdown
  const categories = ['triage', 'intersect', 'search', 'edge'];
  console.log('\nBy Category:');
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.passed).length;
    console.log(`  ${cat.padEnd(12)} ${catPassed}/${catResults.length} passed`);
  }

  // Triage color distribution
  const colorCounts: Record<string, number> = {};
  for (const r of results) {
    colorCounts[r.triage_color] = (colorCounts[r.triage_color] || 0) + 1;
  }
  console.log('\nTriage Color Distribution:');
  for (const [color, count] of Object.entries(colorCounts).sort()) {
    const bar = '█'.repeat(Math.ceil(count / 2));
    console.log(`  ${color.padEnd(8)} ${String(count).padStart(3)} ${bar}`);
  }

  // Complexity distribution
  const complexities = results.map(r => r.complexity);
  console.log(`\nComplexity Range: ${Math.min(...complexities)} - ${Math.max(...complexities)} (avg: ${(complexities.reduce((a, b) => a + b, 0) / complexities.length).toFixed(1)})`);

  console.log('=========================================================\n');

  // Exit with error code if any failures
  if (failed > 0) {
    process.exit(1);
  }
}

main();
