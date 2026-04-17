'use client'

import { useEffect } from 'react'

export function NativeSplashHider() {
  useEffect(() => {
    const t = setTimeout(() => {
      import('@capacitor/splash-screen').then(({ SplashScreen }) => {
        SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {})
      })
    }, 100)
    return () => clearTimeout(t)
  }, [])

  return null
}
