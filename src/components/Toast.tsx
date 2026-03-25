'use client'

import { useContext, type ReactNode } from 'react'
import { ToastContext } from '@/contexts/ToastContext'
import type { Toast } from '@/contexts/ToastContext'

const icons: Record<Toast['variant'], ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M10 6L6 10M6 6l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M8 7.333V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="5.333" r="0.667" fill="currentColor" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.928 14H1.072L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6.667V9.333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="11.333" r="0.667" fill="currentColor" />
    </svg>
  ),
}

const variantStyles: Record<Toast['variant'], string> = {
  success: 'bg-emerald-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-gray-800 text-white',
  warning: 'bg-amber-500 text-white',
}

export function ToastContainer() {
  const context = useContext(ToastContext)
  if (!context) return null
  const { toasts, removeToast } = context

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 px-5 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto max-w-sm w-full rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 text-sm font-medium animate-slide-up ${variantStyles[toast.variant]}`}
          style={{ animation: 'toast-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          <span className="flex-shrink-0">{icons[toast.variant]}</span>
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
