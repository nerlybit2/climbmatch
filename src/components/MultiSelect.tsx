'use client'

interface MultiSelectProps {
  label?: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              selected.includes(o.value)
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
