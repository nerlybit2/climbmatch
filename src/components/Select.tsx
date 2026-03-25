import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
        <select
          ref={ref}
          className={`w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-sm shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none ${
            error ? 'ring-red-400' : ''
          } ${className}`}
          {...props}
        >
          <option value="">Select...</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
