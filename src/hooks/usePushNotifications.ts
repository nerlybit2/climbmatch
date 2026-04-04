import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { saveDeviceToken } from '@/lib/actions/notifications'

/**
 * Registers the device for push notifications and saves the FCM token to the
 * database. Should be mounted once inside the authenticated app layout.
 *
 * All plugin access is lazy (inside the effect) and fully wrapped in try/catch
 * to prevent native bridge crashes if Firebase isn't ready yet on Android.
 */
export function usePushNotifications() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let mounted = true
    const listeners: Array<Promise<{ remove: () => void }>> = []

    async function init() {
      try {
        // Lazy import — avoids touching the native bridge at module load time
        const { PushNotifications } = await import('@capacitor/push-notifications')

        // Add listeners before registering so we don't miss the token event
        listeners.push(
          PushNotifications.addListener('registration', async ({ value: token }) => {
            if (!mounted) return
            await saveDeviceToken(token, Capacitor.getPlatform())
          }),
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[Push] Foreground notification:', notification.title)
          }),
        )

        // Check / request permission
        let permStatus = await PushNotifications.checkPermissions()

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions()
        }

        if (permStatus.receive !== 'granted') return

        await PushNotifications.register()
      } catch (err) {
        // Firebase not configured, plugin not ready, or permissions denied — fail silently
        console.warn('[Push] Initialization failed:', err)
      }
    }

    init()

    return () => {
      mounted = false
      listeners.forEach(l => l.then(r => r.remove()).catch(() => {}))
    }
  }, [])
}
