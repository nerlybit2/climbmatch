'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushNotificationProvider() {
  usePushNotifications()
  return null
}
