'use client'

import type { GearSet } from '@/lib/types/database'

const GEAR_ITEMS: { key: keyof GearSet; label: string; emoji: string }[] = [
  { key: 'rope', label: 'Rope', emoji: '🪢' },
  { key: 'quickdraws', label: 'Quickdraws', emoji: '🔗' },
  { key: 'belayDevice', label: 'Belay Device', emoji: '⛓' },
  { key: 'crashPad', label: 'Crash Pad', emoji: '🛡' },
  { key: 'helmet', label: 'Helmet', emoji: '⛑' },
]

interface Props {
  label?: string
  gear: GearSet
  onChange: (gear: GearSet) => void
}

export function GearCheckboxes({ label, gear, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {GEAR_ITEMS.map((item) => (
          <label
            key={item.key}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 ${
              gear[item.key]
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={gear[item.key]}
              onChange={(e) => onChange({ ...gear, [item.key]: e.target.checked })}
              className="sr-only"
            />
            <span className="text-xs">{item.emoji}</span>
            {item.label}
          </label>
        ))}
      </div>
    </div>
  )
}
