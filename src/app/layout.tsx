import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NativeSplashHider } from '@/components/NativeSplashHider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClimbMatch',
  description: 'Find your climbing partner',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ClimbMatch',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#EDF1F7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body suppressHydrationWarning className={`${inter.className} bg-stone-50 text-gray-900 antialiased`}>
        <NativeSplashHider />
        {children}
      </body>
    </html>
  )
}
