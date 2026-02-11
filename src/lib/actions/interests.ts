'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Interest, PartnerRequest, Profile } from '@/lib/types/database'

export async function createInterest(requestId: string, toUserId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('interests').insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    request_id: requestId,
  })

  if (error && error.code !== '23505') throw new Error(error.message)
}

export interface InboxItem {
  interest: Interest
  fromProfile: Profile
  request: PartnerRequest
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

  return interests.map(interest => ({
    interest,
    fromProfile: profileMap.get(interest.from_user_id)!,
    request: requestMap.get(interest.request_id)!,
  })).filter(item => item.fromProfile && item.request)
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

  return interests.map(interest => ({
    interest,
    fromProfile: profileMap.get(interest.to_user_id)!,
    request: requestMap.get(interest.request_id)!,
  })).filter(item => item.fromProfile && item.request)
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
