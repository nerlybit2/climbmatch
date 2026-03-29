import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const meta = user.user_metadata as { full_name?: string; name?: string; avatar_url?: string; picture?: string } | undefined

  const isNewUser = !profile?.display_name || !profile?.photo_url || !profile?.phone

  return (
    <div>
      {isNewUser && (
        <div className="mx-5 mt-5 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-3">
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-semibold text-blue-600 leading-relaxed">
            Complete your profile to start finding climbing partners. Photo, name and phone number are required.
          </p>
        </div>
      )}
      <div className="px-5 pb-8">
        <ProfileForm
          profile={profile}
          userEmail={user.email || ''}
          prefill={profile ? undefined : {
            displayName: meta?.full_name || meta?.name || '',
            photoUrl: meta?.avatar_url || meta?.picture || '',
          }}
        />
      </div>
    </div>
  )
}
