/** Simple localStorage cache — silently no-ops if storage is unavailable */

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // storage full or unavailable — fail silently
  }
}

export function clearCache(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/* ── Timestamped cache (stale-while-revalidate) ── */

interface CacheEnvelope<T> { data: T; ts: number }

/** How long cached data is considered "fresh" (skip background refetch) */
export const CACHE_FRESH_MS = 30_000 // 30 seconds

/** Read cache with timestamp. Handles legacy format (no ts) by returning ts: 0 */
export function readCacheT<T>(key: string): { data: T; ts: number } | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Envelope format: { data, ts }
    if (parsed && typeof parsed === 'object' && 'ts' in parsed && 'data' in parsed) {
      return parsed as CacheEnvelope<T>
    }
    // Legacy format (raw data, no envelope) — treat as always stale
    return { data: parsed as T, ts: 0 }
  } catch {
    return null
  }
}

/** Write cache wrapped in a timestamped envelope */
export function writeCacheT<T>(key: string, data: T): void {
  try {
    const envelope: CacheEnvelope<T> = { data, ts: Date.now() }
    localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    // storage full or unavailable — fail silently
  }
}

/** Check whether a cache timestamp is still fresh */
export function isCacheFresh(ts: number): boolean {
  return Date.now() - ts < CACHE_FRESH_MS
}

export const CACHE_KEYS = {
  discover: 'cm_discover',
  inbox:    'cm_inbox',
  myPosts:  'cm_myposts',
  profile:  'cm_profile',
} as const
