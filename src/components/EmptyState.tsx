import Link from 'next/link'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({ icon, title, subtitle, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-8">
      <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">{subtitle}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl px-6 py-3 text-sm shadow-lg shadow-blue-500/25"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
