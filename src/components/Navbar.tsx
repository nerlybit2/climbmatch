'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import { useLanguage } from '@/contexts/LanguageContext'

export function Navbar() {
  const pathname = usePathname()
  const { count } = useUnreadCount()
  const { t } = useLanguage()

  const tabs = [
    { href: '/discover', label: t.nav.discover, icon: 'discover' },
    { href: '/requests/new', label: t.nav.post, icon: 'post' },
    { href: '/inbox', label: t.nav.inbox, icon: 'inbox' },
    { href: '/requests', label: t.nav.myPosts, icon: 'list' },
    { href: '/profile', label: t.nav.profile, icon: 'profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div
        className="px-4 pointer-events-auto"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="glass nav-pill-shadow rounded-[28px] flex items-center h-[62px] px-1.5">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== '/requests/new' && pathname.startsWith(tab.href + '/'))
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex items-center justify-center h-full"
              >
                <div
                  className={`relative flex flex-col items-center gap-[3px] px-3 py-2 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-b from-blue-500 to-indigo-700 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <div className="relative">
                    <NavIcon type={tab.icon} active={isActive} />
                    {tab.icon === 'inbox' && count > 0 && (
                      <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5 shadow-sm">
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold tracking-wide leading-none ${isActive ? 'text-white/90' : ''}`}>
                    {tab.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function NavIcon({ type, active }: { type: string; active: boolean }) {
  const cls = "w-5 h-5"
  const sw = active ? 2.5 : 1.8

  switch (type) {
    case 'discover':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" fill={active ? "currentColor" : "none"} opacity={active ? 0.15 : 1} />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? "currentColor" : "none"} />
        </svg>
      )
    case 'post':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" fill={active ? "currentColor" : "none"} opacity={active ? 0.15 : 1} />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      )
    case 'inbox':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill={active ? "currentColor" : "none"} opacity={active ? 0.15 : 1} />
          <polyline points="22,6 12,13 2,6" fill="none" />
        </svg>
      )
    case 'list':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" fill={active ? "currentColor" : "none"} opacity={active ? 0.15 : 1} />
          <line x1="8" y1="8" x2="16" y2="8" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="16" x2="13" y2="16" />
        </svg>
      )
    case 'profile':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} opacity={active ? 0.15 : 1} />
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        </svg>
      )
    case 'settings':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"} opacity={active ? 0.8 : 1} />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      )
    default:
      return null
  }
}
