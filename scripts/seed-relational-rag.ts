// ============================================================================
// RELATIONAL RAG KNOWLEDGE BASE - SEED SCRIPT
// ============================================================================
// Purpose: Read 10-part relational knowledge base + Phase docs, chunk, embed,
//          and insert into mio_knowledge_chunks with full relational metadata.
//
// Usage:
//   export SUPABASE_SERVICE_KEY="eyJhbGci..."
//   export OPENAI_API_KEY="sk-proj-..."
//   npx tsx scripts/seed-relational-rag.ts
//
// Options:
//   --dry-run        Show chunks without inserting
//   --skip-embeddings Insert text chunks only (backfill embeddings later)
//   --batch-size N   Chunks per Supabase insert (default: 20)
//
// Source Files:
//   /ASSETS/MIO/Relation Pillar /RAG Database Docs/MIO RELATIONAL PILLAR MASTER KNOWLEDGE BASE/
//   - PART 1-10 (core relational frameworks, ~60KB)
//   - Phase_2_* (supplementary frameworks, ~67KB)
//
// Target Table: mio_knowledge_chunks (pillar='relational')
// Expected Output: ~250-350 chunks with embeddings
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ||
  '$SUPABASE_SERVICE_ROLE_KEY';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Chunking
const CHUNK_SIZE = 500;      // ~500 chars target
const CHUNK_OVERLAP = 50;    // overlap for context continuity

// CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SKIP_EMBEDDINGS = args.includes('--skip-embeddings');
const BATCH_SIZE = (() => {
  const idx = args.indexOf('--batch-size');
  return idx >= 0 ? parseInt(args[idx + 1], 10) || 20 : 20;
})();

// Knowledge base root
const KB_ROOT = path.resolve(
  __dirname, '..', '..', 'ASSETS', 'MIO', 'Relation Pillar ',
  'RAG Database Docs', 'MIO RELATIONAL PILLAR MASTER KNOWLEDGE BASE'
);

// ============================================================================
// FILE-TO-METADATA MAPPING
// ============================================================================

interface FileMetadata {
  file_number: number;
  framework_domain: string;
  evidence_tier: 'gold' | 'silver' | 'bronze' | 'copper';
  triage_color: 'green' | 'yellow' | 'orange';
  life_stages: string[];
  issue_types: string[];
  category: string;
  source_title: string;
}

// Map each source file to its relational metadata
const FILE_METADATA: Record<string, FileMetadata> = {
  'PART 1 ': {
    file_number: 1,
    framework_domain: 'foundation_attachment',
    evidence_tier: 'gold',
    triage_color: 'green',
    life_stages: ['dating', 'engaged', 'newlywed', 'established', 'crisis', 'remarriage'],
    issue_types: ['communication', 'trust', 'intimacy'],
    category: 'attachment_theory',
    source_title: 'PART 1: Foundation & Attachment',
  },
  'PART 2 ': {
    file_number: 2,
    framework_domain: 'communication_conflict',
    evidence_tier: 'gold',
    triage_color: 'green',
    life_stages: ['dating', 'engaged', 'newlywed', 'established', 'crisis'],
    issue_types: ['communication', 'conflict'],
    category: 'communication_conflict',
    source_title: 'PART 2: Communication & Conflict Resolution',
  },
  'PART 3 ': {
    file_number: 3,
    framework_domain: 'foundation_attachment',
    evidence_tier: 'silver',
    triage_color: 'green',
    life_stages: ['dating', 'engaged', 'newlywed', 'established'],
    issue_types: ['intimacy'],
    category: 'desire_intimacy',
    source_title: 'PART 3: Desire, Sex & Intimacy',
  },
  'PART 4 ': {
    file_number: 4,
    framework_domain: 'foundation_attachment',
    evidence_tier: 'gold',
    triage_color: 'green',
    life_stages: ['dating', 'engaged', 'newlywed', 'established'],
    issue_types: ['communication', 'intimacy'],
    category: 'love_languages',
    source_title: 'PART 4: Emotional Expression & Love Languages',
  },
  'PART 5 ': {
    file_number: 5,
    framework_domain: 'trauma_nervous_system',
    evidence_tier: 'gold',
    triage_color: 'yellow',
    life_stages: ['dating', 'engaged', 'newlywed', 'established', 'crisis'],
    issue_types: ['trauma', 'communication', 'trust'],
    category: 'childhood_wounds',
    source_title: 'PART 5: Childhood Wounds & Healing',
  },
  'PART 6 ': {
    file_number: 6,
    framework_domain: 'addiction_codependency',
    evidence_tier: 'silver',
    triage_color: 'orange',
    life_stages: ['established', 'crisis', 'separation'],
    issue_types: ['trust', 'intimacy', 'trauma'],
    category: 'infidelity_recovery',
    source_title: 'PART 6: Infidelity, Betrayal & Recovery',
  },
  'PART 7 ': {
    file_number: 7,
    framework_domain: 'foundation_attachment',
    evidence_tier: 'silver',
    triage_color: 'green',
    life_stages: ['newlywed', 'established'],
    issue_types: ['parenting', 'communication', 'conflict'],
    category: 'parenting',
    source_title: 'PART 7: Parenting & Child Development',
  },
  'PART 8 ': {
    file_number: 8,
    framework_domain: 'cultural_context',
    evidence_tier: 'silver',
    triage_color: 'green',
    life_stages: ['dating', 'engaged', 'newlywed', 'established', 'crisis', 'separation', 'remarriage'],
    issue_types: ['communication', 'trust', 'intimacy', 'finance'],
    category: 'life_seasons',
    source_title: 'PART 8: Life Seasons & Transitions',
  },
  'PART 9 ': {
    file_number: 9,
    framework_domain: 'foundation_attachment',
    evidence_tier: 'bronze',
    triage_color: 'green',
    life_stages: ['dating', 'separation', 'divorce'],
    issue_types: ['communication', 'trust'],
    category: 'solo_protocols',
    source_title: 'PART 9: Solo User Protocols',
  },
  'PART 10': {
    file_number: 10,
    framework_domain: 'cultural_context',
    evidence_tier: 'bronze',
    triage_color: 'green',
    life_stages: ['dating', 'engaged', 'newlywed', 'established', 'crisis', 'separation', 'remarriage'],
    issue_types: ['communication', 'conflict', 'trust', 'intimacy'],
    category: 'special_applications',
    source_title: 'PART 10: Special Applications & Integration',
  },
  // Phase 2 supplementary docs (rich framework content)
  'Phase_2_Apology': {
    file_number: 11,
    framework_domain: 'communication_conflict',
    evidence_tier: 'silver',
    triage_color: 'green',
    life_stages: ['established', 'crisis'],
    issue_types: ['communication', 'trust', 'conflict'],
    category: 'apology_forgiveness',
    source_title: 'Phase 2: Apology & Forgiveness Framework',
  },
  'Phase_2_Book': {
    file_number: 12,
    framework_domain: 'foundation_attachment',
    evidence_tier: 'gold',
    triage_color: 'green',
    life_stages: ['dating', 'engaged', 'newlywed', 'established', 'crisis'],
    issue_types: ['communication', 'intimacy', 'trust', 'conflict'],
    category: 'book_synthesis',
    source_title: 'Phase 2: Book Framework Synthesis',
  },
  'Phase_2_Parenting': {
    file_number: 13,
    framework_domain: 'foundation_attachment',
    evidence_tier: 'silver',
    triage_color: 'green',
    life_stages: ['newlywed', 'established'],
    issue_types: ['parenting', 'communication', 'conflict'],
    category: 'parenting_frameworks',
    source_title: 'Phase 2: Parenting Frameworks',
  },
  'Phase_2_Sex': {
    file_number: 14,
    framework_domain: 'foundation_attachment',
    evidence_tier: 'silver',
    triage_color: 'green',
    life_stages: ['dating', 'engaged', 'newlywed', 'established'],
    issue_types: ['intimacy'],
    category: 'sex_therapy',
    source_title: 'Phase 2: Sex Therapy Frameworks',
  },
  'Phase_2_Tier_2': {
    file_number: 15,
    framework_domain: 'trauma_nervous_system',
    evidence_tier: 'silver',
    triage_color: 'yellow',
    life_stages: ['established', 'crisis'],
    issue_types: ['trauma', 'abuse', 'addiction'],
    category: 'advanced_frameworks',
    source_title: 'Phase 2: Tier 2 Advanced Frameworks',
  },
  'Phase_2_Final': {
    file_number: 16,
    framework_domain: 'foundation_attachment',
    evidence_tier: 'gold',
    triage_color: 'green',
    life_stages: ['dating', 'engaged', 'newlywed', 'established', 'crisis'],
    issue_types: ['communication', 'intimacy', 'trust', 'conflict', 'trauma'],
    category: 'master_framework',
    source_title: 'Phase 2: Final Assembly Master Framework',
  },
};

// ============================================================================
// TEXT CHUNKING
// ============================================================================

interface TextChunk {
  chunk_number: number;
  chunk_text: string;
  chunk_summary: string;
  section_header: string;
  tokens_approx: number;
}

function chunkText(text: string, sourceTitle: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  let currentSection = sourceTitle;

  // Split into paragraphs first
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  let buffer = '';
  let chunkNum = 0;

  for (const para of paragraphs) {
    // Detect section headers
    const headerMatch = para.match(/^#{1,4}\s+(.+)/);
    if (headerMatch) {
      currentSection = headerMatch[1].trim();
    }

    // If adding this paragraph would exceed chunk size, flush
    if (buffer.length > 0 && buffer.length + para.length > CHUNK_SIZE) {
      chunkNum++;
      chunks.push({
        chunk_number: chunkNum,
        chunk_text: buffer.trim(),
        chunk_summary: `${sourceTitle} > ${currentSection}`,
        section_header: currentSection,
        tokens_approx: Math.ceil(buffer.trim().length / 4),
      });

      // Keep overlap from end of previous chunk
      const words = buffer.trim().split(/\s+/);
      const overlapWords = words.slice(-Math.ceil(CHUNK_OVERLAP / 5));
      buffer = overlapWords.join(' ') + '\n\n' + para;
    } else {
      buffer += (buffer ? '\n\n' : '') + para;
    }
  }

  // Flush remaining buffer
  if (buffer.trim().length > 50) {
    chunkNum++;
    chunks.push({
      chunk_number: chunkNum,
      chunk_text: buffer.trim(),
      chunk_summary: `${sourceTitle} > ${currentSection}`,
      section_header: currentSection,
      tokens_approx: Math.ceil(buffer.trim().length / 4),
    });
  }

  return chunks;
}

// ============================================================================
// FRAMEWORK NAME DETECTION
// ============================================================================

const FRAMEWORK_PATTERNS: Record<string, RegExp> = {
  'attachment_theory': /attachment|levine|heller|attached/i,
  'emotionally_focused_therapy': /sue\s+johnson|hold\s+me\s+tight|eft|emotionally\s+focused/i,
  'gottman_method': /gottman|seven\s+principles|four\s+horsemen|sound\s+relationship/i,
  'love_languages': /love\s+languages?|chapman|five\s+love/i,
  'his_needs_her_needs': /willard\s+harley|his\s+needs|her\s+needs|emotional\s+needs/i,
  'nonviolent_communication': /nonviolent|nvc|marshall\s+rosenberg|observation.*feeling.*need.*request/i,
  'polyvagal_theory': /polyvagal|vagal|porges|dorsal|ventral/i,
  'internal_family_systems': /internal\s+family|ifs|parts\s+work|exile.*manager.*firefighter/i,
  'esther_perel': /esther\s+perel|mating\s+in\s+captivity|state\s+of\s+affairs/i,
  'brene_brown': /bren[eé]\s+brown|vulnerability|shame\s+resilience/i,
  'harriet_lerner': /harriet\s+lerner|dance\s+of|apologize/i,
  'terry_real': /terry\s+real|relational\s+life/i,
  'boundaries': /boundaries|henry\s+cloud|john\s+townsend/i,
  'sensate_focus': /sensate\s+focus|masters\s+and\s+johnson|sensory/i,
  'prepare_enrich': /prepare.*enrich|premarital.*assessment/i,
};

function detectFrameworkNames(text: string): string[] {
  const found: string[] = [];
  for (const [name, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
    if (pattern.test(text)) {
      found.push(name);
    }
  }
  return found;
}

// ============================================================================
// CONTRAINDICATION DETECTION
// ============================================================================

const CONTRAINDICATION_PATTERNS: Record<string, RegExp> = {
  'active_abuse': /active\s+abuse|currently\s+being\s+abused|safety\s+concern/i,
  'active_addiction': /active\s+addiction|currently\s+using|substance\s+abuse/i,
  'acute_psychosis': /psychotic|psychosis|hallucinating|delusion/i,
  'suicidal_ideation': /suicidal|suicide|self.harm|want\s+to\s+die/i,
  'active_dv': /domestic\s+violence|physically\s+abusive|hitting|choking/i,
};

function detectContraindications(text: string): string[] {
  const found: string[] = [];
  for (const [tag, pattern] of Object.entries(CONTRAINDICATION_PATTERNS)) {
    if (pattern.test(text)) {
      found.push(tag);
    }
  }
  return found;
}

// ============================================================================
// OPENAI EMBEDDING GENERATION
// ============================================================================

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`  OpenAI error: ${response.status} ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding ?? null;
  } catch (err) {
    console.error(`  Embedding error: ${(err as Error).message}`);
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// FILE DISCOVERY
// ============================================================================

function discoverFiles(): { filePath: string; metaKey: string }[] {
  if (!fs.existsSync(KB_ROOT)) {
    console.error(`Knowledge base directory not found: ${KB_ROOT}`);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(KB_ROOT).filter(f => f.endsWith('.md'));
  const matched: { filePath: string; metaKey: string }[] = [];

  for (const filename of allFiles) {
    // Find matching metadata key
    const metaKey = Object.keys(FILE_METADATA).find(key =>
      filename.startsWith(key)
    );

    if (metaKey) {
      matched.push({
        filePath: path.join(KB_ROOT, filename),
        metaKey,
      });
    } else {
      // Skip project-management files (PHASES_*, PHASE_4_*, MIO_PROJECT_*)
      console.log(`  Skipping (no metadata mapping): ${filename.slice(0, 60)}...`);
    }
  }

  // Sort by file_number for deterministic ordering
  matched.sort((a, b) =>
    FILE_METADATA[a.metaKey].file_number - FILE_METADATA[b.metaKey].file_number
  );

  return matched;
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('RELATIONAL RAG KNOWLEDGE BASE SEEDER');
  console.log('='.repeat(70));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Embeddings: ${SKIP_EMBEDDINGS ? 'SKIPPED' : OPENAI_API_KEY ? 'ENABLED' : 'NO API KEY - SKIPPED'}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`KB root: ${KB_ROOT}`);
  console.log('');

  // Step 1: Check if our specific content is already seeded
  // (existing rows from exercises/facilitator guides are preserved)
  if (!DRY_RUN) {
    const { count } = await supabase
      .from('mio_knowledge_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('pillar', 'relational')
      .not('framework_domain', 'is', null);

    if (count && count > 0) {
      console.log(`WARNING: mio_knowledge_chunks already has ${count} relational rows WITH framework metadata.`);
      console.log('This means the knowledge base was already seeded.');
      console.log('To re-seed, first delete: DELETE FROM mio_knowledge_chunks WHERE pillar = \'relational\' AND framework_domain IS NOT NULL;');
      console.log('Exiting to prevent duplicates.');
      return;
    }

    // Show existing content info
    const { count: existingCount } = await supabase
      .from('mio_knowledge_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('pillar', 'relational');

    if (existingCount && existingCount > 0) {
      console.log(`Note: ${existingCount} existing relational rows (exercises/guides) will be preserved.`);
    }
  }

  // Step 2: Discover files
  console.log('Discovering knowledge base files...');
  const files = discoverFiles();
  console.log(`Found ${files.length} files to process.\n`);

  // Step 3: Process each file
  let totalChunks = 0;
  let totalEmbedded = 0;
  const allRecords: any[] = [];

  for (const { filePath, metaKey } of files) {
    const meta = FILE_METADATA[metaKey];
    console.log(`\n[${'='.repeat(60)}]`);
    console.log(`Processing: ${meta.source_title} (file #${meta.file_number})`);
    console.log(`  Domain: ${meta.framework_domain} | Evidence: ${meta.evidence_tier} | Triage: ${meta.triage_color}`);

    const rawText = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkText(rawText, meta.source_title);
    console.log(`  Chunks: ${chunks.length} (${rawText.length} chars)`);

    for (const chunk of chunks) {
      const frameworkNames = detectFrameworkNames(chunk.chunk_text);
      const contraindications = detectContraindications(chunk.chunk_text);

      const record: any = {
        chunk_text: chunk.chunk_text,
        chunk_summary: chunk.chunk_summary,
        source_file: meta.source_title,
        chunk_number: chunk.chunk_number,
        pillar: 'relational',
        category: meta.category,
        subcategory: 'framework',
        tokens_approx: chunk.tokens_approx,
        is_active: true,
        priority_level: meta.evidence_tier === 'gold' ? 8 : meta.evidence_tier === 'silver' ? 6 : 4,
        difficulty_level: 'intermediate',
        version: '1.0',
        // Relational-specific columns
        framework_domain: meta.framework_domain,
        framework_name: frameworkNames[0] || null,
        framework_section: chunk.section_header.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 50),
        evidence_tier: meta.evidence_tier,
        triage_color: contraindications.length > 0 ? 'orange' : meta.triage_color,
        contraindication_tags: contraindications,
        cultural_context_flags: [],
        integration_points: frameworkNames.slice(1), // Cross-references
        life_stages: meta.life_stages,
        issue_types: meta.issue_types,
        applicable_contexts: meta.issue_types,
        applicable_patterns: [],
        related_pillars: ['mental'],
      };

      // Generate embedding
      if (!SKIP_EMBEDDINGS && OPENAI_API_KEY && !DRY_RUN) {
        const embedding = await generateEmbedding(chunk.chunk_text);
        if (embedding) {
          record.embedding = JSON.stringify(embedding);
          totalEmbedded++;
        }
        // Rate limit: ~3000 RPM for text-embedding-3-small
        await sleep(25);
      }

      allRecords.push(record);
      totalChunks++;
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Total chunks: ${totalChunks}`);
  console.log(`Embedded: ${totalEmbedded}`);

  if (DRY_RUN) {
    console.log('\nDRY RUN - Sample chunks:');
    for (const rec of allRecords.slice(0, 5)) {
      console.log(`  [${rec.file_number}-${rec.chunk_number}] ${rec.framework_domain} | ${rec.evidence_tier} | ${rec.triage_color}`);
      console.log(`    ${rec.chunk_text.slice(0, 120)}...`);
      console.log(`    Frameworks: ${rec.framework_name || 'none'} | Integrations: ${rec.integration_points.join(', ') || 'none'}`);
    }
    console.log(`\n${totalChunks} total chunks would be inserted.`);
    return;
  }

  // Step 4: Batch insert into Supabase
  console.log(`\nInserting ${totalChunks} chunks in batches of ${BATCH_SIZE}...`);

  let inserted = 0;
  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    const batch = allRecords.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('mio_knowledge_chunks')
      .insert(batch);

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} FAILED: ${error.message}`);
      console.error(`  Details: ${JSON.stringify(error).slice(0, 300)}`);
      // Continue with remaining batches
    } else {
      inserted += batch.length;
      process.stdout.write(`  Inserted: ${inserted}/${totalChunks}\r`);
    }
  }

  console.log(`\n\nDone! Inserted ${inserted}/${totalChunks} chunks.`);

  // Step 5: Verification
  const { count: finalCount } = await supabase
    .from('mio_knowledge_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('pillar', 'relational');

  console.log(`\nVerification: ${finalCount} relational chunks in database.`);

  // Show breakdown by domain
  const { data: domainCounts } = await supabase
    .from('mio_knowledge_chunks')
    .select('framework_domain')
    .eq('pillar', 'relational');

  if (domainCounts) {
    const counts: Record<string, number> = {};
    for (const row of domainCounts) {
      const d = row.framework_domain || 'unclassified';
      counts[d] = (counts[d] || 0) + 1;
    }
    console.log('\nChunks by domain:');
    for (const [domain, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${domain}: ${count}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('RELATIONAL RAG SEED COMPLETE');
  console.log('='.repeat(70));

  if (!totalEmbedded) {
    console.log('\nNOTE: No embeddings were generated. To backfill:');
    console.log('  export OPENAI_API_KEY="sk-..."');
    console.log('  npx tsx scripts/seed-relational-rag.ts');
    console.log('Or use the N8n Knowledge Ingestion Pipeline webhook.');
  }
}

// ============================================================================
// RUN
// ============================================================================

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
