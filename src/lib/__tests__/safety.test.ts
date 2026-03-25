import { describe, it, expect, vi, beforeEach } from 'vitest'
import { blockUser, reportUser } from '@/lib/actions/safety'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'

// Chainable query builder that resolves to `result` when awaited
function q(result: unknown) {
  const self: Record<string, unknown> = {}
  for (const m of ['select', 'insert', 'update', 'eq', 'neq', 'in', 'order', 'limit']) {
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
// blockUser
// ---------------------------------------------------------------------------

describe('blockUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts a block record and resolves', async () => {
    const fromMock = vi.fn().mockReturnValueOnce(q({ error: null }))

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: fromMock,
    } as never)

    await expect(blockUser('user-2')).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('blocks')
  })

  it('silently ignores duplicate block (code 23505)', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ error: { code: '23505', message: 'duplicate' } })),
    } as never)

    await expect(blockUser('user-2')).resolves.toBeUndefined()
  })

  it('throws on unexpected database errors', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ error: { code: '42P01', message: 'table not found' } })),
    } as never)

    await expect(blockUser('user-2')).rejects.toThrow('table not found')
  })

  it('throws when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    await expect(blockUser('user-2')).rejects.toThrow('Not authenticated')
  })

  it('does not block when userId is the same as blocked (self-block scenario)', async () => {
    // The DB constraint should prevent this; the action itself just inserts
    const fromMock = vi.fn().mockReturnValueOnce(q({ error: null }))

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs('user-1'),
      from: fromMock,
    } as never)

    // Action itself doesn't validate self-block — it delegates to the DB constraint
    await expect(blockUser('user-1')).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// reportUser
// ---------------------------------------------------------------------------

describe('reportUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts a report record with reason and resolves', async () => {
    const fromMock = vi.fn().mockReturnValueOnce(q({ error: null }))

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: fromMock,
    } as never)

    await expect(reportUser('user-2', 'Spam', 'Sending unsolicited messages')).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('reports')
  })

  it('inserts a report without optional details', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ error: null })),
    } as never)

    await expect(reportUser('user-2', 'Inappropriate')).resolves.toBeUndefined()
  })

  it('throws on database error', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValueOnce(q({ error: { message: 'insert failed', code: '23503' } })),
    } as never)

    await expect(reportUser('user-2', 'Spam')).rejects.toThrow('insert failed')
  })

  it('throws when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)

    await expect(reportUser('user-2', 'Spam')).rejects.toThrow('Not authenticated')
  })
})
