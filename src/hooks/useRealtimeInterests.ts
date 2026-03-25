'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseRealtimeInterestsOptions {
  userId: string | null
  onChange: () => void
}

export function useRealtimeInterests({ userId, onChange }: UseRealtimeInterestsOptions) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Subscribe to changes on the interests table for this user
    // NOTE: Requires enabling Realtime replication on the 'interests' table
    // in the Supabase dashboard (Database > Replication > supabase_realtime publication)
    const channel = supabase
      .channel(`interests:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interests',
          filter: `to_user_id=eq.${userId}`,
        },
        () => {
          onChangeRef.current()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interests',
          filter: `from_user_id=eq.${userId}`,
        },
        () => {
          onChangeRef.current()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}
