'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { COUNTRY_CODES, splitPhone, filterCountries, type Country } from '@/lib/phone'

interface PhoneInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function PhoneInput({ label, value, onChange, required }: PhoneInputProps) {
  const init = splitPhone(value || '')
  const [selected, setSelected] = useState<Country>(init.country)
  const [local, setLocal] = useState(init.local)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const numberRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  const filtered = useMemo(() => filterCountries(search), [search])

  const pick = (country: Country) => {
    setSelected(country)
    setOpen(false)
    setSearch('')
    onChange(local ? `${country.code}${local}` : '')
    setTimeout(() => numberRef.current?.focus(), 50)
  }

  const handleLocal = (val: string) => {
    const clean = val.replace(/[^\d\s\-()]/g, '')
    setLocal(clean)
    onChange(clean ? `${selected.code}${clean}` : '')
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-[#0a5048] ml-0.5">*</span>}
      </label>

      <div className="flex rounded-2xl overflow-visible ring-1 ring-gray-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#0a5048] transition-all relative" ref={dropdownRef}>
        {/* Country trigger button */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 pl-3.5 pr-2.5 py-3.5 bg-slate-50 border-r border-gray-200 rounded-l-2xl text-sm font-semibold text-gray-700 hover:bg-slate-100 transition-colors flex-shrink-0 focus:outline-none"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-gray-600">{selected.code}</span>
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Number input */}
        <input
          ref={numberRef}
          type="tel"
          value={local}
          onChange={e => handleLocal(e.target.value)}
          placeholder="50 123 4567"
          required={required && !local}
          className="flex-1 bg-transparent px-4 py-3.5 text-sm placeholder:text-gray-300 focus:outline-none min-w-0"
        />

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 z-50 overflow-hidden animate-fade-in">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country or code…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <ul className="overflow-y-auto max-h-56 py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-sm text-gray-400 text-center">No results</li>
              ) : (
                filtered.map((c) => {
                  const isActive = c.name === selected.name && c.code === selected.code
                  return (
                    <li key={c.name + c.code}>
                      <button
                        type="button"
                        onClick={() => pick(c)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                          isActive
                            ? 'bg-[#f0f7f5] text-[#0a5048]'
                            : 'hover:bg-slate-50 text-gray-700'
                        }`}
                      >
                        <span className="text-base w-6 text-center flex-shrink-0">{c.flag}</span>
                        <span className="flex-1 font-medium truncate">{c.name}</span>
                        <span className={`text-xs font-bold flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                          {c.code}
                        </span>
                        {isActive && (
                          <svg className="w-4 h-4 text-[#0a5048] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Preview */}
      {local && (
        <p className="text-[11px] text-gray-400 font-medium px-1">
          Full number: {selected.code}{local}
        </p>
      )}
    </div>
  )
}
