import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMyRequests, cancelRequest, getRequestById, updateRequest } from '@/lib/actions/requests'
import type { RequestPayload } from '@/lib/actions/requests'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'

// Chainable query builder that resolves to `result` when awaited
function q(result: unknown) {
  const self: Record<string, unknown> = {}
  for (const m of ['select', 'insert', 'update', 'upsert', 'eq', 'neq', 'in', 'order', 'limit']) {
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

const requestFixture = {
  id: 'req-1',
  user_id: 'user-1',
  date: '2025-07-01',
  start_time: '09:00',
  end_time: '14:00',
  flexible: false,
  location_type: 'crag',
  location_name: 'Siurana',
  climbing_type: 'sport',
  goal_type: 'any',
  desired_grade_range: null,
  notes: null,
  needs_gear: {},
  carpool_needed: false,
  weight_relevant: false,
  max_weight_difference_kg: null,
  status: 'active',
  created_at: '2025-06-01T08:00:00Z',
  updated_at: '2025-06-01T08:00:00Z',
}

// ---------------------------------------------------------------------------
// getMyRequests
// ---------------------------------------------------------------------------

describe('getMyRequests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    expect(await getMyRequests()).toEqual([])
  })

  it('returns the user requests from the database', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ data: [requestFixture], error: null })),
    } as never)

    const result = await getMyRequests()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('req-1')
    expect(result[0].location_name).toBe('Siurana')
  })

  it('returns empty array when user has no requests', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ data: [], error: null })),
    } as never)

    expect(await getMyRequests()).toEqual([])
  })

  it('returns empty array when data is null', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ data: null, error: null })),
    } as never)

    expect(await getMyRequests()).toEqual([])
  })

  it('returns multiple requests preserving order', async () => {
    const req2 = { ...requestFixture, id: 'req-2', date: '2025-07-05' }

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ data: [requestFixture, req2], error: null })),
    } as never)

    const result = await getMyRequests()
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('req-1')
    expect(result[1].id).toBe('req-2')
  })
})

// ---------------------------------------------------------------------------
// cancelRequest
// ---------------------------------------------------------------------------

describe('cancelRequest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls update with status: cancelled and resolves', async () => {
    const updateChain = q({ error: null })
    // cancelRequest does 3 from() calls:
    // 1. partner_requests.select('location_name')... (Promise.all[0])
    // 2. interests.select('from_user_id')...        (Promise.all[1])
    // 3. partner_requests.update(...)               (the actual cancel)
    const fromMock = vi.fn()
      .mockReturnValueOnce(q({ data: { location_name: 'Siurana' }, error: null })) // select location
      .mockReturnValueOnce(q({ data: [], error: null }))                            // select pending interests
      .mockReturnValueOnce(updateChain)                                             // update status

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: fromMock,
    } as never)

    await expect(cancelRequest('req-1')).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('partner_requests')
    // Verify the update method was called (it's on the chain object)
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'cancelled' })
  })

  it('throws when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    await expect(cancelRequest('req-1')).rejects.toThrow('Not authenticated')
  })

  it('throws on database error', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ error: new Error('foreign key violation') })),
    } as never)

    await expect(cancelRequest('req-1')).rejects.toThrow()
  })

  it('restricts the update to the requesting user with eq filters', async () => {
    const updateChain = q({ error: null })
    // cancelRequest does 3 from() calls: select location, select pending interests, update status
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs('user-1'),
      from: vi.fn()
        .mockReturnValueOnce(q({ data: { location_name: 'Siurana' }, error: null })) // select location
        .mockReturnValueOnce(q({ data: [], error: null }))                            // select pending interests
        .mockReturnValueOnce(updateChain),                                            // update status
    } as never)

    await cancelRequest('req-1')

    // Should have applied eq('id', 'req-1') and eq('user_id', 'user-1') on the update chain
    const eqCalls = (updateChain.eq as ReturnType<typeof vi.fn>).mock.calls
    expect(eqCalls).toContainEqual(['id', 'req-1'])
    expect(eqCalls).toContainEqual(['user_id', 'user-1'])
  })
})

// ---------------------------------------------------------------------------
// getRequestById
// ---------------------------------------------------------------------------

const payloadFixture: RequestPayload = {
  date: '2025-07-10',
  start_time: '10:00',
  end_time: '13:00',
  flexible: false,
  location_type: 'gym',
  location_name: 'Blochaus',
  goal_type: 'project',
  desired_grade_range: '7a-7b',
  notes: null,
  needs_gear: { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false },
  carpool_needed: false,
  weight_relevant: false,
  max_weight_difference_kg: null,
}


describe('getRequestById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    expect(await getRequestById('req-1')).toBeNull()
  })

  it('returns the request when found', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ data: requestFixture, error: null })),
    } as never)

    const result = await getRequestById('req-1')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('req-1')
    expect(result?.location_name).toBe('Siurana')
  })

  it('returns null when request not found', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ data: null, error: null })),
    } as never)

    expect(await getRequestById('nonexistent')).toBeNull()
  })

  it('scopes the query to the authenticated user', async () => {
    const chain = q({ data: requestFixture, error: null })
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs('user-1'),
      from: vi.fn().mockReturnValueOnce(chain),
    } as never)

    await getRequestById('req-1')

    const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls
    expect(eqCalls).toContainEqual(['id', 'req-1'])
    expect(eqCalls).toContainEqual(['user_id', 'user-1'])
  })
})

// ---------------------------------------------------------------------------
// updateRequest
// ---------------------------------------------------------------------------

describe('updateRequest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    await expect(updateRequest('req-1', payloadFixture)).rejects.toThrow('Not authenticated')
  })

  it('resolves when update succeeds', async () => {
    const chain = q({ error: null, data: [{ id: 'req-1' }] })
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(chain),
    } as never)

    await expect(updateRequest('req-1', payloadFixture)).resolves.toBeUndefined()
  })

  it('throws on database error', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ error: new Error('not found'), data: null })),
    } as never)

    await expect(updateRequest('req-1', payloadFixture)).rejects.toThrow()
  })

  it('throws when no rows matched (request inactive or missing)', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ error: null, data: [] })),
    } as never)

    await expect(updateRequest('req-1', payloadFixture)).rejects.toThrow('Request not found or no longer active')
  })

  it('calls update with the payload', async () => {
    const chain = q({ error: null, data: [{ id: 'req-1' }] })
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(chain),
    } as never)

    await updateRequest('req-1', payloadFixture)

    expect(chain.update).toHaveBeenCalledWith(payloadFixture)
  })

  it('scopes the update to the owner and active status', async () => {
    const chain = q({ error: null, data: [{ id: 'req-1' }] })
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs('user-1'),
      from: vi.fn().mockReturnValueOnce(chain),
    } as never)

    await updateRequest('req-1', payloadFixture)

    const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls
    expect(eqCalls).toContainEqual(['id', 'req-1'])
    expect(eqCalls).toContainEqual(['user_id', 'user-1'])
    expect(eqCalls).toContainEqual(['status', 'active'])
  })


})
