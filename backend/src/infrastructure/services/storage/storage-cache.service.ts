/**
 * Storage Cache Service
 * 
 * Caches storage calculations to reduce database queries.
 * Storage calculations are expensive (aggregate queries) and
 * don't need to be recalculated on every request.
 */

export interface StorageCacheEntry {
  storageUsed: bigint;
  timestamp: number; // Unix timestamp
}

export class StorageCacheService {
  private cache: Map<string, StorageCacheEntry> = new Map();
  private readonly defaultTtlSeconds: number;

  constructor(defaultTtlSeconds: number = 60) {
    // Default: 60 seconds cache (storage changes are infrequent)
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  /**
   * Get cached storage value if available and not expired
   */
  get(userId: string): bigint | null {
    const cached = this.cache.get(userId);
    if (!cached) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now > cached.timestamp + this.defaultTtlSeconds * 1000) {
      this.cache.delete(userId);
      return null;
    }

    return cached.storageUsed;
  }

  /**
   * Set storage value in cache
   */
  set(userId: string, storageUsed: bigint): void {
    this.cache.set(userId, {
      storageUsed,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache for a user (call after storage changes)
   */
  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [userId, entry] of this.cache.entries()) {
      if (now > entry.timestamp + this.defaultTtlSeconds * 1000) {
        this.cache.delete(userId);
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
   * Start periodic cleanup
   */
  startCleanup(intervalSeconds: number = 300): ReturnType<typeof setInterval> {
    return setInterval(() => {
      this.clearExpired();
    }, intervalSeconds * 1000);
  }
}


