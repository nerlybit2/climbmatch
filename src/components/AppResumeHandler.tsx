'use client'

import { useEffect, useRef } from 'react'
import { App } from '@capacitor/app'
import { emit } from '@/lib/dataEvents'

const DEBOUNCE_MS = 5_000

export function AppResumeHandler() {
  const lastResumeRef = useRef(0)

  useEffect(() => {
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return
      const now = Date.now()
      if (now - lastResumeRef.current < DEBOUNCE_MS) return
      lastResumeRef.current = now
      emit('app:resumed')
    })

    return () => { listener.then(h => h.remove()) }
  }, [])

  return null
}
