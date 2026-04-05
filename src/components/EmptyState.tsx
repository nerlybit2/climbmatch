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
      <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-7 leading-relaxed">{subtitle}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="bg-[#0a5048] text-white font-bold rounded-2xl px-7 py-3.5 text-sm shadow-lg shadow-[#0a5048]/25 active:scale-[0.96] transition-transform"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
