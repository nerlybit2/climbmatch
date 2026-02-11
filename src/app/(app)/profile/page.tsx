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

  return (
    <div>
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-2xl font-extrabold tracking-tight">{profile ? 'Edit Profile' : 'Create Profile'}</h1>
        <p className="text-sm text-gray-400 mt-0.5 font-medium">{profile ? 'Update your climbing profile' : 'Set up your profile to start matching'}</p>
      </div>
      <div className="px-5 pb-8">
        <ProfileForm profile={profile} userEmail={user.email || ''} />
      </div>
    </div>
  )
}
