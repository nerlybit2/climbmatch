import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { InboxProvider, useInbox } from '@/contexts/InboxContext'
import type { InboxItem } from '@/lib/actions/interests'

vi.mock('@/lib/actions/interests', () => ({
  getInboxData: vi.fn(),
}))

vi.mock('@/lib/cache', () => ({
  readCache: vi.fn(),
  writeCache: vi.fn(),
  CACHE_KEYS: { inbox: 'cm_inbox' },
}))

import { getInboxData } from '@/lib/actions/interests'
import { readCache, writeCache } from '@/lib/cache'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(phone: string): InboxItem {
  return {
    interest: { id: 'int-1', from_user_id: 'u2', to_user_id: 'u1', request_id: 'req-1', status: 'accepted', created_at: '', updated_at: '' },
    fromProfile: { id: 'u2', display_name: 'Alice', photo_url: null, phone, instagram: null, facebook: null, home_area: '', climbing_types: [], experience_level: 'beginner', sport_grade_range: null, boulder_grade_range: null, weight_kg: null, share_weight: false, gear: {}, has_car: false, bio: null, languages: [], created_at: '', updated_at: '' },
    request: { id: 'req-1', user_id: 'u2', climbing_type: 'sport', location_name: 'Siurana', date: '2025-07-01', start_time: null, end_time: null, flexible: false, location_type: 'crag', goal_type: 'any', desired_grade_range: null, notes: null, needs_gear: {}, carpool_needed: false, weight_relevant: false, max_weight_difference_kg: null, status: 'active', created_at: '', updated_at: '' },
    phone,
    instagram: null,
    facebook: null,
  } as unknown as InboxItem
}

/** Minimal component that exposes context state for assertions */
function Probe() {
  const { received, loading } = useInbox()
  return (
    <>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="count">{received.length}</div>
      {received[0] && <div data-testid="phone">{received[0].phone}</div>}
    </>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InboxContext', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('no cache — initial load', () => {
    it('shows loading state while fetching, then renders data', async () => {
      vi.mocked(readCache).mockReturnValue(null)
      vi.mocked(getInboxData).mockResolvedValue({ received: [makeItem('+1')], sent: [] })

      render(<InboxProvider><Probe /></InboxProvider>)

      expect(screen.getByTestId('loading').textContent).toBe('true')
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
      expect(screen.getByTestId('count').textContent).toBe('1')
    })

    it('writes fresh data to cache after fetch', async () => {
      const item = makeItem('+1')
      vi.mocked(readCache).mockReturnValue(null)
      vi.mocked(getInboxData).mockResolvedValue({ received: [item], sent: [] })

      render(<InboxProvider><Probe /></InboxProvider>)

      await waitFor(() => expect(writeCache).toHaveBeenCalled())
      expect(writeCache).toHaveBeenCalledWith('cm_inbox', { received: [item], sent: [] })
    })
  })

  describe('cache exists — stale-while-revalidate', () => {
    it('displays cached data immediately without a loading spinner', async () => {
      const cachedItem = makeItem('+972500000000')
      vi.mocked(readCache).mockReturnValue({ received: [cachedItem], sent: [] })
      vi.mocked(getInboxData).mockResolvedValue({ received: [cachedItem], sent: [] })

      render(<InboxProvider><Probe /></InboxProvider>)

      // Instant render — no loading flicker
      expect(screen.getByTestId('loading').textContent).toBe('false')
      expect(screen.getByTestId('count').textContent).toBe('1')
    })

    it('silently refreshes and updates the displayed phone number', async () => {
      // Reproduces the bug: user updated their phone, but inbox was stuck showing the old one.
      const staleItem = makeItem('+972500000000') // old wrong number
      const freshItem = makeItem('+972509999999') // correct number after profile edit

      vi.mocked(readCache).mockReturnValue({ received: [staleItem], sent: [] })
      vi.mocked(getInboxData).mockResolvedValue({ received: [freshItem], sent: [] })

      render(<InboxProvider><Probe /></InboxProvider>)

      // Stale cache shown first
      expect(screen.getByTestId('phone').textContent).toBe('+972500000000')

      // Background refresh updates to fresh number without loading spinner
      await waitFor(() => expect(screen.getByTestId('phone').textContent).toBe('+972509999999'))
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    it('always calls getInboxData once on mount even when cache is populated', async () => {
      const item = makeItem('+1')
      vi.mocked(readCache).mockReturnValue({ received: [item], sent: [] })
      vi.mocked(getInboxData).mockResolvedValue({ received: [item], sent: [] })

      render(<InboxProvider><Probe /></InboxProvider>)

      await waitFor(() => expect(getInboxData).toHaveBeenCalledTimes(1))
    })

    it('updates the cache with fresh data after background refresh', async () => {
      const staleItem = makeItem('+972500000000')
      const freshItem = makeItem('+972509999999')

      vi.mocked(readCache).mockReturnValue({ received: [staleItem], sent: [] })
      vi.mocked(getInboxData).mockResolvedValue({ received: [freshItem], sent: [] })

      render(<InboxProvider><Probe /></InboxProvider>)

      await waitFor(() =>
        expect(writeCache).toHaveBeenCalledWith('cm_inbox', { received: [freshItem], sent: [] })
      )
    })
  })
})
