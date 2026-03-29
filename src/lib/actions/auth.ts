'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const PROFILE_COMPLETE_COOKIE = 'pc'

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete(PROFILE_COMPLETE_COOKIE)
  redirect('/login')
}

/** Call after a successful profile save so the middleware re-checks on next visit. */
export async function markProfileComplete() {
  const cookieStore = await cookies()
  cookieStore.set(PROFILE_COMPLETE_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await admin.auth.admin.listUsers()
  return data.users.some(u => u.email?.toLowerCase() === email.toLowerCase())
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Use service role to hard-delete the auth user (cascades to profiles/requests via DB FK)
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  await supabase.auth.signOut()
  return { error: null }
}
