import { LRUCache } from 'lru-cache';

// Simple token bucket per key (e.g., per shop or site)
export function createRateLimiter({ tokensPerInterval, intervalMs }: { tokensPerInterval: number; intervalMs: number; }) {
  const cache = new LRUCache<string, { tokens: number; lastRefill: number }>({ max: 1000, ttl: intervalMs * 10 });

  return function allow(key: string): boolean {
    const now = Date.now();
    const entry = cache.get(key) || { tokens: tokensPerInterval, lastRefill: now };
    const elapsed = now - entry.lastRefill;
    if (elapsed >= intervalMs) {
      const refillUnits = Math.floor(elapsed / intervalMs);
      entry.tokens = Math.min(tokensPerInterval, entry.tokens + refillUnits * tokensPerInterval);
      entry.lastRefill = now;
    }
    if (entry.tokens > 0) {
      entry.tokens -= 1;
      cache.set(key, entry);
      return true;
    }
    cache.set(key, entry);
    return false;
  };
}
