'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useProfile } from '@/contexts/ProfileContext'
import { useDiscover } from '@/contexts/DiscoverContext'
import { useInbox } from '@/contexts/InboxContext'
import { useMyPosts } from '@/contexts/MyPostsContext'

export function AppSplashWrapper({ children }: { children: React.ReactNode }) {
  const { loading: profileLoading } = useProfile()
  const { loading: discoverLoading } = useDiscover()
  const { loading: inboxLoading } = useInbox()
  const { loading: myPostsLoading } = useMyPosts()

  const isLoading = profileLoading || discoverLoading || inboxLoading || myPostsLoading

  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!isLoading && visible) {
      import('@capacitor/splash-screen').then(({ SplashScreen }) => {
        SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {})
      })
      setFading(true)
      const t = setTimeout(() => setVisible(false), 500)
      return () => clearTimeout(t)
    }
  }, [isLoading, visible])

  return (
    <>
      {children}
      {visible && (
        <div
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
          style={{ background: 'linear-gradient(180deg, #f0f4ff 0%, #e8edf8 100%)' }}
        >
          {/* Mountain silhouette layers */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full"
            viewBox="0 0 390 180"
            preserveAspectRatio="none"
          >
            <path
              d="M0,180 L0,140 L55,95 L100,115 L160,55 L215,90 L270,60 L320,85 L370,50 L390,62 L390,180 Z"
              fill="#4f8ef7"
              opacity="0.06"
            />
            <path
              d="M0,180 L0,155 L40,120 L90,138 L150,88 L200,110 L260,78 L310,105 L355,72 L390,88 L390,180 Z"
              fill="#4f8ef7"
              opacity="0.09"
            />
            <path
              d="M0,180 L0,165 L60,145 L120,155 L180,130 L240,148 L300,128 L360,142 L390,132 L390,180 Z"
              fill="#4f8ef7"
              opacity="0.08"
            />
          </svg>

          {/* Wordmark */}
          <p
            className="mt-4 text-[13px] font-bold tracking-[0.18em] uppercase animate-slide-in-up relative z-10"
            style={{ color: '#7b9ac4', animationDelay: '120ms' }}
          >
            ClimbMatch
          </p>

          {/* Tagline */}
          <p
            className="mt-1.5 text-[11px] tracking-wide animate-slide-in-up relative z-10"
            style={{ color: '#a0b8d8', animationDelay: '220ms' }}
          >
            Find your climbing partner
          </p>

          {/* Three-dot loader */}
          <div className="absolute bottom-14 flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: '#93b4e0', animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
