'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getMyRequests } from '@/lib/actions/requests'
import { getApplicantCounts } from '@/lib/actions/interests'
import type { PartnerRequest } from '@/lib/types/database'

interface MyPostsContextValue {
  posts: PartnerRequest[]
  applicantCounts: Record<string, number>
  loading: boolean
  refresh: () => Promise<void>
}

const MyPostsContext = createContext<MyPostsContextValue | null>(null)

export function MyPostsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts]                   = useState<PartnerRequest[]>([])
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({})
  const [loading, setLoading]               = useState(false)
  const fetchingRef                         = useRef(false)

  const fetchPosts = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const data = await getMyRequests()
      setPosts(data)
      const activeIds = data.filter(r => r.status === 'active').map(r => r.id)
      if (activeIds.length > 0) {
        const counts = await getApplicantCounts(activeIds)
        setApplicantCounts(counts)
      } else {
        setApplicantCounts({})
      }
    } catch (err) {
      console.error('[MyPosts] fetch error', err)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Fetch once when the app layout mounts (right after login).
  // After that, data is only refreshed when the user creates a post,
  // cancels a post, or accepts a match.
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const refresh = useCallback(async () => {
    await fetchPosts()
  }, [fetchPosts])

  return (
    <MyPostsContext.Provider value={{ posts, applicantCounts, loading, refresh }}>
      {children}
    </MyPostsContext.Provider>
  )
}

export function useMyPosts() {
  const ctx = useContext(MyPostsContext)
  if (!ctx) throw new Error('useMyPosts must be used inside MyPostsProvider')
  return ctx
}
