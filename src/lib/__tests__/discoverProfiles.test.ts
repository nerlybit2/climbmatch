import { describe, it, expect, vi, beforeEach } from 'vitest'
import { discoverProfiles } from '@/lib/actions/discoverProfiles'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Chainable builder that resolves to `result` when awaited. */
function q(result: unknown) {
  const self: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'neq', 'in', 'is', 'gte', 'order', 'limit', 'insert']) {
    self[m] = vi.fn(() => self)
  }
  self.single    = vi.fn(() => Promise.resolve(result))
  self.maybeSingle = vi.fn(() => Promise.resolve(result))
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

function makeProfile(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    display_name: `User ${id}`,
    photo_url: null,
    phone: '+97250000000',
    share_weight: false,
    weight_kg: 70,
    updated_at: '2025-07-01T00:00:00Z',
    ...overrides,
  }
}

function makePost(id: string, userId: string) {
  return {
    id,
    user_id: userId,
    date: '2025-07-10',
    location_name: 'Crag',
    status: 'active',
  }
}

/** Sets up the Supabase mock for discoverProfiles.
 *  Call order: blocksOut | blocksIn | myProfileInterests (parallel) → profiles → posts */
function setupMock({
  blocksOut = [] as unknown[],
  blocksIn = [] as unknown[],
  swipedIds = [] as unknown[],
  profiles = [] as unknown[],
  posts = [] as unknown[],
} = {}) {
  vi.mocked(createServerSupabaseClient).mockResolvedValue({
    auth: authAs(),
    from: vi.fn()
      .mockReturnValueOnce(q({ data: blocksOut, error: null }))   // blocksOut (parallel 1)
      .mockReturnValueOnce(q({ data: blocksIn, error: null }))    // blocksIn  (parallel 2)
      .mockReturnValueOnce(q({ data: swipedIds, error: null }))   // myProfileInterests (parallel 3)
      .mockReturnValueOnce(q({ data: profiles, error: null }))    // all profiles
      .mockReturnValueOnce(q({ data: posts, error: null })),      // active posts
  } as never)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('discoverProfiles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when not authenticated', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: authAs(null),
      from: vi.fn(),
    } as never)
    expect(await discoverProfiles()).toEqual([])
  })

  it('returns empty array when no profiles exist', async () => {
    setupMock({ profiles: [] })
    expect(await discoverProfiles()).toEqual([])
  })

  it('includes profiles with their posts attached', async () => {
    const profile = makeProfile('u2')
    const post = makePost('p1', 'u2')
    setupMock({ profiles: [profile], posts: [post] })

    const cards = await discoverProfiles()
    expect(cards).toHaveLength(1)
    expect(cards[0].profile.id).toBe('u2')
    expect(cards[0].posts).toHaveLength(1)
    expect(cards[0].posts[0].id).toBe('p1')
  })

  it('returns profile with empty posts array when they have no posts', async () => {
    const profile = makeProfile('u2')
    setupMock({ profiles: [profile], posts: [] })

    const cards = await discoverProfiles()
    expect(cards[0].posts).toEqual([])
  })

  it('filters out blocked users (outgoing blocks)', async () => {
    const p1 = makeProfile('u2')
    const p2 = makeProfile('u3')
    setupMock({
      blocksOut: [{ blocked_id: 'u3' }],
      profiles: [p1, p2],
    })

    const cards = await discoverProfiles()
    expect(cards).toHaveLength(1)
    expect(cards[0].profile.id).toBe('u2')
  })

  it('filters out blocked users (incoming blocks)', async () => {
    const p1 = makeProfile('u2')
    const p2 = makeProfile('u3')
    setupMock({
      blocksIn: [{ blocker_id: 'u3' }],
      profiles: [p1, p2],
    })

    const cards = await discoverProfiles()
    expect(cards).toHaveLength(1)
    expect(cards[0].profile.id).toBe('u2')
  })

  it('marks profiles as swiped when profile-level interest exists', async () => {
    const profile = makeProfile('u2')
    setupMock({
      swipedIds: [{ to_user_id: 'u2' }],
      profiles: [profile],
    })

    const cards = await discoverProfiles()
    expect(cards[0].swiped).toBe(true)
  })

  it('marks profile as not swiped when no interest exists', async () => {
    const profile = makeProfile('u2')
    setupMock({ profiles: [profile] })

    const cards = await discoverProfiles()
    expect(cards[0].swiped).toBe(false)
  })

  it('strips phone from returned profiles', async () => {
    const profile = makeProfile('u2', { phone: '+97250123456' })
    setupMock({ profiles: [profile] })

    const cards = await discoverProfiles()
    expect(cards[0].profile.phone).toBeNull()
  })

  it('hides weight_kg when share_weight is false', async () => {
    const profile = makeProfile('u2', { share_weight: false, weight_kg: 75 })
    setupMock({ profiles: [profile] })

    const cards = await discoverProfiles()
    expect(cards[0].profile.weight_kg).toBeNull()
  })

  it('keeps weight_kg when share_weight is true', async () => {
    const profile = makeProfile('u2', { share_weight: true, weight_kg: 75 })
    setupMock({ profiles: [profile] })

    const cards = await discoverProfiles()
    expect(cards[0].profile.weight_kg).toBe(75)
  })

  describe('sort order', () => {
    it('puts unswiped cards before swiped ones', async () => {
      const p1 = makeProfile('u2')
      const p2 = makeProfile('u3')
      setupMock({
        swipedIds: [{ to_user_id: 'u2' }], // u2 is swiped
        profiles: [p1, p2],
      })

      const cards = await discoverProfiles()
      expect(cards[0].profile.id).toBe('u3') // unswiped first
      expect(cards[1].profile.id).toBe('u2') // swiped second
    })

    it('puts profiles with posts before those without, within same swiped status', async () => {
      const p1 = makeProfile('u2') // no posts
      const p2 = makeProfile('u3') // has posts
      const post = makePost('p1', 'u3')
      setupMock({ profiles: [p1, p2], posts: [post] })

      const cards = await discoverProfiles()
      expect(cards[0].profile.id).toBe('u3') // has posts → first
      expect(cards[1].profile.id).toBe('u2') // no posts → second
    })
  })

  it('returns empty array when all profiles are blocked', async () => {
    const profile = makeProfile('u2')
    setupMock({
      blocksOut: [{ blocked_id: 'u2' }],
      profiles: [profile],
    })
    expect(await discoverProfiles()).toEqual([])
  })
})
