'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PartnerRequest, Profile, GearSet } from '@/lib/types/database'

export interface DiscoverFilters {
  date: string
  location_name?: string
  climbing_type?: string
  time_of_day?: string
}

export interface ScoredCard {
  request: PartnerRequest
  profile: Profile
  score: number
}

function timeOverlap(req: PartnerRequest, timeOfDay?: string): number {
  if (req.flexible) return 10
  if (!timeOfDay || timeOfDay === 'flexible') return 10
  if (!req.start_time) return 10

  const startHour = parseInt(req.start_time.split(':')[0])
  if (timeOfDay === 'morning' && startHour < 12) return 30
  if (timeOfDay === 'afternoon' && startHour >= 12 && startHour < 17) return 30
  if (timeOfDay === 'evening' && startHour >= 17) return 30
  return 0
}

function gearCompatibility(userGear: GearSet, needsGear: GearSet): number {
  let score = 0
  const keys: (keyof GearSet)[] = ['rope', 'quickdraws', 'belayDevice', 'crashPad', 'helmet']
  for (const key of keys) {
    if (needsGear[key] && userGear[key]) score += 2
  }
  return Math.min(score, 10)
}

export async function discoverRequests(filters: DiscoverFilters): Promise<ScoredCard[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

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

    if (request.weight_relevant) {
      if (myProfile?.share_weight && myProfile.weight_kg && profile.share_weight && profile.weight_kg) {
        const diff = Math.abs(Number(myProfile.weight_kg) - Number(profile.weight_kg))
        if (request.max_weight_difference_kg && diff > Number(request.max_weight_difference_kg)) {
          score = -1
        }
      }
    }

    const sanitizedProfile = { ...profile }
    if (!sanitizedProfile.share_weight) {
      sanitizedProfile.weight_kg = null
    }
    sanitizedProfile.phone = null

    return { request, profile: sanitizedProfile, score }
  })
    .filter(s => s.score >= 0)
    .sort((a, b) => b.score - a.score || new Date(b.request.created_at).getTime() - new Date(a.request.created_at).getTime())

  return scored
}
