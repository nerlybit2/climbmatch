import { describe, it, expect } from 'vitest'
import { en, he, translations, type Language } from '@/lib/i18n'

// Recursively collect all leaf key paths (e.g. "nav.discover", "toasts.interestSent")
function leafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...leafKeys(v as Record<string, unknown>, path))
    } else {
      keys.push(path)
    }
  }
  return keys
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((cur, k) => (cur as Record<string, unknown>)[k], obj)
}

describe('i18n – translation completeness', () => {
  const enKeys = leafKeys(en as unknown as Record<string, unknown>)
  const heKeys = leafKeys(he as unknown as Record<string, unknown>)

  it('English and Hebrew expose identical key sets', () => {
    expect(new Set(enKeys)).toEqual(new Set(heKeys))
  })

  it('every English value is a non-empty string', () => {
    for (const key of enKeys) {
      const val = getByPath(en as unknown as Record<string, unknown>, key)
      expect(typeof val, `en.${key} should be a string`).toBe('string')
      expect((val as string).length, `en.${key} should not be empty`).toBeGreaterThan(0)
    }
  })

  it('every Hebrew value is a non-empty string', () => {
    for (const key of heKeys) {
      const val = getByPath(he as unknown as Record<string, unknown>, key)
      expect(typeof val, `he.${key} should be a string`).toBe('string')
      expect((val as string).length, `he.${key} should not be empty`).toBeGreaterThan(0)
    }
  })

  it('translations map contains exactly en and he', () => {
    expect(translations.en).toBe(en)
    expect(translations.he).toBe(he)
    expect(Object.keys(translations)).toEqual(['en', 'he'])
  })

  it('most labels differ between languages', () => {
    // Spot-check several sections to ensure real translation happened
    expect(en.nav.discover).not.toBe(he.nav.discover)
    expect(en.nav.settings).not.toBe(he.nav.settings)
    expect(en.inbox.title).not.toBe(he.inbox.title)
    expect(en.requests.title).not.toBe(he.requests.title)
    expect(en.profile.save).not.toBe(he.profile.save)
  })

  it('language keys are only en and he', () => {
    const validLanguages: Language[] = ['en', 'he']
    expect(Object.keys(translations).sort()).toEqual(validLanguages.sort())
  })

  it('English nav labels are all distinct', () => {
    const labels = Object.values(en.nav)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('Hebrew nav labels are all distinct', () => {
    const labels = Object.values(he.nav)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('climbing type values are consistent across sections', () => {
    // climbingTypes section and cardDetails section should match for Sport/Boulder
    expect(en.climbingTypes.sport).toBe(en.cardDetails.sport)
    expect(en.climbingTypes.boulder).toBe(en.cardDetails.boulder)
    expect(he.climbingTypes.sport).toBe(he.cardDetails.sport)
    expect(he.climbingTypes.boulder).toBe(he.cardDetails.boulder)
  })
})
