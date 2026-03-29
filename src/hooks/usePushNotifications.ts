import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { saveDeviceToken } from '@/lib/actions/notifications'

/**
 * Registers the device for push notifications and saves the FCM token to the
 * database. Should be mounted once inside the authenticated app layout.
 */
export function usePushNotifications() {
  useEffect(() => {
    // Push notifications only work in native Capacitor apps
    if (!Capacitor.isNativePlatform()) return

    let mounted = true

    async function register() {
      // Check / request permission
      let permStatus = await PushNotifications.checkPermissions()

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }

      if (permStatus.receive !== 'granted') return

      await PushNotifications.register()
    }

    // Token received from FCM
    const tokenListener = PushNotifications.addListener('registration', async ({ value: token }) => {
      if (!mounted) return
      await saveDeviceToken(token, Capacitor.getPlatform())
    })

    // Handle foreground notifications (show as alert when app is open)
    const notifListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('[Push] Foreground notification:', notification.title)
      },
    )

    register()

    return () => {
      mounted = false
      tokenListener.then(l => l.remove())
      notifListener.then(l => l.remove())
    }
  }, [])
}
