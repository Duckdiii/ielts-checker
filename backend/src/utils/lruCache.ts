interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export interface LruCacheOptions {
  maxSize?: number;
  ttlMs?: number; // Time to live in milliseconds
}

/**
 * Lightweight, zero-dependency in-memory LRU Cache with TTL support
 */
export class SimpleLruCache<K = string, V = any> {
  private map = new Map<K, CacheEntry<V>>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(options: LruCacheOptions = {}) {
    this.maxSize = options.maxSize || 500;
    this.ttlMs = options.ttlMs || 24 * 60 * 60 * 1000; // 24 hours default
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    // Refresh position for LRU (re-insert to make it most recently used)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, customTtlMs?: number): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // Evict oldest entry (the first item in Map iterator)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }

    const ttl = customTtlMs ?? this.ttlMs;
    this.map.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}
