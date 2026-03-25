'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PartnerRequest } from '@/lib/types/database'

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
