import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
}

export function Button({ variant = 'primary', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96]'
  const variants = {
    primary: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:brightness-110 hover:shadow-xl hover:shadow-blue-500/40',
    secondary: 'bg-white text-gray-700 shadow-sm border border-gray-100 hover:bg-gray-50 hover:border-gray-200',
    danger: 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:brightness-110',
    ghost: 'text-gray-500 hover:bg-gray-100/80',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  )
}
