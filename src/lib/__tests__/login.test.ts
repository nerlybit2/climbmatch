import { describe, it, expect } from 'vitest'

/**
 * Unit tests for login page logic that can be extracted as pure functions.
 * These don't touch Supabase — they test validation and OTP digit handling.
 */

// ── OTP helpers (mirrors OtpInput behaviour) ─────────────────────────────────

function applyDigitToSlots(slots: string[], index: number, value: string): string[] {
  // Paste of full code
  if (value.length > 1) {
    const pasted = value.replace(/\D/g, '').slice(0, 6).split('')
    return ['', '', '', '', '', ''].map((_, i) => pasted[i] ?? '')
  }
  const digit = value.replace(/\D/g, '').slice(-1)
  const next = [...slots]
  next[index] = digit
  return next
}

function isOtpComplete(slots: string[]): boolean {
  return slots.length === 6 && slots.every(d => d !== '')
}

// ── Signup validation helpers ─────────────────────────────────────────────────

function validateSignup(displayName: string, password: string, confirmPassword: string): string | null {
  if (!displayName.trim()) return 'Please enter your name.'
  if (password !== confirmPassword) return 'Passwords do not match.'
  return null
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OTP digit input', () => {
  const empty = ['', '', '', '', '', '']

  it('sets a single digit at the correct index', () => {
    const result = applyDigitToSlots(empty, 2, '5')
    expect(result[2]).toBe('5')
    expect(result[0]).toBe('')
  })

  it('ignores non-numeric characters', () => {
    const result = applyDigitToSlots(empty, 0, 'a')
    expect(result[0]).toBe('')
  })

  it('takes only the last digit when multiple chars entered', () => {
    const result = applyDigitToSlots(empty, 0, '39')
    expect(result[0]).toBe('9')
  })

  it('handles paste of full 6-digit code', () => {
    const result = applyDigitToSlots(empty, 0, '123456')
    expect(result).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('handles paste with non-numeric chars stripped', () => {
    const result = applyDigitToSlots(empty, 0, '12 34 56')
    expect(result).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('truncates paste to 6 digits', () => {
    const result = applyDigitToSlots(empty, 0, '12345678')
    expect(result).toEqual(['1', '2', '3', '4', '5', '6'])
  })
})

describe('OTP completion check', () => {
  it('is complete when all 6 slots filled', () => {
    expect(isOtpComplete(['1', '2', '3', '4', '5', '6'])).toBe(true)
  })

  it('is not complete with empty slots', () => {
    expect(isOtpComplete(['1', '2', '3', '', '5', '6'])).toBe(false)
  })

  it('is not complete with fewer than 6 slots', () => {
    expect(isOtpComplete(['1', '2', '3', '4', '5'])).toBe(false)
  })
})

describe('Signup validation', () => {
  it('passes with valid inputs', () => {
    expect(validateSignup('Alice', 'pass123', 'pass123')).toBeNull()
  })

  it('rejects empty display name', () => {
    expect(validateSignup('', 'pass123', 'pass123')).toBe('Please enter your name.')
  })

  it('rejects whitespace-only display name', () => {
    expect(validateSignup('   ', 'pass123', 'pass123')).toBe('Please enter your name.')
  })

  it('rejects mismatched passwords', () => {
    expect(validateSignup('Alice', 'pass123', 'pass456')).toBe('Passwords do not match.')
  })

  it('checks name before password match', () => {
    // Name error takes priority
    expect(validateSignup('', 'abc', 'xyz')).toBe('Please enter your name.')
  })
})
