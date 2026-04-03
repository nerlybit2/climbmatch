import { describe, it, expect } from 'vitest'
import { ISRAEL_CRAGS, ISRAEL_GYMS, WORLD_CRAGS } from '@/lib/crags'

describe('ISRAEL_CRAGS', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(ISRAEL_CRAGS)).toBe(true)
    expect(ISRAEL_CRAGS.length).toBeGreaterThan(0)
    ISRAEL_CRAGS.forEach(c => expect(typeof c).toBe('string'))
  })

  it('contains well-known Israeli crags', () => {
    expect(ISRAEL_CRAGS).toContain('Mt. Arbel')
    expect(ISRAEL_CRAGS).toContain('Keshet Cave')
    expect(ISRAEL_CRAGS).toContain('Red Canyon')
  })

  it('has no duplicate entries', () => {
    const unique = new Set(ISRAEL_CRAGS)
    expect(unique.size).toBe(ISRAEL_CRAGS.length)
  })

  it('has no empty strings', () => {
    ISRAEL_CRAGS.forEach(c => expect(c.trim().length).toBeGreaterThan(0))
  })
})

describe('ISRAEL_GYMS', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(ISRAEL_GYMS)).toBe(true)
    expect(ISRAEL_GYMS.length).toBeGreaterThan(0)
    ISRAEL_GYMS.forEach(g => expect(typeof g).toBe('string'))
  })

  it('contains well-known Israeli gyms', () => {
    expect(ISRAEL_GYMS).toContain('Climbzone Tel Aviv')
    expect(ISRAEL_GYMS).toContain('Vertical Herzliya')
  })

  it('has no duplicate entries', () => {
    const unique = new Set(ISRAEL_GYMS)
    expect(unique.size).toBe(ISRAEL_GYMS.length)
  })

  it('has no entries shared with ISRAEL_CRAGS', () => {
    const cragSet = new Set(ISRAEL_CRAGS)
    ISRAEL_GYMS.forEach(g => expect(cragSet.has(g)).toBe(false))
  })
})

describe('WORLD_CRAGS', () => {
  it('still exports for backward compatibility', () => {
    expect(Array.isArray(WORLD_CRAGS)).toBe(true)
    expect(WORLD_CRAGS.length).toBeGreaterThan(0)
  })
})
