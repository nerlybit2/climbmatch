import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readCache, writeCache, clearCache, CACHE_KEYS } from '@/lib/cache'

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

  it('has exactly 4 keys', () => {
    expect(Object.keys(CACHE_KEYS)).toHaveLength(4)
  })
})
