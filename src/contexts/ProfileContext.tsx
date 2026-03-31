'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'

type UserMeta = { full_name?: string; name?: string; avatar_url?: string; picture?: string }

interface ProfileContextValue {
  profile: Profile | null
  userEmail: string
  userMeta: UserMeta | null
  loading: boolean
  updateProfile: (p: Profile) => void
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  userEmail: '',
  userMeta: null,
  loading: true,
  updateProfile: () => {},
})

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        setUserEmail(user.email || '')
        setUserMeta(user.user_metadata as UserMeta)

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <ProfileContext.Provider value={{ profile, userEmail, userMeta, loading, updateProfile: setProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
