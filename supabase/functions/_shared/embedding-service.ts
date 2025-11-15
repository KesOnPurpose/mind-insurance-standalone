// ============================================================================
// OPENAI EMBEDDING SERVICE
// ============================================================================
// Generates embeddings using OpenAI text-embedding-3-small model
// Includes Upstash caching (24 hour TTL) to reduce API costs
// ============================================================================

import { getCache, CacheKeys, CacheTTL, hashMessage } from './cache-service.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate embedding for text using OpenAI API
 * Cached for 24 hours to reduce costs
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Check cache first
  const cache = getCache();
  const cacheKey = CacheKeys.embedding(hashMessage(text));
  
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('[Embedding] Cache hit');
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('[Embedding] Cache read error:', error);
    // Continue to generate fresh embedding
  }

  // Generate fresh embedding
  console.log('[Embedding] Generating fresh embedding');
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Embedding] OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI embedding failed: ${response.status} ${errorText}`);
  }

  const data: EmbeddingResponse = await response.json();
  const embedding = data.data[0].embedding;

  // Cache the embedding
  try {
    await cache.set(cacheKey, JSON.stringify(embedding), CacheTTL.EMBEDDING);
  } catch (error) {
    console.error('[Embedding] Cache write error:', error);
    // Don't fail if caching fails
  }

  console.log('[Embedding] Generated and cached:', {
    tokens: data.usage.total_tokens,
    dimensions: embedding.length,
  });

  return embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding() multiple times
 */
export async function generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (texts.length === 0) {
    return [];
  }

  // Check cache for each text
  const cache = getCache();
  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  const uncachedIndices: number[] = [];

  for (let i = 0; i < texts.length; i++) {
    const cacheKey = CacheKeys.embedding(hashMessage(texts[i]));
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        results[i] = JSON.parse(cached);
      } else {
        uncachedIndices.push(i);
      }
    } catch (error) {
      console.error('[Embedding Batch] Cache read error for index', i, error);
      uncachedIndices.push(i);
    }
  }

  console.log('[Embedding Batch] Cache hits:', results.filter(r => r !== null).length);
  console.log('[Embedding Batch] Cache misses:', uncachedIndices.length);

  // Generate embeddings for uncached texts
  if (uncachedIndices.length > 0) {
    const uncachedTexts = uncachedIndices.map(i => texts[i]);

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: uncachedTexts,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Embedding Batch] OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI embedding batch failed: ${response.status}`);
    }

    const data: EmbeddingResponse = await response.json();

    // Fill results and cache
    for (let i = 0; i < uncachedIndices.length; i++) {
      const originalIndex = uncachedIndices[i];
      const embedding = data.data[i].embedding;
      results[originalIndex] = embedding;

      // Cache this embedding
      const cacheKey = CacheKeys.embedding(hashMessage(texts[originalIndex]));
      try {
        await cache.set(cacheKey, JSON.stringify(embedding), CacheTTL.EMBEDDING);
      } catch (error) {
        console.error('[Embedding Batch] Cache write error for index', i, error);
      }
    }

    console.log('[Embedding Batch] Generated:', {
      count: uncachedIndices.length,
      tokens: data.usage.total_tokens,
    });
  }

  return results as number[][];
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensions');
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
