import type { CapacitorConfig } from '@capacitor/cli';

// Production is the default — no env var needed for Play Store builds.
// Dev requires explicit opt-in via CAPACITOR_DEV_URL to prevent accidentally
// shipping an APK that points at localhost.
//
// Dev server URL options (set CAPACITOR_DEV_URL before running cap:sync):
//   Real device (USB):  CAPACITOR_DEV_URL=http://localhost:3000  (+ adb reverse tcp:3000 tcp:3000)
//   Android emulator:   CAPACITOR_DEV_URL=http://10.0.2.2:3000
//
// Production URL: defaults to Vercel; override with CAPACITOR_SERVER_URL.
const devUrl = process.env.CAPACITOR_DEV_URL
const isDev = !!devUrl

const config: CapacitorConfig = {
  appId: 'com.climbmatch.app',
  appName: 'ClimbMatch',
  // webDir is required by the CLI but ignored at runtime when server.url is set
  webDir: 'public',
  server: {
    url: isDev
      ? devUrl!
      : (process.env.CAPACITOR_SERVER_URL ?? 'https://climbmatch.vercel.app'),
    cleartext: isDev,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 2000,
      backgroundColor: '#f9fafb',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f9fafb',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
