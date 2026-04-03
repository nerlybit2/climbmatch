import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { DiscoverProvider, useDiscover } from '@/contexts/DiscoverContext'
import type { ScoredCard } from '@/lib/actions/discover'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/actions/discover', () => ({
  discoverRequests: vi.fn(),
}))

const onSubscribe = vi.fn<(event: string, cb: () => void) => () => void>()

vi.mock('@/lib/cache', () => ({
  readCacheT: vi.fn(),
  writeCacheT: vi.fn(),
  isCacheFresh: vi.fn().mockReturnValue(false),
  CACHE_KEYS: { discover: 'cm_discover' },
}))

vi.mock('@/lib/dataEvents', () => ({
  on: (...args: [string, () => void]) => {
    onSubscribe(...args)
    return () => {}
  },
}))

import { discoverRequests } from '@/lib/actions/discover'
import { readCacheT, writeCacheT, isCacheFresh } from '@/lib/cache'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCard(id: string, swiped = false): ScoredCard {
  return {
    request: { id, user_id: 'u2', location_name: 'Crag', date: '2025-07-01', status: 'active' },
    profile: { id: 'u2', display_name: 'Alice', photo_url: null },
    compatibility: {},
    swiped,
  } as unknown as ScoredCard
}

function Probe() {
  const { cards, loading, markSwiped } = useDiscover()
  return (
    <>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="count">{cards.length}</div>
      {cards.map(c => (
        <div key={c.request.id} data-testid={`card-${c.request.id}`}>
          {c.request.location_name}|{String(c.swiped)}
        </div>
      ))}
      <button data-testid="mark-swiped" onClick={() => markSwiped('r1')}>mark</button>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DiscoverContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onSubscribe.mockClear()
  })

  describe('no cache — cold start', () => {
    it('shows loading state, fetches, then renders cards', async () => {
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(discoverRequests).mockResolvedValue([makeCard('r1')])

      render(<DiscoverProvider><Probe /></DiscoverProvider>)

      expect(screen.getByTestId('loading').textContent).toBe('true')
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
      expect(screen.getByTestId('count').textContent).toBe('1')
    })

    it('writes fetched data to timestamped cache', async () => {
      const card = makeCard('r1')
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(discoverRequests).mockResolvedValue([card])

      render(<DiscoverProvider><Probe /></DiscoverProvider>)

      await waitFor(() => expect(writeCacheT).toHaveBeenCalled())
      expect(writeCacheT).toHaveBeenCalledWith('cm_discover', [card])
    })
  })

  describe('stale cache — stale-while-revalidate', () => {
    it('shows cached data immediately with loading=false', () => {
      const card = makeCard('r1')
      vi.mocked(readCacheT).mockReturnValue({ data: [card], ts: 0 })
      vi.mocked(isCacheFresh).mockReturnValue(false)
      vi.mocked(discoverRequests).mockResolvedValue([card])

      render(<DiscoverProvider><Probe /></DiscoverProvider>)

      expect(screen.getByTestId('loading').textContent).toBe('false')
      expect(screen.getByTestId('count').textContent).toBe('1')
    })

    it('silently refreshes stale cache in background', async () => {
      const staleCard = makeCard('r1')
      const freshCard = makeCard('r2')
      vi.mocked(readCacheT).mockReturnValue({ data: [staleCard], ts: 0 })
      vi.mocked(isCacheFresh).mockReturnValue(false)
      vi.mocked(discoverRequests).mockResolvedValue([freshCard])

      render(<DiscoverProvider><Probe /></DiscoverProvider>)

      expect(screen.getByTestId('card-r1')).toBeTruthy()

      await waitFor(() => expect(screen.getByTestId('card-r2')).toBeTruthy())
      expect(screen.queryByTestId('card-r1')).toBeNull()
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
  })

  describe('fresh cache — skip refetch', () => {
    it('does not call discoverRequests when cache is fresh', async () => {
      const card = makeCard('r1')
      vi.mocked(readCacheT).mockReturnValue({ data: [card], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<DiscoverProvider><Probe /></DiscoverProvider>)

      await act(async () => { await Promise.resolve() })
      expect(discoverRequests).not.toHaveBeenCalled()
    })
  })

  describe('markSwiped', () => {
    it('sets swiped=true on matching card without removing it', async () => {
      const card = makeCard('r1', false)
      vi.mocked(readCacheT).mockReturnValue({ data: [card], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<DiscoverProvider><Probe /></DiscoverProvider>)

      // Card initially not swiped
      expect(screen.getByTestId('card-r1').textContent).toBe('Crag|false')

      // Click markSwiped
      await act(async () => { screen.getByTestId('mark-swiped').click() })

      // Card still present but now swiped
      expect(screen.getByTestId('card-r1').textContent).toBe('Crag|true')
      expect(screen.getByTestId('count').textContent).toBe('1')
    })

    it('writes updated cards to cache after marking swiped', async () => {
      const card = makeCard('r1', false)
      vi.mocked(readCacheT).mockReturnValue({ data: [card], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<DiscoverProvider><Probe /></DiscoverProvider>)

      await act(async () => { screen.getByTestId('mark-swiped').click() })

      expect(writeCacheT).toHaveBeenCalledWith('cm_discover', [
        expect.objectContaining({ swiped: true }),
      ])
    })

    it('does not affect other cards', async () => {
      const card1 = makeCard('r1', false)
      const card2 = makeCard('r2', false)
      vi.mocked(readCacheT).mockReturnValue({ data: [card1, card2], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<DiscoverProvider><Probe /></DiscoverProvider>)

      await act(async () => { screen.getByTestId('mark-swiped').click() })

      expect(screen.getByTestId('card-r1').textContent).toBe('Crag|true')
      expect(screen.getByTestId('card-r2').textContent).toBe('Crag|false')
    })
  })

  describe('event subscriptions', () => {
    it('subscribes to post:created, post:updated, post:cancelled, app:resumed', () => {
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(discoverRequests).mockResolvedValue([])

      render(<DiscoverProvider><Probe /></DiscoverProvider>)

      const subscribedEvents = onSubscribe.mock.calls.map(c => c[0])
      expect(subscribedEvents).toContain('post:created')
      expect(subscribedEvents).toContain('post:updated')
      expect(subscribedEvents).toContain('post:cancelled')
      expect(subscribedEvents).toContain('app:resumed')
    })

    it('does not subscribe to interest events', () => {
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(discoverRequests).mockResolvedValue([])

      render(<DiscoverProvider><Probe /></DiscoverProvider>)

      const subscribedEvents = onSubscribe.mock.calls.map(c => c[0])
      expect(subscribedEvents).not.toContain('interest:created')
      expect(subscribedEvents).not.toContain('interest:accepted')
      expect(subscribedEvents).not.toContain('interest:declined')
    })
  })
})
