// ============================================================================
// CULTURAL LANGUAGE DETECTOR (Phase 7.2)
// ============================================================================
//
// Detects culturally-specific expressions, code-switching, and colloquialisms
// to ensure the RAG retrieves culturally-appropriate content and the system
// adapts its language to match the user's frame.
//
// This is NOT about stereotyping. It's about:
// 1. Matching content to the user's actual lived experience
// 2. Avoiding culturally-insensitive framework recommendations
// 3. Selecting culturally-informed examples and case studies
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface CulturalSignal {
  culture: string;
  confidence: number; // 0-1
  markers_found: string[];
  adapted_retrieval_tags: string[];
  framework_adaptations: string[];
}

export interface CulturalDetectionResult {
  detected_cultures: CulturalSignal[];
  primary_culture: string | null;
  language_style: 'formal' | 'conversational' | 'code_switching' | 'clinical';
  colloquial_mappings: Record<string, string>; // user term -> clinical term
  retrieval_boost_tags: string[];
  framework_warnings: string[]; // frameworks to avoid or adapt
}

// ============================================================================
// CULTURAL SIGNAL MAPS
// ============================================================================

interface SignalPattern {
  patterns: RegExp[];
  culture: string;
  confidence_boost: number;
}

const CULTURAL_SIGNALS: SignalPattern[] = [
  // African American cultural signals
  {
    culture: 'african_american',
    confidence_boost: 0.3,
    patterns: [
      /strong\s+(black|brown)\s+(woman|man|wife|husband)/i,
      /code[- ]switch/i,
      /\b(auntie|uncle|cousin|play\s+cousin)\b.*\b(advice|said|told)\b/i,
      /church\s+(mother|father|folk|people|community)/i,
      /\b(sister|brother)\b.*\b(church|congregation)\b/i,
      /generational\s+(curse|trauma|pattern)/i,
      /black\s+(love|marriage|family|man|woman)/i,
      /\bprovider\b.*\b(man|husband|role)\b/i,
    ],
  },
  // Latino/Hispanic cultural signals
  {
    culture: 'latino_hispanic',
    confidence_boost: 0.3,
    patterns: [
      /\b(mi\s+familia|la\s+familia|familia)\b/i,
      /\b(abuela|abuelo|tia|tio|comadre|compadre)\b/i,
      /\b(machismo|marianismo|familismo)\b/i,
      /\b(respeto|orgullo|confianza)\b/i,
      /\b(novela|telenovela)\b/i,
      /\bquinceanera\b/i,
      /\b(mami|papi)\b.*\b(always|said|told)\b/i,
    ],
  },
  // South Asian cultural signals
  {
    culture: 'south_asian',
    confidence_boost: 0.3,
    patterns: [
      /\b(izzat|honour|honor)\b.*\b(family|community)\b/i,
      /arranged\s+marriage/i,
      /\b(joint\s+family|in-?laws?\s+live)\b/i,
      /\b(aunty|uncle)\s+(ji|jee)\b/i,
      /\bbiradari\b/i,
      /\b(dowry|dahej|mahr)\b/i,
      /\b(rishta|rishtey|shaadi)\b/i,
      /log\s+kya\s+kahenge/i, // "what will people say"
    ],
  },
  // East Asian cultural signals
  {
    culture: 'east_asian',
    confidence_boost: 0.3,
    patterns: [
      /\b(face|mianzi|mentsu)\b.*\b(lose|save|keep)\b/i,
      /filial\s+piety/i,
      /\b(tiger\s+(mom|parent|mother|father))\b/i,
      /\b(harmony|wa)\b.*\b(keep|maintain|family)\b/i,
      /\b(shame|haji)\b.*\b(family|parent)\b/i,
      /\b(duty|obligation)\b.*\b(parent|elder|family)\b/i,
    ],
  },
  // Military/Veteran cultural signals
  {
    culture: 'military_veteran',
    confidence_boost: 0.35,
    patterns: [
      /\b(deployed|deployment|redeployed|reintegrat)/i,
      /\b(TDY|PCS|PCSing|mil\s*spouse)\b/i,
      /\b(battle\s+buddy|battle\s+rhythm|chain\s+of\s+command)\b/i,
      /\b(VA|veterans?\s+affairs|PTSD)\b.*\b(appointment|therapy|group)\b/i,
      /\b(active\s+duty|reserve|national\s+guard|retired\s+military)\b/i,
      /\b(hypervigilance|startle|combat)\b/i,
      /\b(military\s+spouse|dependa|dependent)\b/i,
      /\b(moral\s+injury)\b/i,
    ],
  },
  // LGBTQ+ cultural signals
  {
    culture: 'lgbtq_plus',
    confidence_boost: 0.3,
    patterns: [
      /\b(coming\s+out|closet|out\s+to)\b/i,
      /\b(chosen\s+family|found\s+family)\b/i,
      /\b(heteronormative|cisnormative)\b/i,
      /\b(partner|spouse)\b.*\b(same[- ]sex|same[- ]gender)\b/i,
      /\b(minority\s+stress)\b/i,
      /\b(transition|transitioning|non-?binary|gender\s+identity)\b/i,
      /\b(queer|LGBTQ|gay|lesbian|bisexual)\b.*\b(relationship|marriage|couple)\b/i,
    ],
  },
  // Faith-Based Christian signals
  {
    culture: 'faith_based_christian',
    confidence_boost: 0.25,
    patterns: [
      /\b(covenant|marriage\s+covenant)\b/i,
      /\b(headship|submission|submit)\b.*\b(husband|wife|spouse)\b/i,
      /\b(pastor|elder|deacon)\b.*\b(said|told|counsel|advise)\b/i,
      /\b(God|Lord|Jesus|Christ)\b.*\b(marriage|relationship|union)\b/i,
      /\b(biblical|scripture|Bible|proverbs)\b.*\b(marriage|wife|husband)\b/i,
      /\b(purity|purity\s+culture|virgin|abstinence)\b/i,
      /\b(prayer|praying)\b.*\b(marriage|relationship|spouse)\b/i,
    ],
  },
  // Faith-Based Muslim signals
  {
    culture: 'faith_based_muslim',
    confidence_boost: 0.3,
    patterns: [
      /\b(nikah|walimah|mahr|mehr)\b/i,
      /\b(halal|haram)\b.*\b(relationship|dating|marriage)\b/i,
      /\b(imam|sheikh|maulana)\b.*\b(said|counsel|advise)\b/i,
      /\b(qiwamah|nushuz|khul)\b/i,
      /\b(Quran|Sunnah|hadith)\b.*\b(marriage|spouse|wife|husband)\b/i,
      /\b(insha\s*allah|mashallah|subhanallah)\b/i,
      /\b(Islamic|Muslim)\b.*\b(marriage|relationship|family)\b/i,
    ],
  },
  // Immigrant/Bicultural signals
  {
    culture: 'immigrant_bicultural',
    confidence_boost: 0.25,
    patterns: [
      /\b(back\s+home|old\s+country|motherland)\b/i,
      /\b(first[- ]gen|second[- ]gen|immigrant)\b/i,
      /\b(accent|language\s+barrier|translate|interpreter)\b/i,
      /\b(green\s+card|visa|immigration|citizen)\b/i,
      /\b(assimilat|accultur)\b/i,
      /\b(too\s+(American|Western))\b.*\b(family|parent)\b/i,
      /\b(send\s+money|remittance)\b.*\b(family|back\s+home)\b/i,
    ],
  },
  // Blended/Step-Family signals
  {
    culture: 'blended_step_family',
    confidence_boost: 0.35,
    patterns: [
      /\b(step[- ]?(mom|dad|parent|child|son|daughter|kid))\b/i,
      /\b(blended\s+family|bonus\s+(mom|dad|parent))\b/i,
      /\b(ex[- ]?(wife|husband|spouse|partner))\b.*\b(co[- ]?parent)/i,
      /\b(custody|visitation|every\s+other\s+weekend)\b/i,
      /\b(his\s+kids|her\s+kids|my\s+kids|our\s+kids)\b/i,
      /\b(loyalty\s+conflict|caught\s+in\s+the\s+middle)\b/i,
    ],
  },
  // Neurodivergent signals
  {
    culture: 'neurodivergent_couples',
    confidence_boost: 0.3,
    patterns: [
      /\b(ADHD|ADD)\b.*\b(spouse|partner|marriage|relationship)\b/i,
      /\b(autism|autistic|ASD|Asperger)\b.*\b(spouse|partner|marriage)\b/i,
      /\b(executive\s+function|sensory\s+overload|sensory\s+need)\b/i,
      /\b(hyperfocus|hyper[- ]focus)\b.*\b(relationship|partner)\b/i,
      /\b(neurodivergent|neurotypical|NT\s+partner)\b/i,
      /\b(meltdown|shutdown)\b.*\b(partner|spouse)\b/i,
      /\b(parent[- ]child\s+dynamic)\b.*\b(marriage|partner)\b/i,
    ],
  },
  // Age-Gap signals
  {
    culture: 'age_gap',
    confidence_boost: 0.25,
    patterns: [
      /\b(\d+)\s*year(s?)\s*(age\s+)?(gap|difference|older|younger)\b/i,
      /\b(much\s+older|much\s+younger)\b.*\b(partner|spouse|husband|wife)\b/i,
      /\b(generation\s+gap|different\s+generation)\b/i,
      /\b(people\s+judge|people\s+stare|society\s+thinks)\b.*\b(age|older|younger)\b/i,
      /\b(life\s+stage)\b.*\b(different|mismatch)\b/i,
    ],
  },
];

// ============================================================================
// COLLOQUIAL → CLINICAL MAPPINGS
// ============================================================================

const COLLOQUIAL_MAPPINGS: Record<string, { pattern: RegExp; clinical: string }[]> = {
  general: [
    { pattern: /walking\s+on\s+eggshells/i, clinical: 'hypervigilance/emotional volatility' },
    { pattern: /stonewalling/i, clinical: 'withdrawal/emotional disengagement' },
    { pattern: /gaslight/i, clinical: 'psychological manipulation/reality distortion' },
    { pattern: /love\s+bomb/i, clinical: 'idealization phase/narcissistic cycle' },
    { pattern: /breadcrumbing/i, clinical: 'intermittent reinforcement' },
    { pattern: /silent\s+treatment/i, clinical: 'demand-withdraw pattern/stonewalling' },
    { pattern: /triggered/i, clinical: 'activated trauma response' },
    { pattern: /toxic/i, clinical: 'harmful relational patterns' },
    { pattern: /narcissist/i, clinical: 'narcissistic personality traits/coercive control' },
    { pattern: /codependent/i, clinical: 'enmeshed attachment/over-functioning' },
    { pattern: /checking\s+out/i, clinical: 'emotional withdrawal/dissociation' },
    { pattern: /blew\s+up/i, clinical: 'emotional flooding/dysregulation' },
    { pattern: /shut\s+down/i, clinical: 'dorsal vagal shutdown/freeze response' },
    { pattern: /lost\s+(the\s+)?spark/i, clinical: 'decreased romantic/sexual desire' },
    { pattern: /growing\s+apart/i, clinical: 'attachment distance/emotional disconnection' },
  ],
  african_american: [
    { pattern: /ride\s+or\s+die/i, clinical: 'unconditional loyalty/enmeshment risk' },
    { pattern: /strong\s+black\s+(woman|man)/i, clinical: 'externalized resilience expectations/vulnerability avoidance' },
    { pattern: /keep\s+it\s+in\s+the\s+house/i, clinical: 'help-seeking stigma/community privacy norms' },
  ],
  military_veteran: [
    { pattern: /suck\s+it\s+up/i, clinical: 'emotional suppression/stoicism mandate' },
    { pattern: /battle\s+buddy/i, clinical: 'combat bonding/peer support' },
    { pattern: /high\s+speed/i, clinical: 'performance orientation/hypervigilance' },
  ],
};

// ============================================================================
// FRAMEWORK ADAPTATION WARNINGS
// ============================================================================

const FRAMEWORK_WARNINGS: Record<string, string[]> = {
  african_american: [
    'EFT vulnerability exercises may need adaptation - historical context of emotional vulnerability as danger',
    'Avoid pathologizing extended family involvement - it\'s a cultural strength, not enmeshment',
    'Gottman 4 Horsemen detection should account for cultural communication styles',
  ],
  south_asian: [
    'Western boundaries framework may conflict with collectivist family values - adapt language',
    'Individual therapy framing may need reframe toward family harmony goals',
    'In-law dynamics are not "enmeshment" in collectivist cultures - reframe as navigation',
  ],
  east_asian: [
    'Direct emotion expression exercises may need gradual introduction',
    'Conflict engagement techniques should honor indirect communication preferences',
    'Save face considerations should be integrated into repair attempt frameworks',
  ],
  faith_based_christian: [
    'Avoid dismissing covenant framework - work within it when safe',
    'Submission discussions require careful framing - distinguish biblical from patriarchal',
    'Therapy-positive reframing: seeking help is stewardship, not failure',
  ],
  faith_based_muslim: [
    'Framework recommendations should be compatible with Islamic marriage principles',
    'Gender role discussions require sensitivity to religious vs. cultural distinctions',
    'Include Islamic counseling approaches alongside Western frameworks',
  ],
  military_veteran: [
    'Emotional vulnerability exercises need reframing as tactical skills, not weakness',
    'PTSD screening language should be normalized within military culture',
    'Reintegration frameworks should acknowledge the full deployment cycle',
  ],
  lgbtq_plus: [
    'Heteronormative assumptions in standard frameworks need explicit adaptation',
    'Minority stress should be acknowledged as a contributing factor, not pathologized',
    'Family-of-origin work may include chosen family dynamics',
  ],
  neurodivergent_couples: [
    'Standard emotional intelligence frameworks may need neurodivergent adaptation',
    'Executive function accommodations are not "enabling" - they\'re reasonable adjustments',
    'Sensory needs in intimacy discussions are clinical, not preference-based',
  ],
};

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Detect cultural signals in a user message and return adapted retrieval
 * parameters. Runs FAST (regex only, no LLM call) for use in every message.
 */
export function detectCulturalSignals(
  message: string,
  existingProfile?: { cultural_context?: string[] }
): CulturalDetectionResult {
  const cultureScores: Record<string, { confidence: number; markers: string[] }> = {};

  // Check all signal patterns
  for (const signal of CULTURAL_SIGNALS) {
    for (const pattern of signal.patterns) {
      const match = message.match(pattern);
      if (match) {
        if (!cultureScores[signal.culture]) {
          cultureScores[signal.culture] = { confidence: 0, markers: [] };
        }
        cultureScores[signal.culture].confidence += signal.confidence_boost;
        cultureScores[signal.culture].markers.push(match[0]);
      }
    }
  }

  // Boost from existing profile
  if (existingProfile?.cultural_context) {
    for (const ctx of existingProfile.cultural_context) {
      if (cultureScores[ctx]) {
        cultureScores[ctx].confidence += 0.2;
      }
    }
  }

  // Cap confidence at 1.0
  for (const score of Object.values(cultureScores)) {
    score.confidence = Math.min(score.confidence, 1.0);
  }

  // Build detected cultures (threshold: 0.25)
  const detectedCultures: CulturalSignal[] = Object.entries(cultureScores)
    .filter(([, s]) => s.confidence >= 0.25)
    .sort(([, a], [, b]) => b.confidence - a.confidence)
    .map(([culture, score]) => ({
      culture,
      confidence: Math.round(score.confidence * 100) / 100,
      markers_found: score.markers,
      adapted_retrieval_tags: [culture],
      framework_adaptations: FRAMEWORK_WARNINGS[culture] || [],
    }));

  // Detect language style
  const languageStyle = detectLanguageStyle(message);

  // Build colloquial mappings
  const mappings: Record<string, string> = {};
  const allMappingGroups = ['general'];
  if (detectedCultures.length > 0) {
    allMappingGroups.push(detectedCultures[0].culture);
  }
  for (const group of allMappingGroups) {
    const groupMappings = COLLOQUIAL_MAPPINGS[group] || [];
    for (const m of groupMappings) {
      if (m.pattern.test(message)) {
        const match = message.match(m.pattern);
        if (match) {
          mappings[match[0]] = m.clinical;
        }
      }
    }
  }

  // Aggregate framework warnings
  const frameworkWarnings: string[] = [];
  for (const c of detectedCultures) {
    frameworkWarnings.push(...c.framework_adaptations);
  }

  return {
    detected_cultures: detectedCultures,
    primary_culture: detectedCultures.length > 0 ? detectedCultures[0].culture : null,
    language_style: languageStyle,
    colloquial_mappings: mappings,
    retrieval_boost_tags: detectedCultures.map((c) => c.culture),
    framework_warnings: [...new Set(frameworkWarnings)],
  };
}

// ============================================================================
// LANGUAGE STYLE DETECTION
// ============================================================================

function detectLanguageStyle(
  message: string
): 'formal' | 'conversational' | 'code_switching' | 'clinical' {
  const wordCount = message.split(/\s+/).length;
  const clinicalTerms = [
    'attachment', 'avoidant', 'anxious', 'dysregulation', 'trauma',
    'narcissistic', 'codependency', 'enmeshment', 'differentiation',
    'polyvagal', 'somatic', 'transference', 'countertransference',
  ];
  const casualMarkers = [
    /\blol\b/i, /\bomg\b/i, /\bsmh\b/i, /\btbh\b/i, /\bidk\b/i,
    /\baf\b/i, /\bngl\b/i, /\bfr\b/i, /\brn\b/i,
    /\.{3,}/, /!{2,}/, /\?{2,}/,
  ];

  const clinicalCount = clinicalTerms.filter((t) =>
    new RegExp(`\\b${t}\\b`, 'i').test(message)
  ).length;
  const casualCount = casualMarkers.filter((p) => p.test(message)).length;

  // Clinical language detected
  if (clinicalCount >= 2) return 'clinical';

  // Code-switching: mix of formal/casual
  if (clinicalCount >= 1 && casualCount >= 1) return 'code_switching';

  // Casual/conversational
  if (casualCount >= 2 || (wordCount < 30 && casualCount >= 1)) return 'conversational';

  // Default to formal
  return 'formal';
}

// ============================================================================
// CONTEXT FORMATTING FOR RAG
// ============================================================================

/**
 * Format cultural detection results into a context block for the system prompt.
 */
export function formatCulturalContext(result: CulturalDetectionResult): string {
  if (result.detected_cultures.length === 0 && Object.keys(result.colloquial_mappings).length === 0) {
    return '';
  }

  const parts: string[] = ['\n[CULTURAL CONTEXT DETECTED]'];

  if (result.detected_cultures.length > 0) {
    const cultures = result.detected_cultures
      .map((c) => `${c.culture} (${Math.round(c.confidence * 100)}% confidence)`)
      .join(', ');
    parts.push(`Cultures detected: ${cultures}`);
  }

  if (result.framework_warnings.length > 0) {
    parts.push('\nFramework adaptations needed:');
    for (const w of result.framework_warnings.slice(0, 3)) {
      parts.push(`- ${w}`);
    }
  }

  if (Object.keys(result.colloquial_mappings).length > 0) {
    parts.push('\nUser language → Clinical mapping:');
    for (const [user, clinical] of Object.entries(result.colloquial_mappings)) {
      parts.push(`- "${user}" → ${clinical}`);
    }
  }

  parts.push(`\nUser communication style: ${result.language_style}`);

  return parts.join('\n');
}
