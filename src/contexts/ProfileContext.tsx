'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'
import { readCacheT, writeCacheT, isCacheFresh, CACHE_KEYS } from '@/lib/cache'
import { on } from '@/lib/dataEvents'

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
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [userMeta, setUserMeta]   = useState<UserMeta | null>(null)
  const [loading, setLoading]     = useState(true)
  const fetchingRef               = useRef(false)
  const lastFetchRef              = useRef(0)

  useEffect(() => {
    async function load(silent: boolean) {
      if (fetchingRef.current) return
      if (silent && isCacheFresh(lastFetchRef.current)) return
      fetchingRef.current = true
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { if (!silent) setLoading(false); fetchingRef.current = false; return }

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
        lastFetchRef.current = Date.now()
        writeCacheT(CACHE_KEYS.profile, { profile: data, userEmail: email, userMeta: meta })
      } finally {
        if (!silent) setLoading(false)
        fetchingRef.current = false
      }
    }

    // Read cache client-side only (avoids SSR/hydration mismatch), then stale-while-revalidate
    const cached = readCacheT<ProfileCache>(CACHE_KEYS.profile)
    if (cached !== null) {
      setProfile(cached.data.profile)
      setUserEmail(cached.data.userEmail)
      setUserMeta(cached.data.userMeta)
      setLoading(false)
      if (!isCacheFresh(cached.ts)) load(true)
    } else {
      load(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refresh profile on app resume
  useEffect(() => {
    return on('app:resumed', () => {
      if (fetchingRef.current || isCacheFresh(lastFetchRef.current)) return
      // Inline silent fetch
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        const email = user.email || ''
        const meta  = user.user_metadata as UserMeta
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          setProfile(data)
          setUserEmail(email)
          setUserMeta(meta)
          lastFetchRef.current = Date.now()
          writeCacheT(CACHE_KEYS.profile, { profile: data, userEmail: email, userMeta: meta })
        })
      })
    })
  }, [])

  const updateProfile = (p: Profile) => {
    setProfile(p)
    writeCacheT(CACHE_KEYS.profile, { profile: p, userEmail, userMeta })
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
