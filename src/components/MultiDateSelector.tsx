'use client'

import { useState } from 'react'
import { formatDateShort } from '@/lib/dates'

interface Props {
  value: string[]                    // sorted ISO date strings (at least one)
  onChange: (dates: string[]) => void
  minDate?: string
  label?: string
}

const MAX_DATES = 7

export function MultiDateSelector({ value, onChange, minDate, label }: Props) {
  // Infer initial mode from value length (edit mode: if request has multiple dates, start multi)
  const [isMulti, setIsMulti] = useState(() => value.length > 1)

  const sorted = [...value].sort()
  const singleDate = sorted[0] ?? ''

  const switchToSingle = () => {
    setIsMulti(false)
    // Keep only the earliest date
    const earliest = sorted[0]
    if (earliest) onChange([earliest])
  }

  const switchToMulti = () => {
    setIsMulti(true)
    // Current value carries over unchanged
  }

  const handleSingleChange = (newDate: string) => {
    onChange([newDate])
  }

  const handleAddDate = (newDate: string) => {
    if (!newDate) return
    if (value.includes(newDate)) return // no dupes
    if (value.length >= MAX_DATES) return
    const updated = [...value, newDate].sort()
    onChange(updated)
  }

  const handleRemove = (iso: string) => {
    if (value.length <= 1) return // keep at least one
    onChange(value.filter(d => d !== iso))
  }

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex bg-slate-100/80 rounded-2xl p-1 border border-slate-200/60 gap-1">
        <button
          type="button"
          onClick={switchToSingle}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
            !isMulti
              ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md shadow-blue-400/25'
              : 'text-slate-500'
          }`}
        >
          Single day
        </button>
        <button
          type="button"
          onClick={switchToMulti}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
            isMulti
              ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md shadow-blue-400/25'
              : 'text-slate-500'
          }`}
        >
          Multiple days
        </button>
      </div>

      {!isMulti ? (
        /* ── Single date input ─────────────────────────────────── */
        <div className="space-y-1.5">
          {label && (
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {label}
            </label>
          )}
          <input
            type="date"
            value={singleDate}
            onChange={e => handleSingleChange(e.target.value)}
            min={minDate}
            required
            className="w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-sm shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      ) : (
        /* ── Multi date mode ───────────────────────────────────── */
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {label ?? 'Dates'}
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {value.length}/{MAX_DATES}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {sorted.map(iso => (
              <span
                key={iso}
                className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold px-3 py-2 rounded-xl"
              >
                {formatDateShort(iso)}
                <button
                  type="button"
                  onClick={() => handleRemove(iso)}
                  disabled={value.length <= 1}
                  aria-label={`Remove ${formatDateShort(iso)}`}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-blue-400 hover:text-red-400 transition-colors disabled:opacity-30 ml-0.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}

            {value.length < MAX_DATES && (
              /* Label wrapping the hidden input — clicking anywhere on the label opens the date picker */
              <label className="inline-flex items-center gap-1.5 bg-slate-50 border border-dashed border-slate-300 text-slate-500 text-sm font-semibold px-3 py-2 rounded-xl hover:bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer select-none">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add date
                <input
                  type="date"
                  min={minDate}
                  className="sr-only"
                  onChange={e => {
                    handleAddDate(e.target.value)
                    // Reset so the same date can be picked again after remove
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>

          {value.length >= MAX_DATES && (
            <p className="text-xs text-slate-400 font-medium">
              Maximum {MAX_DATES} dates selected.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
