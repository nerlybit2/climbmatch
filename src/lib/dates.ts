/**
 * Date formatting helpers for partner requests that may have multiple dates.
 *
 * Display rules:
 *   1 date              → "Friday, Apr 4"
 *   2+ consecutive days → "Apr 4–5"  (or "Apr 30–May 1" across months)
 *   non-consecutive     → "Apr 4, 6, 8"  (abbreviated same month)
 *                      or "Apr 4, May 6"  (different months)
 */

/** Parse an ISO date string (YYYY-MM-DD) as UTC midnight to avoid timezone shifts. */
function parseUTC(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/**
 * Format one or more dates for display.
 *
 * @param date    The primary ISO date string (always present on a PartnerRequest).
 * @param dates   Optional multi-date array from the `dates` column.
 */
export function formatDates(date: string, dates?: string[] | null): string {
  const all = dates && dates.length > 0 ? [...dates].sort() : [date]

  if (all.length === 1) {
    return parseUTC(all[0]).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }

  const sorted = [...all].sort()

  // Check if all dates are consecutive
  let consecutive = true
  for (let i = 1; i < sorted.length; i++) {
    const diff =
      (parseUTC(sorted[i]).getTime() - parseUTC(sorted[i - 1]).getTime()) /
      86_400_000
    if (diff !== 1) {
      consecutive = false
      break
    }
  }

  if (consecutive) {
    const first = parseUTC(sorted[0])
    const last = parseUTC(sorted[sorted.length - 1])
    const firstStr = first.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    const lastDay = last.getUTCDate()
    const firstMonth = first.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    const lastMonth = last.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })

    if (firstMonth === lastMonth) {
      return `${firstStr}–${lastDay}`
    }
    const lastStr = last.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    return `${firstStr}–${lastStr}`
  }

  // Non-consecutive: check if same month
  const months = sorted.map(d =>
    parseUTC(d).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  )
  const allSameMonth = months.every(m => m === months[0])

  if (allSameMonth) {
    const month = months[0]
    const days = sorted.map(d => parseUTC(d).getUTCDate())
    return `${month} ${days.join(', ')}`
  }

  // Different months — list each abbreviated
  return sorted
    .map(d =>
      parseUTC(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    )
    .join(', ')
}

/**
 * Short format for chips/cards — no weekday.
 *   1 date     → "Apr 4"
 *   otherwise  → same as formatDates but without weekday
 */
export function formatDateShort(iso: string): string {
  return parseUTC(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
