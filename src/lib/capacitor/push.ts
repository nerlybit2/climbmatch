import { Capacitor } from '@capacitor/core'

export async function registerPushNotifications() {
  if (!Capacitor.isNativePlatform()) return null

  const { PushNotifications } = await import('@capacitor/push-notifications')

  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return null

  await PushNotifications.register()

  return new Promise<string | null>((resolve) => {
    PushNotifications.addListener('registration', (token) => {
      resolve(token.value)
    })
    PushNotifications.addListener('registrationError', () => {
      resolve(null)
    })
  })
}

export async function addPushListeners(onNotification: (data: any) => void) {
  if (!Capacitor.isNativePlatform()) return

  const { PushNotifications } = await import('@capacitor/push-notifications')

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    onNotification(notification)
  })

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    onNotification(action.notification)
  })
}
