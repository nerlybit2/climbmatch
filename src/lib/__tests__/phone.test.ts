import { describe, it, expect } from 'vitest'
import {
  COUNTRY_CODES,
  splitPhone,
  filterCountries,
  digitsOnly,
  whatsappUrl,
  parseInstagram,
  parseFacebook,
} from '@/lib/phone'

// ---------------------------------------------------------------------------
// COUNTRY_CODES
// ---------------------------------------------------------------------------

describe('COUNTRY_CODES', () => {
  it('contains at least 40 entries', () => {
    expect(COUNTRY_CODES.length).toBeGreaterThanOrEqual(40)
  })

  it('every entry has a non-empty code starting with +', () => {
    for (const c of COUNTRY_CODES) {
      expect(c.code.startsWith('+')).toBe(true)
      expect(c.code.length).toBeGreaterThan(1)
    }
  })

  it('every entry has a non-empty name and flag', () => {
    for (const c of COUNTRY_CODES) {
      expect(c.name.length).toBeGreaterThan(0)
      expect(c.flag.length).toBeGreaterThan(0)
    }
  })

  it('Israel is the first entry (default country)', () => {
    expect(COUNTRY_CODES[0].code).toBe('+972')
    expect(COUNTRY_CODES[0].name).toBe('Israel')
  })

  it('includes commonly needed countries', () => {
    const names = COUNTRY_CODES.map(c => c.name)
    expect(names).toContain('United States')
    expect(names).toContain('United Kingdom')
    expect(names).toContain('Germany')
    expect(names).toContain('UAE')
  })
})

// ---------------------------------------------------------------------------
// splitPhone
// ---------------------------------------------------------------------------

describe('splitPhone', () => {
  it('splits an Israeli number correctly', () => {
    const { country, local } = splitPhone('+972501234567')
    expect(country.code).toBe('+972')
    expect(local).toBe('501234567')
  })

  it('splits a US number correctly', () => {
    const { country, local } = splitPhone('+12125550100')
    expect(country.code).toBe('+1')
    expect(local).toBe('2125550100')
  })

  it('splits a UK number correctly', () => {
    const { country, local } = splitPhone('+447911123456')
    expect(country.code).toBe('+44')
    expect(local).toBe('7911123456')
  })

  it('uses longest-match: +972 beats +97', () => {
    // +97 is not a real code but +972 should be preferred over any shorter prefix
    const { country } = splitPhone('+972501234567')
    expect(country.code).toBe('+972')
  })

  it('handles 4-digit codes like +358 (Finland)', () => {
    const { country, local } = splitPhone('+358401234567')
    expect(country.code).toBe('+358')
    expect(local).toBe('401234567')
  })

  it('falls back to Israel for unrecognised prefix', () => {
    const { country, local } = splitPhone('+9991234567')
    expect(country.code).toBe('+972')
    expect(local).toBe('')
  })

  it('falls back gracefully for an empty string', () => {
    const { country, local } = splitPhone('')
    expect(country.code).toBe('+972')
    expect(local).toBe('')
  })
})

// ---------------------------------------------------------------------------
// filterCountries
// ---------------------------------------------------------------------------

describe('filterCountries', () => {
  it('returns all entries for an empty query', () => {
    expect(filterCountries('')).toHaveLength(COUNTRY_CODES.length)
  })

  it('returns all entries for a whitespace-only query', () => {
    expect(filterCountries('   ')).toHaveLength(COUNTRY_CODES.length)
  })

  it('matches by country name (case-insensitive)', () => {
    const results = filterCountries('israel')
    expect(results.some(c => c.name === 'Israel')).toBe(true)
  })

  it('matches by partial name', () => {
    const results = filterCountries('ger')
    expect(results.some(c => c.name === 'Germany')).toBe(true)
  })

  it('matches by dial code including +', () => {
    const results = filterCountries('+972')
    expect(results.some(c => c.code === '+972')).toBe(true)
  })

  it('matches by dial code digits without +', () => {
    const results = filterCountries('972')
    expect(results.some(c => c.code === '+972')).toBe(true)
  })

  it('returns empty array for a query with no matches', () => {
    expect(filterCountries('xyzzy-no-such-country')).toHaveLength(0)
  })

  it('does not match on flag emoji', () => {
    // Emoji search is not supported — should return 0
    const results = filterCountries('🇮🇱')
    expect(results.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// digitsOnly
// ---------------------------------------------------------------------------

describe('digitsOnly', () => {
  it('strips + and spaces', () => {
    expect(digitsOnly('+972 50 123 4567')).toBe('972501234567')
  })

  it('strips dashes and parentheses', () => {
    expect(digitsOnly('+1 (212) 555-0100')).toBe('12125550100')
  })

  it('returns empty string for no digits', () => {
    expect(digitsOnly('abc')).toBe('')
  })

  it('returns digits unchanged when already clean', () => {
    expect(digitsOnly('972501234567')).toBe('972501234567')
  })
})

// ---------------------------------------------------------------------------
// whatsappUrl
// ---------------------------------------------------------------------------

describe('whatsappUrl', () => {
  it('builds a correct wa.me URL', () => {
    const url = whatsappUrl('+972501234567', 'Hello!')
    expect(url).toBe('https://wa.me/972501234567?text=Hello!')
  })

  it('URL-encodes spaces in the message', () => {
    const url = whatsappUrl('+1234567890', 'Hello World')
    expect(url).toContain('Hello%20World')
  })

  it('strips non-digit characters from the phone', () => {
    const url = whatsappUrl('+972 50-123 4567', 'Hi')
    expect(url.startsWith('https://wa.me/972501234567')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// parseInstagram
// ---------------------------------------------------------------------------

describe('parseInstagram', () => {
  it('strips leading @', () => {
    expect(parseInstagram('@climber_guy')).toBe('climber_guy')
  })

  it('extracts username from full URL', () => {
    expect(parseInstagram('https://www.instagram.com/climber_guy/')).toBe('climber_guy')
    expect(parseInstagram('https://instagram.com/climber_guy')).toBe('climber_guy')
  })

  it('strips trailing slash', () => {
    expect(parseInstagram('climber_guy/')).toBe('climber_guy')
  })

  it('handles plain username with no prefix', () => {
    expect(parseInstagram('climber_guy')).toBe('climber_guy')
  })

  it('handles http (non-https) URL', () => {
    expect(parseInstagram('http://instagram.com/climber_guy')).toBe('climber_guy')
  })
})

// ---------------------------------------------------------------------------
// parseFacebook
// ---------------------------------------------------------------------------

describe('parseFacebook', () => {
  it('extracts handle from full URL', () => {
    expect(parseFacebook('https://www.facebook.com/john.doe')).toBe('john.doe')
    expect(parseFacebook('https://facebook.com/john.doe')).toBe('john.doe')
  })

  it('strips trailing slash', () => {
    expect(parseFacebook('john.doe/')).toBe('john.doe')
  })

  it('handles plain username with no prefix', () => {
    expect(parseFacebook('john.doe')).toBe('john.doe')
  })

  it('handles http URL', () => {
    expect(parseFacebook('http://facebook.com/john.doe')).toBe('john.doe')
  })
})
