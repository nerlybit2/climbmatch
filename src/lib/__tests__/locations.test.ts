import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCustomLocations, addCustomLocation } from '@/lib/actions/locations'

function authAs(userId: string | null = 'user-1') {
  return {
    getUser: vi.fn().mockResolvedValue({
      data: { user: userId ? { id: userId } : null },
    }),
  }
}

describe('getCustomLocations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns names for the given type', async () => {
    const rows = [{ name: 'Gita' }, { name: 'Secret Wall' }]
    const chain: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'order']) chain[m] = vi.fn(() => chain)
    chain.then = (_res: (v: unknown) => unknown) =>
      Promise.resolve({ data: rows, error: null }).then(_res)

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValue(chain),
    } as never)

    const result = await getCustomLocations('crag')
    expect(result).toEqual(['Gita', 'Secret Wall'])
  })

  it('returns empty array when there are no custom locations', async () => {
    const chain: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'order']) chain[m] = vi.fn(() => chain)
    chain.then = (_res: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(_res)

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValue(chain),
    } as never)

    const result = await getCustomLocations('gym')
    expect(result).toEqual([])
  })

  it('filters by the correct type column', async () => {
    const eqMock = vi.fn(() => chain)
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn(() => chain)
    chain.eq = eqMock
    chain.order = vi.fn(() => chain)
    chain.then = (_res: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(_res)

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValue(chain),
    } as never)

    await getCustomLocations('gym')
    expect(eqMock).toHaveBeenCalledWith('type', 'gym')
  })
})

describe('addCustomLocation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts with trimmed name, type, and user id', async () => {
    const insertMock = vi.fn().mockReturnValue({
      throwOnError: vi.fn().mockReturnValue(Promise.resolve()),
    })

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs('user-42'),
      from: vi.fn().mockReturnValue({ insert: insertMock }),
    } as never)

    await addCustomLocation('  Gita  ', 'crag')

    expect(insertMock).toHaveBeenCalledWith({
      name: 'Gita',
      type: 'crag',
      created_by: 'user-42',
    })
  })

  it('does nothing when user is not authenticated', async () => {
    const fromMock = vi.fn()

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: fromMock,
    } as never)

    await addCustomLocation('Gita', 'crag')
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('silently ignores duplicate errors', async () => {
    const insertMock = vi.fn().mockReturnValue({
      throwOnError: vi.fn().mockReturnValue(Promise.reject(new Error('duplicate key'))),
    })

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(),
      from: vi.fn().mockReturnValue({ insert: insertMock }),
    } as never)

    await expect(addCustomLocation('Gita', 'crag')).resolves.toBeUndefined()
  })
})
