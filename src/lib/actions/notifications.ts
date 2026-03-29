'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function saveDeviceToken(token: string, platform: string = 'android'): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('device_tokens')
    .upsert({ user_id: user.id, token, platform }, { onConflict: 'user_id,token' })
}

export async function removeDeviceToken(token: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('token', token)
}
