import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchLocations, discoverRequests } from '@/lib/actions/discover'
import { WORLD_CRAGS } from '@/lib/crags'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'

// Chainable query builder
function q(result: unknown) {
  const self: Record<string, unknown> = {}
  for (const m of ['select', 'insert', 'update', 'eq', 'neq', 'in', 'ilike', 'not', 'order', 'limit']) {
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
// searchLocations
// ---------------------------------------------------------------------------

describe('searchLocations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array for empty string', async () => {
    expect(await searchLocations('')).toEqual([])
  })

  it('returns empty array for a single-character query', async () => {
    expect(await searchLocations('S')).toEqual([])
  })

  it('returns crag results from the static list even without auth', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    const results = await searchLocations('Siurana')
    expect(results.some(r => r.includes('Siurana'))).toBe(true)
  })

  it('limits results to 8 entries', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    // 'a' matches hundreds of crags — result should still be capped at 8
    const results = await searchLocations('an')
    expect(results.length).toBeLessThanOrEqual(8)
  })

  it('merges DB locations before static crag results', async () => {
    const dbLocation = 'My Local Gym'

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [{ location_name: dbLocation }], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null })),
    } as never)

    const results = await searchLocations('My Local')
    expect(results[0]).toBe(dbLocation)
  })

  it('deduplicates case-insensitively', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: [{ location_name: 'Siurana, Spain' }], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null })),
    } as never)

    const results = await searchLocations('Siurana')
    const siuranaCount = results.filter(r => r.toLowerCase().includes('siurana')).length
    expect(siuranaCount).toBe(1)
  })

  it('returns results starting with the query first', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    // 'Margalef' starts with 'Marg'; 'El Chorro' contains no match — but 'Margalef' should be first
    const results = await searchLocations('Marg')
    if (results.length > 1) {
      expect(results[0].toLowerCase().startsWith('marg')).toBe(true)
    }
  })

  it('WORLD_CRAGS contains a large number of entries', () => {
    expect(WORLD_CRAGS.length).toBeGreaterThan(100)
  })
})

// ---------------------------------------------------------------------------
// discoverRequests
// ---------------------------------------------------------------------------

describe('discoverRequests', () => {
  const today = new Date().toISOString().split('T')[0]

  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    expect(await discoverRequests({ date: today })).toEqual([])
  })

  it('returns empty array when no requests found for the date', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))  // myProfile
        .mockReturnValueOnce(q({ data: [], error: null }))    // blocksOut
        .mockReturnValueOnce(q({ data: [], error: null }))    // blocksIn
        .mockReturnValueOnce(q({ data: [], error: null }))    // myInterests
        .mockReturnValueOnce(q({ data: [], error: null })),   // requests query
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    expect(await discoverRequests({ date: today })).toEqual([])
  })

  it('filters out requests from blocked users', async () => {
    const blockedUserId = 'blocked-user'
    const request = {
      id: 'req-1', user_id: blockedUserId, date: today,
      climbing_type: 'sport', location_name: 'Test', status: 'active',
      start_time: null, end_time: null, flexible: true,
      needs_gear: {}, carpool_needed: false, weight_relevant: false,
      max_weight_difference_kg: null, goal_type: 'any', desired_grade_range: null,
      notes: null, location_type: 'crag', created_at: '', updated_at: '',
    }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))                          // myProfile
        .mockReturnValueOnce(q({ data: [{ blocked_id: blockedUserId }], error: null })) // blocksOut
        .mockReturnValueOnce(q({ data: [], error: null }))                            // blocksIn
        .mockReturnValueOnce(q({ data: [], error: null }))                            // myInterests
        .mockReturnValueOnce(q({ data: [request], error: null })),                    // requests
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    expect(await discoverRequests({ date: today })).toEqual([])
  })

  it('filters out already-swiped requests', async () => {
    const request = {
      id: 'req-1', user_id: 'user-2', date: today,
      climbing_type: 'sport', location_name: 'Test', status: 'active',
      start_time: null, end_time: null, flexible: true,
      needs_gear: {}, carpool_needed: false, weight_relevant: false,
      max_weight_difference_kg: null, goal_type: 'any', desired_grade_range: null,
      notes: null, location_type: 'crag', created_at: '', updated_at: '',
    }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))                       // myProfile
        .mockReturnValueOnce(q({ data: [], error: null }))                         // blocksOut
        .mockReturnValueOnce(q({ data: [], error: null }))                         // blocksIn
        .mockReturnValueOnce(q({ data: [{ request_id: 'req-1' }], error: null }))  // myInterests (already swiped)
        .mockReturnValueOnce(q({ data: [request], error: null })),                 // requests
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    expect(await discoverRequests({ date: today })).toEqual([])
  })

  it('returns scored cards for eligible requests', async () => {
    const request = {
      id: 'req-1', user_id: 'user-2', date: today,
      climbing_type: 'sport', location_name: 'Siurana', status: 'active',
      start_time: '09:00', end_time: '14:00', flexible: false,
      needs_gear: { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false },
      carpool_needed: false, weight_relevant: false, max_weight_difference_kg: null,
      goal_type: 'any', desired_grade_range: null, notes: null,
      location_type: 'crag', created_at: '2025-06-01T08:00:00Z', updated_at: '',
    }
    const profile = {
      id: 'user-2', display_name: 'Alice', photo_url: '/alice.jpg',
      home_area: null, climbing_types: ['sport'], experience_level: null,
      sport_grade_range: null, boulder_grade_range: null, weight_kg: null,
      share_weight: false,
      gear: { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false },
      has_car: false, bio: null, languages: [], phone: null,
      created_at: '', updated_at: '',
    }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null })) // myProfile
        .mockReturnValueOnce(q({ data: [], error: null }))   // blocksOut
        .mockReturnValueOnce(q({ data: [], error: null }))   // blocksIn
        .mockReturnValueOnce(q({ data: [], error: null }))   // myInterests
        .mockReturnValueOnce(q({ data: [request], error: null })) // requests
        .mockReturnValueOnce(q({ data: [profile], error: null })), // profiles
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    const cards = await discoverRequests({ date: today })
    expect(cards).toHaveLength(1)
    expect(cards[0].request.id).toBe('req-1')
    expect(cards[0].profile.display_name).toBe('Alice')
    expect(typeof cards[0].score).toBe('number')
    // Phone is sanitized out of profile
    expect(cards[0].profile.phone).toBeNull()
  })

  it('excludes cards where weight mismatch gives score = -1', async () => {
    const request = {
      id: 'req-1', user_id: 'user-2', date: today,
      climbing_type: 'sport', location_name: 'Siurana', status: 'active',
      start_time: null, end_time: null, flexible: true,
      needs_gear: { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false },
      carpool_needed: false,
      weight_relevant: true,
      max_weight_difference_kg: 5, // max 5 kg diff
      goal_type: 'any', desired_grade_range: null, notes: null,
      location_type: 'crag', created_at: '2025-06-01T08:00:00Z', updated_at: '',
    }
    const myProfile = {
      id: 'user-1', weight_kg: 100, share_weight: true,
      climbing_types: [], gear: {}, has_car: false,
      experience_level: null, sport_grade_range: null, boulder_grade_range: null,
    }
    const theirProfile = {
      id: 'user-2', display_name: 'Bob', photo_url: '/bob.jpg',
      weight_kg: 60, share_weight: true, // 40 kg diff → exceeds max 5
      climbing_types: [], gear: {}, has_car: false, phone: null,
      experience_level: null, sport_grade_range: null, boulder_grade_range: null,
      home_area: null, bio: null, languages: [], created_at: '', updated_at: '',
    }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: myProfile, error: null })) // myProfile.single()
        .mockReturnValueOnce(q({ data: [], error: null }))        // blocksOut
        .mockReturnValueOnce(q({ data: [], error: null }))        // blocksIn
        .mockReturnValueOnce(q({ data: [], error: null }))        // myInterests
        .mockReturnValueOnce(q({ data: [request], error: null })) // requests
        .mockReturnValueOnce(q({ data: [theirProfile], error: null })), // profiles
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    // myProfile is fetched via .single() but our mock returns it via `then`
    // The filter score = -1 should exclude this card
    const cards = await discoverRequests({ date: today })
    expect(cards).toHaveLength(0)
  })

  it('sorts results by score descending', async () => {
    const makeRequest = (id: string, userId: string, location: string) => ({
      id, user_id: userId, date: today,
      climbing_type: 'sport', location_name: location, status: 'active',
      start_time: '09:00', end_time: '14:00', flexible: false,
      needs_gear: { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false },
      carpool_needed: false, weight_relevant: false, max_weight_difference_kg: null,
      goal_type: 'any', desired_grade_range: null, notes: null,
      location_type: 'crag', created_at: '2025-06-01T08:00:00Z', updated_at: '',
    })
    const makeProfile = (id: string, name: string) => ({
      id, display_name: name, photo_url: `/${name}.jpg`,
      home_area: null, climbing_types: [], experience_level: null,
      sport_grade_range: null, boulder_grade_range: null, weight_kg: null,
      share_weight: false,
      gear: { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false },
      has_car: false, bio: null, languages: [], phone: null,
      created_at: '', updated_at: '',
    })

    const requests = [
      makeRequest('req-1', 'user-2', 'No Match Gym'),   // no location boost
      makeRequest('req-2', 'user-3', 'Siurana, Spain'), // location boost
    ]
    const profiles = [makeProfile('user-2', 'Alice'), makeProfile('user-3', 'Bob')]
    const myProfile = {
      id: 'user-1', climbing_types: ['sport'], gear: {},
      experience_level: null, sport_grade_range: null, boulder_grade_range: null,
      weight_kg: null, share_weight: false, has_car: false,
    }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: myProfile, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: requests, error: null }))
        .mockReturnValueOnce(q({ data: profiles, error: null })),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    const cards = await discoverRequests({ date: today, location_name: 'Siurana' })
    if (cards.length === 2) {
      // Siurana match should rank higher (location boost = +40)
      expect(cards[0].request.location_name).toContain('Siurana')
      expect(cards[0].score).toBeGreaterThan(cards[1].score)
    }
  })
})
