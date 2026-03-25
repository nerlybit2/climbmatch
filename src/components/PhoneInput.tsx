'use client'

import { useState, useEffect } from 'react'

const COUNTRY_CODES = [
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+1',   flag: '🇺🇸', name: 'US/Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43',  flag: '🇦🇹', name: 'Austria' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgium' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: '+45',  flag: '🇩🇰', name: 'Denmark' },
  { code: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+36',  flag: '🇭🇺', name: 'Hungary' },
  { code: '+30',  flag: '🇬🇷', name: 'Greece' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
]

interface PhoneInputProps {
  label: string
  value: string // full value like "+972501234567"
  onChange: (value: string) => void
  required?: boolean
}

function splitPhone(full: string): { dialCode: string; local: string } {
  for (const c of COUNTRY_CODES.sort((a, b) => b.code.length - a.code.length)) {
    if (full.startsWith(c.code)) {
      return { dialCode: c.code, local: full.slice(c.code.length) }
    }
  }
  return { dialCode: '+972', local: full.replace(/^\+?\d{0,4}/, '') }
}

export function PhoneInput({ label, value, onChange, required }: PhoneInputProps) {
  const initial = splitPhone(value || '')
  const [dialCode, setDialCode] = useState(initial.dialCode)
  const [local, setLocal] = useState(initial.local)

  useEffect(() => {
    // If parent resets value externally
    if (!value) { setDialCode('+972'); setLocal(''); return }
    const split = splitPhone(value)
    setDialCode(split.dialCode)
    setLocal(split.local)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDialCode = (code: string) => {
    setDialCode(code)
    onChange(local ? `${code}${local}` : '')
  }

  const handleLocal = (num: string) => {
    // Strip non-digits (allow leading spaces stripped)
    const clean = num.replace(/[^\d\s\-()]/g, '')
    setLocal(clean)
    onChange(clean ? `${dialCode}${clean}` : '')
  }

  const selected = COUNTRY_CODES.find(c => c.code === dialCode) ?? COUNTRY_CODES[0]

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="flex rounded-2xl overflow-hidden ring-1 ring-gray-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
        {/* Country code selector */}
        <div className="relative flex-shrink-0">
          <select
            value={dialCode}
            onChange={e => handleDialCode(e.target.value)}
            className="h-full appearance-none bg-slate-50 border-r border-gray-200 pl-3 pr-7 text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
            style={{ minWidth: '90px' }}
          >
            {COUNTRY_CODES.map(c => (
              <option key={c.code + c.name} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {/* Number input */}
        <input
          type="tel"
          value={local}
          onChange={e => handleLocal(e.target.value)}
          placeholder="50 123 4567"
          required={required}
          className="flex-1 bg-transparent px-4 py-3.5 text-sm placeholder:text-gray-300 focus:outline-none"
        />
      </div>
      <p className="text-[11px] text-gray-400 font-medium">
        {selected.flag} {selected.name} {dialCode}
        {local && ` · ${dialCode}${local}`}
      </p>
    </div>
  )
}
