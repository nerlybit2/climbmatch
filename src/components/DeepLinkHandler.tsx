'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { createClient } from '@/lib/supabase/client'

export function DeepLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleUrl = async (url: string) => {
      if (!url.startsWith('climbmatch://auth/callback')) return
      try {
        const params = new URL(url).searchParams
        const code = params.get('code')
        if (!code) return
        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
            router.replace(profile ? '/discover' : '/profile')
          }
        }
      } catch (err) {
        console.error('[DeepLink] failed to exchange code', err)
      }
    }

    // Handle case where app was opened cold via deep link
    App.getLaunchUrl().then((result) => { if (result?.url) handleUrl(result.url) })

    // Handle case where app was already running and gets a new deep link
    const listener = App.addListener('appUrlOpen', ({ url }) => handleUrl(url))
    return () => { listener.then(l => l.remove()) }
  }, [router])

  return null
}
