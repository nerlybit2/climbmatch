'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PartnerRequest, Profile, GearSet } from '@/lib/types/database'
import { timeOverlap, gearCompatibility, experienceLevelScore } from '@/lib/scoring'
import { WORLD_CRAGS } from '@/lib/crags'

export interface DiscoverFilters {
  date: string
  location_name?: string
  climbing_type?: string
  time_of_day?: string
}

export interface CompatibilityInfo {
  gearMatches: string[]       // gear items user has that request needs
  gradeOverlap: boolean       // does user's grade range match request's desired grade
  userGradeRange: string | null
  requestedGrade: string | null
  carpoolAvailable: boolean   // request needs ride AND user has car
  carpoolNeeded: boolean      // request needs a ride
  timeMatch: boolean          // time preferences align
}

export interface ScoredCard {
  request: PartnerRequest
  profile: Profile
  score: number
  compatibility: CompatibilityInfo
}

export async function searchLocations(query: string): Promise<string[]> {
  if (!query || query.length < 2) return []

  const lower = query.toLowerCase()
  const seen = new Set<string>()
  const dbResults: string[] = []
  const cragResults: string[] = []

  // Search the world crags list (instant, no DB call)
  for (const crag of WORLD_CRAGS) {
    if (crag.toLowerCase().includes(lower)) {
      cragResults.push(crag)
    }
  }

  // Also search DB for user-created locations
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const [{ data: requests }, { data: profiles }] = await Promise.all([
      supabase.from('partner_requests').select('location_name').ilike('location_name', `%${query}%`).limit(30),
      supabase.from('profiles').select('home_area').not('home_area', 'is', null).ilike('home_area', `%${query}%`).limit(10),
    ])

    for (const r of requests || []) {
      const key = r.location_name.toLowerCase()
      if (!seen.has(key)) { seen.add(key); dbResults.push(r.location_name) }
    }
    for (const p of profiles || []) {
      if (p.home_area) {
        const key = p.home_area.toLowerCase()
        if (!seen.has(key)) { seen.add(key); dbResults.push(p.home_area) }
      }
    }
  }

  // Merge: DB results first (active community locations), then world crags
  const merged: string[] = []
  for (const loc of dbResults) {
    if (merged.length >= 8) break
    merged.push(loc)
  }
  for (const crag of cragResults) {
    if (merged.length >= 8) break
    const key = crag.toLowerCase()
    if (!seen.has(key)) { seen.add(key); merged.push(crag) }
  }

  // Sort: starts-with first, then alphabetical
  merged.sort((a, b) => {
    const aStarts = a.toLowerCase().startsWith(lower) ? 0 : 1
    const bStarts = b.toLowerCase().startsWith(lower) ? 0 : 1
    return aStarts - bStarts || a.localeCompare(b)
  })

  return merged.slice(0, 8)
}

export async function discoverRequests(filters: DiscoverFilters): Promise<ScoredCard[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Expire stale requests on each discovery query
  try { await supabase.rpc('expire_old_requests') } catch {}

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: blocksOut } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id)

  const { data: blocksIn } = await supabase
    .from('blocks')
    .select('blocker_id')
    .eq('blocked_id', user.id)

  const blockedIds = new Set([
    ...(blocksOut || []).map(b => b.blocked_id),
    ...(blocksIn || []).map(b => b.blocker_id),
  ])

  const { data: myInterests } = await supabase
    .from('interests')
    .select('request_id')
    .eq('from_user_id', user.id)

  const swipedRequestIds = new Set((myInterests || []).map(i => i.request_id))

  let query = supabase
    .from('partner_requests')
    .select('*')
    .eq('status', 'active')
    .eq('date', filters.date)
    .neq('user_id', user.id)

  if (filters.climbing_type) {
    query = query.eq('climbing_type', filters.climbing_type)
  }

  const { data: requests } = await query.order('created_at', { ascending: false })
  if (!requests || requests.length === 0) return []

  const eligible = requests.filter(r => !blockedIds.has(r.user_id) && !swipedRequestIds.has(r.id))

  const userIds = [...new Set(eligible.map(r => r.user_id))]
  if (userIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  const scored: ScoredCard[] = eligible.map(request => {
    const profile = profileMap.get(request.user_id)!
    let score = 0

    score += timeOverlap(request, filters.time_of_day)

    if (filters.location_name && request.location_name.toLowerCase().includes(filters.location_name.toLowerCase())) {
      score += 40
    }

    if (myProfile && myProfile.climbing_types.includes(request.climbing_type)) {
      score += 25
    }

    if (myProfile) {
      score += gearCompatibility(myProfile.gear as GearSet, request.needs_gear as GearSet)
    }

    if (request.desired_grade_range && myProfile) {
      const myGrade = request.climbing_type === 'boulder' ? myProfile.boulder_grade_range : myProfile.sport_grade_range
      if (myGrade && request.desired_grade_range === myGrade) {
        score += 10
      }
    }

    score += experienceLevelScore(myProfile?.experience_level ?? null, profile.experience_level ?? null)

    if (request.weight_relevant) {
      if (myProfile?.share_weight && myProfile.weight_kg && profile.share_weight && profile.weight_kg) {
        const diff = Math.abs(Number(myProfile.weight_kg) - Number(profile.weight_kg))
        if (request.max_weight_difference_kg && diff > Number(request.max_weight_difference_kg)) {
          score = -1
        }
      }
    }

    // Build compatibility info
    const gearKeys: (keyof GearSet)[] = ['rope', 'quickdraws', 'belayDevice', 'crashPad', 'helmet']
    const gearLabels: Record<keyof GearSet, string> = {
      rope: 'Rope', quickdraws: 'Quickdraws', belayDevice: 'Belay Device',
      crashPad: 'Crash Pad', helmet: 'Helmet',
    }
    const gearMatches = gearKeys.filter(k => (request.needs_gear as GearSet)?.[k] && (myProfile?.gear as GearSet)?.[k]).map(k => gearLabels[k])

    const myGradeForCompat = request.climbing_type === 'boulder' ? myProfile?.boulder_grade_range : myProfile?.sport_grade_range
    const gradeOverlap = !!(request.desired_grade_range && myGradeForCompat && request.desired_grade_range === myGradeForCompat)

    const compatibility: CompatibilityInfo = {
      gearMatches,
      gradeOverlap,
      userGradeRange: myGradeForCompat || null,
      requestedGrade: request.desired_grade_range || null,
      carpoolAvailable: !!(request.carpool_needed && myProfile?.has_car),
      carpoolNeeded: !!request.carpool_needed,
      timeMatch: timeOverlap(request, filters.time_of_day) >= 30,
    }

    const sanitizedProfile = { ...profile }
    if (!sanitizedProfile.share_weight) {
      sanitizedProfile.weight_kg = null
    }
    sanitizedProfile.phone = null

    return { request, profile: sanitizedProfile, score, compatibility }
  })
    .filter(s => s.score >= 0)
    .sort((a, b) => b.score - a.score || new Date(b.request.created_at).getTime() - new Date(a.request.created_at).getTime())

  return scored
}
