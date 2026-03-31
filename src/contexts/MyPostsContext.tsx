'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getMyRequests } from '@/lib/actions/requests'
import { getApplicantCounts } from '@/lib/actions/interests'
import type { PartnerRequest } from '@/lib/types/database'
import { readCache, writeCache, CACHE_KEYS } from '@/lib/cache'

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
  const cached                                = readCache<MyPostsCache>(CACHE_KEYS.myPosts)
  const [posts, setPosts]                     = useState<PartnerRequest[]>(cached?.posts ?? [])
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>(cached?.applicantCounts ?? {})
  const [loading, setLoading]                 = useState(cached === null)
  const fetchingRef                           = useRef(false)

  const fetchPosts = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const data = await getMyRequests()
      const activeIds = data.filter(r => r.status === 'active').map(r => r.id)
      const counts = activeIds.length > 0 ? await getApplicantCounts(activeIds) : {}
      setPosts(data)
      setApplicantCounts(counts)
      writeCache(CACHE_KEYS.myPosts, { posts: data, applicantCounts: counts })
    } catch (err) {
      console.error('[MyPosts] fetch error', err)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Only fetch on mount if there's nothing in cache
  useEffect(() => {
    if (cached === null) fetchPosts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = useCallback(async () => { await fetchPosts() }, [fetchPosts])

  // Optimistic update — also patches the cache
  const updatePost = useCallback((id: string, changes: Partial<PartnerRequest>) => {
    setPosts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...changes } : p)
      setApplicantCounts(counts => {
        writeCache(CACHE_KEYS.myPosts, { posts: next, applicantCounts: counts })
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
