const CACHE_PREFIX = 'apicache:';
const DEFAULT_TTL = 5 * 60 * 1000;

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key: string, val: string) {
  try { localStorage.setItem(key, val) } catch {}
}
function safeRemove(key: string) {
  try { localStorage.removeItem(key) } catch {}
}

interface CacheEntry {
  data: unknown;
  expiry: number;
}

export function getCachedResponse(url: string): { data: unknown } | null {
  const raw = safeGet(CACHE_PREFIX + url);
  if (!raw) return null;
  try {
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() < entry.expiry) return { data: entry.data };
    safeRemove(CACHE_PREFIX + url);
  } catch {}
  return null;
}

export function setCachedResponse(url: string, data: unknown, ttl = DEFAULT_TTL) {
  const entry: CacheEntry = { data, expiry: Date.now() + ttl };
  safeSet(CACHE_PREFIX + url, JSON.stringify(entry));
}

export function clearAllCachedResponses() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
    }
    keys.forEach(k => safeRemove(k));
  } catch {}
}

export function invalidateCachedResponse(urlPrefix: string) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX + urlPrefix)) safeRemove(key);
    }
  } catch {}
}
