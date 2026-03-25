import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createInterest,
  getInbox,
  getSentInterests,
  acceptInterest,
  declineInterest,
  getPendingInterestCount,
} from '@/lib/actions/interests'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a chainable Supabase query builder that resolves to `result` when awaited. */
function q(result: unknown) {
  const self: Record<string, unknown> = {}
  for (const m of ['select', 'insert', 'update', 'upsert', 'eq', 'neq', 'in', 'ilike', 'not', 'order', 'limit']) {
    self[m] = vi.fn(() => self)
  }
  self.single = vi.fn(() => Promise.resolve(result))
  self.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej)
  return self
}

function authAs(userId: string | null = 'user-1') {
  return {
    getUser: vi.fn().mockResolvedValue({
      data: { user: userId ? { id: userId } : null },
    }),
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const profileFixture = {
  id: 'user-2',
  display_name: 'Alice',
  photo_url: '/alice.jpg',
  phone: '+972501234',
  home_area: 'Tel Aviv',
  climbing_types: ['sport'],
  experience_level: 'intermediate',
  sport_grade_range: '6b-7a',
  boulder_grade_range: null,
  weight_kg: null,
  share_weight: false,
  gear: {},
  has_car: false,
  bio: null,
  languages: [],
  created_at: '',
  updated_at: '',
}

const requestFixture = {
  id: 'req-1',
  user_id: 'user-2',
  climbing_type: 'sport',
  location_name: 'Siurana',
  date: '2025-07-01',
  start_time: '09:00',
  end_time: '14:00',
  flexible: false,
  location_type: 'crag',
  goal_type: 'any',
  desired_grade_range: null,
  notes: null,
  needs_gear: {},
  carpool_needed: false,
  weight_relevant: false,
  max_weight_difference_kg: null,
  status: 'active',
  created_at: '',
  updated_at: '',
}

const interestFixture = {
  id: 'int-1',
  from_user_id: 'user-2',
  to_user_id: 'user-1',
  request_id: 'req-1',
  status: 'pending',
  created_at: '',
  updated_at: '',
}

// ---------------------------------------------------------------------------
// createInterest
// ---------------------------------------------------------------------------

describe('createInterest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns { matched: false } when no mutual interest exists', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ error: null }))             // insert interest
        .mockReturnValueOnce(q({ data: null, error: null })), // single – no mutual
    } as never)

    const result = await createInterest('req-1', 'user-2')
    expect(result).toEqual({ matched: false })
  })

  it('returns { matched: true } with profile and request when mutual interest exists', async () => {
    const matchedProfile = { display_name: 'Alice', photo_url: '/alice.jpg', phone: '+972501234' }
    const requestDetails = { climbing_type: 'sport', location_name: 'Siurana', date: '2025-07-01' }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ error: null }))                                                     // insert
        .mockReturnValueOnce(q({ data: { id: 'mutual-id', request_id: 'req-mutual' }, error: null })) // single mutual
        .mockReturnValueOnce(q({ error: null }))                                                     // update interests (mutual)
        .mockReturnValueOnce(q({ error: null }))                                                     // update interests (mine)
        .mockReturnValueOnce(q({ error: null }))                                                     // update requests (req-1)
        .mockReturnValueOnce(q({ error: null }))                                                     // update requests (req-mutual)
        .mockReturnValueOnce(q({ data: matchedProfile, error: null }))                               // profile single
        .mockReturnValueOnce(q({ data: requestDetails, error: null })),                              // request single
    } as never)

    const result = await createInterest('req-1', 'user-2')
    expect(result.matched).toBe(true)
    expect(result.matchedProfile).toEqual(matchedProfile)
    expect(result.requestDetails).toEqual(requestDetails)
  })

  it('handles duplicate insert (code 23505) without throwing', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ error: { code: '23505', message: 'duplicate' } }))
        .mockReturnValueOnce(q({ data: null, error: null })),
    } as never)

    await expect(createInterest('req-1', 'user-2')).resolves.toEqual({ matched: false })
  })

  it('throws on unexpected insert error', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ error: { code: '42P01', message: 'table not found' } })),
    } as never)

    await expect(createInterest('req-1', 'user-2')).rejects.toThrow('table not found')
  })

  it('throws when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    await expect(createInterest('req-1', 'user-2')).rejects.toThrow('Not authenticated')
  })
})

// ---------------------------------------------------------------------------
// getInbox
// ---------------------------------------------------------------------------

describe('getInbox', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    expect(await getInbox()).toEqual([])
  })

  it('returns empty array when no interests exist', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ data: [], error: null })),
    } as never)

    expect(await getInbox()).toEqual([])
  })

  it('returns correctly joined inbox items', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [interestFixture], error: null })) // interests
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))  // profiles
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })), // requests
    } as never)

    const items = await getInbox()
    expect(items).toHaveLength(1)
    expect(items[0].interest.id).toBe('int-1')
    expect(items[0].fromProfile.display_name).toBe('Alice')
    expect(items[0].request.location_name).toBe('Siurana')
  })

  it('hides phone for pending interests', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [{ ...interestFixture, status: 'pending' }], error: null }))
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })),
    } as never)

    const items = await getInbox()
    expect(items[0].phone).toBeNull()
  })

  it('exposes phone for accepted interests', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [{ ...interestFixture, status: 'accepted' }], error: null }))
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })),
    } as never)

    const items = await getInbox()
    expect(items[0].phone).toBe('+972501234')
  })

  it('filters out items with missing profile or request', async () => {
    const orphanInterest = { ...interestFixture, from_user_id: 'unknown-user' }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [interestFixture, orphanInterest], error: null }))
        .mockReturnValueOnce(q({ data: [profileFixture], error: null })) // only one profile
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })),
    } as never)

    const items = await getInbox()
    expect(items).toHaveLength(1)
    expect(items[0].fromProfile.id).toBe('user-2')
  })
})

// ---------------------------------------------------------------------------
// getSentInterests
// ---------------------------------------------------------------------------

describe('getSentInterests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    expect(await getSentInterests()).toEqual([])
  })

  it('returns sent interests with joined data', async () => {
    const sentInterest = { ...interestFixture, from_user_id: 'user-1', to_user_id: 'user-2' }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [sentInterest], error: null }))
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })),
    } as never)

    const items = await getSentInterests()
    expect(items).toHaveLength(1)
    expect(items[0].interest.status).toBe('pending')
    expect(items[0].phone).toBeNull() // pending → no phone
  })
})

// ---------------------------------------------------------------------------
// acceptInterest
// ---------------------------------------------------------------------------

describe('acceptInterest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('resolves successfully and marks request as matched', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ error: null }))                                  // update interest
        .mockReturnValueOnce(q({ data: { request_id: 'req-1' }, error: null }))   // select single
        .mockReturnValueOnce(q({ error: null })),                                  // update request
    } as never)

    await expect(acceptInterest('int-1')).resolves.toBeUndefined()
  })

  it('throws when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    await expect(acceptInterest('int-1')).rejects.toThrow('Not authenticated')
  })

  it('throws on database error', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ error: { message: 'connection error', code: '08000' } })),
    } as never)

    await expect(acceptInterest('int-1')).rejects.toThrow('connection error')
  })
})

// ---------------------------------------------------------------------------
// declineInterest
// ---------------------------------------------------------------------------

describe('declineInterest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('resolves successfully', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ error: null })),
    } as never)

    await expect(declineInterest('int-1')).resolves.toBeUndefined()
  })

  it('throws when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    await expect(declineInterest('int-1')).rejects.toThrow('Not authenticated')
  })

  it('throws on database error', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ error: { message: 'not found', code: 'PGRST116' } })),
    } as never)

    await expect(declineInterest('int-1')).rejects.toThrow('not found')
  })
})

// ---------------------------------------------------------------------------
// getPendingInterestCount
// ---------------------------------------------------------------------------

describe('getPendingInterestCount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 0 when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    expect(await getPendingInterestCount()).toBe(0)
  })

  it('returns the count from the database', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ count: 7, error: null })),
    } as never)

    expect(await getPendingInterestCount()).toBe(7)
  })

  it('returns 0 when count is null', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ count: null, error: null })),
    } as never)

    expect(await getPendingInterestCount()).toBe(0)
  })
})
