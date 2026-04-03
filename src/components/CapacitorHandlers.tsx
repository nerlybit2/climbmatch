'use client'

import dynamic from 'next/dynamic'

// Capacitor modules touch native bridge APIs at import time, which throws on the
// server. Wrapping them in a client component lets us use ssr:false.
const DeepLinkHandler = dynamic(
  () => import('@/components/DeepLinkHandler').then(m => ({ default: m.DeepLinkHandler })),
  { ssr: false },
)
const PushNotificationProvider = dynamic(
  () => import('@/components/PushNotificationProvider').then(m => ({ default: m.PushNotificationProvider })),
  { ssr: false },
)
const AppResumeHandler = dynamic(
  () => import('@/components/AppResumeHandler').then(m => ({ default: m.AppResumeHandler })),
  { ssr: false },
)

export function CapacitorHandlers() {
  return (
    <>
      <DeepLinkHandler />
      <PushNotificationProvider />
      <AppResumeHandler />
    </>
  )
}
