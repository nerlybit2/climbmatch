import { Capacitor } from '@capacitor/core'

export interface GeoPosition {
  lat: number
  lng: number
}

export type GeoError = 'denied' | 'unavailable' | 'unknown'

export interface GeoResult {
  position: GeoPosition | null
  error?: GeoError
}

export async function getCurrentPosition(): Promise<GeoResult> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Geolocation } = await import('@capacitor/geolocation')

      let perm
      try {
        perm = await Geolocation.requestPermissions()
      } catch {
        return { position: null, error: 'denied' }
      }

      const granted = perm.location === 'granted' || perm.coarseLocation === 'granted'
      if (!granted) return { position: null, error: 'denied' }

      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000,
        })
        return { position: { lat: pos.coords.latitude, lng: pos.coords.longitude } }
      } catch {
        return { position: null, error: 'unavailable' }
      }
    }

    // Browser fallback (e.g. visiting the site in a mobile browser)
    if (!navigator.geolocation) {
      return { position: null, error: 'unavailable' }
    }
    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ position: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            resolve({ position: null, error: 'denied' })
          } else {
            resolve({ position: null, error: 'unavailable' })
          }
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 },
      )
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/denied|permission|not authorized/i.test(msg)) {
      return { position: null, error: 'denied' }
    }
    return { position: null, error: 'unknown' }
  }
}
