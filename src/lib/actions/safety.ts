'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function blockUser(blockedId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('blocks').insert({
    blocker_id: user.id,
    blocked_id: blockedId,
  })

  if (error && error.code !== '23505') throw new Error(error.message)
}

export async function reportUser(reportedId: string, reason: string, details?: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_id: reportedId,
    reason,
    details: details || null,
  })

  if (error) throw new Error(error.message)
}
