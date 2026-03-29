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
  updatePost: (id: string, changes: Partial<PartnerRequest>) => void
}

const MyPostsContext = createContext<MyPostsContextValue | null>(null)

export function MyPostsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts]                     = useState<PartnerRequest[]>([])
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({})
  const [loading, setLoading]                 = useState(false)
  const fetchingRef                           = useRef(false)

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
  // Data only updates when the user:
  //   - creates a post  → refresh() called from RequestForm
  //   - edits a post    → refresh() called from RequestForm
  //   - cancels a post  → optimistic updatePost('cancelled')
  useEffect(() => { fetchPosts() }, [fetchPosts])

  const refresh = useCallback(async () => { await fetchPosts() }, [fetchPosts])

  // Optimistic update — avoids a round-trip for cancel/status changes
  const updatePost = useCallback((id: string, changes: Partial<PartnerRequest>) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p))
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
