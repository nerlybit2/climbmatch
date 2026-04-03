import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV !== 'production';

const config: CapacitorConfig = {
  appId: 'com.climbmatch.app',
  appName: 'ClimbMatch',
  // webDir is required by the CLI but ignored at runtime when server.url is set
  webDir: 'public',
  server: {
    // Dev: 10.0.2.2 is the Android emulator alias for localhost
    // Prod: set CAPACITOR_SERVER_URL env var or replace with your Vercel URL
    url: isDev
      ? 'http://10.0.2.2:3000'
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
