#!/usr/bin/env npx ts-node
/**
 * Batch Binder Generation Script
 *
 * Usage:
 *   npx ts-node scripts/batch-generate-binders.ts --api-key=sk-ant-xxx [options]
 *
 * Options:
 *   --api-key       Required. Claude API key (starts with sk-ant-)
 *   --state         Filter by state code (e.g., CA, TX, FL)
 *   --min-confidence Minimum confidence score (default: 60)
 *   --limit         Maximum binders to generate (default: no limit)
 *   --dry-run       Preview without saving to database
 *   --verbose       Show detailed progress
 *   --help          Show this help message
 *
 * Examples:
 *   npx ts-node scripts/batch-generate-binders.ts --api-key=sk-ant-xxx --state=CA --limit=5
 *   npx ts-node scripts/batch-generate-binders.ts --api-key=sk-ant-xxx --min-confidence=70 --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { buildBinderPrompt, validateBinderContent, extractSectionHeaders, assessCacheRecord } from '../src/utils/binderPromptBuilder';
import type { CountyComplianceCache } from '../src/types/countyCompliance';
import type { BatchGenerationResult, GenerationResultDetail } from '../src/types/binderGeneration';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hpyodaugrkctagkrfofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = 8192;
const RATE_LIMIT_DELAY_MS = 1500; // 1.5 seconds between API calls

// Parse command line arguments
function parseArgs(): {
  apiKey: string;
  stateCode?: string;
  minConfidence: number;
  limit?: number;
  dryRun: boolean;
  verbose: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);
  const result = {
    apiKey: '',
    stateCode: undefined as string | undefined,
    minConfidence: 60,
    limit: undefined as number | undefined,
    dryRun: false,
    verbose: false,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true;
    } else if (arg.startsWith('--api-key=')) {
      result.apiKey = arg.split('=')[1];
    } else if (arg.startsWith('--state=')) {
      result.stateCode = arg.split('=')[1].toUpperCase();
    } else if (arg.startsWith('--min-confidence=')) {
      result.minConfidence = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--limit=')) {
      result.limit = parseInt(arg.split('=')[1], 10);
    }
  }

  return result;
}

function showHelp(): void {
  console.log(`
Batch Binder Generation Script

Usage:
  npx ts-node scripts/batch-generate-binders.ts --api-key=sk-ant-xxx [options]

Options:
  --api-key        Required. Claude API key (starts with sk-ant-)
  --state          Filter by state code (e.g., CA, TX, FL)
  --min-confidence Minimum confidence score (default: 60)
  --limit          Maximum binders to generate (default: no limit)
  --dry-run        Preview without saving to database
  --verbose        Show detailed progress
  --help           Show this help message

Examples:
  npx ts-node scripts/batch-generate-binders.ts --api-key=sk-ant-xxx --state=CA --limit=5
  npx ts-node scripts/batch-generate-binders.ts --api-key=sk-ant-xxx --min-confidence=70 --dry-run
  npx ts-node scripts/batch-generate-binders.ts --api-key=sk-ant-xxx --verbose
`);
}

function log(message: string, verbose: boolean, isVerboseOnly = false): void {
  if (isVerboseOnly && !verbose) return;
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logError(message: string): void {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Validate API key
  if (!args.apiKey || !args.apiKey.startsWith('sk-ant-')) {
    logError('Invalid or missing API key. Use --api-key=sk-ant-xxx');
    process.exit(1);
  }

  // Check Supabase service key
  if (!SUPABASE_SERVICE_KEY) {
    logError('SUPABASE_SERVICE_KEY environment variable not set');
    process.exit(1);
  }

  log('Starting batch binder generation...', args.verbose);
  log(`Configuration:`, args.verbose);
  log(`  State filter: ${args.stateCode || 'All states'}`, args.verbose);
  log(`  Min confidence: ${args.minConfidence}`, args.verbose);
  log(`  Limit: ${args.limit || 'No limit'}`, args.verbose);
  log(`  Dry run: ${args.dryRun}`, args.verbose);

  // Initialize clients
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const anthropic = new Anthropic({ apiKey: args.apiKey });

  // Fetch cache records
  log('Fetching cache records...', args.verbose);

  let query = supabase
    .from('county_compliance_cache')
    .select('*')
    .gte('confidence_score', args.minConfidence)
    .order('confidence_score', { ascending: false });

  if (args.stateCode) {
    query = query.eq('state_code', args.stateCode);
  }

  if (args.limit) {
    query = query.limit(args.limit * 2); // Fetch extra to account for skips
  }

  const { data: cacheRecords, error: fetchError } = await query;

  if (fetchError) {
    logError(`Failed to fetch cache records: ${fetchError.message}`);
    process.exit(1);
  }

  if (!cacheRecords || cacheRecords.length === 0) {
    log('No cache records found matching criteria', args.verbose);
    process.exit(0);
  }

  log(`Found ${cacheRecords.length} cache records`, args.verbose);

  // Check which records already have binders
  const countyNames = cacheRecords.map(r => r.county_name);
  const stateCodes = [...new Set(cacheRecords.map(r => r.state_code))];

  const { data: existingBinders } = await supabase
    .from('local_compliance_binders')
    .select('location_name, state_code')
    .in('state_code', stateCodes);

  const existingBinderKeys = new Set(
    (existingBinders || []).map(b => `${b.location_name}|${b.state_code}`)
  );

  // Filter to records that need generation
  const recordsToProcess = cacheRecords.filter(record => {
    const key = `${record.county_name}|${record.state_code}`;
    return !existingBinderKeys.has(key);
  });

  // Apply limit after filtering
  const finalRecords = args.limit
    ? recordsToProcess.slice(0, args.limit)
    : recordsToProcess;

  log(`Records to process: ${finalRecords.length} (${cacheRecords.length - recordsToProcess.length} already have binders)`, args.verbose);

  if (finalRecords.length === 0) {
    log('All matching records already have binders', args.verbose);
    process.exit(0);
  }

  // Process records
  const results: GenerationResultDetail[] = [];
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < finalRecords.length; i++) {
    const record = finalRecords[i] as CountyComplianceCache;
    const progress = `[${i + 1}/${finalRecords.length}]`;

    log(`${progress} Processing ${record.county_name}, ${record.state_code}...`, args.verbose);

    // Assess record suitability
    const assessment = assessCacheRecord(record);

    if (!assessment.isSuitable) {
      log(`${progress} Skipping: ${assessment.issues.join(', ')}`, args.verbose, true);
      skippedCount++;
      results.push({
        countyName: record.county_name,
        stateCode: record.state_code,
        status: 'skipped',
        reason: assessment.issues.join(', '),
        confidenceScore: record.confidence_score,
      });
      continue;
    }

    const startTime = Date.now();

    try {
      // Build prompt
      const prompt = buildBinderPrompt(record);
      log(`${progress} Calling Claude API...`, args.verbose, true);

      // Call Claude API
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'user', content: prompt.userPrompt }
        ],
        system: prompt.systemPrompt,
      });

      // Extract content
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as { type: 'text'; text: string }).text)
        .join('\n');

      if (!content) {
        throw new Error('Empty response from Claude');
      }

      // Validate content
      const validation = validateBinderContent(content);
      const processingTimeMs = Date.now() - startTime;

      if (!validation.isValid) {
        log(`${progress} Quality validation failed: ${validation.errors.join(', ')}`, args.verbose);
        // Still save if not dry run, but flag it
      }

      if (!args.dryRun) {
        // Insert into database
        const sectionHeaders = extractSectionHeaders(content);

        const binderData = {
          location_name: record.county_name,
          location_type: 'county' as const,
          state_code: record.state_code,
          title: `${record.county_name} County, ${record.state_code} – Group Home Compliance Binder`,
          content: content,
          section_headers: sectionHeaders,
          metadata: {
            source: 'auto_generated',
            source_cache_id: record.id,
            confidence_score: record.confidence_score,
            generated_at: new Date().toISOString(),
            word_count: validation.wordCount,
            quality_validation: validation,
            processing_time_ms: processingTimeMs,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: insertedBinder, error: insertError } = await supabase
          .from('local_compliance_binders')
          .insert(binderData)
          .select('id')
          .single();

        if (insertError) {
          throw new Error(`Database insert failed: ${insertError.message}`);
        }

        log(`${progress} ✓ Saved binder ${insertedBinder.id} (${validation.wordCount} words, ${processingTimeMs}ms)`, args.verbose);

        results.push({
          countyName: record.county_name,
          stateCode: record.state_code,
          status: 'success',
          binderId: insertedBinder.id,
          wordCount: validation.wordCount,
          confidenceScore: record.confidence_score,
          processingTimeMs,
        });
      } else {
        log(`${progress} ✓ [DRY RUN] Would save binder (${validation.wordCount} words, ${processingTimeMs}ms)`, args.verbose);

        results.push({
          countyName: record.county_name,
          stateCode: record.state_code,
          status: 'success',
          wordCount: validation.wordCount,
          confidenceScore: record.confidence_score,
          processingTimeMs,
        });
      }

      successCount++;

      // Rate limiting
      if (i < finalRecords.length - 1) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }

    } catch (err) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      logError(`${progress} Failed: ${errorMessage}`);
      failedCount++;

      results.push({
        countyName: record.county_name,
        stateCode: record.state_code,
        status: 'failed',
        reason: errorMessage,
        confidenceScore: record.confidence_score,
        processingTimeMs,
      });

      // Continue with next record
      if (i < finalRecords.length - 1) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }
    }
  }

  // Summary
  const summary: BatchGenerationResult = {
    success: successCount,
    failed: failedCount,
    skipped: skippedCount,
    total: finalRecords.length,
    details: results,
    generatedAt: new Date().toISOString(),
    params: {
      stateCode: args.stateCode as any,
      minConfidence: args.minConfidence,
      dryRun: args.dryRun,
      batchLimit: args.limit,
    },
  };

  console.log('\n========================================');
  console.log('BATCH GENERATION COMPLETE');
  console.log('========================================');
  console.log(`Total processed: ${summary.total}`);
  console.log(`  ✓ Success: ${summary.success}`);
  console.log(`  ✗ Failed: ${summary.failed}`);
  console.log(`  ○ Skipped: ${summary.skipped}`);
  console.log('========================================\n');

  if (args.verbose && results.length > 0) {
    console.log('Detailed Results:');
    console.log('-----------------');
    for (const result of results) {
      const statusIcon = result.status === 'success' ? '✓' : result.status === 'failed' ? '✗' : '○';
      const details = result.status === 'success'
        ? `${result.wordCount} words`
        : result.reason || '';
      console.log(`${statusIcon} ${result.countyName}, ${result.stateCode} - ${details}`);
    }
    console.log('');
  }

  // Write results to file
  const resultsFile = `binder-generation-results-${Date.now()}.json`;
  const fs = await import('fs');
  fs.writeFileSync(resultsFile, JSON.stringify(summary, null, 2));
  log(`Results written to ${resultsFile}`, args.verbose);

  // Exit with error if any failures
  if (failedCount > 0) {
    process.exit(1);
  }
}

// Run main
main().catch(err => {
  logError(err instanceof Error ? err.message : 'Unknown error');
  process.exit(1);
});
