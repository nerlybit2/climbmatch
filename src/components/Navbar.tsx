'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/discover', label: 'Discover', icon: 'discover' },
  { href: '/requests/new', label: 'Post', icon: 'post' },
  { href: '/inbox', label: 'Inbox', icon: 'inbox' },
  { href: '/requests', label: 'My Posts', icon: 'list' },
  { href: '/profile', label: 'Profile', icon: 'profile' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-gray-200/50 pb-safe z-50">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/requests/new' && pathname.startsWith(tab.href + '/'))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full text-[10px] font-semibold tracking-wide transition-all duration-200 ${
                isActive ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-gradient-to-r from-orange-500 to-rose-500 rounded-full" />
              )}
              <NavIcon type={tab.icon} active={isActive} />
              <span className="mt-0.5">{tab.label}</span>
            </Link>
          )
        })}
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
    default:
      return null
  }
}
