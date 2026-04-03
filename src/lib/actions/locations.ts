'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getCustomLocations(type: 'gym' | 'crag'): Promise<string[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('custom_locations')
    .select('name')
    .eq('type', type)
    .order('created_at', { ascending: true })
  return (data ?? []).map(r => r.name)
}

export async function addCustomLocation(name: string, type: 'gym' | 'crag'): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Ignore conflict — someone else may have added the same place already
  await supabase
    .from('custom_locations')
    .insert({ name: name.trim(), type, created_by: user.id })
    .throwOnError()
    .then(() => {}, () => {}) // swallow unique-constraint errors silently
}
