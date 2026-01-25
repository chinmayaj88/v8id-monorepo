/**
 * URL Cache Service
 * 
 * In-memory cache for presigned URLs to reduce OCI API calls and latency.
 * Uses simple Map-based cache with TTL support.
 * 
 * For production scale, consider Redis-based cache.
 */

export interface CachedUrl {
  url: string;
  expiresAt: number; // Unix timestamp
}

export class UrlCacheService {
  private cache: Map<string, CachedUrl> = new Map();
  private readonly defaultTtlSeconds: number;

  constructor(defaultTtlSeconds: number = 600) {
    // Default: 10 minutes for file URLs, can be overridden
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  /**
   * Get cached URL if available and not expired
   */
  get(key: string): string | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.url;
  }

  /**
   * Set URL in cache with TTL
   */
  set(key: string, url: string, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const expiresAt = Date.now() + ttl * 1000;

    this.cache.set(key, {
      url,
      expiresAt,
    });
  }

  /**
   * Delete cached URL
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear expired entries (cleanup)
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (for monitoring)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  startCleanup(intervalSeconds: number = 300): ReturnType<typeof setInterval> {
    return setInterval(() => {
      this.clearExpired();
    }, intervalSeconds * 1000);
  }
}


