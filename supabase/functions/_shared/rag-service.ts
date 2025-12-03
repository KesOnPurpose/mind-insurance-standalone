// ============================================================================
// RAG SERVICE - HYBRID SEARCH WITH RECIPROCAL RANK FUSION (RRF)
// ============================================================================
// Combines semantic search (vector embeddings) with keyword search (FTS)
// Uses Reciprocal Rank Fusion to merge and re-rank results
// ============================================================================

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateEmbedding } from './embedding-service.ts';
import { expandForFTS, expandSearchTerms, POPULATION_SYNONYMS, BUSINESS_SYNONYMS, BEHAVIORAL_SYNONYMS } from './searchSynonyms.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface KnowledgeChunk {
  id: string;
  chunk_text: string;
  chunk_summary?: string;
  source_file: string;
  category: string;
  subcategory?: string;
  tokens_approx: number;
  priority_level: number;
  
  // Nette-specific
  week_number?: number;
  tactic_id?: string;
  tactic_category?: string;
  applicable_states?: string[];
  target_demographics?: string[];
  
  // ME-specific
  financing_type?: string;
  capital_range?: string;
  
  // MIO-specific
  applicable_practice_types?: string[];
  applicable_patterns?: string[];
  
  // Search metadata
  similarity_score?: number;
  fts_rank?: number;
  combined_score?: number;
}

export interface SearchFilters {
  // Nette filters
  week_number?: number;
  tactic_category?: string;
  target_state?: string;
  target_demographic?: string;
  
  // ME filters
  financing_type?: string;
  capital_range?: string;
  
  // MIO filters
  practice_type?: string;
  pattern?: string;
  
  // Universal filters
  category?: string;
  min_priority?: number;
}

export type AgentType = 'nette' | 'mio' | 'me';

/**
 * Perform hybrid search (vector + FTS) with RRF ranking
 */
export async function hybridSearch(
  query: string,
  agent: AgentType,
  filters: SearchFilters = {},
  matchCount: number = 5
): Promise<KnowledgeChunk[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Determine table based on agent
  const tableName = agent === 'nette' ? 'nette_knowledge_chunks'
                  : agent === 'me' ? 'me_knowledge_chunks'
                  : 'mio_knowledge_chunks';

  console.log(`[RAG] Searching ${tableName} with filters:`, filters);

  // Expand query with synonyms based on agent type
  // Nette uses population + business synonyms
  // MIO uses behavioral synonyms
  const synonymDict = agent === 'mio'
    ? BEHAVIORAL_SYNONYMS
    : { ...POPULATION_SYNONYMS, ...BUSINESS_SYNONYMS };

  const expandedQuery = expandForFTS(query, synonymDict);
  const expandedTerms = expandSearchTerms(query, synonymDict);

  console.log(`[RAG] Query expanded: "${query}" -> ${expandedTerms.length} terms`);
  if (expandedTerms.length > 1) {
    console.log(`[RAG] Expanded terms: ${expandedTerms.slice(0, 5).join(', ')}${expandedTerms.length > 5 ? '...' : ''}`);
  }

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Perform vector search (uses original query for semantic matching)
  const vectorResults = await vectorSearch(
    supabase,
    tableName,
    queryEmbedding,
    filters,
    matchCount * 2 // Get more candidates for RRF
  );

  // Perform FTS search with expanded synonyms
  const ftsResults = await fullTextSearch(
    supabase,
    tableName,
    expandedQuery, // Use synonym-expanded query for FTS
    filters,
    matchCount * 2 // Get more candidates for RRF
  );

  // Apply Reciprocal Rank Fusion
  const fusedResults = reciprocalRankFusion(
    vectorResults,
    ftsResults,
    matchCount
  );

  console.log(`[RAG] Found ${fusedResults.length} results using RRF`);

  return fusedResults;
}

/**
 * Vector similarity search using cosine distance
 */
async function vectorSearch(
  supabase: SupabaseClient,
  tableName: string,
  queryEmbedding: number[],
  filters: SearchFilters,
  limit: number
): Promise<KnowledgeChunk[]> {
  let query = supabase
    .from(tableName)
    .select('*')
    .is('is_active', true);

  // Apply filters
  query = applyFilters(query, filters);

  // Note: We need to use rpc for vector similarity search with proper indexing
  // For now, fetch all and calculate similarity in-memory
  const { data, error } = await query.limit(100);

  if (error) {
    console.error('[RAG] Vector search error:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Calculate similarity scores
  const results = data
    .map((chunk: any) => {
      if (!chunk.embedding) return null;

      // Parse embedding (stored as text array)
      const embedding = JSON.parse(chunk.embedding);
      
      // Calculate cosine similarity
      const similarity = cosineSimilarity(queryEmbedding, embedding);

      return {
        ...chunk,
        similarity_score: similarity,
      };
    })
    .filter((r): r is KnowledgeChunk => r !== null)
    .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
    .slice(0, limit);

  console.log('[RAG] Vector search results:', results.length);

  return results;
}

/**
 * Full-text search using PostgreSQL FTS
 */
async function fullTextSearch(
  supabase: SupabaseClient,
  tableName: string,
  query: string,
  filters: SearchFilters,
  limit: number
): Promise<KnowledgeChunk[]> {
  let dbQuery = supabase
    .from(tableName)
    .select('*')
    .is('is_active', true)
    .textSearch('fts', query, {
      type: 'websearch',
      config: 'english',
    });

  // Apply filters
  dbQuery = applyFilters(dbQuery, filters);

  const { data, error } = await dbQuery.limit(limit);

  if (error) {
    console.error('[RAG] FTS search error:', error);
    throw error;
  }

  if (!data) {
    return [];
  }

  // Add FTS rank (position in results)
  const results = data.map((chunk: any, index: number) => ({
    ...chunk,
    fts_rank: index + 1,
  }));

  console.log('[RAG] FTS results:', results.length);

  return results;
}

/**
 * Apply search filters to query
 */
function applyFilters(query: any, filters: SearchFilters): any {
  // Nette filters
  if (filters.week_number) {
    query = query.eq('week_number', filters.week_number);
  }
  if (filters.tactic_category) {
    query = query.eq('tactic_category', filters.tactic_category);
  }
  if (filters.target_state) {
    query = query.contains('applicable_states', [filters.target_state]);
  }
  if (filters.target_demographic) {
    query = query.contains('target_demographics', [filters.target_demographic]);
  }

  // ME filters
  if (filters.financing_type) {
    query = query.eq('financing_type', filters.financing_type);
  }
  if (filters.capital_range) {
    query = query.eq('capital_range', filters.capital_range);
  }

  // MIO filters
  if (filters.practice_type) {
    query = query.contains('applicable_practice_types', [filters.practice_type]);
  }
  if (filters.pattern) {
    query = query.contains('applicable_patterns', [filters.pattern]);
  }

  // Universal filters
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.min_priority) {
    query = query.lte('priority_level', filters.min_priority);
  }

  return query;
}

/**
 * Reciprocal Rank Fusion (RRF) algorithm
 * Combines rankings from multiple sources with a constant k (default 60)
 */
function reciprocalRankFusion(
  vectorResults: KnowledgeChunk[],
  ftsResults: KnowledgeChunk[],
  topK: number,
  k: number = 60
): KnowledgeChunk[] {
  const scoreMap = new Map<string, { chunk: KnowledgeChunk; score: number }>();

  // Process vector results
  vectorResults.forEach((chunk, rank) => {
    const id = chunk.id;
    const score = 1 / (k + rank + 1);
    
    if (scoreMap.has(id)) {
      scoreMap.get(id)!.score += score;
    } else {
      scoreMap.set(id, { chunk, score });
    }
  });

  // Process FTS results
  ftsResults.forEach((chunk, rank) => {
    const id = chunk.id;
    const score = 1 / (k + rank + 1);
    
    if (scoreMap.has(id)) {
      scoreMap.get(id)!.score += score;
    } else {
      scoreMap.set(id, { chunk, score });
    }
  });

  // Sort by combined score and take top K
  const fusedResults = Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ chunk, score }) => ({
      ...chunk,
      combined_score: score,
    }));

  return fusedResults;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Format search results for AI context
 */
export function formatContextChunks(chunks: KnowledgeChunk[]): string {
  return chunks
    .map((chunk, index) => {
      let context = `[Source ${index + 1}]\n`;
      context += `File: ${chunk.source_file}\n`;
      context += `Category: ${chunk.category}`;
      
      if (chunk.subcategory) {
        context += ` → ${chunk.subcategory}`;
      }
      
      if (chunk.tactic_id) {
        context += ` (${chunk.tactic_id})`;
      }
      
      context += `\n\n${chunk.chunk_text}\n`;
      
      if (chunk.combined_score) {
        context += `\n(Relevance: ${(chunk.combined_score * 100).toFixed(1)}%)\n`;
      }
      
      return context;
    })
    .join('\n---\n\n');
}
