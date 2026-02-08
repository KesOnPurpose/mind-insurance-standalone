// ============================================================================
// BILLION DOLLAR RAG - Content Generation Pipeline
// ============================================================================
//
// Generates ~40,000 knowledge chunks across 7 content types:
//   1. Micro-Interventions (~5,000) - Exact scripts, exercises, de-escalation
//   2. Case Studies (~10,000) - Situation → Pattern → Framework → Outcome
//   3. Real Talk / Keston Voice (~5,000) - Clinical concepts in warm language
//   4. Primary Source Summaries (~15,000) - Book chapter extractions
//   5. Validation Chunks (~500) - Pure emotional validation
//   6. Cross-Pillar Content (~2,000) - When the real issue is in another pillar
//   7. Cultural Context Modules (~2,400) - 12 cultural contexts × 200 chunks
//
// Usage:
//   OPENAI_API_KEY=sk-... ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-rag-content.ts --type micro_interventions --batch-size 10
//
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_KEY = '$SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// --no-embed flag: skip embedding generation, insert chunks with null embeddings
// Embeddings can be backfilled later via --type=backfill_embeddings
const NO_EMBED = process.argv.includes('--no-embed');

// ============================================================================
// FRAMEWORK DOMAINS (for reference in generation)
// ============================================================================

const FRAMEWORK_DOMAINS = {
  foundation_attachment: {
    label: 'Foundation & Attachment',
    frameworks: ['gottman_method', 'emotionally_focused_therapy', 'attachment_theory_bowlby', 'five_love_languages'],
  },
  communication_conflict: {
    label: 'Communication & Conflict',
    frameworks: ['nonviolent_communication', 'crucial_conversations', 'gottman_four_horsemen'],
  },
  trauma_nervous_system: {
    label: 'Trauma & Nervous System',
    frameworks: ['polyvagal_theory', 'complex_trauma_cptsd', 'internal_family_systems', 'somatic_experiencing'],
  },
  abuse_narcissism: {
    label: 'Abuse & Narcissism',
    frameworks: ['coercive_control_stark', 'narcissistic_abuse_recovery', 'lundy_bancroft_abuser_profiles'],
  },
  addiction_codependency: {
    label: 'Addiction & Codependency',
    frameworks: ['addiction_impact_relationships', 'codependency_beattie', 'betrayal_trauma_steffens'],
  },
  modern_threats: {
    label: 'Modern Threats',
    frameworks: ['social_media_impact', 'financial_infidelity', 'technology_boundaries'],
  },
  financial_mens: {
    label: 'Financial & Men\'s Identity',
    frameworks: ['financial_stress_marriage', 'male_identity_crisis'],
  },
  cultural_context: {
    label: 'Cultural Context',
    frameworks: ['religious_faith_based_marriage', 'cross_cultural_relationships'],
  },
  neurodivergence: {
    label: 'Neurodivergence',
    frameworks: ['adhd_and_marriage_orlov', 'autism_in_relationships'],
  },
  premarital_formation: {
    label: 'Premarital & Formation',
    frameworks: ['premarital_counseling', 'boundaries_dating_cloud_townsend'],
  },
};

// ============================================================================
// CONTENT GENERATION TEMPLATES
// ============================================================================

const TEMPLATES = {
  micro_intervention: {
    system: `You are a world-class relational therapist creating micro-interventions for a coaching app. Each intervention must be:
1. Immediately actionable (can be done in 2-15 minutes)
2. Based on evidence-based frameworks
3. Written as exact scripts or step-by-step exercises
4. Tailored to specific relationship patterns

Return a JSON array of interventions. Each object must have:
{
  "title": "short descriptive title",
  "chunk_text": "the full intervention text (200-400 words) with exact scripts/steps",
  "chunk_summary": "one-line summary",
  "framework_name": "the framework this is based on",
  "framework_domain": "the domain",
  "framework_section": "specific section (e.g., 'repair_attempts', 'de_escalation')",
  "evidence_tier": "gold|silver|bronze",
  "target_readiness": "processing|ready|motivated",
  "time_commitment_category": "micro_2min|short_15min|medium_30min",
  "target_pattern": "pursuer_withdrawer|withdrawer_withdrawer|volatile|general",
  "target_issue": "communication|intimacy|trust|conflict|general",
  "triage_color": "green|yellow"
}`,

    prompt: (domain: string, frameworks: string[]) => `Generate 5 micro-interventions for the ${domain} domain, using these frameworks: ${frameworks.join(', ')}.

Include:
- 2 beginner scripts (exact words to say in specific situations)
- 2 intermediate exercises (structured activities for couples)
- 1 emergency de-escalation technique

Make them specific and actionable. Include exact wording where possible.`,
  },

  case_study: {
    system: `You are creating realistic case studies for a relational coaching knowledge base. Each case study must:
1. Feel authentic and specific (not generic)
2. Show a clear pattern → framework → intervention → outcome arc
3. Include demographic details that make it relatable
4. NOT use real names or identifiable details

Return a JSON array. Each object must have:
{
  "title": "Case: [brief description]",
  "chunk_text": "the full case study (300-500 words) with Situation → Pattern → Intervention → Outcome",
  "chunk_summary": "one-line summary",
  "framework_name": "primary framework applied",
  "framework_domain": "domain",
  "framework_section": "case_study",
  "evidence_tier": "bronze",
  "target_readiness": "ready|motivated",
  "age_range": "25-35|35-45|45-55|55+|all",
  "relationship_type": "married|dating|separated|coparenting|remarriage",
  "cultural_contexts": ["array of applicable cultural contexts"],
  "triage_color": "green|yellow"
}`,

    prompt: (domain: string, frameworks: string[], demographics: string) => `Generate 3 case studies for ${domain}, using ${frameworks.join(' and ')}.

Demographics focus: ${demographics}

Each case study should follow: Situation (what they're dealing with) → Pattern Identified (what's really happening) → Framework Applied (what concepts helped) → Intervention (what they did) → Outcome (what changed).

Make them feel real and relatable. Include specific details about their life situation.`,
  },

  real_talk: {
    system: `You are Keston, a warm but direct relationship coach. Your voice is:
- Direct and honest ("Look, here's what's really happening...")
- Uses real-world analogies and metaphors
- Personal but professional
- Definition-first approach ("Let me define what I mean by...")
- Progressive revelation (simple → complex)
- Never clinical or academic-sounding
- Uses "you" and "your" directly
- Occasional humor but never at someone's expense

Return a JSON array. Each object must have:
{
  "title": "Real Talk: [topic]",
  "chunk_text": "the content in Keston's voice (200-400 words)",
  "chunk_summary": "one-line summary in Keston's voice",
  "framework_name": "underlying framework",
  "framework_domain": "domain",
  "framework_section": "real_talk",
  "evidence_tier": "bronze",
  "voice": "keston",
  "target_readiness": "processing|ready",
  "triage_color": "green"
}`,

    prompt: (domain: string, concepts: string[]) => `Write 5 "Real Talk" pieces about ${domain} concepts: ${concepts.join(', ')}.

For each concept:
1. Start with "Look..." or "Here's the thing..." or a direct statement
2. Explain the concept using everyday language and metaphors
3. Give a real-world example
4. End with one specific thing they can do TODAY

Write like you're talking to a friend at a coffee shop, not lecturing. Be warm but don't sugarcoat.`,
  },

  validation: {
    system: `You are creating emotional validation content for people in relationship crisis. These chunks are used when someone is emotionally flooded and NOT ready for advice.

The goal is pure empathy - making them feel seen and understood.

Return a JSON array. Each object must have:
{
  "title": "Validation: [specific situation]",
  "chunk_text": "validation message (100-200 words) - pure empathy, no advice",
  "chunk_summary": "one-line summary",
  "framework_name": "general_validation",
  "framework_domain": "foundation_attachment",
  "framework_section": "validation",
  "evidence_tier": "bronze",
  "voice": "keston",
  "target_readiness": "flooded",
  "granularity": "validation",
  "target_issue": "the specific issue being validated",
  "triage_color": "green|yellow"
}`,

    prompt: (issues: string[]) => `Generate 10 validation chunks for people experiencing: ${issues.join(', ')}.

Each validation should:
1. Name the specific pain they're feeling
2. Normalize it ("This is one of the hardest things...")
3. Acknowledge their courage for seeking help
4. NOT give advice, reframe, or suggest solutions
5. Use warm, direct language

Examples of what they might be feeling:
- The loneliness of sleeping next to someone who feels like a stranger
- The exhaustion of being the only one trying
- The shame of admitting your relationship is struggling
- The fear that comes after discovering betrayal`,
  },

  cross_pillar: {
    system: `You are creating content about how non-relational life factors affect relationships. The key insight: 70% of "communication problems" actually have root causes in other life areas.

Return a JSON array. Each object must have:
{
  "title": "Cross-Pillar: [pillar] → [relationship impact]",
  "chunk_text": "content (200-400 words) explaining the cross-pillar connection",
  "chunk_summary": "one-line summary",
  "framework_name": "cross_pillar_awareness",
  "framework_domain": "communication_conflict",
  "framework_section": "cross_pillar",
  "evidence_tier": "bronze",
  "cross_pillar_tags": ["the non-relational pillar involved"],
  "target_readiness": "processing|ready",
  "triage_color": "green|yellow"
}`,

    prompt: (pillar: string, scenarios: string[]) => `Generate 5 cross-pillar content pieces about how ${pillar} issues affect relationships.

Scenarios: ${scenarios.join(', ')}

For each:
1. Describe the presenting symptom (what the couple thinks is wrong)
2. Reveal the actual root cause (the ${pillar} factor)
3. Explain the cascade (how it creates relationship conflict)
4. Suggest what to address first (the real issue, not the symptom)`,
  },

  cultural_context: {
    system: `You are creating culturally-informed relationship content. This content MUST be:
1. Respectful and nuanced - no stereotypes
2. Written by someone who deeply understands the culture
3. Specific about how cultural factors interact with relationship dynamics
4. Clear about when Western therapy frameworks need adaptation
5. Practical - includes culturally-appropriate alternatives

Return a JSON array. Each object must have:
{
  "title": "Cultural: [culture] - [topic]",
  "chunk_text": "culturally-informed content (200-400 words)",
  "chunk_summary": "one-line summary",
  "framework_name": "cultural_adaptation",
  "framework_domain": "cultural_context",
  "framework_section": "cultural_module",
  "evidence_tier": "bronze",
  "cultural_contexts": ["the cultural context"],
  "target_readiness": "ready",
  "triage_color": "green"
}`,

    prompt: (culture: string, topics: string[]) => `Generate 5 culturally-informed pieces for ${culture} relationships, covering: ${topics.join(', ')}.

For each topic:
1. How this cultural context shapes expectations
2. Common tensions between cultural norms and relationship needs
3. How standard relationship frameworks need adaptation
4. Specific culturally-sensitive approaches that work
5. What a coach should AVOID saying/assuming

Be deeply respectful. Acknowledge the strengths of this cultural framework while addressing challenges.`,
  },
};

// ============================================================================
// GENERATION ENGINE
// ============================================================================

async function callClaude(systemPrompt: string, userPrompt: string): Promise<unknown[]> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      temperature: 0.7,
      system: systemPrompt + '\n\nIMPORTANT: Return ONLY a valid JSON array. No markdown, no code fences, no explanation before or after the JSON.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  const text = result.content[0]?.text || '[]';

  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  // Extract JSON array from response
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting JSON array from surrounding text
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch { /* fall through to repair */ }
    }

    // Repair truncated JSON: find last complete object in array
    const arrayStart = cleaned.indexOf('[');
    if (arrayStart >= 0) {
      let truncated = cleaned.slice(arrayStart);
      // Find last complete object by finding last '}'
      const lastCompleteObj = truncated.lastIndexOf('}');
      if (lastCompleteObj > 0) {
        truncated = truncated.slice(0, lastCompleteObj + 1) + ']';
        try {
          const parsed = JSON.parse(truncated);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.warn(`    (repaired truncated JSON: recovered ${parsed.length} chunks)`);
            return parsed;
          }
        } catch { /* fall through */ }
      }
    }

    console.error('Failed to parse Claude response:', cleaned.slice(0, 300));
    return [];
  }
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (NO_EMBED) return null;

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required (use --no-embed to skip embeddings)');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding error: ${response.status}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

// ============================================================================
// CHUNK INSERTION
// ============================================================================

interface ChunkData {
  title?: string;
  chunk_text: string;
  chunk_summary: string;
  framework_name: string;
  framework_domain: string;
  framework_section?: string;
  evidence_tier?: string;
  triage_color?: string;
  voice?: string;
  granularity?: string;
  target_readiness?: string;
  time_commitment_category?: string;
  cross_pillar_tags?: string[];
  cultural_contexts?: string[];
  age_range?: string;
  relationship_type?: string[];
  target_pattern?: string;
  target_issue?: string;
}

let chunkCounter = 0;
let chunkCounterInitialized = false;

async function initChunkCounter(): Promise<void> {
  if (chunkCounterInitialized) return;
  // Get max chunk_number from existing generated content to avoid unique constraint violations
  const { data } = await supabase
    .from('mio_knowledge_chunks')
    .select('chunk_number')
    .eq('pillar', 'relational')
    .like('source_file', 'generated/%')
    .order('chunk_number', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    chunkCounter = data[0].chunk_number;
    console.log(`  Chunk counter initialized at ${chunkCounter} (continuing from existing)`);
  }
  chunkCounterInitialized = true;
}

async function insertChunk(chunk: ChunkData): Promise<boolean> {
  await initChunkCounter();
  try {
    const embedding = await generateEmbedding(chunk.chunk_text);
    chunkCounter++;

    const tokensApprox = Math.ceil(chunk.chunk_text.split(/\s+/).length * 1.3);

    const record: Record<string, unknown> = {
      pillar: 'relational',
      source_file: `generated/${chunk.granularity || 'concept'}/${chunk.framework_domain}`,
      chunk_number: chunkCounter,
      tokens_approx: tokensApprox,
      category: chunk.framework_domain,
      chunk_text: chunk.chunk_text,
      chunk_summary: chunk.chunk_summary || chunk.chunk_text.slice(0, 200),
      framework_domain: chunk.framework_domain,
      framework_name: chunk.framework_name,
      framework_section: (chunk.framework_section || 'general').slice(0, 50),
      evidence_tier: chunk.evidence_tier || 'bronze',
      triage_color: chunk.triage_color || 'green',
      expert_name: chunk.framework_name,
      is_active: true,
      granularity: chunk.granularity || 'concept',
      voice: chunk.voice || 'clinical',
      target_readiness: chunk.target_readiness || 'ready',
      time_commitment_category: chunk.time_commitment_category || null,
      cross_pillar_tags: chunk.cross_pillar_tags || [],
      cultural_contexts: chunk.cultural_contexts || [],
      age_range: chunk.age_range || 'all',
      relationship_type: chunk.relationship_type || [],
    };

    // Only include embedding if generated (null when --no-embed)
    if (embedding) {
      record.embedding = JSON.stringify(embedding);
    }

    const { error } = await supabase.from('mio_knowledge_chunks').insert(record);

    if (error) {
      console.error(`  Insert error: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`  Error processing chunk: ${err}`);
    return false;
  }
}

// ============================================================================
// GENERATION RUNNERS
// ============================================================================

async function generateMicroInterventions(batchSize: number = 5): Promise<number> {
  console.log('\n=== Generating Micro-Interventions ===');
  let total = 0;

  for (const [domain, config] of Object.entries(FRAMEWORK_DOMAINS)) {
    console.log(`\n  Domain: ${config.label} (${config.frameworks.length} frameworks)`);

    for (const framework of config.frameworks) {
      console.log(`    Framework: ${framework}`);

      const chunks = await callClaude(
        TEMPLATES.micro_intervention.system,
        TEMPLATES.micro_intervention.prompt(config.label, [framework]),
      );

      for (const chunk of chunks as ChunkData[]) {
        const success = await insertChunk({
          ...chunk,
          framework_domain: domain,
          framework_name: chunk.framework_name || framework,
          granularity: 'micro_intervention',
          voice: 'script',
        });
        if (success) total++;
      }

      // Rate limiting
      await sleep(1000);

      if (total >= batchSize) {
        console.log(`  Reached batch limit of ${batchSize}`);
        return total;
      }
    }
  }

  return total;
}

async function generateValidationChunks(batchSize: number = 50): Promise<number> {
  console.log('\n=== Generating Validation Chunks ===');
  let total = 0;

  const issueGroups = [
    ['loneliness in marriage', 'sleeping next to a stranger', 'emotional disconnection'],
    ['betrayal discovery', 'trust shattered', 'hypervigilance after infidelity'],
    ['one-sided effort', 'exhaustion from trying alone', 'feeling like a single parent'],
    ['financial shame', 'money arguments', 'provider pressure'],
    ['postpartum distance', 'new baby stress', 'identity loss after parenthood'],
    ['abuse realization', 'walking on eggshells', 'fear in your own home'],
    ['addiction impact', 'broken promises', 'relapse devastation'],
    ['grief and loss', 'death of loved one affecting relationship', 'grieving differently'],
    ['communication breakdown', 'stonewalling', 'being shut out'],
    ['intimacy loss', 'rejected physically', 'no longer desired'],
  ];

  for (const issues of issueGroups) {
    console.log(`  Issues: ${issues.join(', ')}`);

    const chunks = await callClaude(
      TEMPLATES.validation.system,
      TEMPLATES.validation.prompt(issues),
    );

    for (const chunk of chunks as ChunkData[]) {
      const success = await insertChunk({
        ...chunk,
        framework_domain: 'foundation_attachment',
        framework_name: 'general_validation',
        granularity: 'validation',
        voice: 'keston',
        target_readiness: 'flooded',
      });
      if (success) total++;
    }

    await sleep(1000);

    if (total >= batchSize) {
      console.log(`  Reached batch limit of ${batchSize}`);
      return total;
    }
  }

  return total;
}

async function generateCrossPillarContent(batchSize: number = 20): Promise<number> {
  console.log('\n=== Generating Cross-Pillar Content ===');
  let total = 0;

  const pillarScenarios: Record<string, string[]> = {
    physical: [
      'sleep deprivation making partners snap at each other',
      'chronic pain reducing intimacy and creating distance',
      'postpartum exhaustion destroying emotional regulation',
      'medication side effects killing libido',
      'burnout leaving no energy for the relationship',
    ],
    financial: [
      'debt shame causing withdrawal and secrecy',
      'job loss triggering identity crisis and irritability',
      'financial control as a form of subtle abuse',
      'spending disagreements masking deeper values conflict',
      'provider pressure creating emotional unavailability',
    ],
    mental: [
      'depression presenting as apathy/not caring',
      'anxiety creating controlling behavior',
      'PTSD flashbacks disrupting intimacy',
      'ADHD creating parent-child dynamic in marriage',
      'panic attacks limiting social life as a couple',
    ],
    spiritual: [
      'purpose crisis projected onto the relationship',
      'midlife questioning creating restlessness',
      'faith differences creating hidden resentment',
      'empty nest revealing neglected partnership',
      'existential anxiety about the future',
    ],
  };

  for (const [pillar, scenarios] of Object.entries(pillarScenarios)) {
    console.log(`  Pillar: ${pillar}`);

    const chunks = await callClaude(
      TEMPLATES.cross_pillar.system,
      TEMPLATES.cross_pillar.prompt(pillar, scenarios),
    );

    for (const chunk of chunks as ChunkData[]) {
      const success = await insertChunk({
        ...chunk,
        framework_domain: 'communication_conflict',
        framework_name: 'cross_pillar_awareness',
        granularity: 'concept',
        cross_pillar_tags: [pillar],
      });
      if (success) total++;
    }

    await sleep(1000);

    if (total >= batchSize) {
      console.log(`  Reached batch limit of ${batchSize}`);
      return total;
    }
  }

  return total;
}

async function generateCulturalContent(batchSize: number = 20): Promise<number> {
  console.log('\n=== Generating Cultural Context Content ===');
  let total = 0;

  const culturalModules: Record<string, string[]> = {
    'African American': [
      'Historical trauma and its impact on trust in relationships',
      'Code-switching between public and private relationship dynamics',
      'Strong Black woman syndrome and vulnerability in relationships',
      'Church and faith community influence on marriage expectations',
      'Navigating interracial relationships within community context',
    ],
    'Latino/Hispanic': [
      'Familismo - family involvement in couple decisions',
      'Machismo and evolving masculinity in relationships',
      'Marianismo expectations and women\'s autonomy',
      'Respeto across generations and in-law dynamics',
      'Bicultural stress when partners have different acculturation levels',
    ],
    'Military/Veteran': [
      'Deployment and reintegration cycle effects on marriage',
      'Hypervigilance at home - when combat training affects family',
      'Moral injury and its impact on intimacy and trust',
      'Military spouse identity and autonomous decision-making gaps',
      'Transitioning to civilian life as a couple',
    ],
    'Faith-Based Christian': [
      'Covenant theology and when staying becomes harmful',
      'Headship debates and mutual submission in practice',
      'Church pressure on struggling marriages',
      'Purity culture effects on marital intimacy',
      'When pastoral advice conflicts with therapeutic best practices',
    ],
    'LGBTQ+': [
      'Minority stress and its impact on relationship quality',
      'Coming out stress and couple identity formation',
      'Chosen family dynamics and boundary-setting',
      'Internalized stigma affecting intimacy',
      'Navigating heteronormative relationship frameworks',
    ],
    'Blended/Step-Family': [
      'Loyalty conflicts between biological parent and step-parent',
      'Authority dynamics and discipline disagreements',
      'Ex-partner co-parenting tensions affecting new relationship',
      'Children\'s adjustment and its stress on the couple',
      'Building couple identity amid family complexity',
    ],
    'South Asian': [
      'Arranged marriage evolution - balancing family choice with personal connection',
      'Family honor (izzat) and its pressure on couples to present a perfect front',
      'Intergenerational household dynamics and boundary-setting with in-laws',
      'Acculturation gaps between first-gen and second-gen partners',
      'Emotional expression norms and the expectation to endure silently',
    ],
    'East Asian': [
      'Face culture (mianzi) and avoiding public conflict at the cost of private connection',
      'Filial piety obligations creating loyalty conflicts between spouse and parents',
      'Emotional restraint norms and misreading composure as indifference',
      'Academic and financial achievement pressure affecting couple priorities',
      'Navigating Western therapy frameworks when harmony is the cultural default',
    ],
    'Faith-Based Muslim': [
      'Islamic marriage as both spiritual contract and partnership of mercy (mawaddah wa rahmah)',
      'Mahr and financial expectations - cultural vs. religious distinctions',
      'Gender role expectations (qiwamah) and modern partnership realities',
      'Extended family involvement and the balance of cultural vs. Quranic guidance',
      'Stigma around divorce (talaq) and seeking help outside the community',
    ],
    'Immigrant/Bicultural': [
      'Acculturation gap when one partner adapts faster to the new culture',
      'Language barriers creating unequal power dynamics in the relationship',
      'Identity straddling - being "too American" at home, "too foreign" outside',
      'Loss of extended family support network and its impact on couple stress',
      'Immigration trauma and legal status uncertainty affecting relationship stability',
    ],
    'Neurodivergent Couples': [
      'ADHD and the parent-child dynamic that destroys intimacy',
      'Autism and emotional reciprocity - different wiring, not less love',
      'Sensory overload affecting physical intimacy and shared spaces',
      'Executive function gaps creating unequal household labor',
      'When one partner is diagnosed later in life and the relationship identity shifts',
    ],
    'Age-Gap Relationships': [
      'Power dynamics and the importance of mutual decision-making audits',
      'Life stage mismatch - when one partner wants children and the other is done',
      'Social stigma and its corrosive effect on couple confidence',
      'Different generational communication norms creating friction',
      'Financial planning complexity when retirement timelines diverge significantly',
    ],
  };

  for (const [culture, topics] of Object.entries(culturalModules)) {
    console.log(`  Culture: ${culture}`);

    const chunks = await callClaude(
      TEMPLATES.cultural_context.system,
      TEMPLATES.cultural_context.prompt(culture, topics),
    );

    for (const chunk of chunks as ChunkData[]) {
      const success = await insertChunk({
        ...chunk,
        framework_domain: 'cultural_context',
        framework_name: 'cultural_adaptation',
        granularity: 'concept',
        cultural_contexts: [culture.toLowerCase().replace(/[\s/]+/g, '_')],
      });
      if (success) total++;
    }

    await sleep(1000);

    if (total >= batchSize) {
      console.log(`  Reached batch limit of ${batchSize}`);
      return total;
    }
  }

  return total;
}

async function generateRealTalkContent(batchSize: number = 20): Promise<number> {
  console.log('\n=== Generating Real Talk (Keston Voice) Content ===');
  let total = 0;

  const conceptGroups: Record<string, string[]> = {
    foundation_attachment: ['attachment styles in plain english', 'why your partner shuts down', 'the pursuer-withdrawer dance', 'what security actually looks like', 'love languages beyond the book'],
    communication_conflict: ['the four horsemen you dont see coming', 'how to fight without destroying', 'the repair attempt that saves marriages', 'why listening is harder than you think', 'when sorry isnt enough'],
    trauma_nervous_system: ['your nervous system runs your relationship', 'why you get triggered by small things', 'the freeze response in arguments', 'childhood wounds in adult love', 'what safety feels like'],
    addiction_codependency: ['loving someone with an addiction', 'codependency isnt love', 'betrayal trauma is real', 'enabling vs supporting', 'when to stay vs when to go'],
    modern_threats: ['phones are killing your marriage', 'financial secrets destroy trust', 'comparison is stealing your joy', 'the lonely marriage in a connected world', 'boundaries in the digital age'],
  };

  for (const [domain, concepts] of Object.entries(conceptGroups)) {
    console.log(`  Domain: ${domain}`);

    const chunks = await callClaude(
      TEMPLATES.real_talk.system,
      TEMPLATES.real_talk.prompt(domain, concepts),
    );

    for (const chunk of chunks as ChunkData[]) {
      const success = await insertChunk({
        ...chunk,
        framework_domain: domain,
        granularity: 'real_talk',
        voice: 'keston',
      });
      if (success) total++;
    }

    await sleep(1000);

    if (total >= batchSize) {
      console.log(`  Reached batch limit of ${batchSize}`);
      return total;
    }
  }

  return total;
}

async function generateCaseStudies(batchSize: number = 15): Promise<number> {
  console.log('\n=== Generating Case Studies ===');
  let total = 0;

  const demographicCombos = [
    { demo: 'Couple in their late 20s, dating 3 years, considering marriage', type: 'dating', age: '25-35' },
    { demo: 'Married couple in their 30s with a toddler, dual-income', type: 'married', age: '25-35' },
    { demo: 'Married couple in their 40s, empty nest approaching, 15+ years together', type: 'married', age: '35-45' },
    { demo: 'Separated couple in their 50s, considering reconciliation', type: 'separated', age: '45-55' },
    { demo: 'Blended family, both partners have children from previous marriages', type: 'remarriage', age: '35-45' },
  ];

  const domains = ['foundation_attachment', 'communication_conflict', 'trauma_nervous_system'];

  for (const { demo, type, age } of demographicCombos) {
    for (const domain of domains) {
      const config = FRAMEWORK_DOMAINS[domain as keyof typeof FRAMEWORK_DOMAINS];
      console.log(`  ${demo} × ${config.label}`);

      const chunks = await callClaude(
        TEMPLATES.case_study.system,
        TEMPLATES.case_study.prompt(config.label, config.frameworks.slice(0, 2), demo),
      );

      for (const chunk of chunks as ChunkData[]) {
        const success = await insertChunk({
          ...chunk,
          framework_domain: domain,
          granularity: 'case_study',
          age_range: age,
          relationship_type: [type],
        });
        if (success) total++;
      }

      await sleep(1000);

      if (total >= batchSize) {
        console.log(`  Reached batch limit of ${batchSize}`);
        return total;
      }
    }
  }

  return total;
}

// ============================================================================
// BACKFILL EMBEDDINGS (for chunks inserted with --no-embed)
// ============================================================================

async function backfillEmbeddings(): Promise<number> {
  console.log('\n=== Backfilling Embeddings for Null-Embedding Chunks ===');

  if (!OPENAI_API_KEY) {
    // Try via Supabase Edge Function (which has the key deployed)
    console.log('  No local OPENAI_API_KEY — using Supabase Edge Function...');
    return backfillViaEdgeFunction();
  }

  // Direct OpenAI mode
  const { data: chunks, error } = await supabase
    .from('mio_knowledge_chunks')
    .select('id, chunk_text')
    .eq('pillar', 'relational')
    .is('embedding', null)
    .eq('is_active', true)
    .limit(200);

  if (error || !chunks?.length) {
    console.log(`  ${error ? 'Error: ' + error.message : 'No chunks need embeddings'}`);
    return 0;
  }

  console.log(`  Found ${chunks.length} chunks needing embeddings`);
  let updated = 0;

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.chunk_text);
      if (!embedding) continue;

      const { error: updateError } = await supabase
        .from('mio_knowledge_chunks')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', chunk.id);

      if (!updateError) {
        updated++;
        if (updated % 10 === 0) console.log(`    Embedded ${updated}/${chunks.length}...`);
      }
      await sleep(200); // Rate limit
    } catch (err) {
      console.error(`    Error embedding chunk ${chunk.id}: ${err}`);
    }
  }

  console.log(`  Backfilled ${updated}/${chunks.length} embeddings`);

  // Check if more remain
  const { count } = await supabase
    .from('mio_knowledge_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('pillar', 'relational')
    .is('embedding', null)
    .eq('is_active', true);

  if (count && count > 0) {
    console.log(`  ${count} chunks still need embeddings. Run again to continue.`);
  }

  return updated;
}

async function backfillViaEdgeFunction(): Promise<number> {
  // Call Supabase Edge Function to generate embeddings in batch
  // The generate-hyde Edge Function has OPENAI_API_KEY deployed
  const { data: chunks, error } = await supabase
    .from('mio_knowledge_chunks')
    .select('id, chunk_text')
    .eq('pillar', 'relational')
    .is('embedding', null)
    .eq('is_active', true)
    .limit(50);

  if (error || !chunks?.length) {
    console.log(`  ${error ? 'Error: ' + error.message : 'No chunks need embeddings'}`);
    return 0;
  }

  console.log(`  Found ${chunks.length} chunks to embed via Edge Function`);
  let updated = 0;

  for (const chunk of chunks) {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-hyde', {
        body: { text: chunk.chunk_text, mode: 'embed_only' },
      });

      if (fnError || !data?.embedding) {
        console.error(`    Edge fn error for ${chunk.id}: ${fnError?.message || 'no embedding returned'}`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('mio_knowledge_chunks')
        .update({ embedding: JSON.stringify(data.embedding) })
        .eq('id', chunk.id);

      if (!updateError) {
        updated++;
        if (updated % 10 === 0) console.log(`    Embedded ${updated}/${chunks.length}...`);
      }
      await sleep(500); // Slower rate for Edge Functions
    } catch (err) {
      console.error(`    Error: ${err}`);
    }
  }

  console.log(`  Backfilled ${updated}/${chunks.length} embeddings via Edge Function`);
  return updated;
}

// ============================================================================
// TAG EXISTING CHUNKS
// ============================================================================

async function tagExistingChunks(): Promise<number> {
  console.log('\n=== Tagging Existing Chunks with New Metadata ===');

  const { data: chunks, error } = await supabase
    .from('mio_knowledge_chunks')
    .select('id, chunk_text, framework_domain, framework_name, evidence_tier')
    .eq('pillar', 'relational')
    .is('granularity', null)
    .limit(500);

  if (error || !chunks) {
    console.error('Error fetching chunks:', error?.message);
    return 0;
  }

  console.log(`  Found ${chunks.length} untagged chunks`);
  let updated = 0;

  for (const chunk of chunks) {
    const updates: Record<string, unknown> = {
      granularity: 'concept', // Default for existing chunks
      voice: 'clinical',     // Default for existing chunks
      target_readiness: 'ready',
    };

    // Infer time commitment from text length
    const wordCount = (chunk.chunk_text || '').split(/\s+/).length;
    if (wordCount < 100) {
      updates.time_commitment_category = 'micro_2min';
    } else if (wordCount < 300) {
      updates.time_commitment_category = 'short_15min';
    } else {
      updates.time_commitment_category = 'medium_30min';
    }

    const { error: updateError } = await supabase
      .from('mio_knowledge_chunks')
      .update(updates)
      .eq('id', chunk.id);

    if (!updateError) updated++;
  }

  console.log(`  Tagged ${updated}/${chunks.length} chunks`);
  return updated;
}

// ============================================================================
// PRIMARY SOURCE CONTENT GENERATION (Phase 2.4 - ~15,000 chunks)
// ============================================================================

const __filename_resolved = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const __dirname_resolved = typeof __dirname !== 'undefined' ? __dirname : dirname(__filename_resolved);

const PRIMARY_SOURCE_TEMPLATE = {
  system: `You are a world-class relational therapy knowledge architect creating detailed educational content chunks from primary source material. Each chunk must be:
1. Self-contained (makes sense without reading other chunks)
2. Evidence-based with specific framework attribution
3. 150-300 words with concrete details
4. Immediately useful for a coaching AI to reference

Return a JSON array of 5 chunks. Each object must have:
{
  "title": "descriptive title",
  "chunk_text": "the detailed content (150-300 words)",
  "chunk_summary": "one-line summary",
  "framework_name": "specific framework",
  "framework_section": "specific section within framework",
  "evidence_tier": "gold|silver|bronze",
  "chunk_type": "concept|technique|application|assessment|coaching_note",
  "target_readiness": "processing|ready|motivated",
  "target_issue": "communication|intimacy|trust|conflict|trauma|abuse|addiction|identity|general"
}

Generate a MIX of chunk types:
- concept (2): Core theory explanations with supporting evidence
- technique (1): Specific methods/exercises with step-by-step instructions
- application (1): Real-world relationship scenarios where this applies
- coaching_note (1): What a coach needs to know about applying this`,
};

// Comprehensive expansion plan: framework → subtopics for chunk generation
// Each subtopic generates ~10 chunks per call. Total plan targets ~15,000 chunks.
const PRIMARY_SOURCE_EXPANSION = [
  // =================== DOMAIN 1: FOUNDATION & ATTACHMENT ===================
  // Gottman Method (~1,200 chunks across 12 subtopics × 10 chunks × 10 angles)
  { domain: 'foundation_attachment', framework: 'gottman_method', subtopics: [
    'The Four Horsemen: Criticism - attacking character vs addressing behavior, antidotes',
    'The Four Horsemen: Contempt - the single strongest predictor of divorce, culture of appreciation as antidote',
    'The Four Horsemen: Defensiveness - counter-attacking and victim-playing, taking responsibility as antidote',
    'The Four Horsemen: Stonewalling - emotional flooding and shutdown, self-soothing as antidote',
    'Principle 1: Enhance Love Maps - knowing partner\'s inner world, the Love Maps questionnaire',
    'Principle 2: Nurture Fondness and Admiration - fighting negative sentiment override, gratitude practices',
    'Principle 3: Turn Toward Each Other - bids for connection, the emotional bank account metaphor',
    'Principle 4: Let Your Partner Influence You - shared power, respecting partner\'s perspective',
    'Principle 5: Solve Solvable Problems - softened startup, repair attempts, compromise',
    'Principle 6: Overcome Gridlock on Perpetual Problems - dreams within conflict, the 69% that never resolve',
    'Principle 7: Create Shared Meaning - rituals of connection, shared goals, roles, symbols',
    'The Sound Relationship House - friendship foundation, managing conflict, creating shared meaning layers',
    'The Magic 5:1 Ratio - positive to negative interactions, why happy couples still fight',
    'Repair Attempts - the secret weapon of emotionally intelligent couples, types of repair',
    'Harsh vs Soft Startup - how conversations begin predicts how they end, gender differences',
    'Flooding and Physiological Self-Soothing - DPA (Diffuse Physiological Arousal), the 20-minute break rule',
    'The Distance and Isolation Cascade - stages of relationship decline, Negative Sentiment Override',
    'Gottman Research Methods - the Love Lab, predicting divorce with 91% accuracy, what the science shows',
  ]},

  // EFT (~800 chunks)
  { domain: 'foundation_attachment', framework: 'emotionally_focused_therapy', subtopics: [
    'ARE Framework: Accessibility - being emotionally available, removing barriers to connection',
    'ARE Framework: Responsiveness - tuning into partner\'s emotional needs, not dismissing',
    'ARE Framework: Engagement - staying emotionally present, active attention and checking in',
    'Demon Dialogue 1: Find the Bad Guy - mutual blame cycle, both partners defending themselves',
    'Demon Dialogue 2: The Protest Polka (Pursue-Withdraw) - the most common pattern, pursuer-withdrawer dance',
    'Demon Dialogue 3: Freeze and Flee - both partners withdraw, emotional desert, hardest to break',
    'Conversation 1: Recognizing the Demon Dialogues - naming the cycle, externalizing the pattern',
    'Conversation 4: Hold Me Tight - the core conversation, expressing attachment fears and needs',
    'Conversation 5: Forgiving Injuries - attachment injuries vs everyday hurts, the healing process',
    'Conversation 6: Bonding Through Sex and Touch - sealed off vs solace vs synchrony intimacy',
    'Conversation 7: Keeping Your Love Alive - resilience rituals, creating an ongoing love story',
    'Attachment Fears and Needs - the raw vulnerability beneath relationship conflict',
    'Raw Spots and Emotional Triggers - how past wounds create present reactivity',
    'EFT Treatment Stages - de-escalation, restructuring bonds, consolidation',
  ]},

  // Bowlby Attachment Theory (~600 chunks)
  { domain: 'foundation_attachment', framework: 'attachment_theory_bowlby', subtopics: [
    'Secure Base and Safe Haven - the dual function of attachment figures in adult relationships',
    'Internal Working Models - how childhood attachment shapes adult relationship expectations',
    'Secure Attachment Style - characteristics, relationship patterns, what security looks like',
    'Anxious-Preoccupied Attachment - hyperactivation strategies, fear of abandonment, protest behaviors',
    'Dismissive-Avoidant Attachment - deactivation strategies, self-reliance, suppressing needs',
    'Fearful-Avoidant (Disorganized) Attachment - approach-avoid conflict, most linked to trauma',
    'Attachment Activation - what triggers the attachment system in adults, proximity seeking',
    'Protest-Despair-Detachment Cycle - separation responses in adult relationships',
    'Earned Security - how insecure attachment can become secure through relationship experiences',
    'Attachment and the Brain - neuroscience of bonding, oxytocin, mirror neurons',
  ]},

  // Five Love Languages (~400 chunks)
  { domain: 'foundation_attachment', framework: 'five_love_languages', subtopics: [
    'Words of Affirmation - verbal love, encouragement, written notes, specific vs generic praise',
    'Quality Time - undivided attention, active listening, shared activities, quality conversation',
    'Acts of Service - love through action, reducing burden, anticipating needs, cultural context',
    'Physical Touch - the power of nonsexual touch, holding hands, hugs, physical presence',
    'Receiving Gifts - visual symbols of love, thoughtfulness over expense, the gift of presence',
    'Discovering Your Love Language - the love tank metaphor, why we default to our own language',
    'Love Languages in Conflict - how empty love tanks create fights, speaking partner\'s language during repair',
    'Love Languages Across Life Stages - how needs shift with children, aging, career changes',
  ]},

  // =================== DOMAIN 2: COMMUNICATION & CONFLICT ===================
  // NVC (~600 chunks)
  { domain: 'communication_conflict', framework: 'nonviolent_communication', subtopics: [
    'NVC Component 1: Observations vs Evaluations - separating facts from interpretations',
    'NVC Component 2: Feelings - distinguishing genuine feelings from thoughts/judgments',
    'NVC Component 3: Needs - universal human needs driving all behavior, needs inventory',
    'NVC Component 4: Requests - making clear, positive, doable requests vs demands',
    'How We Alienate Others - moralistic judgments, comparisons, denying responsibility, demands',
    'Empathic Listening - receiving with whole being, reflecting back, sustaining empathy',
    'NVC and Anger - anger as a signal of unmet needs, transforming anger into connection',
    'NVC in Couples Conflict - practical dialogue examples, the mediator\'s seat technique',
    'Self-Empathy - giving yourself the same quality of attention, self-compassion as foundation',
    'NVC When It\'s Hard - receiving criticism without defensiveness, saying no compassionately',
  ]},

  // Crucial Conversations (~400 chunks)
  { domain: 'communication_conflict', framework: 'crucial_conversations', subtopics: [
    'The STATE Framework - Share facts, Tell story, Ask path, Talk tentatively, Encourage testing',
    'The Pool of Shared Meaning - why expanding the pool leads to better decisions',
    'Safety First - Mutual Purpose and Mutual Respect as conditions for dialogue',
    'Silence and Violence - recognizing when people move to unhealthy coping',
    'Restoring Safety - Contrasting ("I don\'t want X, I do want Y"), the CRIB framework',
    'Master My Stories - separating facts from stories, victim/villain/helpless narratives',
    'Moving to Action - turning crucial conversations into results, who/what/when follow-through',
    'Crucial Conversations in Intimate Relationships - when stakes are highest with someone you love',
  ]},

  // =================== DOMAIN 3: TRAUMA & NERVOUS SYSTEM ===================
  // Polyvagal Theory (~500 chunks)
  { domain: 'trauma_nervous_system', framework: 'polyvagal_theory', subtopics: [
    'The Three States - ventral vagal (safety), sympathetic (fight/flight), dorsal vagal (freeze/collapse)',
    'Neuroception - the unconscious detection of safety and danger through facial cues, voice tone',
    'The Vagal Brake - how the ventral vagal system regulates arousal and enables social engagement',
    'Co-Regulation in Couples - how partners regulate each other\'s nervous systems',
    'The Polyvagal Ladder - moving between states, the autonomic hierarchy in daily life',
    'Vagal Tone and Relationship Health - exercises to strengthen the vagus nerve, breathing techniques',
    'Trauma and Polyvagal Theory - why trauma survivors get stuck in defensive states',
    'Neuroception Mismatch - when the body detects danger that isn\'t there, false alarms in relationships',
    'Polyvagal-Informed Couples Therapy - using nervous system language with clients',
  ]},

  // Complex PTSD / 4F Responses (~600 chunks)
  { domain: 'trauma_nervous_system', framework: 'complex_trauma_cptsd', subtopics: [
    'The Fight Response (Narcissistic Defense) - power and control as safety, contempt patterns',
    'The Flight Response (Obsessive-Compulsive Defense) - perfectionism as safety, workaholism',
    'The Freeze Response (Dissociative Defense) - isolation as safety, people as danger',
    'The Fawn Response (Codependent Defense) - merging with others as safety, loss of self',
    'Trauma Hybrids - Fight/Fawn, Flight/Freeze, and other combinations in relationships',
    'Emotional Flashbacks - instant regressions into childhood feeling states, not visual flashbacks',
    'The Inner Critic in C-PTSD - the internalized voice of the abuser, critic management',
    'Abandonment Depression - the core wound, grieving what was never received in childhood',
    'Shrinking the Outer Critic - how projecting the critic onto partners destroys relationships',
    'Recovery from C-PTSD - the long road, grieving, reparenting, building safe relationships',
  ]},

  // Body Keeps the Score (~500 chunks)
  { domain: 'trauma_nervous_system', framework: 'body_keeps_the_score', subtopics: [
    'Trauma Lives in the Body - why talking alone isn\'t enough, the body-mind connection',
    'The Traumatized Brain - amygdala hyperactivation, prefrontal cortex shutdown, emotional hijacking',
    'Dissociation and Disconnection - trauma survivors losing contact with their bodies',
    'Developmental Trauma - how childhood trauma affects adult relationship capacity',
    'EMDR for Trauma Recovery - how it works, what to expect, relationship applications',
    'Yoga and Body-Based Approaches - interoception, reclaiming the body from trauma',
    'Neurofeedback and Brain Training - rewiring trauma responses through brain-based interventions',
    'Community and Healing - theater, group work, the social nature of trauma recovery',
  ]},

  // IFS (~500 chunks)
  { domain: 'trauma_nervous_system', framework: 'internal_family_systems', subtopics: [
    'The Self - the 8 C\'s (Calm, Curious, Compassionate, etc.), Self-led relationships',
    'Exiles - young wounded parts carrying trauma, how they get triggered in relationships',
    'Managers - protective parts running daily life, controlling behaviors in relationships',
    'Firefighters - emergency parts that extinguish pain, addictions and impulsive behaviors',
    'Blending - when a part takes over, losing Self-leadership in arguments',
    'Unburdening - releasing extreme beliefs and emotions from parts, the healing process',
    'IFS in Couples Work - how partners\' parts trigger each other, courageous communication',
    'Self-to-Self Connection - what happens when both partners are in Self, the magic of IFS',
    'Common Parts in Relationship Conflict - the inner critic, the abandoned child, the protector',
  ]},

  // Somatic Experiencing (~300 chunks)
  { domain: 'trauma_nervous_system', framework: 'somatic_experiencing', subtopics: [
    'Incomplete Survival Responses - trapped trauma energy in the body, why animals shake',
    'The Felt Sense - SIBAM model (Sensation, Image, Behavior, Affect, Meaning)',
    'Titration - approaching trauma in small doses, preventing overwhelm',
    'Pendulation - the natural rhythm between contraction and expansion in healing',
    'Resourcing - building capacity before processing trauma, safety anchors',
    'Somatic Markers in Relationships - body signals warning of triggers before conscious awareness',
    'Touch and Trauma - when physical intimacy is triggering, building safety gradually',
  ]},

  // =================== DOMAIN 4: ABUSE & NARCISSISM ===================
  // Coercive Control (~400 chunks)
  { domain: 'abuse_narcissism', framework: 'coercive_control_stark', subtopics: [
    'Coercive Control as a Liberty Crime - reframing from incident-based to pattern-based abuse',
    'The Tactics: Isolation, Micromanagement, Degradation, Intimidation, Surveillance',
    'Financial Control - engineering financial dependence, restricting access to money',
    'Why Victims Stay - learned helplessness, trauma bonding, intermittent reinforcement',
    'The Hostage Analogy - living in captivity within your own home',
    'Identifying Coercive Control - screening questions, red flags for coaches',
    'Safety Planning - practical steps for someone in a coercive control situation',
    'Post-Separation Abuse - how control continues after leaving, legal and digital harassment',
  ]},

  // Lundy Bancroft (~400 chunks)
  { domain: 'abuse_narcissism', framework: 'lundy_bancroft_abuser_profiles', subtopics: [
    'The 9 Abuser Types - Demand Man, Mr. Right, Water Torturer, Drill Sergeant, Mr. Sensitive, etc.',
    'Abuse is About Entitlement, Not Anger - the thinking patterns behind abusive behavior',
    'Why Couples Therapy is Dangerous with an Abuser - how they weaponize therapy language',
    'The Escalation Pattern - how abuse intensifies over time, the cycle of violence',
    'Abusers Choose When to Lose Control - the myth of the "out of control" abuser',
    'Narcissistic Abuse Recovery - rebuilding identity, trust, and self-worth after narcissistic abuse',
    'Gaslighting - reality distortion, making victims question their own perception',
    'Trauma Bonding - the biochemistry of attachment to an abuser, intermittent reinforcement',
  ]},

  // =================== DOMAIN 5: ADDICTION & CODEPENDENCY ===================
  // Codependency (~400 chunks)
  { domain: 'addiction_codependency', framework: 'codependency_beattie', subtopics: [
    'Characteristics of Codependency - caretaking, low self-worth, repression, obsession, control',
    'Detachment - the core solution, releasing without disconnecting, letting go with love',
    'Setting Boundaries After Codependency - learning to say no, guilt without giving in',
    'Self-Care as Recovery - parenting yourself, identifying your own needs',
    'Codependency in Romantic Relationships - the dance of neediness, attracting unavailable people',
    'The Codependent Family System - roles children play, how patterns perpetuate',
    'Recovery from People-Pleasing - the fawn response connection, building authentic self',
    'When Helping Becomes Enabling - the crucial difference, tough love vs abandonment',
  ]},

  // Betrayal Trauma (~400 chunks)
  { domain: 'addiction_codependency', framework: 'betrayal_trauma_steffens', subtopics: [
    'Betrayal Trauma vs Codependency - partners are injured, not sick, reframing the narrative',
    'PTSD Symptoms in Partners - hypervigilance, intrusive thoughts, emotional flooding',
    'Discovery Day - the shattering moment, immediate crisis intervention',
    'Gaslighting Effects - questioning your own reality after systematic deception',
    'The Healing Timeline - phases of recovery, what to expect and when',
    'Trust Rebuilding - transparency, accountability, verification vs control',
    'Sexual Healing After Betrayal - rebuilding physical intimacy after trust is shattered',
    'Addiction as Brain Disease - understanding the partner\'s addiction without excusing behavior',
  ]},

  // =================== DOMAIN 6: MODERN THREATS ===================
  { domain: 'modern_threats', framework: 'social_media_impact', subtopics: [
    'Comparison Culture - Instagram highlight reels destroying relationship satisfaction',
    'Doom-scrolling and Presence - phone addiction stealing quality time and attention',
    'Grass Is Greener Syndrome - social media creating false alternatives to committed relationships',
    'Parasocial Relationships - emotional attachment to online personalities replacing partner connection',
    'Digital Infidelity - emotional affairs online, DM culture, when is it cheating?',
    'Social Media Oversharing - airing relationship problems publicly, performative relationships',
  ]},
  { domain: 'modern_threats', framework: 'financial_infidelity', subtopics: [
    'Types of Financial Infidelity - secret accounts, hidden debt, unreported spending, lying about income',
    'Warning Signs of Financial Dishonesty - behavioral changes, defensiveness about money',
    'Recovery from Financial Betrayal - full disclosure, rebuilding financial trust, joint planning',
    'Financial Infidelity vs Financial Abuse - the crucial distinction for coaches',
  ]},
  { domain: 'modern_threats', framework: 'technology_boundaries', subtopics: [
    'Phone Addiction at the Dinner Table - the phubbing epidemic, presence contracts',
    'Gaming Addiction and Marriage - when virtual worlds replace real relationships',
    'Pornography as Modern Threat - impact on intimacy expectations, body image, arousal patterns',
    'Digital Boundaries for Couples - password sharing, social media agreements, screen-free zones',
    'The Lonely Marriage in a Connected World - surrounded by connections, disconnected from partner',
    'Remote Work and Relationship Strain - blurred boundaries, always-on culture, creating transitions',
  ]},

  // =================== DOMAIN 7: FINANCIAL & MEN'S IDENTITY ===================
  { domain: 'financial_mens', framework: 'financial_stress_marriage', subtopics: [
    'Money as #1 Divorce Predictor - Ramsey Solutions research, financial disagreements vs all others',
    'Different Money Scripts - spenders vs savers, risk-takers vs security-seekers, values conflicts',
    'Joint vs Separate Finances - approaches, when each works, the yours/mine/ours model',
    'Debt Shame and Relationship Withdrawal - how financial shame creates emotional distance',
    'Financial Teamwork - budgeting together, financial meetings, aligned goals',
    'Job Loss and Relationship Impact - identity crisis, role reversal, supporting without rescuing',
  ]},
  { domain: 'financial_mens', framework: 'male_identity_crisis', subtopics: [
    'The Provider Trap - equating worth with earning, emotional unavailability from work obsession',
    'Man Up Culture - how toxic masculinity prevents vulnerability and connection',
    'Men\'s Mental Health Stigma - help-seeking barriers, depression presenting as anger/withdrawal',
    'Fatherhood Identity - navigating modern fatherhood, active parenting, work-life integration',
    'Purpose Crisis in Modern Men - loss of traditional roles, finding meaning beyond provider identity',
    'Male Emotional Literacy - building vocabulary for feelings, unlearning suppression',
  ]},

  // =================== DOMAIN 8: CULTURAL CONTEXT ===================
  { domain: 'cultural_context', framework: 'religious_faith_based_marriage', subtopics: [
    'Covenant Marriage - when spiritual commitment supports vs traps couples',
    'Submission Theology Debates - complementarian vs egalitarian, healthy vs controlling headship',
    'Purity Culture Aftermath - sexual shame in marriage, rebuilding healthy intimacy after purity messaging',
    'When Faith is Used as Control - spiritual abuse, weaponizing scripture, religious gaslighting',
    'Interfaith Relationships - navigating different belief systems, raising children, holiday conflicts',
    'Church Pressure on Struggling Marriages - when community judgment prevents help-seeking',
  ]},
  { domain: 'cultural_context', framework: 'cross_cultural_relationships', subtopics: [
    'Cultural Conflict Styles - direct vs indirect, loud vs quiet, public vs private disagreement norms',
    'Family Involvement Norms - individualist vs collectivist expectations about in-laws and extended family',
    'Gender Role Negotiations - when partners come from different cultural expectations about roles',
    'Communication Across Cultures - high-context vs low-context, what gets lost in translation',
    'Child-Rearing Across Cultures - discipline, education, independence, when parents disagree on approach',
    'Building a Shared Culture - creating new traditions that honor both backgrounds',
  ]},

  // =================== DOMAIN 9: NEURODIVERGENCE ===================
  { domain: 'neurodivergence', framework: 'adhd_and_marriage_orlov', subtopics: [
    'The ADHD Parent-Child Dynamic - how it develops, why it destroys intimacy',
    'Hyperfocus Courtship Followed by Inattention - the confusing shift after the honeymoon',
    'RSD (Rejection Sensitive Dysphoria) - misinterpreting neutral feedback as rejection',
    'Time Blindness and Trust Erosion - chronic lateness, forgotten promises, perceived disrespect',
    'Emotional Dysregulation in ADHD Arguments - intensity mismatches, flooding faster',
    'ADHD Treatment and Relationship Recovery - medication, coaching, and couples strategies',
    'The Non-ADHD Partner\'s Experience - caregiver fatigue, resentment, losing attraction',
    'ADHD and Household Labor - executive function gaps, creating systems that work for both',
  ]},
  { domain: 'neurodivergence', framework: 'autism_in_relationships', subtopics: [
    'The Double Empathy Problem - neither partner lacks empathy, they process differently',
    'Alexithymia - difficulty identifying and expressing emotions, it\'s not that they don\'t care',
    'Sensory Differences in Intimacy - touch sensitivity, environmental overwhelm, accommodations',
    'Literal Communication vs Neurotypical Hints - bridging the inference gap',
    'Meltdowns vs Anger - understanding sensory/emotional overwhelm, not intentional aggression',
    'Late Diagnosis and Relationship Identity Shifts - when one partner learns they\'re autistic',
    'Special Interests and Connection - using focused interests as bridges, not barriers',
    'Creating Autistic-Friendly Relationship Rituals - predictability, scripts, structured check-ins',
  ]},

  // =================== DOMAIN 10: PREMARITAL & FORMATION ===================
  { domain: 'premarital_formation', framework: 'premarital_counseling', subtopics: [
    'The PREPARE/ENRICH Assessment - strengths and growth areas, key discussion topics',
    'Essential Pre-Marriage Conversations - finances, children, religion, in-laws, conflict styles',
    'Red Flags vs Growth Areas - what predicts divorce vs what can be developed with intention',
    'Prevention vs Intervention - why investing in relationship skills early saves marriages',
    'Conflict Style Compatibility - volatile, validating, avoiding couples, mismatched styles',
    'Sexual Expectations Alignment - frequency, boundaries, desire differences, fantasy disclosure',
  ]},
  { domain: 'premarital_formation', framework: 'boundaries_dating_cloud_townsend', subtopics: [
    'Types of Boundaries in Dating - physical, emotional, time, digital, family',
    'Character vs Chemistry - evaluating partners on character traits, not just attraction',
    'When to Say Yes and When to Say No - healthy flexibility vs people-pleasing',
    'Dating Patterns That Predict Relationship Health - attachment patterns in dating behavior',
    'Identifying Red Flags Early - control, jealousy, isolation, lovebombing, inconsistency',
    'Building Foundation Before Crisis - skills and conversations that prevent future problems',
  ]},
];

// Generation round angles - each pass generates different types of content
const GENERATION_ROUNDS = [
  {
    id: 1,
    name: 'Foundational Theory & Core Techniques',
    promptSuffix: `Generate a MIX:
- 2 CONCEPT chunks: Core theory, research findings, key principles with citations
- 1 TECHNIQUE chunk: Specific exercises, scripts, step-by-step methods with exact wording
- 1 APPLICATION chunk: Real scenarios showing this concept in couples
- 1 COACHING_NOTE chunk: What a coach needs to know, common mistakes`,
  },
  {
    id: 2,
    name: 'Advanced Clinical & Edge Cases',
    promptSuffix: `Generate a MIX focusing on ADVANCED content:
- 1 CONCEPT chunk: Advanced/nuanced aspects most practitioners miss
- 1 TECHNIQUE chunk: Advanced interventions for resistant or complex cases
- 2 APPLICATION chunks: Complex real-world scenarios (blended families, cultural factors, co-morbidities)
- 1 COACHING_NOTE chunk: When to refer out, contraindications, ethical considerations`,
  },
  {
    id: 3,
    name: 'Keston Voice Translations & Real Talk',
    promptSuffix: `Generate ALL chunks in Keston's warm, direct voice (NOT clinical language):
- 2 chunks: Explain the core concepts like talking to a friend at coffee
- 1 chunk: "Look, here's what's REALLY happening..." - the real talk version
- 1 chunk: Stories/metaphors that make complex concepts click instantly
- 1 chunk: "What you can do TODAY" - immediate actionable steps in plain language

Use "you" and "your" directly. Start with hooks like "Look...", "Here's the thing...", "Let me be real with you..."`,
  },
  {
    id: 4,
    name: 'Situation-Specific Micro-Scripts',
    promptSuffix: `Generate EXACT SCRIPTS people can use in specific situations:
- 2 chunks: Word-for-word scripts for common situations (starting difficult conversations, responding to criticism, setting boundaries)
- 2 chunks: "If they say X, respond with Y" - decision tree scripts for common scenarios
- 1 chunk: Emergency de-escalation script for heated moments (under 30 seconds)

Every chunk MUST include exact words to say. Format as dialogue where possible.`,
  },
  {
    id: 5,
    name: 'Pattern Recognition & Warning Signs',
    promptSuffix: `Generate content focused on PATTERN RECOGNITION:
- 2 chunks: Early warning signs of this dynamic developing
- 1 chunk: How this pattern presents differently across demographics (age, gender, culture, attachment style)
- 1 chunk: The escalation pattern - how it gets worse over time if unaddressed
- 1 chunk: What the PARTNER of someone exhibiting this pattern experiences

Focus on helping coaches and users IDENTIFY what's happening before they know the clinical name.`,
  },
  {
    id: 6,
    name: 'Recovery Journeys & Success Stories',
    promptSuffix: `Generate content focused on HOPE and RECOVERY:
- 2 chunks: Realistic recovery timelines - what improvement looks like at 1 week, 1 month, 3 months, 1 year
- 1 chunk: Case vignette showing a couple who successfully addressed this (composite story)
- 1 chunk: Common setbacks during recovery and how to handle them
- 1 chunk: Signs of genuine progress that are easy to miss (subtle positive changes)

Balance realistic expectations with genuine hope.`,
  },
];

async function generatePrimarySourceContent(batchSize: number = 100): Promise<number> {
  console.log('\n=== Generating Primary Source Content (Phase 2.4) ===');
  console.log(`  ${PRIMARY_SOURCE_EXPANSION.length} framework groups to process`);

  // Parse round from args (--round=1 through --round=6, default=1)
  const roundArg = parseInt(process.argv.find(a => a.startsWith('--round='))?.split('=')[1] || '1');
  const round = GENERATION_ROUNDS.find(r => r.id === roundArg) || GENERATION_ROUNDS[0];
  console.log(`  Round ${round.id}/6: ${round.name}`);

  // Parse offset for resuming (--batch-offset=groupIdx,subtopicIdx)
  const offsetArg = process.argv.find(a => a.startsWith('--batch-offset='))?.split('=')[1];
  let startGroup = 0;
  let startSubtopic = 0;
  if (offsetArg) {
    const [g, s] = offsetArg.split(',').map(Number);
    startGroup = g - 1;
    startSubtopic = s;
    console.log(`  Resuming from group ${g}, subtopic ${s}`);
  }

  // Load source text for context
  let sourceText = '';
  try {
    sourceText = readFileSync(
      join(__dirname_resolved, 'source-texts', 'PRIMARY-SOURCE-SUMMARIES.md'),
      'utf-8'
    );
    console.log(`  Loaded source text: ${Math.round(sourceText.length / 1024)}KB`);
  } catch {
    console.warn('  WARNING: PRIMARY-SOURCE-SUMMARIES.md not found, generating without source context');
  }

  const totalSubtopics = PRIMARY_SOURCE_EXPANSION.reduce((sum, g) => sum + g.subtopics.length, 0);
  console.log(`  Total subtopics: ${totalSubtopics} (x5 chunks each = ~${totalSubtopics * 5} chunks this round)`);

  let total = 0;
  let frameworkIndex = 0;

  for (const group of PRIMARY_SOURCE_EXPANSION) {
    frameworkIndex++;
    if (frameworkIndex - 1 < startGroup) continue;

    console.log(`\n  [${frameworkIndex}/${PRIMARY_SOURCE_EXPANSION.length}] ${group.framework} (${group.subtopics.length} subtopics)`);

    const frameworkLabel = group.framework.replace(/_/g, ' ');
    const relevantContext = extractRelevantSource(sourceText, frameworkLabel, group.domain);

    const subtopicStart = (frameworkIndex - 1 === startGroup) ? startSubtopic : 0;

    for (let i = subtopicStart; i < group.subtopics.length; i++) {
      const subtopic = group.subtopics[i];
      console.log(`    Subtopic ${i + 1}/${group.subtopics.length}: ${subtopic.slice(0, 60)}...`);

      const prompt = `Generate 5 detailed knowledge chunks about: "${subtopic}"

Framework: ${group.framework}
Domain: ${FRAMEWORK_DOMAINS[group.domain as keyof typeof FRAMEWORK_DOMAINS]?.label || group.domain}
Round: ${round.name}

${relevantContext ? `SOURCE MATERIAL FOR CONTEXT:\n${relevantContext}\n\nExpand SIGNIFICANTLY beyond the source material with additional detail, practical examples, clinical nuance, and coaching applications.` : 'Generate comprehensive, evidence-based content from your knowledge of this framework.'}

${round.promptSuffix}`;

      try {
        const chunks = await callClaude(PRIMARY_SOURCE_TEMPLATE.system, prompt);

        // Map chunk_type to valid granularity values
        // Valid: summary, concept, deep_dive, micro_intervention, case_study, real_talk, validation
        const GRANULARITY_MAP: Record<string, string> = {
          concept: 'concept',
          technique: 'micro_intervention',
          application: 'case_study',
          assessment: 'deep_dive',
          coaching_note: 'deep_dive',
          summary: 'summary',
          deep_dive: 'deep_dive',
          micro_intervention: 'micro_intervention',
          case_study: 'case_study',
          real_talk: 'real_talk',
          validation: 'validation',
        };

        for (const chunk of chunks as ChunkData[]) {
          const rawType = (chunk as Record<string, unknown>).chunk_type as string || 'concept';
          const granularity = GRANULARITY_MAP[rawType] || 'concept';

          const success = await insertChunk({
            ...chunk,
            framework_domain: group.domain,
            framework_name: chunk.framework_name || group.framework,
            framework_section: chunk.framework_section || subtopic.split(' - ')[0].toLowerCase().replace(/\s+/g, '_').slice(0, 50),
            granularity,
            voice: round.id === 3 ? 'keston' : 'clinical',
            evidence_tier: chunk.evidence_tier || 'silver',
          });
          if (success) total++;
        }
      } catch (err) {
        console.error(`    ERROR: ${err}`);
      }

      await sleep(1000);

      if (total >= batchSize) {
        console.log(`\n  Reached batch limit of ${batchSize}`);
        console.log(`  Resume: --type=primary_source --round=${round.id} --batch-offset=${frameworkIndex},${i + 1} --batch-size=${batchSize}`);
        return total;
      }
    }
  }

  console.log(`\n  Round ${round.id} complete! Generated ${total} chunks.`);
  if (round.id < 6) {
    console.log(`  Next: --type=primary_source --round=${round.id + 1} --batch-size=${batchSize}`);
  }

  return total;
}

function extractRelevantSource(fullText: string, framework: string, domain: string): string {
  if (!fullText) return '';

  // Try to find the section about this framework
  const lines = fullText.split('\n');
  let capturing = false;
  let relevantLines: string[] = [];
  let depth = 0;

  for (const line of lines) {
    // Check if this line starts a section about our framework
    const lowerLine = line.toLowerCase();
    const lowerFramework = framework.toLowerCase();

    if (line.startsWith('###') && (
      lowerLine.includes(lowerFramework) ||
      lowerLine.includes(lowerFramework.replace(/_/g, ' '))
    )) {
      capturing = true;
      depth = (line.match(/^#+/) || [''])[0].length;
      relevantLines = [line];
      continue;
    }

    if (capturing) {
      // Stop when we hit another section at the same or higher level
      if (line.startsWith('#') && (line.match(/^#+/) || [''])[0].length <= depth) {
        break;
      }
      relevantLines.push(line);
    }
  }

  const result = relevantLines.join('\n').trim();
  // Limit to ~2000 chars to fit in Claude's context alongside other prompt content
  return result.slice(0, 2000);
}

// ============================================================================
// MAIN
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const typeArg = args.find(a => a.startsWith('--type='))?.split('=')[1] || 'all';
  const batchSize = parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '50');

  console.log('=== Billion Dollar RAG Content Generator ===');
  console.log(`Type: ${typeArg} | Batch size: ${batchSize}`);
  console.log(`Anthropic API: ${ANTHROPIC_API_KEY ? 'configured' : 'MISSING'}`);
  console.log(`OpenAI API: ${OPENAI_API_KEY ? 'configured' : 'MISSING'}`);
  if (NO_EMBED) console.log(`Embeddings: SKIPPED (--no-embed) — backfill later with --type=backfill_embeddings`);

  const skipApiCheck = ['tag_existing', 'backfill_embeddings'].includes(typeArg);

  if (!skipApiCheck) {
    if (!ANTHROPIC_API_KEY) {
      console.error('\nANTHROPIC_API_KEY is required for content generation.');
      console.error('Usage: ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-rag-content.ts --type=primary_source --no-embed');
      process.exit(1);
    }
    if (!OPENAI_API_KEY && !NO_EMBED) {
      console.error('\nOPENAI_API_KEY is required for embedding generation.');
      console.error('Use --no-embed to skip embeddings and backfill later:');
      console.error('  ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-rag-content.ts --type=primary_source --round=1 --no-embed');
      console.error('\nOr provide both keys:');
      console.error('  ANTHROPIC_API_KEY=sk-... OPENAI_API_KEY=sk-... npx tsx scripts/generate-rag-content.ts --type=primary_source --round=1');
      process.exit(1);
    }
  }

  let totalGenerated = 0;

  const generators: Record<string, () => Promise<number>> = {
    micro_interventions: () => generateMicroInterventions(batchSize),
    case_studies: () => generateCaseStudies(batchSize),
    real_talk: () => generateRealTalkContent(batchSize),
    validation: () => generateValidationChunks(batchSize),
    cross_pillar: () => generateCrossPillarContent(batchSize),
    cultural: () => generateCulturalContent(batchSize),
    primary_source: () => generatePrimarySourceContent(batchSize),
    tag_existing: () => tagExistingChunks(),
    backfill_embeddings: () => backfillEmbeddings(),
  };

  if (typeArg === 'all') {
    for (const [name, generator] of Object.entries(generators)) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`  Running: ${name}`);
      console.log(`${'='.repeat(60)}`);
      const count = await generator();
      totalGenerated += count;
      console.log(`  ${name}: Generated ${count} chunks`);
    }
  } else if (generators[typeArg]) {
    totalGenerated = await generators[typeArg]();
  } else {
    console.error(`Unknown type: ${typeArg}. Available: ${Object.keys(generators).join(', ')}, all`);
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  TOTAL: ${totalGenerated} chunks generated/tagged`);
  console.log(`${'='.repeat(60)}`);

  // Final count
  const { count } = await supabase
    .from('mio_knowledge_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('pillar', 'relational');

  console.log(`  Database now has ${count} relational chunks total`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
