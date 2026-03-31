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

export const CACHE_KEYS = {
  discover: 'cm_discover',
  inbox:    'cm_inbox',
  myPosts:  'cm_myposts',
  profile:  'cm_profile',
} as const
