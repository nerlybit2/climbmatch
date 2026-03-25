'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPendingInterestCount } from '@/lib/actions/interests'

export function useUnreadCount() {
  const [count, setCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const onChangeRef = useRef<(() => void) | undefined>(undefined)

  const fetchCount = useCallback(async () => {
    const c = await getPendingInterestCount()
    setCount(c)
  }, [])

  onChangeRef.current = fetchCount

  // Get user ID on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        fetchCount()
      }
    })
  }, [fetchCount])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`unread:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interests',
          filter: `to_user_id=eq.${userId}`,
        },
        () => {
          onChangeRef.current?.()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { count }
}
