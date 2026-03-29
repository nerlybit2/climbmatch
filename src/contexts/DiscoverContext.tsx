'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { discoverRequests, type ScoredCard, type DiscoverFilters } from '@/lib/actions/discover'

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
  const [cards, setCards]     = useState<ScoredCard[]>([])
  const [loading, setLoading] = useState(false)
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
    } catch (err) {
      console.error('[Discover] fetch error', err)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Fetch once when the app layout mounts (right after login).
  // After that, data is only refreshed when the user explicitly applies
  // filters or hits the refresh button — never on route navigation.
  useEffect(() => {
    fetchCards({})
  }, [fetchCards])

  const applyFilters = useCallback(async (f: DiscoverFilters) => {
    await fetchCards(f)
  }, [fetchCards])

  const removeCard = useCallback((requestId: string) => {
    setCards(prev => prev.filter(c => c.request.id !== requestId))
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
