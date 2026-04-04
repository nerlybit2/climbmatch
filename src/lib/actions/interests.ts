'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/fcm'
import type { Interest, PartnerRequest, Profile } from '@/lib/types/database'

export interface MatchResult {
  matched: boolean
  matchedProfile?: {
    display_name: string
    photo_url: string
    phone: string | null
    instagram: string | null
    facebook: string | null
  }
  requestDetails?: {
    location_name: string
    date: string
  }
}

export async function createInterest(requestId: string | null, toUserId: string): Promise<MatchResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', user.id).single()
  if (!profileCheck) throw new Error('PROFILE_REQUIRED')

  const { error } = await supabase.from('interests').insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    request_id: requestId,
  })

  if (error) {
    if (error.code === '23505') return { matched: false }
    throw new Error(error.message)
  }

  const [{ data: myProfile }, { data: matchedProfile }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    supabase.from('profiles').select('display_name, photo_url, phone, instagram, facebook').eq('id', toUserId).single(),
  ])

  // Fetch request details only if this is a post-based interest
  let requestDetails: { location_name: string; date: string; user_id?: string } | null = null
  if (requestId) {
    const { data } = await supabase.from('partner_requests').select('location_name, date, user_id').eq('id', requestId).single()
    requestDetails = data
  }

  // Notify the other user
  const notifTitle = requestId ? '🧗 New interest in your post!' : '🧗 Someone wants to connect!'
  const notifBody = requestDetails
    ? `${myProfile?.display_name ?? 'Someone'} wants to climb with you at ${requestDetails.location_name}`
    : `${myProfile?.display_name ?? 'Someone'} wants to connect with you on ClimbMatch`
  sendNotification(toUserId, {
    title: notifTitle,
    body: notifBody,
    data: { screen: 'inbox' },
  }).catch(console.error)

  return { matched: true, matchedProfile: matchedProfile ?? undefined, requestDetails: requestDetails ?? undefined }
}

export interface InboxItem {
  interest: Interest
  fromProfile: Profile
  request: PartnerRequest | null
  phone: string | null
  instagram: string | null
  facebook: string | null
}

export async function getInbox(): Promise<InboxItem[]> {
  const { received } = await getInboxData()
  return received
}

export async function getSentInterests(): Promise<InboxItem[]> {
  const { sent } = await getInboxData()
  return sent
}

/** Single-function inbox loader: 1 auth + 2 parallel interest queries + 2 parallel data queries = 3 round-trips total. */
export async function getInboxData(): Promise<{ received: InboxItem[]; sent: InboxItem[] }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { received: [], sent: [] }

  // Fetch received and sent interests in parallel — one round-trip
  const [{ data: receivedInterests }, { data: sentInterests }] = await Promise.all([
    supabase.from('interests').select('*').eq('to_user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('interests').select('*').eq('from_user_id', user.id).order('created_at', { ascending: false }),
  ])

  const allInterests = [...(receivedInterests || []), ...(sentInterests || [])]
  if (allInterests.length === 0) return { received: [], sent: [] }

  // Collect all unique user IDs and request IDs across both tabs
  const otherUserIds = new Set<string>()
  for (const i of receivedInterests || []) otherUserIds.add(i.from_user_id)
  for (const i of sentInterests || []) otherUserIds.add(i.to_user_id)

  const requestIds = new Set(allInterests.map(i => i.request_id).filter((id): id is string => id !== null))

  // Fetch all profiles and requests in parallel — one round-trip
  const [{ data: profiles }, { data: requests }] = await Promise.all([
    supabase.from('profiles').select('*').in('id', [...otherUserIds]),
    requestIds.size > 0
      ? supabase.from('partner_requests').select('*').in('id', [...requestIds])
      : Promise.resolve({ data: [] as PartnerRequest[] }),
  ])

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))
  const requestMap = new Map((requests || []).map(r => [r.id, r]))

  const received: InboxItem[] = (receivedInterests || [])
    .map(interest => {
      const profile = profileMap.get(interest.from_user_id)
      if (!profile) return null
      const request = interest.request_id ? requestMap.get(interest.request_id) ?? null : null
      return {
        interest,
        fromProfile: profile,
        request,
        phone: profile.phone ?? null,
        instagram: profile.instagram ?? null,
        facebook: profile.facebook ?? null,
      }
    })
    .filter(Boolean) as InboxItem[]

  const sent: InboxItem[] = (sentInterests || [])
    .map(interest => {
      const profile = profileMap.get(interest.to_user_id)
      if (!profile) return null
      const request = interest.request_id ? requestMap.get(interest.request_id) ?? null : null
      const accepted = interest.status === 'accepted'
      return {
        interest,
        fromProfile: profile,
        request,
        phone: accepted ? profile.phone ?? null : null,
        instagram: accepted ? profile.instagram ?? null : null,
        facebook: accepted ? profile.facebook ?? null : null,
      }
    })
    .filter(Boolean) as InboxItem[]

  return { received, sent }
}

export async function acceptInterest(interestId: string): Promise<MatchResult> {
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
    .select('from_user_id, request_id')
    .eq('id', interestId)
    .single()

  if (!interest) return { matched: true }

  const [{ data: myProfile }, { data: matchedProfile }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    supabase.from('profiles').select('display_name, photo_url, phone, instagram, facebook').eq('id', interest.from_user_id).single(),
  ])

  let acceptedRequestDetails: { location_name: string; date: string } | null = null
  if (interest.request_id) {
    const { data } = await supabase.from('partner_requests').select('location_name, date').eq('id', interest.request_id).single()
    acceptedRequestDetails = data
  }

  // Notify the applicant: their request was accepted
  const notifBody = acceptedRequestDetails
    ? `${myProfile?.display_name ?? 'Your partner'} accepted your request to climb at ${acceptedRequestDetails.location_name}`
    : `${myProfile?.display_name ?? 'A climber'} wants to connect with you!`
  sendNotification(interest.from_user_id, {
    title: "🎉 It's a match!",
    body: notifBody,
    data: { screen: 'inbox' },
  }).catch(console.error)

  return { matched: true, matchedProfile: matchedProfile ?? undefined, requestDetails: acceptedRequestDetails ?? undefined }
}

export async function declineInterest(interestId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Fetch before updating so we have the from_user_id and location
  const { data: interest } = await supabase
    .from('interests')
    .select('from_user_id, request_id')
    .eq('id', interestId)
    .eq('to_user_id', user.id)
    .single()

  const { error } = await supabase
    .from('interests')
    .update({ status: 'declined' as const })
    .eq('id', interestId)
    .eq('to_user_id', user.id)

  if (error) throw new Error(error.message)

  // Notify the applicant: declined
  if (interest) {
    let locName = 'the crag'
    if (interest.request_id) {
      const { data: requestDetails } = await supabase
        .from('partner_requests')
        .select('location_name')
        .eq('id', interest.request_id)
        .single()
      if (requestDetails) locName = requestDetails.location_name
    }

    sendNotification(interest.from_user_id, {
      title: 'Update on your application',
      body: `Your request to climb at ${locName} was not accepted this time. Keep exploring!`,
      data: { screen: 'inbox' },
    }).catch(console.error)
  }
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
    .select('partner_requests!inner(id)', { count: 'exact', head: true })
    .eq('to_user_id', user.id)
    .eq('status', 'pending')

  return count || 0
}

export async function getApplicantCounts(requestIds: string[]): Promise<Record<string, number>> {
  if (requestIds.length === 0) return {}
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('interests')
    .select('request_id')
    .in('request_id', requestIds)
    .eq('status', 'pending')
  if (!data) return {}
  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.request_id] = (counts[row.request_id] || 0) + 1
  }
  return counts
}
