'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getInboxData, type InboxItem } from '@/lib/actions/interests'
import { readCacheT, writeCacheT, isCacheFresh, CACHE_KEYS } from '@/lib/cache'
import { on, type DataEvent } from '@/lib/dataEvents'

interface InboxCache { received: InboxItem[]; sent: InboxItem[] }

interface InboxContextValue {
  received: InboxItem[]
  sent: InboxItem[]
  loading: boolean
  refresh: () => Promise<void>
  updateItem: (interestId: string, status: 'accepted' | 'declined') => void
}

const InboxContext = createContext<InboxContextValue | null>(null)

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const [received, setReceived]   = useState<InboxItem[]>([])
  const [sent, setSent]           = useState<InboxItem[]>([])
  const [loading, setLoading]     = useState(true)
  const fetchingRef               = useRef(false)
  const lastFetchRef              = useRef(0)

  const fetchInbox = useCallback(async (silent = false) => {
    if (fetchingRef.current) return
    if (silent && isCacheFresh(lastFetchRef.current)) return
    fetchingRef.current = true
    if (!silent) setLoading(true)
    try {
      const data = await getInboxData()
      setReceived(data.received)
      setSent(data.sent)
      lastFetchRef.current = Date.now()
      writeCacheT(CACHE_KEYS.inbox, { received: data.received, sent: data.sent })
    } catch (err) {
      console.error('[Inbox] fetch error', err)
    } finally {
      if (!silent) setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Read cache client-side only (avoids SSR/hydration mismatch), then stale-while-revalidate
  useEffect(() => {
    const cached = readCacheT<InboxCache>(CACHE_KEYS.inbox)
    if (cached !== null) {
      setReceived(cached.data.received)
      setSent(cached.data.sent)
      setLoading(false)
      if (!isCacheFresh(cached.ts)) fetchInbox(true)
    } else {
      fetchInbox()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Subscribe to relevant data events for background refresh
  useEffect(() => {
    // interest:created is a user action — always force-fetch so the sent tab updates immediately
    const forceEvents: DataEvent[] = ['interest:created']
    const silentEvents: DataEvent[] = ['interest:accepted', 'interest:declined', 'app:resumed']
    const unsubs = [
      ...forceEvents.map(e => on(e, () => fetchInbox(false))),
      ...silentEvents.map(e => on(e, () => fetchInbox(true))),
    ]
    return () => unsubs.forEach(u => u())
  }, [fetchInbox])

  const refresh = useCallback(async () => {
    await fetchInbox(false)
  }, [fetchInbox])

  // Optimistic update — also patches the cache so it stays consistent
  const updateItem = useCallback((interestId: string, status: 'accepted' | 'declined') => {
    const update = (items: InboxItem[]) =>
      items.map(item =>
        item.interest.id === interestId
          ? { ...item, interest: { ...item.interest, status } }
          : item
      )
    setReceived(prev => {
      const next = update(prev)
      setSent(s => {
        const nextSent = update(s)
        writeCacheT(CACHE_KEYS.inbox, { received: next, sent: nextSent })
        return nextSent
      })
      return next
    })
  }, [])

  return (
    <InboxContext.Provider value={{ received, sent, loading, refresh, updateItem }}>
      {children}
    </InboxContext.Provider>
  )
}

export function useInbox() {
  const ctx = useContext(InboxContext)
  if (!ctx) throw new Error('useInbox must be used inside InboxProvider')
  return ctx
}
