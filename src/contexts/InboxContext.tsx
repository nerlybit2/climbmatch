'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getInboxData, type InboxItem } from '@/lib/actions/interests'

interface InboxContextValue {
  received: InboxItem[]
  sent: InboxItem[]
  loading: boolean
  refresh: () => Promise<void>
  updateItem: (interestId: string, status: 'accepted' | 'declined') => void
}

const InboxContext = createContext<InboxContextValue | null>(null)

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const [received, setReceived] = useState<InboxItem[]>([])
  const [sent, setSent]         = useState<InboxItem[]>([])
  const [loading, setLoading]   = useState(false)
  const fetchingRef             = useRef(false)

  const fetchInbox = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const data = await getInboxData()
      setReceived(data.received)
      setSent(data.sent)
    } catch (err) {
      console.error('[Inbox] fetch error', err)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Fetch once when the app layout mounts (right after login).
  // After that, data only updates when:
  //   - user accepts/declines (optimistic update via updateItem)
  //   - a new interest arrives via realtime (refresh() called from InboxPage)
  useEffect(() => {
    fetchInbox()
  }, [fetchInbox])

  const refresh = useCallback(async () => {
    await fetchInbox()
  }, [fetchInbox])

  // Optimistic update — no re-fetch needed for accept/decline
  const updateItem = useCallback((interestId: string, status: 'accepted' | 'declined') => {
    const update = (items: InboxItem[]) =>
      items.map(item =>
        item.interest.id === interestId
          ? { ...item, interest: { ...item.interest, status } }
          : item
      )
    setReceived(prev => update(prev))
    setSent(prev => update(prev))
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
