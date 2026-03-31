'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { discoverRequests, type ScoredCard, type DiscoverFilters } from '@/lib/actions/discover'
import { readCache, writeCache, CACHE_KEYS } from '@/lib/cache'

interface DiscoverContextValue {
  cards: ScoredCard[]
  loading: boolean
  filters: DiscoverFilters
  applyFilters: (f: DiscoverFilters) => Promise<void>
  removeCard: (requestId: string) => void
  refresh: () => Promise<void>
}

const DiscoverContext = createContext<DiscoverContextValue | null>(null)

export function DiscoverProvider({ children }: { children: React.ReactNode }) {
  const cached                = readCache<ScoredCard[]>(CACHE_KEYS.discover)
  const [cards, setCards]     = useState<ScoredCard[]>(cached ?? [])
  const [loading, setLoading] = useState(cached === null) // only show spinner on first ever load
  const [filters, setFilters] = useState<DiscoverFilters>({})
  const fetchingRef           = useRef(false)

  const fetchCards = useCallback(async (f: DiscoverFilters = {}) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const results = await discoverRequests(f)
      setCards(results)
      setFilters(f)
      // Only cache unfiltered results so cache always reflects full feed
      if (Object.keys(f).length === 0) writeCache(CACHE_KEYS.discover, results)
    } catch (err) {
      console.error('[Discover] fetch error', err)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Only fetch on mount if there's nothing in cache
  useEffect(() => {
    if (cached === null) fetchCards({})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFilters = useCallback(async (f: DiscoverFilters) => {
    await fetchCards(f)
  }, [fetchCards])

  const removeCard = useCallback((requestId: string) => {
    setCards(prev => {
      const next = prev.filter(c => c.request.id !== requestId)
      writeCache(CACHE_KEYS.discover, next)
      return next
    })
  }, [])

  const refresh = useCallback(async () => {
    await fetchCards(filters)
  }, [fetchCards, filters])

  return (
    <DiscoverContext.Provider value={{ cards, loading, filters, applyFilters, removeCard, refresh }}>
      {children}
    </DiscoverContext.Provider>
  )
}

export function useDiscover() {
  const ctx = useContext(DiscoverContext)
  if (!ctx) throw new Error('useDiscover must be used inside DiscoverProvider')
  return ctx
}
