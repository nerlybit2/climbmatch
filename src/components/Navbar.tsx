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
    { href: '/swipe', label: t.nav.swipeDiscover, icon: 'swipeDiscover' },
    { href: '/discover', label: t.nav.discover, icon: 'discover' },
    { href: '/requests/new', label: t.nav.post, icon: 'post' },
    { href: '/inbox', label: t.nav.inbox, icon: 'inbox' },
    { href: '/requests', label: t.nav.myPosts, icon: 'list' },
    { href: '/profile', label: t.nav.profile, icon: 'profile' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#F5F5F5] border-t border-[#e7ebed]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-[62px]">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/requests/new' &&
             pathname !== '/requests/new' &&
             pathname.startsWith(tab.href + '/'))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] relative pt-1"
            >
              {/* Top indicator line */}
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-200"
                style={{
                  width: isActive ? 32 : 0,
                  background: isActive ? '#2f4f4f' : 'transparent',
                }}
              />
              <div className="relative">
                <NavIcon type={tab.icon} active={isActive} />
                {tab.icon === 'inbox' && count > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] bg-[#e48b34] text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] font-bold tracking-wide leading-none transition-all duration-200 ${
                  isActive ? 'text-[#1b4d42] opacity-100' : 'text-[#8bcaf0] opacity-0 max-h-0 overflow-hidden'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function NavIcon({ type, active }: { type: string; active: boolean }) {
  const cls = "w-[22px] h-[22px]"
  const color = active ? '#1b4d42' : '#8bcaf0'
  const sw = active ? 2.2 : 1.8

  switch (type) {
    case 'swipeDiscover':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" fill={active ? color : 'none'} opacity={active ? 0.12 : 1} />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? color : 'none'} opacity={active ? 0.6 : 1} />
        </svg>
      )
    case 'discover':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      )
    case 'post':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" fill={active ? color : 'none'} opacity={active ? 0.12 : 1} />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      )
    case 'inbox':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill={active ? color : 'none'} opacity={active ? 0.12 : 1} />
          <polyline points="22,6 12,13 2,6" fill="none" />
        </svg>
      )
    case 'list':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" fill={active ? color : 'none'} opacity={active ? 0.12 : 1} />
          <line x1="8" y1="8" x2="16" y2="8" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="16" x2="13" y2="16" />
        </svg>
      )
    case 'profile':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" fill={active ? color : 'none'} opacity={active ? 0.12 : 1} />
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        </svg>
      )
    default:
      return null
  }
}
