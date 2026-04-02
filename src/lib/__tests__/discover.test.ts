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
  for (const m of ['select', 'insert', 'update', 'eq', 'neq', 'gte', 'lte', 'in', 'ilike', 'not', 'order', 'limit']) {
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

    expect(await discoverRequests({ date_from: today, date_to: today })).toEqual([])
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

    expect(await discoverRequests({ date_from: today, date_to: today })).toEqual([])
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

    expect(await discoverRequests({ date_from: today, date_to: today })).toEqual([])
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

    expect(await discoverRequests({ date_from: today, date_to: today })).toEqual([])
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

    const cards = await discoverRequests({ date_from: today, date_to: today })
    expect(cards).toHaveLength(1)
    expect(cards[0].request.id).toBe('req-1')
    expect(cards[0].profile.display_name).toBe('Alice')
    expect(cards[0].compatibility).toBeDefined()
    // Phone is sanitized out of profile
    expect(cards[0].profile.phone).toBeNull()
  })

  it('returns all results when no weight mismatch logic is applied', async () => {
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

    // Weight mismatch is no longer a filter — card is returned
    const cards = await discoverRequests({ date_from: today, date_to: today })
    expect(cards).toHaveLength(1)
  })

  // ── Filter: location_name (DB-level) ───────────────────────────────────────

  it('calls .ilike() on the requests query when location_name is provided', async () => {
    const requestsQ = q({ data: [], error: null })

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))  // myProfile
        .mockReturnValueOnce(q({ data: [], error: null }))    // blocksOut
        .mockReturnValueOnce(q({ data: [], error: null }))    // blocksIn
        .mockReturnValueOnce(q({ data: [], error: null }))    // myInterests
        .mockReturnValueOnce(requestsQ),                       // requests — captured
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    await discoverRequests({ date_from: today, date_to: today, location_name: 'Siurana' })

    expect(requestsQ.ilike).toHaveBeenCalledWith('location_name', '%Siurana%')
  })

  it('trims whitespace from location_name before passing to .ilike()', async () => {
    const requestsQ = q({ data: [], error: null })

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(requestsQ),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    await discoverRequests({ date_from: today, date_to: today, location_name: '  Siurana  ' })

    expect(requestsQ.ilike).toHaveBeenCalledWith('location_name', '%Siurana%')
  })

  it('does not call .ilike() when location_name is undefined', async () => {
    const requestsQ = q({ data: [], error: null })

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(requestsQ),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    await discoverRequests({ date_from: today, date_to: today })

    expect(requestsQ.ilike).not.toHaveBeenCalled()
  })

  it('does not call .ilike() when location_name is an empty string', async () => {
    const requestsQ = q({ data: [], error: null })

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(requestsQ),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    await discoverRequests({ date_from: today, date_to: today, location_name: '' })

    expect(requestsQ.ilike).not.toHaveBeenCalled()
  })

  // ── Filter: date_from / date_to (DB-level) ──────────────────────────────────

  it('passes date_from to .gte() on the requests query', async () => {
    const requestsQ = q({ data: [], error: null })
    const customDate = '2026-06-01'

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(requestsQ),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    await discoverRequests({ date_from: customDate, date_to: '2026-12-31' })

    expect(requestsQ.gte).toHaveBeenCalledWith('date', customDate)
  })

  it('passes date_to to .lte() on the requests query', async () => {
    const requestsQ = q({ data: [], error: null })
    const customDate = '2026-12-31'

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(requestsQ),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    await discoverRequests({ date_from: '2026-06-01', date_to: customDate })

    expect(requestsQ.lte).toHaveBeenCalledWith('date', customDate)
  })

  it('defaults date_from to today when not provided', async () => {
    const requestsQ = q({ data: [], error: null })

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(requestsQ),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    await discoverRequests({})

    expect(requestsQ.gte).toHaveBeenCalledWith('date', today)
  })

  it('defaults date_to to one year ahead when not provided', async () => {
    const requestsQ = q({ data: [], error: null })
    const oneYearAhead = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(requestsQ),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    await discoverRequests({})

    expect(requestsQ.lte).toHaveBeenCalledWith('date', oneYearAhead)
  })

  // ── Filter: time_of_day (client-side) ───────────────────────────────────────

  // Helpers shared across time_of_day tests
  const makeTimedRequest = (id: string, userId: string, startTime: string | null, flexible = false) => ({
    id, user_id: userId, date: today,
    climbing_type: 'sport', location_name: 'Test Crag', status: 'active',
    start_time: startTime, end_time: null, flexible,
    needs_gear: { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false },
    carpool_needed: false, weight_relevant: false, max_weight_difference_kg: null,
    goal_type: 'any', desired_grade_range: null, notes: null,
    location_type: 'crag', created_at: '2025-06-01T08:00:00Z', updated_at: '',
  })
  const makeSimpleProfile = (id: string, name: string) => ({
    id, display_name: name, photo_url: `/${name}.jpg`,
    home_area: null, climbing_types: [], experience_level: null,
    sport_grade_range: null, boulder_grade_range: null, weight_kg: null,
    share_weight: false, gear: {}, has_car: false, bio: null, languages: [],
    phone: null, created_at: '', updated_at: '',
  })

  it('time_of_day: morning — keeps morning requests (start < 12), excludes others', async () => {
    const morningReq  = makeTimedRequest('req-1', 'user-2', '09:00') // hour 9 → morning
    const eveningReq  = makeTimedRequest('req-2', 'user-3', '19:00') // hour 19 → evening

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [morningReq, eveningReq], error: null }))
        .mockReturnValueOnce(q({ data: [makeSimpleProfile('user-2', 'Alice'), makeSimpleProfile('user-3', 'Bob')], error: null })),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    const cards = await discoverRequests({ time_of_day: 'morning' })
    expect(cards).toHaveLength(1)
    expect(cards[0].request.id).toBe('req-1')
  })

  it('time_of_day: afternoon — keeps afternoon requests (12 ≤ start < 17), excludes others', async () => {
    const morningReq   = makeTimedRequest('req-1', 'user-2', '09:00')
    const afternoonReq = makeTimedRequest('req-2', 'user-3', '14:00')
    const eveningReq   = makeTimedRequest('req-3', 'user-4', '19:00')

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [morningReq, afternoonReq, eveningReq], error: null }))
        .mockReturnValueOnce(q({ data: [
          makeSimpleProfile('user-2', 'Alice'),
          makeSimpleProfile('user-3', 'Bob'),
          makeSimpleProfile('user-4', 'Carol'),
        ], error: null })),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    const cards = await discoverRequests({ time_of_day: 'afternoon' })
    expect(cards).toHaveLength(1)
    expect(cards[0].request.id).toBe('req-2')
  })

  it('time_of_day: evening — keeps evening requests (start ≥ 17), excludes others', async () => {
    const morningReq = makeTimedRequest('req-1', 'user-2', '09:00')
    const eveningReq = makeTimedRequest('req-2', 'user-3', '18:00')

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [morningReq, eveningReq], error: null }))
        .mockReturnValueOnce(q({ data: [makeSimpleProfile('user-2', 'Alice'), makeSimpleProfile('user-3', 'Bob')], error: null })),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    const cards = await discoverRequests({ time_of_day: 'evening' })
    expect(cards).toHaveLength(1)
    expect(cards[0].request.id).toBe('req-2')
  })

  it('time_of_day filter always keeps flexible requests', async () => {
    const flexibleReq = makeTimedRequest('req-1', 'user-2', '09:00', true) // flexible=true
    const eveningReq  = makeTimedRequest('req-2', 'user-3', '19:00')        // non-flexible evening

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [flexibleReq, eveningReq], error: null }))
        .mockReturnValueOnce(q({ data: [makeSimpleProfile('user-2', 'Alice'), makeSimpleProfile('user-3', 'Bob')], error: null })),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    // morning filter — flexible passes (timeOverlap returns 10), evening non-flexible is excluded
    const cards = await discoverRequests({ time_of_day: 'morning' })
    expect(cards).toHaveLength(1)
    expect(cards[0].request.id).toBe('req-1')
  })

  it('no time_of_day filter returns all requests regardless of start_time', async () => {
    const morningReq  = makeTimedRequest('req-1', 'user-2', '09:00')
    const eveningReq  = makeTimedRequest('req-2', 'user-3', '19:00')

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: null, error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [], error: null }))
        .mockReturnValueOnce(q({ data: [morningReq, eveningReq], error: null }))
        .mockReturnValueOnce(q({ data: [makeSimpleProfile('user-2', 'Alice'), makeSimpleProfile('user-3', 'Bob')], error: null })),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    const cards = await discoverRequests({})
    expect(cards).toHaveLength(2)
  })
})
