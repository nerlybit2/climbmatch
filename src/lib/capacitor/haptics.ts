import { Capacitor } from '@capacitor/core'

export async function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (!Capacitor.isNativePlatform()) return
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
  const styles = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }
  await Haptics.impact({ style: styles[type] })
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  if (!Capacitor.isNativePlatform()) return
  const { Haptics, NotificationType } = await import('@capacitor/haptics')
  const types = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error }
  await Haptics.notification({ type: types[type] })
}
