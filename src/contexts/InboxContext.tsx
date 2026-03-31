'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getInboxData, type InboxItem } from '@/lib/actions/interests'
import { readCache, writeCache, CACHE_KEYS } from '@/lib/cache'

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
  const cached                    = readCache<InboxCache>(CACHE_KEYS.inbox)
  const [received, setReceived]   = useState<InboxItem[]>(cached?.received ?? [])
  const [sent, setSent]           = useState<InboxItem[]>(cached?.sent ?? [])
  const [loading, setLoading]     = useState(cached === null)
  const fetchingRef               = useRef(false)

  const fetchInbox = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const data = await getInboxData()
      setReceived(data.received)
      setSent(data.sent)
      writeCache(CACHE_KEYS.inbox, { received: data.received, sent: data.sent })
    } catch (err) {
      console.error('[Inbox] fetch error', err)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Only fetch on mount if there's nothing in cache
  useEffect(() => {
    if (cached === null) fetchInbox()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = useCallback(async () => {
    await fetchInbox()
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
        writeCache(CACHE_KEYS.inbox, { received: next, sent: nextSent })
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
