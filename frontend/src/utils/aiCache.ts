export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  source: 'memory' | 'indexeddb' | 'firestore' | 'gemini';
}

const memoryCache = new Map<string, CacheEntry<any>>();

// Clean string to create valid cache key
export function generateCacheKey(prefix: string, rawInput: string): string {
  const sanitized = rawInput
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 80);
  return `${prefix}_${sanitized}`;
}

/**
 * Retrieve cached AI analysis:
 * 1. Memory cache (0ms)
 * 2. LocalStorage / IndexedDB (1ms)
 */
export async function getCachedAiResponse<T>(cacheKey: string): Promise<CacheEntry<T> | null> {
  // 1. In-Memory
  if (memoryCache.has(cacheKey)) {
    const entry = memoryCache.get(cacheKey)!;
    return { ...entry, source: 'memory' };
  }

  // 2. LocalStorage Cache (Fast Local fallback)
  try {
    const localRaw = localStorage.getItem(`ai_cache_${cacheKey}`);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      memoryCache.set(cacheKey, parsed);
      return { ...parsed, source: 'indexeddb' };
    }
  } catch (err) {
    // Ignore localStorage errors
  }

  return null;
}

/**
 * Save AI analysis to multi-tier local cache (Memory + LocalStorage)
 * Avoids consuming limited Firestore daily write quota.
 */
export async function saveCachedAiResponse<T>(cacheKey: string, payload: T): Promise<void> {
  const entry: CacheEntry<T> = {
    key: cacheKey,
    data: payload,
    timestamp: Date.now(),
    source: 'gemini',
  };

  // 1. Memory
  memoryCache.set(cacheKey, entry);

  // 2. Local Storage
  try {
    localStorage.setItem(`ai_cache_${cacheKey}`, JSON.stringify(entry));
  } catch (err) {
    // Quota reached, clean oldest
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('ai_cache_')) {
          localStorage.removeItem(k);
          break;
        }
      }
    } catch {}
  }
}
