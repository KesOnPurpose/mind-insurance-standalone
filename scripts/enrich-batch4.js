/**
 * RAG Step Enrichment Script
 *
 * Purpose: Transform 378 generic 5-step tactics into 7-13 actionable steps
 * using RAG content from gh_training_chunks table
 *
 * Usage: node scripts/enrich-tactic-steps.js [--batch=1|2|3] [--test]
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Environment configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_KEY || !ANTHROPIC_API_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   SUPABASE_SERVICE_KEY:', SUPABASE_KEY ? '✓' : '✗');
  console.error('   ANTHROPIC_API_KEY:', ANTHROPIC_API_KEY ? '✓' : '✗');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Configuration
const CONFIG = {
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.3,
  maxTokens: 4000,
  testMode: process.argv.includes('--test'),
  batchArg: process.argv.find(arg => arg.startsWith('--batch=')),
};

/**
 * Query RAG database for tactic-related content
 */
async function queryRAGContent(tactic) {
  const { tactic_name, category, parent_category } = tactic;

  // Try multiple search strategies
  const searchTerms = [
    category,
    tactic_name,
    parent_category
  ].filter(Boolean);

  console.log(`  🔍 Searching RAG for: ${searchTerms.join(', ')}`);

  // Strategy 1: Exact category match (using chunk_text instead of content_text)
  let { data: chunks, error } = await supabase
    .from('gh_training_chunks')
    .select('id, source_file, chunk_text')
    .ilike('chunk_text', `%${category}%`)
    .limit(10);

  if (!chunks || chunks.length === 0) {
    // Strategy 2: Text search in tactic name
    ({ data: chunks, error } = await supabase
      .from('gh_training_chunks')
      .select('id, source_file, chunk_text')
      .ilike('chunk_text', `%${tactic_name}%`)
      .limit(10));
  }

  if (!chunks || chunks.length === 0) {
    // Strategy 3: Parent category search
    ({ data: chunks, error } = await supabase
      .from('gh_training_chunks')
      .select('id, source_file, chunk_text')
      .ilike('chunk_text', `%${parent_category}%`)
      .limit(10));
  }

  if (error) {
    console.error(`  ❌ RAG query error:`, error.message);
    return { chunks: [], chunkCount: 0 };
  }

  console.log(`  ✓ Found ${chunks?.length || 0} RAG chunks`);
  return { chunks: chunks || [], chunkCount: chunks?.length || 0 };
}

/**
 * Generate enriched steps using Claude
 */
async function generateEnrichedSteps(tactic, ragContext) {
  const { tactic_id, tactic_name, category } = tactic;

  const systemPrompt = `You are an expert in Group Homes for Newbies business operations.

Your task: Generate 7-13 ACTIONABLE, SPECIFIC steps for the tactic below using ONLY the provided RAG content from Lynette Wheaton's course.

QUALITY STANDARDS (from T021, T410, T421 benchmarks):
✅ MUST INCLUDE:
- Specific tools/platforms with pricing (e.g., "Google Voice free, Grasshopper $26/month")
- Exact documents to use (e.g., "SSI award letter", "VA benefits verification")
- Measurable criteria (e.g., "Contact 20+ landlords per week", "$967 SSI vs $950 rent")
- Real-world examples with numbers
- Legal/compliance considerations where relevant
- Revenue potential quantified (e.g., "$2,500-$3,500/month HCHV payment")
- Specific contacts/organizations (e.g., "Homeless Veteran Coordinator at local VA")

❌ MUST NOT INCLUDE (generic phrases):
- "Research and understand [topic]"
- "Gather necessary resources"
- "Take action"
- "Document your progress"
- "Review and refine"
- Any vague/generic instruction without specific guidance

OUTPUT FORMAT:
Return ONLY a JSON array of steps as strings:
["Step 1 text", "Step 2 text", ..., "Step N text"]

No markdown. No explanations. Just the JSON array.`;

  const userPrompt = `TACTIC: ${tactic_name}
CATEGORY: ${category}

RAG CONTENT:
${ragContext}

Generate 7-13 specific, actionable steps:`;

  console.log(`  🤖 Generating steps for ${tactic_id}...`);

  try {
    const message = await anthropic.messages.create({
      model: CONFIG.model,
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const responseText = message.content[0].text.trim();

    // Extract JSON array (handle cases where Claude adds markdown)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Response does not contain JSON array');
    }

    const steps = JSON.parse(jsonMatch[0]);
    console.log(`  ✓ Generated ${steps.length} steps`);

    return { steps, usage: message.usage };
  } catch (error) {
    console.error(`  ❌ Claude API error:`, error.message);
    throw error;
  }
}

/**
 * Validate generated steps
 */
function validateSteps(tactic, steps) {
  const { tactic_id, tactic_name } = tactic;
  const errors = [];

  // Validation 1: Step count
  if (steps.length < 7 || steps.length > 13) {
    errors.push(`Step count ${steps.length} (must be 7-13)`);
  }

  // Validation 2: No generic phrases
  const genericPhrases = [
    /research and understand/i,
    /gather necessary resources/i,
    /take action/i,
    /document your progress/i,
    /review and refine/i
  ];

  const genericSteps = steps.filter(step =>
    genericPhrases.some(phrase => phrase.test(step))
  );

  if (genericSteps.length > 0) {
    errors.push(`Contains ${genericSteps.length} generic phrases`);
  }

  // Validation 3: At least 50% of steps have specifics
  const specificIndicators = [
    /\$\d+/,           // Pricing ($26/month)
    /\d+\+/,           // Quantities (20+ landlords)
    /\d+%/,            // Percentages (50%)
    /\d+ (steps?|points?|items?)/,  // Numbered lists
    /\((e\.g\.|for example)/i,      // Examples
  ];

  const specificCount = steps.filter(step =>
    specificIndicators.some(pattern => pattern.test(step))
  ).length;

  if (specificCount < steps.length * 0.5) {
    errors.push(`Only ${specificCount}/${steps.length} steps are specific (need 50%+)`);
  }

  const isValid = errors.length === 0;

  if (isValid) {
    console.log(`  ✅ PASS: ${tactic_id} validated (${steps.length} steps, ${specificCount} specific)`);
  } else {
    console.log(`  ❌ REJECT: ${tactic_id} - ${errors.join(', ')}`);
  }

  return {
    isValid,
    errors,
    stepCount: steps.length,
    specificCount
  };
}

/**
 * Process a single tactic
 */
async function processTactic(tactic, retryCount = 0) {
  const { tactic_id, tactic_name } = tactic;

  console.log(`\n📋 Processing ${tactic_id}: ${tactic_name}`);

  try {
    // Step 1: Query RAG
    const { chunks, chunkCount } = await queryRAGContent(tactic);

    if (chunkCount === 0) {
      console.log(`  ⚠️  No RAG content found - using tactic name only`);
    }

    // Step 2: Concatenate RAG context
    const ragContext = chunks.length > 0
      ? chunks.map(c => `[${c.source_file}]\n${c.chunk_text}`).join('\n\n---\n\n')
      : `No specific course content found for "${tactic_name}". Use general group home business knowledge.`;

    // Step 3: Generate steps
    const { steps, usage } = await generateEnrichedSteps(tactic, ragContext);

    // Step 4: Validate
    const validation = validateSteps(tactic, steps);

    if (!validation.isValid && retryCount < 2) {
      console.log(`  🔄 Retrying (attempt ${retryCount + 2}/3)...`);
      return await processTactic(tactic, retryCount + 1);
    }

    return {
      tactic_id,
      tactic_name,
      enriched_steps: steps,
      validation,
      chunkCount,
      usage,
      retryCount
    };

  } catch (error) {
    console.error(`  ❌ Error processing ${tactic_id}:`, error.message);
    return {
      tactic_id,
      tactic_name,
      error: error.message,
      validation: { isValid: false, errors: [error.message] }
    };
  }
}

/**
 * Save results to files
 */
async function saveResults(results, batchName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(process.cwd(), 'enrichment-output');

  await fs.mkdir(outputDir, { recursive: true });

  // Success log (CSV)
  const successResults = results.filter(r => r.validation?.isValid);
  const successCsv = [
    'tactic_id,tactic_name,step_count,specific_count,chunk_count,retry_count,timestamp',
    ...successResults.map(r =>
      `${r.tactic_id},"${r.tactic_name}",${r.validation.stepCount},${r.validation.specificCount},${r.chunkCount},${r.retryCount},${timestamp}`
    )
  ].join('\n');

  await fs.writeFile(
    path.join(outputDir, `enrichment-log-${batchName}-${timestamp}.csv`),
    successCsv
  );

  // Error log (CSV)
  const errorResults = results.filter(r => !r.validation?.isValid);
  if (errorResults.length > 0) {
    const errorCsv = [
      'tactic_id,tactic_name,errors,chunk_count,timestamp',
      ...errorResults.map(r =>
        `${r.tactic_id},"${r.tactic_name}","${r.validation?.errors?.join('; ') || r.error}",${r.chunkCount || 0},${timestamp}`
      )
    ].join('\n');

    await fs.writeFile(
      path.join(outputDir, `enrichment-errors-${batchName}-${timestamp}.csv`),
      errorCsv
    );
  }

  // Full results (JSON)
  await fs.writeFile(
    path.join(outputDir, `enrichment-results-${batchName}-${timestamp}.json`),
    JSON.stringify(results, null, 2)
  );

  console.log(`\n📁 Results saved to ${outputDir}/`);
  console.log(`   ✓ enrichment-log-${batchName}-${timestamp}.csv`);
  if (errorResults.length > 0) {
    console.log(`   ✓ enrichment-errors-${batchName}-${timestamp}.csv`);
  }
  console.log(`   ✓ enrichment-results-${batchName}-${timestamp}.json`);

  return { successResults, errorResults };
}

/**
 * Generate SQL migration
 */
async function generateMigration(successResults, batchName) {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const migrationFile = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    `${timestamp}_enrich_tactic_steps_${batchName}.sql`
  );

  const sqlStatements = [
    '-- Migration: Enrich Generic Tactic Steps with RAG Content',
    `-- Batch: ${batchName}`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Tactics Enriched: ${successResults.length}`,
    '',
    '-- Backup existing steps before update',
    'DO $$',
    'BEGIN',
    '  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = \'gh_tactic_instructions_backup\') THEN',
    '    CREATE TABLE gh_tactic_instructions_backup AS',
    '    SELECT tactic_id, step_by_step, now() as backup_at',
    '    FROM gh_tactic_instructions;',
    '    RAISE NOTICE \'Created backup table: gh_tactic_instructions_backup\';',
    '  END IF;',
    'END $$;',
    '',
    '-- Update tactics with enriched steps',
    ...successResults.map(r => {
      const stepsJson = JSON.stringify(r.enriched_steps);
      const escapedJson = stepsJson.replace(/'/g, "''");
      return `UPDATE gh_tactic_instructions\nSET step_by_step = '${escapedJson}'::JSONB\nWHERE tactic_id = '${r.tactic_id}';\n`;
    }),
    '',
    '-- Verification query',
    'SELECT',
    '  COUNT(*) as total_updated,',
    '  COUNT(*) FILTER (WHERE jsonb_array_length(step_by_step) BETWEEN 7 AND 13) as valid_step_count,',
    '  AVG(jsonb_array_length(step_by_step)) as avg_steps',
    'FROM gh_tactic_instructions',
    `WHERE tactic_id IN (${successResults.map(r => `'${r.tactic_id}'`).join(', ')});`,
    '',
    '-- Rollback script (if needed)',
    '/*',
    'ROLLBACK INSTRUCTIONS:',
    'UPDATE gh_tactic_instructions t',
    'SET step_by_step = b.step_by_step',
    'FROM gh_tactic_instructions_backup b',
    'WHERE t.tactic_id = b.tactic_id;',
    '*/'
  ].join('\n');

  await fs.writeFile(migrationFile, sqlStatements);
  console.log(`\n📄 Migration generated: ${migrationFile}`);

  return migrationFile;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 RAG Step Enrichment Pipeline Starting...\n');

  // Load tactics to enrich
  const tacticsFile = path.join(process.cwd(), 'TACTICS-TO-ENRICH.json');
  const tacticsData = JSON.parse(await fs.readFile(tacticsFile, 'utf-8'));

  // Fetch full tactic data from database for the IDs in config
  const tacticIds = tacticsData.tacticIds || tacticsData.tactics?.map(t => t.tactic_id) || [];

  console.log(`📋 Loading ${tacticIds.length} tactics from database...\n`);

  const { data: tacticsFromDb, error: fetchError } = await supabase
    .from('gh_tactic_instructions')
    .select('tactic_id, tactic_name, category, parent_category, week_assignment, is_critical_path, step_by_step')
    .in('tactic_id', tacticIds);

  if (fetchError) {
    throw new Error(`Failed to fetch tactics: ${fetchError.message}`);
  }

  if (!tacticsFromDb || tacticsFromDb.length === 0) {
    throw new Error(`No tactics found in database for IDs: ${tacticIds.join(', ')}`);
  }

  console.log(`✅ Loaded ${tacticsFromDb.length} tactics from database\n`);

  let tacticsToProcess = tacticsFromDb;
  let batchName = 'batch4-remaining-generic';

  // Test mode: process only 5 tactics
  if (CONFIG.testMode) {
    tacticsToProcess = tacticsToProcess.slice(0, 5);
    batchName = 'test';
    console.log('⚠️  TEST MODE: Processing only 5 tactics\n');
  }

  console.log(`📊 Processing ${tacticsToProcess.length} tactics (${batchName})\n`);

  // Process tactics sequentially (to avoid rate limits)
  const results = [];
  for (let i = 0; i < tacticsToProcess.length; i++) {
    const tactic = tacticsToProcess[i];
    console.log(`[${i + 1}/${tacticsToProcess.length}]`);

    const result = await processTactic(tactic);
    results.push(result);

    // Rate limiting: 50 requests/minute = 1.2s per request
    if (i < tacticsToProcess.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }

  // Save results
  const { successResults, errorResults } = await saveResults(results, batchName);

  // Generate migration (only for non-test mode)
  if (!CONFIG.testMode && successResults.length > 0) {
    await generateMigration(successResults, batchName);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 ENRICHMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successResults.length}/${results.length} (${(successResults.length/results.length*100).toFixed(1)}%)`);
  console.log(`❌ Failed:  ${errorResults.length}/${results.length} (${(errorResults.length/results.length*100).toFixed(1)}%)`);

  if (successResults.length > 0) {
    const avgSteps = successResults.reduce((sum, r) => sum + r.validation.stepCount, 0) / successResults.length;
    const avgSpecific = successResults.reduce((sum, r) => sum + r.validation.specificCount, 0) / successResults.length;
    console.log(`📊 Avg Steps: ${avgSteps.toFixed(1)}`);
    console.log(`📊 Avg Specific Steps: ${avgSpecific.toFixed(1)} (${(avgSpecific/avgSteps*100).toFixed(1)}%)`);
  }

  console.log('='.repeat(60));

  if (CONFIG.testMode) {
    console.log('\n💡 Test complete! Review results, then run full batches:');
    console.log('   node scripts/enrich-tactic-steps.js --batch=1');
    console.log('   node scripts/enrich-tactic-steps.js --batch=2');
    console.log('   node scripts/enrich-tactic-steps.js --batch=3');
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
