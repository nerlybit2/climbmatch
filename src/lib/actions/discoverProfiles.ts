'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Profile, PartnerRequest } from '@/lib/types/database'

export interface ProfileCard {
  profile: Profile
  posts: PartnerRequest[]
  swiped: boolean
}

export async function discoverProfiles(): Promise<ProfileCard[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fire independent queries in parallel
  const [
    { data: blocksOut },
    { data: blocksIn },
    { data: myProfileInterests },
  ] = await Promise.all([
    supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id),
    supabase.from('blocks').select('blocker_id').eq('blocked_id', user.id),
    // Get profile-level interests (where request_id IS NULL) to mark swiped
    supabase.from('interests').select('to_user_id').eq('from_user_id', user.id).is('request_id', null),
  ])

  const blockedIds = new Set([
    ...(blocksOut || []).map(b => b.blocked_id),
    ...(blocksIn || []).map(b => b.blocker_id),
  ])
  const swipedUserIds = new Set((myProfileInterests || []).map(i => i.to_user_id))

  // Fetch all profiles except current user
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id)
    .order('updated_at', { ascending: false })
    .limit(200)

  if (!profiles || profiles.length === 0) return []

  // Filter out blocked users
  const eligible = profiles.filter(p => !blockedIds.has(p.id))
  const eligibleIds = eligible.map(p => p.id)

  if (eligibleIds.length === 0) return []

  // Fetch active posts for all eligible profiles in one query
  const { data: allPosts } = await supabase
    .from('partner_requests')
    .select('*')
    .in('user_id', eligibleIds)
    .eq('status', 'active')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })

  // Group posts by user
  const postsByUser = new Map<string, PartnerRequest[]>()
  for (const post of allPosts || []) {
    const existing = postsByUser.get(post.user_id) || []
    existing.push(post)
    postsByUser.set(post.user_id, existing)
  }

  // Sanitize and build cards
  const cards: ProfileCard[] = eligible.map(profile => {
    const sanitized = { ...profile }
    if (!sanitized.share_weight) sanitized.weight_kg = null
    sanitized.phone = null

    return {
      profile: sanitized,
      posts: postsByUser.get(profile.id) || [],
      swiped: swipedUserIds.has(profile.id),
    }
  })

  // Sort: unswiped first, then by whether they have posts, then by recency
  cards.sort((a, b) => {
    const aS = a.swiped ? 1 : 0
    const bS = b.swiped ? 1 : 0
    if (aS !== bS) return aS - bS
    const aP = a.posts.length > 0 ? 0 : 1
    const bP = b.posts.length > 0 ? 0 : 1
    if (aP !== bP) return aP - bP
    return 0
  })

  return cards
}
