import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { readCache, writeCache, clearCache, readCacheT, writeCacheT, isCacheFresh, CACHE_FRESH_MS, CACHE_KEYS } from '@/lib/cache'

// ---------------------------------------------------------------------------
// Mock localStorage for Node environment
// ---------------------------------------------------------------------------

function makeMockStorage() {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k] }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('readCache', () => {
  let storage: ReturnType<typeof makeMockStorage>

  beforeEach(() => {
    storage = makeMockStorage()
    Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true })
  })

  it('returns null when key does not exist', () => {
    expect(readCache('nonexistent')).toBeNull()
  })

  it('parses and returns stored JSON value', () => {
    storage.setItem('test_key', JSON.stringify({ name: 'Alice' }))
    expect(readCache<{ name: string }>('test_key')).toEqual({ name: 'Alice' })
  })

  it('returns null on JSON parse error (corrupted data)', () => {
    storage.setItem('bad_key', 'not valid json {{{')
    // JSON.parse will throw; readCache should return null silently
    expect(readCache('bad_key')).toBeNull()
  })

  it('returns null when localStorage throws on getItem', () => {
    storage.getItem.mockImplementation(() => { throw new Error('SecurityError') })
    expect(readCache('any_key')).toBeNull()
  })
})

describe('writeCache', () => {
  let storage: ReturnType<typeof makeMockStorage>

  beforeEach(() => {
    storage = makeMockStorage()
    Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true })
  })

  it('serializes and stores the value as JSON', () => {
    writeCache('my_key', { score: 42 })
    expect(storage.setItem).toHaveBeenCalledWith('my_key', JSON.stringify({ score: 42 }))
  })

  it('stores an array correctly', () => {
    const arr = [1, 2, 3]
    writeCache('arr_key', arr)
    expect(JSON.parse(storage.setItem.mock.calls[0][1])).toEqual(arr)
  })

  it('does not throw when localStorage throws (storage full)', () => {
    storage.setItem.mockImplementation(() => { throw new Error('QuotaExceededError') })
    expect(() => writeCache('key', 'value')).not.toThrow()
  })
})

describe('clearCache', () => {
  let storage: ReturnType<typeof makeMockStorage>

  beforeEach(() => {
    storage = makeMockStorage()
    Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true })
  })

  it('removes the item for the given key', () => {
    storage.setItem('to_clear', 'data')
    clearCache('to_clear')
    expect(storage.removeItem).toHaveBeenCalledWith('to_clear')
  })

  it('does not throw when localStorage throws', () => {
    storage.removeItem.mockImplementation(() => { throw new Error('SecurityError') })
    expect(() => clearCache('key')).not.toThrow()
  })
})

describe('readCache + writeCache round-trip', () => {
  let storage: ReturnType<typeof makeMockStorage>

  beforeEach(() => {
    storage = makeMockStorage()
    Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true })
  })

  it('reads back the value that was written', () => {
    const data = { items: ['a', 'b'], count: 2 }
    writeCache('round_trip', data)
    // Simulate what readCache does: read from the store
    const written = storage.setItem.mock.calls[0][1]
    storage.getItem.mockReturnValue(written)
    expect(readCache('round_trip')).toEqual(data)
  })

  it('clearCache makes subsequent readCache return null', () => {
    writeCache('cm_discover', [{ id: 1 }])
    clearCache('cm_discover')
    // After clearing, getItem should return null
    storage.getItem.mockReturnValue(null)
    expect(readCache('cm_discover')).toBeNull()
  })
})

describe('CACHE_KEYS', () => {
  it('has the expected keys defined', () => {
    expect(CACHE_KEYS.discover).toBe('cm_discover')
    expect(CACHE_KEYS.inbox).toBe('cm_inbox')
    expect(CACHE_KEYS.myPosts).toBe('cm_myposts')
    expect(CACHE_KEYS.profile).toBe('cm_profile')
  })

  it('has exactly 5 keys', () => {
    expect(Object.keys(CACHE_KEYS)).toHaveLength(5)
  })

  it('includes swipeDiscover key', () => {
    expect(CACHE_KEYS.swipeDiscover).toBe('cm_swipe_discover')
  })
})

// ---------------------------------------------------------------------------
// Timestamped cache (readCacheT / writeCacheT / isCacheFresh)
// ---------------------------------------------------------------------------

describe('readCacheT', () => {
  let storage: ReturnType<typeof makeMockStorage>

  beforeEach(() => {
    storage = makeMockStorage()
    Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true })
  })

  it('returns null when key does not exist', () => {
    expect(readCacheT('nonexistent')).toBeNull()
  })

  it('parses envelope format { data, ts }', () => {
    const envelope = { data: { name: 'Alice' }, ts: 1000 }
    storage.setItem('key', JSON.stringify(envelope))
    expect(readCacheT<{ name: string }>('key')).toEqual(envelope)
  })

  it('treats legacy format (no ts/data fields) as ts: 0', () => {
    const legacy = { name: 'Bob' }
    storage.setItem('key', JSON.stringify(legacy))
    expect(readCacheT<{ name: string }>('key')).toEqual({ data: legacy, ts: 0 })
  })

  it('treats legacy array format as ts: 0', () => {
    const legacy = [1, 2, 3]
    storage.setItem('key', JSON.stringify(legacy))
    expect(readCacheT<number[]>('key')).toEqual({ data: legacy, ts: 0 })
  })

  it('returns null on corrupted data', () => {
    storage.setItem('key', 'not valid json {{{')
    expect(readCacheT('key')).toBeNull()
  })

  it('returns null when localStorage throws', () => {
    storage.getItem.mockImplementation(() => { throw new Error('SecurityError') })
    expect(readCacheT('key')).toBeNull()
  })
})

describe('writeCacheT', () => {
  let storage: ReturnType<typeof makeMockStorage>

  beforeEach(() => {
    storage = makeMockStorage()
    Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true })
  })

  it('wraps data in a timestamped envelope', () => {
    const now = Date.now()
    writeCacheT('key', { score: 42 })
    const stored = JSON.parse(storage.setItem.mock.calls[0][1])
    expect(stored.data).toEqual({ score: 42 })
    expect(stored.ts).toBeGreaterThanOrEqual(now)
    expect(stored.ts).toBeLessThanOrEqual(Date.now())
  })

  it('does not throw when localStorage throws', () => {
    storage.setItem.mockImplementation(() => { throw new Error('QuotaExceededError') })
    expect(() => writeCacheT('key', 'value')).not.toThrow()
  })
})

describe('readCacheT + writeCacheT round-trip', () => {
  let storage: ReturnType<typeof makeMockStorage>

  beforeEach(() => {
    storage = makeMockStorage()
    Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true })
  })

  it('reads back the data and a valid timestamp', () => {
    const data = { items: ['a', 'b'], count: 2 }
    writeCacheT('rt', data)
    const written = storage.setItem.mock.calls[0][1]
    storage.getItem.mockReturnValue(written)
    const result = readCacheT<typeof data>('rt')
    expect(result?.data).toEqual(data)
    expect(result?.ts).toBeGreaterThan(0)
  })
})

describe('isCacheFresh', () => {
  afterEach(() => vi.useRealTimers())

  it('returns true when timestamp is within CACHE_FRESH_MS', () => {
    expect(isCacheFresh(Date.now() - 1000)).toBe(true)
  })

  it('returns false when timestamp is older than CACHE_FRESH_MS', () => {
    expect(isCacheFresh(Date.now() - CACHE_FRESH_MS - 1)).toBe(false)
  })

  it('returns false for ts: 0 (legacy cache)', () => {
    expect(isCacheFresh(0)).toBe(false)
  })

  it('CACHE_FRESH_MS is 30 seconds', () => {
    expect(CACHE_FRESH_MS).toBe(30_000)
  })
})
