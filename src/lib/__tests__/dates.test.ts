import { describe, it, expect } from 'vitest'
import { formatDates, formatDateShort } from '@/lib/dates'

describe('formatDates', () => {
  describe('single date', () => {
    it('returns weekday + month + day when only date is provided', () => {
      expect(formatDates('2026-04-04')).toBe('Saturday, Apr 4')
    })

    it('returns weekday + month + day when dates is null', () => {
      expect(formatDates('2026-04-04', null)).toBe('Saturday, Apr 4')
    })

    it('returns weekday + month + day when dates is empty array', () => {
      expect(formatDates('2026-04-04', [])).toBe('Saturday, Apr 4')
    })

    it('returns weekday + month + day when dates has one entry', () => {
      expect(formatDates('2026-04-06', ['2026-04-06'])).toBe('Monday, Apr 6')
    })

    it('uses dates[0] over date when only one entry in dates', () => {
      // dates overrides the date param when non-empty
      expect(formatDates('2026-01-01', ['2026-04-04'])).toBe('Saturday, Apr 4')
    })
  })

  describe('consecutive range', () => {
    it('formats two consecutive days as range within same month', () => {
      expect(formatDates('2026-04-04', ['2026-04-04', '2026-04-05'])).toBe('Apr 4–5')
    })

    it('formats three consecutive days as range', () => {
      expect(formatDates('2026-04-04', ['2026-04-04', '2026-04-05', '2026-04-06'])).toBe('Apr 4–6')
    })

    it('handles unsorted input — still formats as correct range', () => {
      expect(formatDates('2026-04-06', ['2026-04-06', '2026-04-04', '2026-04-05'])).toBe('Apr 4–6')
    })

    it('formats range across month boundary', () => {
      const result = formatDates('2026-04-30', ['2026-04-30', '2026-05-01'])
      expect(result).toBe('Apr 30–May 1')
    })
  })

  describe('non-consecutive dates', () => {
    it('formats two non-consecutive same-month dates with abbreviated days', () => {
      expect(formatDates('2026-04-04', ['2026-04-04', '2026-04-06'])).toBe('Apr 4, 6')
    })

    it('formats three non-consecutive same-month dates', () => {
      expect(formatDates('2026-04-04', ['2026-04-04', '2026-04-06', '2026-04-08'])).toBe('Apr 4, 6, 8')
    })

    it('formats non-consecutive dates across months', () => {
      const result = formatDates('2026-04-04', ['2026-04-04', '2026-05-06'])
      expect(result).toBe('Apr 4, May 6')
    })

    it('handles unsorted non-consecutive input', () => {
      expect(formatDates('2026-04-08', ['2026-04-08', '2026-04-04', '2026-04-06'])).toBe('Apr 4, 6, 8')
    })
  })

  describe('edge cases', () => {
    it('does not shift date due to timezone — Apr 4 stays Apr 4', () => {
      const result = formatDates('2026-04-04')
      expect(result).toContain('Apr 4')
    })

    it('handles single date at year boundary', () => {
      expect(formatDates('2026-01-01')).toBe('Thursday, Jan 1')
    })
  })
})

describe('formatDateShort', () => {
  it('returns month and day without weekday', () => {
    expect(formatDateShort('2026-04-04')).toBe('Apr 4')
  })

  it('does not timezone-shift the date', () => {
    expect(formatDateShort('2026-12-31')).toBe('Dec 31')
  })
})
