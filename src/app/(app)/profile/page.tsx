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

  return (
    <div>
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
