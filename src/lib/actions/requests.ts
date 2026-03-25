'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PartnerRequest, GearSet, LocationType, GoalType } from '@/lib/types/database'

export interface RequestPayload {
  date: string
  start_time: string | null
  end_time: string | null
  flexible: boolean
  location_type: LocationType
  location_name: string
  goal_type: GoalType
  desired_grade_range: string | null
  notes: string | null
  needs_gear: GearSet
  carpool_needed: boolean
  weight_relevant: boolean
  max_weight_difference_kg: number | null
}

export async function getMyRequests(): Promise<PartnerRequest[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('partner_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return data || []
}

export async function getRequestById(id: string): Promise<PartnerRequest | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('partner_requests')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  return data ?? null
}

export async function updateRequest(id: string, payload: RequestPayload): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('partner_requests')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (error) throw error
}

export async function cancelRequest(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('partner_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}
