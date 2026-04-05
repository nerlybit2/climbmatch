'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getMyRequests } from '@/lib/actions/requests'
import { getApplicantCounts } from '@/lib/actions/interests'
import type { PartnerRequest } from '@/lib/types/database'
import { readCacheT, writeCacheT, isCacheFresh, CACHE_KEYS } from '@/lib/cache'
import { on, type DataEvent } from '@/lib/dataEvents'

interface MyPostsCache { posts: PartnerRequest[]; applicantCounts: Record<string, number> }

interface MyPostsContextValue {
  posts: PartnerRequest[]
  applicantCounts: Record<string, number>
  loading: boolean
  refresh: () => Promise<void>
  updatePost: (id: string, changes: Partial<PartnerRequest>) => void
}

const MyPostsContext = createContext<MyPostsContextValue | null>(null)

export function MyPostsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts]                     = useState<PartnerRequest[]>([])
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({})
  const [loading, setLoading]                 = useState(true)
  const fetchingRef                           = useRef(false)
  const lastFetchRef                          = useRef(0)

  const fetchPosts = useCallback(async (silent = false) => {
    if (fetchingRef.current) return
    if (silent && isCacheFresh(lastFetchRef.current)) return
    fetchingRef.current = true
    if (!silent) setLoading(true)
    try {
      const data = await getMyRequests()
      const activeIds = data.filter(r => r.status === 'active').map(r => r.id)
      const counts = activeIds.length > 0 ? await getApplicantCounts(activeIds) : {}
      setPosts(data)
      setApplicantCounts(counts)
      lastFetchRef.current = Date.now()
      writeCacheT(CACHE_KEYS.myPosts, { posts: data, applicantCounts: counts })
    } catch (err) {
      console.error('[MyPosts] fetch error', err)
    } finally {
      if (!silent) setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Read cache client-side only (avoids SSR/hydration mismatch), then stale-while-revalidate
  useEffect(() => {
    const cached = readCacheT<MyPostsCache>(CACHE_KEYS.myPosts)
    if (cached !== null) {
      setPosts(cached.data.posts)
      setApplicantCounts(cached.data.applicantCounts)
      setLoading(false)
      if (!isCacheFresh(cached.ts)) fetchPosts(true)
    } else {
      fetchPosts()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Subscribe to relevant data events for background refresh
  useEffect(() => {
    const events: DataEvent[] = [
      'post:created', 'post:updated', 'post:cancelled',
      'interest:accepted', 'interest:declined', 'app:resumed',
    ]
    const unsubs = events.map(e => on(e, () => fetchPosts(true)))
    return () => unsubs.forEach(u => u())
  }, [fetchPosts])

  const refresh = useCallback(async () => { await fetchPosts() }, [fetchPosts])

  // Optimistic update — also patches the cache
  const updatePost = useCallback((id: string, changes: Partial<PartnerRequest>) => {
    setPosts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...changes } : p)
      setApplicantCounts(counts => {
        writeCacheT(CACHE_KEYS.myPosts, { posts: next, applicantCounts: counts })
        return counts
      })
      return next
    })
  }, [])

  return (
    <MyPostsContext.Provider value={{ posts, applicantCounts, loading, refresh, updatePost }}>
      {children}
    </MyPostsContext.Provider>
  )
}

export function useMyPosts() {
  const ctx = useContext(MyPostsContext)
  if (!ctx) throw new Error('useMyPosts must be used inside MyPostsProvider')
  return ctx
}
