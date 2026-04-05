'use client'

import { useProfile } from '@/contexts/ProfileContext'
import { ProfileForm } from '@/components/ProfileForm'
import { PullToRefreshWrapper } from '@/components/PullToRefreshWrapper'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'

export default function ProfilePage() {
  const { profile, userEmail, userMeta, loading, updateProfile } = useProfile()

  const refreshProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) updateProfile(data as Profile)
  }

  if (loading) {
    return (
      <div className="px-5 pt-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-3xl bg-slate-200" />
          <div className="h-9 w-32 bg-slate-200 rounded-2xl" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 bg-slate-200 rounded-2xl" />
        ))}
      </div>
    )
  }

  const isNewUser = !profile?.display_name || !profile?.photo_url || !profile?.phone

  return (
    <PullToRefreshWrapper onRefresh={refreshProfile}>
    <div>
      {isNewUser && (
        <div className="mx-5 mt-5 bg-[#f0f7f5] border border-[#0a5048]/15 rounded-2xl px-4 py-3 flex items-start gap-3">
          <svg className="w-4 h-4 text-[#0a5048]/60 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-semibold text-[#0a5048] leading-relaxed">
            Complete your profile to start finding climbing partners. Photo, name and phone number are required.
          </p>
        </div>
      )}
      <div className="px-5 pb-28">
        <ProfileForm
          profile={profile}
          userEmail={userEmail}
          prefill={profile ? undefined : {
            displayName: userMeta?.full_name || userMeta?.name || '',
            photoUrl: userMeta?.avatar_url || userMeta?.picture || '',
          }}
        />
      </div>
    </div>
    </PullToRefreshWrapper>
  )
}
