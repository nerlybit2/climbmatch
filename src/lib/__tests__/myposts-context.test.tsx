import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MyPostsProvider, useMyPosts } from '@/contexts/MyPostsContext'
import type { PartnerRequest } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/actions/requests', () => ({
  getMyRequests: vi.fn(),
}))

vi.mock('@/lib/actions/interests', () => ({
  getApplicantCounts: vi.fn(),
}))

const onSubscribe = vi.fn<(event: string, cb: () => void) => () => void>()

vi.mock('@/lib/cache', () => ({
  readCacheT: vi.fn(),
  writeCacheT: vi.fn(),
  isCacheFresh: vi.fn().mockReturnValue(false),
  CACHE_KEYS: { myPosts: 'cm_myposts' },
}))

vi.mock('@/lib/dataEvents', () => ({
  on: (...args: [string, () => void]) => {
    onSubscribe(...args)
    return () => {}
  },
}))

import { getMyRequests } from '@/lib/actions/requests'
import { getApplicantCounts } from '@/lib/actions/interests'
import { readCacheT, writeCacheT, isCacheFresh } from '@/lib/cache'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePost(id: string, status = 'active'): PartnerRequest {
  return {
    id, user_id: 'u1', location_name: 'Crag', date: '2025-07-01',
    start_time: null, end_time: null, flexible: false,
    location_type: 'crag', goal_type: 'any', desired_grade_range: null,
    notes: null, needs_gear: {}, carpool_needed: false,
    weight_relevant: false, max_weight_difference_kg: null,
    status, created_at: '', updated_at: '',
  } as unknown as PartnerRequest
}

function Probe() {
  const { posts, applicantCounts, loading } = useMyPosts()
  return (
    <>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="count">{posts.length}</div>
      {posts.map(p => (
        <div key={p.id} data-testid={`post-${p.id}`}>
          {p.status}|{applicantCounts[p.id] ?? 0}
        </div>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MyPostsContext', () => {
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
        const { loading } = useMyPosts()
        if (firstRenderLoading.length === 0) firstRenderLoading.push(loading)
        return null
      }

      const post = makePost('p1')
      vi.mocked(readCacheT).mockReturnValue({
        data: { posts: [post], applicantCounts: { p1: 2 } }, ts: Date.now(),
      })
      vi.mocked(isCacheFresh).mockReturnValue(true)
      vi.mocked(getMyRequests).mockResolvedValue([post])
      vi.mocked(getApplicantCounts).mockResolvedValue({ p1: 2 })

      render(<MyPostsProvider><StateCapture /></MyPostsProvider>)

      expect(firstRenderLoading[0]).toBe(true)
    })
  })

  describe('no cache — cold start', () => {
    it('shows loading then renders posts after fetch', async () => {
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(getMyRequests).mockResolvedValue([makePost('p1')])
      vi.mocked(getApplicantCounts).mockResolvedValue({ p1: 3 })

      render(<MyPostsProvider><Probe /></MyPostsProvider>)

      expect(screen.getByTestId('loading').textContent).toBe('true')
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
      expect(screen.getByTestId('count').textContent).toBe('1')
      expect(screen.getByTestId('post-p1').textContent).toBe('active|3')
    })

    it('writes fetched data to timestamped cache', async () => {
      const post = makePost('p1')
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(getMyRequests).mockResolvedValue([post])
      vi.mocked(getApplicantCounts).mockResolvedValue({ p1: 2 })

      render(<MyPostsProvider><Probe /></MyPostsProvider>)

      await waitFor(() => expect(writeCacheT).toHaveBeenCalled())
      expect(writeCacheT).toHaveBeenCalledWith('cm_myposts', {
        posts: [post],
        applicantCounts: { p1: 2 },
      })
    })

    it('skips getApplicantCounts when no active posts', async () => {
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(getMyRequests).mockResolvedValue([makePost('p1', 'cancelled')])

      render(<MyPostsProvider><Probe /></MyPostsProvider>)

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
      expect(getApplicantCounts).not.toHaveBeenCalled()
    })
  })

  describe('stale cache — stale-while-revalidate', () => {
    it('shows cached data immediately with loading=false', () => {
      const post = makePost('p1')
      vi.mocked(readCacheT).mockReturnValue({
        data: { posts: [post], applicantCounts: { p1: 1 } }, ts: 0,
      })
      vi.mocked(isCacheFresh).mockReturnValue(false)
      vi.mocked(getMyRequests).mockResolvedValue([post])
      vi.mocked(getApplicantCounts).mockResolvedValue({ p1: 1 })

      render(<MyPostsProvider><Probe /></MyPostsProvider>)

      expect(screen.getByTestId('loading').textContent).toBe('false')
      expect(screen.getByTestId('count').textContent).toBe('1')
    })

    it('silently refreshes stale cache and updates applicant counts', async () => {
      const post = makePost('p1')
      vi.mocked(readCacheT).mockReturnValue({
        data: { posts: [post], applicantCounts: { p1: 1 } }, ts: 0,
      })
      vi.mocked(isCacheFresh).mockReturnValue(false)
      vi.mocked(getMyRequests).mockResolvedValue([post])
      vi.mocked(getApplicantCounts).mockResolvedValue({ p1: 5 })

      render(<MyPostsProvider><Probe /></MyPostsProvider>)

      // Stale count shown first
      expect(screen.getByTestId('post-p1').textContent).toBe('active|1')

      // Background refresh updates count
      await waitFor(() => expect(screen.getByTestId('post-p1').textContent).toBe('active|5'))
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
  })

  describe('fresh cache — skip refetch', () => {
    it('does not call getMyRequests when cache is fresh', async () => {
      const post = makePost('p1')
      vi.mocked(readCacheT).mockReturnValue({
        data: { posts: [post], applicantCounts: {} }, ts: Date.now(),
      })
      vi.mocked(isCacheFresh).mockReturnValue(true)

      render(<MyPostsProvider><Probe /></MyPostsProvider>)

      await act(async () => { await Promise.resolve() })
      expect(getMyRequests).not.toHaveBeenCalled()
    })
  })

  describe('event subscriptions', () => {
    it('subscribes to post and interest events + app:resumed', () => {
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(getMyRequests).mockResolvedValue([])
      vi.mocked(getApplicantCounts).mockResolvedValue({})

      render(<MyPostsProvider><Probe /></MyPostsProvider>)

      const events = onSubscribe.mock.calls.map(c => c[0])
      expect(events).toContain('post:created')
      expect(events).toContain('post:updated')
      expect(events).toContain('post:cancelled')
      expect(events).toContain('interest:accepted')
      expect(events).toContain('interest:declined')
      expect(events).toContain('app:resumed')
    })

    it('does not subscribe to interest:created (irrelevant to own posts)', () => {
      vi.mocked(readCacheT).mockReturnValue(null)
      vi.mocked(getMyRequests).mockResolvedValue([])
      vi.mocked(getApplicantCounts).mockResolvedValue({})

      render(<MyPostsProvider><Probe /></MyPostsProvider>)

      const events = onSubscribe.mock.calls.map(c => c[0])
      expect(events).not.toContain('interest:created')
    })
  })
})
