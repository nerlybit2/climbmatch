'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { discoverProfiles, type ProfileCard } from '@/lib/actions/discoverProfiles'
import { readCacheT, writeCacheT, isCacheFresh, CACHE_KEYS } from '@/lib/cache'
import { on, type DataEvent } from '@/lib/dataEvents'

interface SwipeDiscoverContextValue {
  profiles: ProfileCard[]
  loading: boolean
  removeProfile: (profileId: string) => void
  markSwiped: (profileId: string) => void
  refresh: () => Promise<void>
}

const SwipeDiscoverContext = createContext<SwipeDiscoverContextValue | null>(null)

export function SwipeDiscoverProvider({ children }: { children: React.ReactNode }) {
  const cached = readCacheT<ProfileCard[]>(CACHE_KEYS.swipeDiscover)
  const [profiles, setProfiles] = useState<ProfileCard[]>(cached?.data ?? [])
  const [loading, setLoading] = useState(cached === null)
  const fetchingRef = useRef(false)
  const lastFetchRef = useRef(0)

  const fetchProfiles = useCallback(async (silent = false) => {
    if (fetchingRef.current) return
    if (silent && isCacheFresh(lastFetchRef.current)) return
    fetchingRef.current = true
    if (!silent) setLoading(true)
    try {
      const results = await discoverProfiles()
      setProfiles(results)
      lastFetchRef.current = Date.now()
      writeCacheT(CACHE_KEYS.swipeDiscover, results)
    } catch (err) {
      console.error('[SwipeDiscover] fetch error', err)
    } finally {
      if (!silent) setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (cached === null) {
      fetchProfiles()
    } else if (!isCacheFresh(cached.ts)) {
      fetchProfiles(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const events: DataEvent[] = ['interest:created', 'post:created', 'post:updated', 'post:cancelled', 'app:resumed']
    const unsubs = events.map(e => on(e, () => fetchProfiles(true)))
    return () => unsubs.forEach(u => u())
  }, [fetchProfiles])

  const removeProfile = useCallback((profileId: string) => {
    setProfiles(prev => {
      const next = prev.filter(c => c.profile.id !== profileId)
      writeCacheT(CACHE_KEYS.swipeDiscover, next)
      return next
    })
  }, [])

  const markSwiped = useCallback((profileId: string) => {
    setProfiles(prev => {
      const next = prev.map(c =>
        c.profile.id === profileId ? { ...c, swiped: true } : c
      )
      writeCacheT(CACHE_KEYS.swipeDiscover, next)
      return next
    })
  }, [])

  const refresh = useCallback(async () => {
    await fetchProfiles()
  }, [fetchProfiles])

  return (
    <SwipeDiscoverContext.Provider value={{ profiles, loading, removeProfile, markSwiped, refresh }}>
      {children}
    </SwipeDiscoverContext.Provider>
  )
}

export function useSwipeDiscover() {
  const ctx = useContext(SwipeDiscoverContext)
  if (!ctx) throw new Error('useSwipeDiscover must be used inside SwipeDiscoverProvider')
  return ctx
}
