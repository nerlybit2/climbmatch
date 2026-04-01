import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createInterest,
  getInbox,
  getSentInterests,
  acceptInterest,
  declineInterest,
  getPendingInterestCount,
  getApplicantCounts,
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
  instagram: '@alice_climbs',
  facebook: 'alice.climbs',
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

  it('returns matched: true with poster profile and request details', async () => {
    const posterProfile = { display_name: 'Alice', photo_url: '/alice.jpg', phone: '+972501234', instagram: '@alice', facebook: null }
    const reqDetails = { location_name: 'Siurana', date: '2025-07-01', user_id: 'user-2' }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: { id: 'user-1' }, error: null }))   // profile check
        .mockReturnValueOnce(q({ error: null }))                            // insert interest
        .mockReturnValueOnce(q({ data: { display_name: 'Me' }, error: null })) // myProfile (parallel[0])
        .mockReturnValueOnce(q({ data: posterProfile, error: null }))          // matchedProfile (parallel[1])
        .mockReturnValueOnce(q({ data: reqDetails, error: null })),             // requestDetails (parallel[2])
    } as never)

    const result = await createInterest('req-1', 'user-2')
    expect(result).toMatchObject({ matched: true, matchedProfile: posterProfile, requestDetails: reqDetails })
  })

  it('includes instagram and facebook in matchedProfile', async () => {
    const posterProfile = { display_name: 'Alice', photo_url: '/alice.jpg', phone: '+972501234', instagram: '@alice_climbs', facebook: 'alice.climbs' }
    const reqDetails = { location_name: 'Siurana', date: '2025-07-01', user_id: 'user-2' }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: { id: 'user-1' }, error: null }))           // profile check
        .mockReturnValueOnce(q({ error: null }))                                    // insert interest
        .mockReturnValueOnce(q({ data: { display_name: 'Me' }, error: null }))     // myProfile (parallel[0])
        .mockReturnValueOnce(q({ data: posterProfile, error: null }))               // matchedProfile (parallel[1])
        .mockReturnValueOnce(q({ data: reqDetails, error: null })),                 // requestDetails (parallel[2])
    } as never)

    const result = await createInterest('req-1', 'user-2')
    expect(result.matchedProfile?.instagram).toBe('@alice_climbs')
    expect(result.matchedProfile?.facebook).toBe('alice.climbs')
  })

  it('returns matched: false on duplicate insert (code 23505)', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: { id: 'user-1' }, error: null }))
        .mockReturnValueOnce(q({ error: { code: '23505', message: 'duplicate' } })),
    } as never)

    const result = await createInterest('req-1', 'user-2')
    expect(result.matched).toBe(false)
  })

  it('throws on unexpected insert error', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: { id: 'user-1' }, error: null })) // profile check
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
    // getInboxData fetches received and sent interests in parallel (2 from() calls)
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [], error: null })) // received interests
        .mockReturnValueOnce(q({ data: [], error: null })), // sent interests
    } as never)

    expect(await getInbox()).toEqual([])
  })

  it('returns correctly joined inbox items', async () => {
    // getInboxData: 1) received interests, 2) sent interests, 3) profiles, 4) partner_requests
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [interestFixture], error: null })) // received interests
        .mockReturnValueOnce(q({ data: [], error: null }))                // sent interests
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))  // profiles
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })), // requests
    } as never)

    const items = await getInbox()
    expect(items).toHaveLength(1)
    expect(items[0].interest.id).toBe('int-1')
    expect(items[0].fromProfile.display_name).toBe('Alice')
    expect(items[0].request.location_name).toBe('Siurana')
  })

  it('exposes phone for pending interests (request owner can contact applicants)', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [{ ...interestFixture, status: 'pending' }], error: null })) // received
        .mockReturnValueOnce(q({ data: [], error: null }))                                           // sent
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))                             // profiles
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })),                            // requests
    } as never)

    const items = await getInbox()
    expect(items[0].phone).toBe('+972501234')
  })

  it('exposes phone for accepted interests', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [{ ...interestFixture, status: 'accepted' }], error: null })) // received
        .mockReturnValueOnce(q({ data: [], error: null }))                                            // sent
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))                              // profiles
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })),                             // requests
    } as never)

    const items = await getInbox()
    expect(items[0].phone).toBe('+972501234')
  })

  it('filters out items with missing profile or request', async () => {
    const orphanInterest = { ...interestFixture, from_user_id: 'unknown-user' }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [interestFixture, orphanInterest], error: null })) // received
        .mockReturnValueOnce(q({ data: [], error: null }))                                 // sent
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))                   // profiles (only one)
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })),                  // requests
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

    // getInboxData: 1) received interests, 2) sent interests, 3) profiles, 4) partner_requests
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [], error: null }))                  // received interests
        .mockReturnValueOnce(q({ data: [sentInterest], error: null }))      // sent interests
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))    // profiles
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })),   // requests
    } as never)

    const items = await getSentInterests()
    expect(items).toHaveLength(1)
    expect(items[0].interest.status).toBe('pending')
    expect(items[0].phone).toBeNull() // pending → no phone
  })

  it('hides instagram and facebook when interest is pending', async () => {
    const sentInterest = { ...interestFixture, from_user_id: 'user-1', to_user_id: 'user-2', status: 'pending' }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [], error: null }))                  // received interests
        .mockReturnValueOnce(q({ data: [sentInterest], error: null }))      // sent interests
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))    // profiles
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })),   // requests
    } as never)

    const items = await getSentInterests()
    expect(items[0].instagram).toBeNull()
    expect(items[0].facebook).toBeNull()
  })

  it('exposes instagram and facebook when interest is accepted', async () => {
    const sentInterest = { ...interestFixture, from_user_id: 'user-1', to_user_id: 'user-2', status: 'accepted' }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [], error: null }))                  // received interests
        .mockReturnValueOnce(q({ data: [sentInterest], error: null }))      // sent interests
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))    // profiles
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })),   // requests
    } as never)

    const items = await getSentInterests()
    expect(items[0].instagram).toBe('@alice_climbs')
    expect(items[0].facebook).toBe('alice.climbs')
  })
})

// ---------------------------------------------------------------------------
// getInbox – social contact fields
// ---------------------------------------------------------------------------

describe('getInbox – social contact fields', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exposes instagram and facebook for inbox (applicant side)', async () => {
    // getInboxData: 1) received interests, 2) sent interests, 3) profiles, 4) partner_requests
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [interestFixture], error: null })) // received interests
        .mockReturnValueOnce(q({ data: [], error: null }))                // sent interests
        .mockReturnValueOnce(q({ data: [profileFixture], error: null }))  // profiles
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })), // requests
    } as never)

    const items = await getInbox()
    expect(items[0].instagram).toBe('@alice_climbs')
    expect(items[0].facebook).toBe('alice.climbs')
  })

  it('returns null instagram/facebook when profile has none', async () => {
    const profileNoSocial = { ...profileFixture, instagram: null, facebook: null }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [interestFixture], error: null }))   // received interests
        .mockReturnValueOnce(q({ data: [], error: null }))                   // sent interests
        .mockReturnValueOnce(q({ data: [profileNoSocial], error: null }))    // profiles
        .mockReturnValueOnce(q({ data: [requestFixture], error: null })),    // requests
    } as never)

    const items = await getInbox()
    expect(items[0].instagram).toBeNull()
    expect(items[0].facebook).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// acceptInterest
// ---------------------------------------------------------------------------

describe('acceptInterest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('resolves successfully and returns match result', async () => {
    const matchedProfile = { display_name: 'Alice', photo_url: '/alice.jpg', phone: '+972501234' }
    const requestDetails = { location_name: 'Siurana', date: '2025-07-01' }

    // acceptInterest does 5 from() calls:
    // 1. interests.update(...)           — update status
    // 2. interests.select(...)           — fetch from_user_id + request_id
    // 3. profiles.select('display_name') — myProfile (parallel[0])
    // 4. profiles.select('display_name, photo_url, ...')  — matchedProfile (parallel[1])
    // 5. partner_requests.select(...)    — requestDetails (parallel[2])
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ error: null }))                                                          // update interest
        .mockReturnValueOnce(q({ data: { from_user_id: 'user-2', request_id: 'req-1' }, error: null }))  // select interest
        .mockReturnValueOnce(q({ data: { display_name: 'Me' }, error: null }))                            // myProfile (parallel[0])
        .mockReturnValueOnce(q({ data: matchedProfile, error: null }))                                    // matchedProfile (parallel[1])
        .mockReturnValueOnce(q({ data: requestDetails, error: null })),                                   // requestDetails (parallel[2])
    } as never)

    await expect(acceptInterest('int-1')).resolves.toMatchObject({ matched: true })
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
    // declineInterest does:
    // 1. interests.select('from_user_id, request_id')...single() — fetch before updating
    // 2. interests.update({ status: 'declined' })...             — update status
    // 3. (conditional) partner_requests.select('location_name')  — for notification (fires when interest found)
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))  // select interest → null, skips notification
        .mockReturnValueOnce(q({ error: null })),             // update status
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
    // When the update fails, the error is thrown. The select comes first — mock it with null data,
    // then mock the update with the error.
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))  // select interest (before update)
        .mockReturnValueOnce(q({ error: { message: 'not found', code: 'PGRST116' } })), // update error
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

// ---------------------------------------------------------------------------
// getApplicantCounts
// ---------------------------------------------------------------------------

describe('getApplicantCounts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty object for empty array', async () => {
    expect(await getApplicantCounts([])).toEqual({})
  })

  it('returns counts keyed by request_id', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({
        data: [{ request_id: 'req-1' }, { request_id: 'req-1' }, { request_id: 'req-2' }],
        error: null,
      })),
    } as never)
    const counts = await getApplicantCounts(['req-1', 'req-2'])
    expect(counts['req-1']).toBe(2)
    expect(counts['req-2']).toBe(1)
  })

  it('returns empty object when no interests found', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ data: [], error: null })),
    } as never)
    expect(await getApplicantCounts(['req-1'])).toEqual({})
  })
})
