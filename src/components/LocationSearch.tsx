'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ISRAEL_CRAGS, ISRAEL_GYMS } from '@/lib/crags'
import { getCustomLocations, addCustomLocation } from '@/lib/actions/locations'

interface Props {
  value: string
  onChange: (value: string) => void
  type: 'gym' | 'crag'
  label?: string
  required?: boolean
  error?: string
}

export function LocationSearch({ value, onChange, type, label, required, error }: Props) {
  const staticList = type === 'gym' ? ISRAEL_GYMS : ISRAEL_CRAGS
  const [custom, setCustom] = useState<string[]>([])
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch community-added locations from DB on mount and when type changes
  useEffect(() => {
    getCustomLocations(type).then(setCustom).catch(() => {})
  }, [type])

  const list = [...staticList, ...custom.filter(c => !staticList.includes(c))]

  // Keep query in sync when value changes externally (e.g. locationType switch)
  useEffect(() => {
    setQuery(value)
  }, [value])

  const filtered = query.trim()
    ? list.filter(n => n.toLowerCase().includes(query.toLowerCase()))
    : list

  const showAddOption = query.trim().length > 0 && !list.some(n => n.toLowerCase() === query.toLowerCase().trim())

  const select = useCallback((name: string, isNew = false) => {
    if (isNew) {
      setCustom(prev => [...prev, name])
      addCustomLocation(name, type).catch(() => {})
    }
    onChange(name)
    setQuery(name)
    setOpen(false)
    setHighlighted(-1)
  }, [onChange, type])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        // If user typed something that isn't a valid selection, keep whatever they typed
        if (query.trim() && query !== value) onChange(query.trim())
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [query, value, onChange])

  const totalOptions = filtered.length + (showAddOption ? 1 : 0)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) { if (e.key !== 'Tab') setOpen(true); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => (h + 1) % totalOptions)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => (h - 1 + totalOptions) % totalOptions)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted >= 0 && highlighted < filtered.length) {
        select(filtered[highlighted])
      } else if (highlighted === filtered.length && showAddOption) {
        select(query.trim(), true)
      } else if (query.trim()) {
        select(query.trim(), true)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlighted(-1)
    }
  }

  const icon = type === 'crag'
    ? <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 19l4-8 4 4 3-6 4 10H3z"/></svg>
    : <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m4-4h1m-1 4h1M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4"/></svg>

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Search icon */}
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
        </div>

        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHighlighted(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={type === 'crag' ? 'Search crags…' : 'Search gyms…'}
          required={required}
          autoComplete="off"
          className={`w-full rounded-2xl border-0 bg-white pl-10 pr-4 py-3.5 text-sm shadow-sm ring-1 placeholder:text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
            error ? 'ring-red-400' : 'ring-gray-200'
          }`}
        />

        {/* Clear button */}
        {query.length > 0 && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onChange(''); setQuery(''); setOpen(true); inputRef.current?.focus() }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (filtered.length > 0 || showAddOption) && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <ul className="max-h-52 overflow-y-auto py-1.5">
            {filtered.map((name, i) => (
              <li key={name}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); select(name) }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                    highlighted === i ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {icon}
                  <span>{name}</span>
                </button>
              </li>
            ))}

            {showAddOption && (
              <li>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); select(query.trim(), true) }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left border-t border-slate-100 transition-colors ${
                    highlighted === filtered.length ? 'bg-blue-50 text-blue-700' : 'text-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span>Add &ldquo;{query.trim()}&rdquo;</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
