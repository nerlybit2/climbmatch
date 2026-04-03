'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { discoverRequests, type ScoredCard, type DiscoverFilters } from '@/lib/actions/discover'
import { readCacheT, writeCacheT, isCacheFresh, CACHE_KEYS } from '@/lib/cache'
import { on, type DataEvent } from '@/lib/dataEvents'

interface DiscoverContextValue {
  cards: ScoredCard[]
  loading: boolean
  filters: DiscoverFilters
  applyFilters: (f: DiscoverFilters) => Promise<void>
  removeCard: (requestId: string) => void
  markSwiped: (requestId: string) => void
  refresh: () => Promise<void>
}

const DiscoverContext = createContext<DiscoverContextValue | null>(null)

export function DiscoverProvider({ children }: { children: React.ReactNode }) {
  const cached                = readCacheT<ScoredCard[]>(CACHE_KEYS.discover)
  const [cards, setCards]     = useState<ScoredCard[]>(cached?.data ?? [])
  const [loading, setLoading] = useState(cached === null) // only show spinner on first ever load
  const [filters, setFilters] = useState<DiscoverFilters>({})
  const fetchingRef           = useRef(false)
  const lastFetchRef          = useRef(0)

  const fetchCards = useCallback(async (f: DiscoverFilters = {}, silent = false) => {
    if (fetchingRef.current) return
    if (silent && isCacheFresh(lastFetchRef.current)) return
    fetchingRef.current = true
    if (!silent) setLoading(true)
    try {
      const results = await discoverRequests(f)
      setCards(results)
      setFilters(f)
      lastFetchRef.current = Date.now()
      // Only cache unfiltered results so cache always reflects full feed
      if (Object.keys(f).length === 0) writeCacheT(CACHE_KEYS.discover, results)
    } catch (err) {
      console.error('[Discover] fetch error', err)
    } finally {
      if (!silent) setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Stale-while-revalidate: show cache instantly, refresh in background if stale
  useEffect(() => {
    if (cached === null) {
      fetchCards({})
    } else if (!isCacheFresh(cached.ts)) {
      fetchCards({}, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Subscribe to relevant data events for background refresh
  useEffect(() => {
    const events: DataEvent[] = ['post:created', 'post:updated', 'post:cancelled', 'app:resumed']
    const unsubs = events.map(e => on(e, () => fetchCards(filters, true)))
    return () => unsubs.forEach(u => u())
  }, [fetchCards, filters])

  const applyFilters = useCallback(async (f: DiscoverFilters) => {
    await fetchCards(f)
  }, [fetchCards])

  const removeCard = useCallback((requestId: string) => {
    setCards(prev => {
      const next = prev.filter(c => c.request.id !== requestId)
      writeCacheT(CACHE_KEYS.discover, next)
      return next
    })
  }, [])

  const markSwiped = useCallback((requestId: string) => {
    setCards(prev => {
      const next = prev.map(c =>
        c.request.id === requestId ? { ...c, swiped: true } : c
      )
      writeCacheT(CACHE_KEYS.discover, next)
      return next
    })
  }, [])

  const refresh = useCallback(async () => {
    await fetchCards(filters)
  }, [fetchCards, filters])

  return (
    <DiscoverContext.Provider value={{ cards, loading, filters, applyFilters, removeCard, markSwiped, refresh }}>
      {children}
    </DiscoverContext.Provider>
  )
}

export function useDiscover() {
  const ctx = useContext(DiscoverContext)
  if (!ctx) throw new Error('useDiscover must be used inside DiscoverProvider')
  return ctx
}
