import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { SwipeDiscoverProvider, useSwipeDiscover } from '@/contexts/SwipeDiscoverContext'
import type { ProfileCard } from '@/lib/actions/discoverProfiles'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/actions/discoverProfiles', () => ({
  discoverProfiles: vi.fn(),
}))

const onSubscribe = vi.fn<(event: string, cb: () => void) => () => void>()

vi.mock('@/lib/cache', () => ({
  readCacheT: vi.fn(),
  writeCacheT: vi.fn(),
  isCacheFresh: vi.fn().mockReturnValue(false),
  CACHE_KEYS: { swipeDiscover: 'cm_swipe_discover' },
}))

vi.mock('@/lib/dataEvents', () => ({
  on: (...args: [string, () => void]) => {
    onSubscribe(...args)
    return () => {}
  },
}))

import { discoverProfiles } from '@/lib/actions/discoverProfiles'
import { readCacheT, writeCacheT, isCacheFresh } from '@/lib/cache'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCard(profileId: string, swiped = false): ProfileCard {
  return {
    profile: { id: profileId, display_name: `User ${profileId}`, photo_url: null } as ProfileCard['profile'],
    posts: [],
    swiped,
  }
}

function Probe() {
  const { profiles, loading, markSwiped, removeProfile } = useSwipeDiscover()
  return (
    <>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="count">{profiles.length}</div>
      {profiles.map(c => (
        <div key={c.profile.id} data-testid={`card-${c.profile.id}`}>
          {c.profile.display_name}|{String(c.swiped)}
        </div>
      ))}
      <button data-testid="mark-swiped" onClick={() => markSwiped('p1')}>mark</button>
      <button data-testid="remove" onClick={() => removeProfile('p1')}>remove</button>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SwipeDiscoverContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onSubscribe.mockClear()
  })

  describe('hydration safety — server-consistent initial state', () => {
    it('first render is always loading=true even when cache has data', () => {
      // Regression test: readCacheT must only be called inside useEffect, never
      // during the render phase. If it's called during render, the server (which
      // has no localStorage) would start with loading=true but the client would
      // start with loading=false, causing a React hydration mismatch.
      const firstRenderLoading: boolean[] = []

      function StateCapture() {
        const { loading } = useSwipeDiscover()
        if (firstRenderLoading.length === 0) firstRenderLoading.push(loading)
        return null
      }

      const card = makeCard('p1')
      vi.mocked(readCacheT).mockReturnValue({ data: [card], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)
      vi.mocked(discoverProfiles).mockResolvedValue([card])

      render(<SwipeDiscoverProvider><StateCapture /></SwipeDiscoverProvider>)

      expect(firstRenderLoading[0]).toBe(true)
    })
  })

  describe('no cache — cold start', () => {
    it('shows loading state then renders profiles after fetch', async () => {
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(discoverProfiles).mockResolvedValue([makeCard('p1')])

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)

      expect(screen.getByTestId('loading').textContent).toBe('true')
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
      expect(screen.getByTestId('count').textContent).toBe('1')
    })

    it('writes fetched profiles to cache', async () => {
      const card = makeCard('p1')
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(discoverProfiles).mockResolvedValue([card])

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)

      await waitFor(() => expect(writeCacheT).toHaveBeenCalled())
      expect(writeCacheT).toHaveBeenCalledWith('cm_swipe_discover', [card])
    })
  })

  describe('stale cache — stale-while-revalidate', () => {
    it('shows cached profiles immediately without loading spinner', () => {
      const card = makeCard('p1')
      vi.mocked(readCacheT).mockReturnValue({ data: [card], ts: 0 })
      vi.mocked(isCacheFresh).mockReturnValue(false)
      vi.mocked(discoverProfiles).mockResolvedValue([card])

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)

      expect(screen.getByTestId('loading').textContent).toBe('false')
      expect(screen.getByTestId('count').textContent).toBe('1')
    })

    it('silently refreshes stale cache in background', async () => {
      const stale = makeCard('p1')
      const fresh = makeCard('p2')
      vi.mocked(readCacheT).mockReturnValue({ data: [stale], ts: 0 })
      vi.mocked(isCacheFresh).mockReturnValue(false)
      vi.mocked(discoverProfiles).mockResolvedValue([fresh])

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)

      expect(screen.getByTestId('card-p1')).toBeTruthy()
      await waitFor(() => expect(screen.queryByTestId('card-p1')).toBeNull())
      expect(screen.getByTestId('card-p2')).toBeTruthy()
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
  })

  describe('fresh cache — skip refetch', () => {
    it('does not call discoverProfiles when cache is fresh', async () => {
      const card = makeCard('p1')
      vi.mocked(readCacheT).mockReturnValue({ data: [card], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)

      await act(async () => { await Promise.resolve() })
      expect(discoverProfiles).not.toHaveBeenCalled()
    })
  })

  describe('markSwiped', () => {
    it('sets swiped=true on the matching profile without removing it', async () => {
      const card = makeCard('p1', false)
      vi.mocked(readCacheT).mockReturnValue({ data: [card], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)

      expect(screen.getByTestId('card-p1').textContent).toContain('false')
      await act(async () => { screen.getByTestId('mark-swiped').click() })

      expect(screen.getByTestId('card-p1').textContent).toContain('true')
      expect(screen.getByTestId('count').textContent).toBe('1')
    })

    it('writes updated profiles to cache', async () => {
      const card = makeCard('p1')
      vi.mocked(readCacheT).mockReturnValue({ data: [card], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)
      await act(async () => { screen.getByTestId('mark-swiped').click() })

      expect(writeCacheT).toHaveBeenCalledWith('cm_swipe_discover', [
        expect.objectContaining({ swiped: true }),
      ])
    })

    it('does not affect other profiles', async () => {
      const c1 = makeCard('p1')
      const c2 = makeCard('p2')
      vi.mocked(readCacheT).mockReturnValue({ data: [c1, c2], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)
      await act(async () => { screen.getByTestId('mark-swiped').click() })

      expect(screen.getByTestId('card-p1').textContent).toContain('true')
      expect(screen.getByTestId('card-p2').textContent).toContain('false')
    })
  })

  describe('removeProfile', () => {
    it('removes the matching profile from the list', async () => {
      const card = makeCard('p1')
      vi.mocked(readCacheT).mockReturnValue({ data: [card], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)

      expect(screen.getByTestId('count').textContent).toBe('1')
      await act(async () => { screen.getByTestId('remove').click() })

      expect(screen.getByTestId('count').textContent).toBe('0')
      expect(screen.queryByTestId('card-p1')).toBeNull()
    })

    it('writes updated list to cache after removal', async () => {
      const c1 = makeCard('p1')
      const c2 = makeCard('p2')
      vi.mocked(readCacheT).mockReturnValue({ data: [c1, c2], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)
      await act(async () => { screen.getByTestId('remove').click() })

      expect(writeCacheT).toHaveBeenCalledWith('cm_swipe_discover', [c2])
    })

    it('leaves other profiles intact', async () => {
      const c1 = makeCard('p1')
      const c2 = makeCard('p2')
      vi.mocked(readCacheT).mockReturnValue({ data: [c1, c2], ts: Date.now() })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)
      await act(async () => { screen.getByTestId('remove').click() })

      expect(screen.getByTestId('card-p2')).toBeTruthy()
    })
  })

  describe('event subscriptions', () => {
    it('subscribes to interest:created, post:created, post:updated, post:cancelled, app:resumed', () => {
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(discoverProfiles).mockResolvedValue([])

      render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)

      const events = onSubscribe.mock.calls.map(c => c[0])
      expect(events).toContain('interest:created')
      expect(events).toContain('post:created')
      expect(events).toContain('post:updated')
      expect(events).toContain('post:cancelled')
      expect(events).toContain('app:resumed')
    })
  })

  describe('error handling', () => {
    it('does not crash when discoverProfiles throws', async () => {
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(discoverProfiles).mockRejectedValue(new Error('network error'))

      // Should render without throwing
      expect(() => render(<SwipeDiscoverProvider><Probe /></SwipeDiscoverProvider>)).not.toThrow()
      await act(async () => { await Promise.resolve() })
    })
  })
})
