/**
 * Binder Generation Service
 * Purpose: Transform county_compliance_cache records into local_compliance_binders
 * Uses Claude API to generate prose content from structured data
 */

import { supabase } from '@/integrations/supabase/client';
import type { StateCode, LocalBinder, BinderSectionHeader } from '@/types/compliance';
import type { CountyComplianceCache } from '@/types/countyCompliance';
import type {
  GenerateBindersFromCacheParams,
  GenerateSingleBinderParams,
  BatchGenerationResult,
  GenerationResultDetail,
  SingleGenerationResult,
  CacheRecordSummary,
  BinderPreviewData,
  BinderQualityValidation,
} from '@/types/binderGeneration';
import { BINDER_QUALITY_THRESHOLDS, STANDARD_BINDER_SECTIONS } from '@/types/binderGeneration';
import {
  buildBinderPrompt,
  assessCacheRecord,
  countWords,
  extractSectionHeaders,
  validateBinderContent,
  getStateName,
} from '@/utils/binderPromptBuilder';
import { STATE_NAMES } from '@/types/compliance';

// ============================================================================
// CONSTANTS
// ============================================================================

// Edge Function is used for Claude API calls (server-side to avoid CORS)

// ============================================================================
// CACHE RECORD QUERIES
// ============================================================================

/**
 * Get all cache records with optional filtering
 */
export async function getCacheRecords(params?: {
  stateCode?: StateCode;
  minConfidence?: number;
  limit?: number;
}): Promise<CountyComplianceCache[]> {
  let query = supabase
    .from('county_compliance_cache')
    .select('*')
    .order('state_code')
    .order('county_name');

  if (params?.stateCode) {
    query = query.eq('state_code', params.stateCode);
  }

  if (params?.minConfidence) {
    query = query.gte('confidence_score', params.minConfidence);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[BinderGeneration] Error fetching cache records:', error);
    throw error;
  }

  return (data || []) as CountyComplianceCache[];
}

/**
 * Get a single cache record by county name and state
 */
export async function getCacheRecord(
  countyName: string,
  stateCode: StateCode
): Promise<CountyComplianceCache | null> {
  const { data, error } = await supabase
    .from('county_compliance_cache')
    .select('*')
    .eq('county_name', countyName)
    .eq('state_code', stateCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[BinderGeneration] Error fetching cache record:', error);
    throw error;
  }

  return data as CountyComplianceCache;
}

/**
 * Get cache records summary for admin UI
 */
export async function getCacheRecordsSummary(
  stateCode?: StateCode
): Promise<CacheRecordSummary[]> {
  console.log('[BinderGeneration] Fetching cache summaries, stateCode:', stateCode);

  let query = supabase
    .from('county_compliance_cache')
    .select('id, county_name, state_code, confidence_score, compliance_status, data_source, updated_at')
    .order('state_code')
    .order('county_name');

  if (stateCode) {
    query = query.eq('state_code', stateCode);
  }

  const { data: cacheData, error: cacheError } = await query;

  console.log('[BinderGeneration] Cache query result:', {
    dataLength: cacheData?.length || 0,
    error: cacheError,
    firstRow: cacheData?.[0],
  });

  if (cacheError) {
    console.error('[BinderGeneration] Error fetching cache summaries:', cacheError);
    throw cacheError;
  }

  // Get existing binders to mark which counties already have binders
  const { data: bindersData, error: bindersError } = await supabase
    .from('local_compliance_binders')
    .select('location_name, state_code');

  if (bindersError) {
    console.error('[BinderGeneration] Error fetching existing binders:', bindersError);
  }

  const existingBinders = new Set(
    (bindersData || []).map((b: { location_name: string; state_code: string }) =>
      `${b.location_name}:${b.state_code}`
    )
  );

  return (cacheData || []).map((record: {
    id: string;
    county_name: string;
    state_code: string;
    confidence_score: number | null;
    compliance_status: string | null;
    data_source: string;
    updated_at: string;
  }) => {
    const binderKey = `${record.county_name} County:${record.state_code}`;
    const assessment = { qualityScore: 0, isSuitable: false };

    // Calculate quality score based on confidence
    if (record.confidence_score !== null) {
      assessment.qualityScore = record.confidence_score;
      assessment.isSuitable = record.confidence_score >= BINDER_QUALITY_THRESHOLDS.MIN_CONFIDENCE_SCORE;
    }

    return {
      id: record.id,
      countyName: record.county_name,
      stateCode: record.state_code as StateCode,
      stateName: STATE_NAMES[record.state_code as StateCode] || record.state_code,
      confidenceScore: record.confidence_score,
      complianceStatus: record.compliance_status as CountyComplianceCache['compliance_status'],
      dataSource: record.data_source,
      hasBinder: existingBinders.has(binderKey),
      lastUpdated: record.updated_at,
      qualityScore: assessment.qualityScore,
      isSuitable: assessment.isSuitable,
    };
  });
}

/**
 * Get cache statistics by state
 */
export async function getCacheStatsByState(): Promise<{
  stateCode: StateCode;
  stateName: string;
  totalRecords: number;
  suitableRecords: number;
  existingBinders: number;
  avgConfidence: number;
}[]> {
  const { data: cacheData, error: cacheError } = await supabase
    .from('county_compliance_cache')
    .select('state_code, confidence_score');

  if (cacheError) {
    console.error('[BinderGeneration] Error fetching cache stats:', cacheError);
    throw cacheError;
  }

  const { data: bindersData, error: bindersError } = await supabase
    .from('local_compliance_binders')
    .select('state_code');

  if (bindersError) {
    console.error('[BinderGeneration] Error fetching binder stats:', bindersError);
  }

  // Aggregate by state
  const stateStats: Record<string, {
    total: number;
    suitable: number;
    confidenceSum: number;
    confidenceCount: number;
  }> = {};

  const binderCounts: Record<string, number> = {};
  for (const binder of (bindersData || [])) {
    const sc = (binder as { state_code: string }).state_code;
    binderCounts[sc] = (binderCounts[sc] || 0) + 1;
  }

  for (const record of (cacheData || [])) {
    const r = record as { state_code: string; confidence_score: number | null };
    if (!stateStats[r.state_code]) {
      stateStats[r.state_code] = { total: 0, suitable: 0, confidenceSum: 0, confidenceCount: 0 };
    }
    stateStats[r.state_code].total++;
    if (r.confidence_score !== null) {
      stateStats[r.state_code].confidenceSum += r.confidence_score;
      stateStats[r.state_code].confidenceCount++;
      if (r.confidence_score >= BINDER_QUALITY_THRESHOLDS.MIN_CONFIDENCE_SCORE) {
        stateStats[r.state_code].suitable++;
      }
    }
  }

  return Object.entries(stateStats).map(([stateCode, stats]) => ({
    stateCode: stateCode as StateCode,
    stateName: STATE_NAMES[stateCode as StateCode] || stateCode,
    totalRecords: stats.total,
    suitableRecords: stats.suitable,
    existingBinders: binderCounts[stateCode] || 0,
    avgConfidence: stats.confidenceCount > 0
      ? Math.round(stats.confidenceSum / stats.confidenceCount)
      : 0,
  })).sort((a, b) => a.stateName.localeCompare(b.stateName));
}

// ============================================================================
// BINDER GENERATION
// ============================================================================

/**
 * Generate a binder from a cache record using Edge Function (server-side Claude API)
 * Uses the generate-binder Edge Function to avoid CORS issues
 */
export async function generateBinderContent(
  cacheRecord: CountyComplianceCache
): Promise<{ content: string; wordCount: number }> {
  const { data, error } = await supabase.functions.invoke('generate-binder', {
    body: { cacheRecord },
  });

  if (error) {
    throw new Error(`Edge Function error: ${error.message}`);
  }

  if (!data || !data.content) {
    throw new Error('Edge Function returned empty content');
  }

  return { content: data.content, wordCount: data.wordCount };
}

/**
 * Validate generated binder quality
 */
export function validateGeneratedBinder(content: string): BinderQualityValidation {
  const validation = validateBinderContent(content);
  const headers = extractSectionHeaders(content);

  // Check for all required sections
  const mainSections = headers.filter(h => h.level === 2);
  const subSections = headers.filter(h => h.level === 3);

  const allSectionsPresent = mainSections.length >= BINDER_QUALITY_THRESHOLDS.REQUIRED_MAIN_SECTIONS;
  const allSubsectionsPresent = subSections.length >= BINDER_QUALITY_THRESHOLDS.REQUIRED_SUBSECTIONS;

  // Check for placeholder text
  const placeholderPatterns = [
    /\[TODO\]/gi,
    /\[PLACEHOLDER\]/gi,
    /\[INSERT\]/gi,
    /\[ADD\s+HERE\]/gi,
    /\[YOUR\s+/gi,
  ];

  const placeholderTextFound: string[] = [];
  for (const pattern of placeholderPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      placeholderTextFound.push(...matches);
    }
  }

  // Check for legal citations
  const hasLegalCitations = /\d+\s*(Pa\.|N\.J\.|NYCRR|USC|CFR|Code|§)/i.test(content);

  // Check for municipal code URL
  const hasMunicipalCodeUrl = /https?:\/\/[^\s]+\.(gov|us|municode|ecode)/i.test(content);

  const missingSections: string[] = [];
  if (!allSectionsPresent) {
    missingSections.push(`Missing ${BINDER_QUALITY_THRESHOLDS.REQUIRED_MAIN_SECTIONS - mainSections.length} main sections`);
  }
  if (!allSubsectionsPresent) {
    missingSections.push(`Missing ${BINDER_QUALITY_THRESHOLDS.REQUIRED_SUBSECTIONS - subSections.length} subsections`);
  }

  return {
    isValid: validation.isValid && allSectionsPresent && allSubsectionsPresent && placeholderTextFound.length === 0,
    wordCount: validation.wordCount,
    minWordCountMet: validation.wordCount >= BINDER_QUALITY_THRESHOLDS.MIN_WORD_COUNT,
    allSectionsPresent,
    allSubsectionsPresent,
    missingSections,
    hasPlaceholderText: placeholderTextFound.length > 0,
    placeholderTextFound,
    hasLegalCitations,
    hasMunicipalCodeUrl,
    warnings: validation.warnings,
    errors: validation.issues,
  };
}

/**
 * Generate a single binder from a cache record
 */
export async function generateSingleBinder(
  params: GenerateSingleBinderParams
): Promise<SingleGenerationResult> {
  const { cacheRecord, dryRun = false, forceRegenerate = false } = params;
  const startTime = Date.now();

  try {
    // Check if binder already exists
    if (!forceRegenerate) {
      const { data: existingBinder } = await supabase
        .from('local_compliance_binders')
        .select('id')
        .eq('location_name', `${cacheRecord.county_name} County`)
        .eq('state_code', cacheRecord.state_code)
        .single();

      if (existingBinder) {
        return {
          success: false,
          error: 'Binder already exists. Use forceRegenerate=true to overwrite.',
          cacheRecordId: cacheRecord.id,
          processingTimeMs: Date.now() - startTime,
        };
      }
    }

    // Assess cache record suitability
    const assessment = assessCacheRecord(cacheRecord);
    if (!assessment.isSuitable) {
      return {
        success: false,
        error: `Cache record not suitable: ${assessment.issues.join(', ')}`,
        cacheRecordId: cacheRecord.id,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Generate content
    const { content, wordCount } = await generateBinderContent(cacheRecord);

    // Validate generated content
    const validation = validateGeneratedBinder(content);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Generated content failed validation: ${validation.errors.join(', ')}`,
        cacheRecordId: cacheRecord.id,
        wordCount,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Build binder object
    const sectionHeaders: BinderSectionHeader[] = extractSectionHeaders(content).map(h => ({
      id: h.id,
      title: h.title,
      level: h.level as 2 | 3,
    }));

    const locationName = `${cacheRecord.county_name} County`;
    const title = `Compliance Binder: Independent Shared Housing, ${locationName}, ${getStateName(cacheRecord.state_code)}`;

    const binderData = {
      location_name: locationName,
      location_type: 'county' as const,
      state_code: cacheRecord.state_code,
      title,
      content,
      word_count: wordCount,
      section_headers: sectionHeaders,
      metadata: {
        source: 'auto_generated',
        source_cache_id: cacheRecord.id,
        confidence_score: cacheRecord.confidence_score,
        generated_at: new Date().toISOString(),
        version: '1.0',
      },
    };

    if (dryRun) {
      return {
        success: true,
        binder: {
          id: 'dry-run-preview',
          ...binderData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as LocalBinder,
        cacheRecordId: cacheRecord.id,
        wordCount,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Insert into database
    const { data: insertedBinder, error: insertError } = await supabase
      .from('local_compliance_binders')
      .upsert(binderData, { onConflict: 'location_name,state_code' })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return {
      success: true,
      binder: insertedBinder as LocalBinder,
      cacheRecordId: cacheRecord.id,
      wordCount,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[BinderGeneration] Error generating binder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cacheRecordId: cacheRecord.id,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Batch generate binders from cache records
 */
export async function batchGenerateBinders(
  params: GenerateBindersFromCacheParams
): Promise<BatchGenerationResult> {
  const {
    stateCode,
    minConfidence = BINDER_QUALITY_THRESHOLDS.MIN_CONFIDENCE_SCORE,
    dryRun = false,
    batchLimit = 50,
    countyNames,
  } = params;

  const results: GenerationResultDetail[] = [];
  let success = 0;
  let failed = 0;
  let skipped = 0;

  // Fetch cache records
  let query = supabase
    .from('county_compliance_cache')
    .select('*')
    .gte('confidence_score', minConfidence)
    .order('confidence_score', { ascending: false })
    .limit(batchLimit);

  if (stateCode) {
    query = query.eq('state_code', stateCode);
  }

  if (countyNames && countyNames.length > 0) {
    query = query.in('county_name', countyNames);
  }

  const { data: cacheRecords, error: fetchError } = await query;

  if (fetchError) {
    throw fetchError;
  }

  const records = (cacheRecords || []) as CountyComplianceCache[];
  const total = records.length;

  // Process each record
  for (const record of records) {
    const startTime = Date.now();

    try {
      // Check if binder already exists
      const { data: existingBinder } = await supabase
        .from('local_compliance_binders')
        .select('id')
        .eq('location_name', `${record.county_name} County`)
        .eq('state_code', record.state_code)
        .single();

      if (existingBinder) {
        skipped++;
        results.push({
          countyName: record.county_name,
          stateCode: record.state_code as StateCode,
          status: 'skipped',
          reason: 'Binder already exists',
          confidenceScore: record.confidence_score ?? undefined,
          processingTimeMs: Date.now() - startTime,
        });
        continue;
      }

      // Generate binder
      const result = await generateSingleBinder({
        cacheRecord: record,
        dryRun,
        forceRegenerate: false,
      });

      if (result.success) {
        success++;
        results.push({
          countyName: record.county_name,
          stateCode: record.state_code as StateCode,
          status: 'success',
          binderId: result.binder?.id,
          wordCount: result.wordCount,
          confidenceScore: record.confidence_score ?? undefined,
          processingTimeMs: result.processingTimeMs,
        });
      } else {
        failed++;
        results.push({
          countyName: record.county_name,
          stateCode: record.state_code as StateCode,
          status: 'failed',
          reason: result.error,
          confidenceScore: record.confidence_score ?? undefined,
          processingTimeMs: result.processingTimeMs,
        });
      }

      // Rate limiting: wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      failed++;
      results.push({
        countyName: record.county_name,
        stateCode: record.state_code as StateCode,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error',
        confidenceScore: record.confidence_score ?? undefined,
        processingTimeMs: Date.now() - startTime,
      });
    }
  }

  return {
    success,
    failed,
    skipped,
    total,
    details: results,
    generatedAt: new Date().toISOString(),
    params: { stateCode, minConfidence, dryRun, batchLimit, countyNames },
  };
}

/**
 * Generate a preview of a binder without saving
 */
export async function generateBinderPreview(
  cacheRecordId: string
): Promise<BinderPreviewData | null> {
  const { data: cacheRecord, error } = await supabase
    .from('county_compliance_cache')
    .select('*')
    .eq('id', cacheRecordId)
    .single();

  if (error || !cacheRecord) {
    console.error('[BinderGeneration] Error fetching cache record for preview:', error);
    return null;
  }

  const record = cacheRecord as CountyComplianceCache;
  const { content, wordCount } = await generateBinderContent(record);
  const sectionHeaders = extractSectionHeaders(content).map(h => ({
    id: h.id,
    title: h.title,
    level: h.level as 2 | 3,
  }));
  const qualityValidation = validateGeneratedBinder(content);

  return {
    locationName: `${record.county_name} County`,
    locationType: 'county',
    stateCode: record.state_code as StateCode,
    title: `Compliance Binder: Independent Shared Housing, ${record.county_name} County, ${getStateName(record.state_code)}`,
    content,
    wordCount,
    sectionHeaders,
    sourceRecord: record,
    qualityValidation,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Cache queries
  getCacheRecords,
  getCacheRecord,
  getCacheRecordsSummary,
  getCacheStatsByState,
  // Generation
  generateBinderContent,
  generateSingleBinder,
  batchGenerateBinders,
  generateBinderPreview,
  // Validation
  validateGeneratedBinder,
};
