'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PartnerRequest, Profile, GearSet } from '@/lib/types/database'
import { timeOverlap } from '@/lib/scoring'
import { WORLD_CRAGS } from '@/lib/crags'

export interface DiscoverFilters {
  date_from?: string
  date_to?: string
  location_name?: string
  time_of_day?: string
}

export interface CompatibilityInfo {
  gearMatches: string[]       // gear items user has that request needs
  carpoolAvailable: boolean   // request needs ride AND user has car
  carpoolNeeded: boolean      // request needs a ride
  timeMatch: boolean          // time preferences align
}

export interface ScoredCard {
  request: PartnerRequest
  profile: Profile
  compatibility: CompatibilityInfo
  swiped: boolean
  distanceKm: number | null
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]
  const oneYearAhead = new Date(Date.now() + 365 * 86_400_000).toISOString().split('T')[0]
  const dateFrom = filters.date_from || sevenDaysAgo
  const dateTo = filters.date_to || oneYearAhead

  // Fire independent queries in parallel
  const [
    { data: myProfile },
    { data: blocksOut },
    { data: blocksIn },
    { data: myInterests },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id),
    supabase.from('blocks').select('blocker_id').eq('blocked_id', user.id),
    supabase.from('interests').select('request_id').eq('from_user_id', user.id),
  ])

  // Build requests query — apply DB-level filters directly
  let requestsQuery = supabase
    .from('partner_requests')
    .select('*')
    .eq('status', 'active')
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .neq('user_id', user.id)
    .order('date', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200)

  if (filters.location_name?.trim()) {
    requestsQuery = requestsQuery.ilike('location_name', `%${filters.location_name.trim()}%`)
  }

  const { data: requests } = await requestsQuery

  if (!requests || requests.length === 0) return []

  const blockedIds = new Set([
    ...(blocksOut || []).map(b => b.blocked_id),
    ...(blocksIn || []).map(b => b.blocker_id),
  ])
  const swipedRequestIds = new Set((myInterests || []).map(i => i.request_id))

  const eligible = requests.filter(r => !blockedIds.has(r.user_id))

  const userIds = [...new Set(eligible.map(r => r.user_id))]
  if (userIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  // time_of_day has no DB column — filter client-side
  const timeFiltered = filters.time_of_day
    ? eligible.filter(r => timeOverlap(r, filters.time_of_day) > 0)
    : eligible

  const cards: ScoredCard[] = timeFiltered
    .filter(r => profileMap.has(r.user_id))
    .map(request => {
      const profile = profileMap.get(request.user_id)!

      const gearKeys: (keyof GearSet)[] = ['rope', 'quickdraws', 'belayDevice', 'crashPad', 'helmet']
      const gearLabels: Record<keyof GearSet, string> = {
        rope: 'Rope', quickdraws: 'Quickdraws', belayDevice: 'Belay Device',
        crashPad: 'Crash Pad', helmet: 'Helmet',
      }
      const gearMatches = gearKeys
        .filter(k => (request.needs_gear as GearSet)?.[k] && (myProfile?.gear as GearSet)?.[k])
        .map(k => gearLabels[k])

      const compatibility: CompatibilityInfo = {
        gearMatches,
        carpoolAvailable: !!(request.carpool_needed && myProfile?.has_car),
        carpoolNeeded: !!request.carpool_needed,
        timeMatch: timeOverlap(request, filters.time_of_day) >= 30,
      }

      const distanceKm =
        myProfile?.lat != null && myProfile?.lng != null && profile.lat != null && profile.lng != null
          ? Math.round(haversineKm(myProfile.lat, myProfile.lng, profile.lat, profile.lng))
          : null

      const sanitizedProfile = { ...profile }
      if (!sanitizedProfile.share_weight) sanitizedProfile.weight_kg = null
      sanitizedProfile.phone = null
      sanitizedProfile.lat = null
      sanitizedProfile.lng = null

      return { request, profile: sanitizedProfile, compatibility, swiped: swipedRequestIds.has(request.id), distanceKm }
    })

  // Sort: future unswiped → future swiped → past unswiped → past swiped
  // Within each bucket: nearby first (null distance sorts last), then by date
  cards.sort((a, b) => {
    const aPast = a.request.date < today ? 1 : 0
    const bPast = b.request.date < today ? 1 : 0
    if (aPast !== bPast) return aPast - bPast
    const aSwiped = a.swiped ? 1 : 0
    const bSwiped = b.swiped ? 1 : 0
    if (aSwiped !== bSwiped) return aSwiped - bSwiped
    const aDist = a.distanceKm ?? Infinity
    const bDist = b.distanceKm ?? Infinity
    if (Math.abs(aDist - bDist) > 1) return aDist - bDist
    return a.request.date.localeCompare(b.request.date)
  })

  return cards
}
