import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
        <input
          ref={ref}
          className={`w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-sm shadow-sm ring-1 ring-gray-200 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition-all ${
            error ? 'ring-red-400' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
