'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Interest, PartnerRequest, Profile } from '@/lib/types/database'

export interface MatchResult {
  matched: boolean
  matchedProfile?: {
    display_name: string
    photo_url: string
    phone: string | null
  }
  requestDetails?: {
    climbing_type: string
    location_name: string
    date: string
  }
}

export async function createInterest(requestId: string, toUserId: string): Promise<MatchResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('interests').insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    request_id: requestId,
  })

  if (error && error.code !== '23505') throw new Error(error.message)

  // Check for mutual interest
  const { data: mutualInterest } = await supabase
    .from('interests')
    .select('id, request_id')
    .eq('from_user_id', toUserId)
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .limit(1)
    .single()

  if (mutualInterest) {
    // Auto-accept both interests
    await Promise.all([
      supabase.from('interests').update({ status: 'accepted' as const }).eq('from_user_id', toUserId).eq('to_user_id', user.id).eq('status', 'pending'),
      supabase.from('interests').update({ status: 'accepted' as const }).eq('from_user_id', user.id).eq('to_user_id', toUserId).eq('request_id', requestId),
    ])

    // Mark both requests as matched
    await Promise.all([
      supabase.from('partner_requests').update({ status: 'matched' as const }).eq('id', requestId),
      supabase.from('partner_requests').update({ status: 'matched' as const }).eq('id', mutualInterest.request_id),
    ])

    // Get matched profile with phone for messaging
    const { data: matchedProfile } = await supabase
      .from('profiles')
      .select('display_name, photo_url, phone')
      .eq('id', toUserId)
      .single()

    const { data: request } = await supabase
      .from('partner_requests')
      .select('climbing_type, location_name, date')
      .eq('id', requestId)
      .single()

    return {
      matched: true,
      matchedProfile: matchedProfile || undefined,
      requestDetails: request || undefined,
    }
  }

  return { matched: false }
}

export interface InboxItem {
  interest: Interest
  fromProfile: Profile
  request: PartnerRequest
  phone: string | null
}

export async function getInbox(): Promise<InboxItem[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: interests } = await supabase
    .from('interests')
    .select('*')
    .eq('to_user_id', user.id)
    .order('created_at', { ascending: false })

  if (!interests || interests.length === 0) return []

  const fromUserIds = [...new Set(interests.map(i => i.from_user_id))]
  const requestIds = [...new Set(interests.map(i => i.request_id))]

  const [{ data: profiles }, { data: requests }] = await Promise.all([
    supabase.from('profiles').select('*').in('id', fromUserIds),
    supabase.from('partner_requests').select('*').in('id', requestIds),
  ])

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))
  const requestMap = new Map((requests || []).map(r => [r.id, r]))

  return interests.map(interest => {
    const profile = profileMap.get(interest.from_user_id)!
    return {
      interest,
      fromProfile: profile,
      request: requestMap.get(interest.request_id)!,
      phone: interest.status === 'accepted' ? profile?.phone : null,
    }
  }).filter(item => item.fromProfile && item.request)
}

export async function getSentInterests(): Promise<InboxItem[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: interests } = await supabase
    .from('interests')
    .select('*')
    .eq('from_user_id', user.id)
    .order('created_at', { ascending: false })

  if (!interests || interests.length === 0) return []

  const toUserIds = [...new Set(interests.map(i => i.to_user_id))]
  const requestIds = [...new Set(interests.map(i => i.request_id))]

  const [{ data: profiles }, { data: requests }] = await Promise.all([
    supabase.from('profiles').select('*').in('id', toUserIds),
    supabase.from('partner_requests').select('*').in('id', requestIds),
  ])

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))
  const requestMap = new Map((requests || []).map(r => [r.id, r]))

  return interests.map(interest => {
    const profile = profileMap.get(interest.to_user_id)!
    return {
      interest,
      fromProfile: profile,
      request: requestMap.get(interest.request_id)!,
      phone: interest.status === 'accepted' ? profile?.phone : null,
    }
  }).filter(item => item.fromProfile && item.request)
}

export async function acceptInterest(interestId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('interests')
    .update({ status: 'accepted' as const })
    .eq('id', interestId)
    .eq('to_user_id', user.id)

  if (error) throw new Error(error.message)

  const { data: interest } = await supabase
    .from('interests')
    .select('request_id')
    .eq('id', interestId)
    .single()

  if (interest) {
    await supabase
      .from('partner_requests')
      .update({ status: 'matched' as const })
      .eq('id', interest.request_id)
  }
}

export async function declineInterest(interestId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('interests')
    .update({ status: 'declined' as const })
    .eq('id', interestId)
    .eq('to_user_id', user.id)

  if (error) throw new Error(error.message)
}

export async function getAcceptedContactInfo(interestId: string): Promise<{ phone: string | null; displayName: string } | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: interest } = await supabase
    .from('interests')
    .select('*')
    .eq('id', interestId)
    .eq('status', 'accepted')
    .single()

  if (!interest) return null
  if (interest.from_user_id !== user.id && interest.to_user_id !== user.id) return null

  const otherUserId = interest.from_user_id === user.id ? interest.to_user_id : interest.from_user_id

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone, display_name')
    .eq('id', otherUserId)
    .single()

  return profile ? { phone: profile.phone, displayName: profile.display_name } : null
}

export async function getPendingInterestCount(): Promise<number> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('interests')
    .select('*', { count: 'exact', head: true })
    .eq('to_user_id', user.id)
    .eq('status', 'pending')

  return count || 0
}
