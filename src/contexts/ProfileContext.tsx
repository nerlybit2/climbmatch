'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'
import { readCache, writeCache, CACHE_KEYS } from '@/lib/cache'

type UserMeta = { full_name?: string; name?: string; avatar_url?: string; picture?: string }

interface ProfileCache { profile: Profile | null; userEmail: string; userMeta: UserMeta | null }

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
  const cached                    = readCache<ProfileCache>(CACHE_KEYS.profile)
  const [profile, setProfile]     = useState<Profile | null>(cached?.profile ?? null)
  const [userEmail, setUserEmail] = useState(cached?.userEmail ?? '')
  const [userMeta, setUserMeta]   = useState<UserMeta | null>(cached?.userMeta ?? null)
  const [loading, setLoading]     = useState(cached === null)

  useEffect(() => {
    if (cached !== null) return // already have data — skip fetch
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const email = user.email || ''
        const meta  = user.user_metadata as UserMeta
        setUserEmail(email)
        setUserMeta(meta)

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(data)
        writeCache(CACHE_KEYS.profile, { profile: data, userEmail: email, userMeta: meta })
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateProfile = (p: Profile) => {
    setProfile(p)
    writeCache(CACHE_KEYS.profile, { profile: p, userEmail, userMeta })
  }

  return (
    <ProfileContext.Provider value={{ profile, userEmail, userMeta, loading, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
