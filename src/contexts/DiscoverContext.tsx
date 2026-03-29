'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { discoverRequests, type ScoredCard, type DiscoverFilters } from '@/lib/actions/discover'

interface DiscoverContextValue {
  cards: ScoredCard[]
  loading: boolean
  lastFetched: number | null        // timestamp so callers know how fresh the data is
  filters: DiscoverFilters
  applyFilters: (f: DiscoverFilters) => Promise<void>
  removeCard: (requestId: string) => void
  refresh: () => Promise<void>
  seed: (cards: ScoredCard[]) => void   // called by server-rendered page to hydrate instantly
}

const DiscoverContext = createContext<DiscoverContextValue | null>(null)

const STALE_MS = 60_000 // re-fetch if data is older than 1 minute

export function DiscoverProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards]           = useState<ScoredCard[]>([])
  const [loading, setLoading]       = useState(false)
  const [lastFetched, setLastFetched] = useState<number | null>(null)
  const [filters, setFilters]       = useState<DiscoverFilters>({})
  const fetchingRef                 = useRef(false)

  const fetchCards = useCallback(async (f: DiscoverFilters = {}) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const results = await discoverRequests(f)
      setCards(results)
      setLastFetched(Date.now())
      setFilters(f)
    } catch (err) {
      console.error('[Discover] fetch error', err)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Prefetch as soon as the app layout mounts — happens right after login,
  // before the user even navigates to the discover page.
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

  // Called by the server-rendered discover page to instantly hydrate the context
  // with data that arrived in the HTML, skipping the client fetch entirely.
  const seed = useCallback((serverCards: ScoredCard[]) => {
    const isStale = !lastFetched || Date.now() - lastFetched > STALE_MS
    if (isStale && serverCards.length > 0) {
      setCards(serverCards)
      setLastFetched(Date.now())
    }
  }, [lastFetched])

  return (
    <DiscoverContext.Provider value={{ cards, loading, lastFetched, filters, applyFilters, removeCard, refresh, seed }}>
      {children}
    </DiscoverContext.Provider>
  )
}

export function useDiscover() {
  const ctx = useContext(DiscoverContext)
  if (!ctx) throw new Error('useDiscover must be used inside DiscoverProvider')
  return ctx
}
