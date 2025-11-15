// ============================================================================
// UPSTASH REDIS CACHE SERVICE
// ============================================================================
// Provides caching layer for:
// - AI responses (5 min TTL)
// - User context (1 hour TTL)
// - Embeddings (1 hour TTL)
// ============================================================================

interface CacheConfig {
  url: string;
  token: string;
}

class CacheService {
  private config: CacheConfig;

  constructor() {
    const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
    const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
    }

    this.config = { url, token };
  }

  /**
   * Get cached value by key
   */
  async get(key: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.config.url}/get/${key}`, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) {
        console.error('[Cache] GET failed:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('[Cache] GET error:', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL (in seconds)
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.url}/setex/${key}/${ttlSeconds}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
        body: value,
      });

      if (!response.ok) {
        console.error('[Cache] SET failed:', response.status, response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Cache] SET error:', error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.url}/del/${key}`, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('[Cache] DELETE error:', error);
      return false;
    }
  }

  /**
   * Delete all keys matching pattern (e.g., "nette:user123:*")
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      // Get all keys matching pattern
      const scanResponse = await fetch(`${this.config.url}/scan/0/match/${pattern}/count/1000`, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
      });

      if (!scanResponse.ok) {
        console.error('[Cache] SCAN failed:', scanResponse.status);
        return 0;
      }

      const scanData = await scanResponse.json();
      const keys = scanData.result[1] as string[];

      if (!keys || keys.length === 0) {
        return 0;
      }

      // Delete all keys in pipeline
      const pipeline = keys.map(key => ['DEL', key]);
      
      const pipelineResponse = await fetch(`${this.config.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pipeline),
      });

      if (!pipelineResponse.ok) {
        console.error('[Cache] PIPELINE DELETE failed:', pipelineResponse.status);
        return 0;
      }

      return keys.length;
    } catch (error) {
      console.error('[Cache] DELETE PATTERN error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.url}/exists/${key}`, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.result === 1;
    } catch (error) {
      console.error('[Cache] EXISTS error:', error);
      return false;
    }
  }

  /**
   * Get TTL for key (in seconds, -1 if no expiry, -2 if doesn't exist)
   */
  async ttl(key: string): Promise<number> {
    try {
      const response = await fetch(`${this.config.url}/ttl/${key}`, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) return -2;

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('[Cache] TTL error:', error);
      return -2;
    }
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

export function getCache(): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService();
  }
  return cacheInstance;
}

// Cache key builders
export const CacheKeys = {
  // Nette AI cache keys
  netteResponse: (userId: string, week: number, msgHash: string) => 
    `nette:${userId}:w${week}:${msgHash}`,
  netteUserContext: (userId: string) => 
    `nette:context:${userId}`,
  
  // MIO AI cache keys
  mioResponse: (userId: string, practiceId: string) => 
    `mio:${userId}:practice:${practiceId}`,
  mioUserContext: (userId: string) => 
    `mio:context:${userId}`,
  
  // ME AI cache keys
  meResponse: (userId: string, financingType: string, msgHash: string) => 
    `me:${userId}:${financingType}:${msgHash}`,
  meUserContext: (userId: string) => 
    `me:context:${userId}`,
  
  // Shared embedding cache
  embedding: (textHash: string) => 
    `emb:${textHash}`,
};

// Cache TTLs (in seconds)
export const CacheTTL = {
  RESPONSE_SHORT: 300,      // 5 minutes (chat responses)
  RESPONSE_MEDIUM: 1800,    // 30 minutes (practice feedback)
  RESPONSE_LONG: 3600,      // 1 hour (financing analysis)
  USER_CONTEXT: 3600,       // 1 hour
  EMBEDDING: 86400,         // 24 hours
};

// Helper to generate message hash
export function hashMessage(message: string): string {
  // Simple hash for cache keys (not cryptographic)
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
