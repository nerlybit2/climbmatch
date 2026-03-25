export interface Country {
  code: string
  flag: string
  name: string
}

export const COUNTRY_CODES: Country[] = [
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
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
  { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
]

/** Longest-match split of a full phone string into dial code + local number. */
export function splitPhone(full: string): { country: Country; local: string } {
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
  for (const c of sorted) {
    if (full.startsWith(c.code)) {
      return { country: c, local: full.slice(c.code.length) }
    }
  }
  return { country: COUNTRY_CODES[0], local: '' }
}

/** Filter COUNTRY_CODES by name or dial code substring (case-insensitive). */
export function filterCountries(query: string): Country[] {
  const q = query.trim().toLowerCase()
  if (!q) return COUNTRY_CODES
  return COUNTRY_CODES.filter(
    c =>
      c.name.toLowerCase().includes(q) ||
      c.code.includes(q) ||
      c.code.replace('+', '').includes(q),
  )
}

/** Strip non-digit characters for use in wa.me or sms: links. */
export function digitsOnly(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

/** Build a WhatsApp URL from a full phone number string. */
export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(message)}`
}

/** Normalise an Instagram handle or URL to just the username. */
export function parseInstagram(raw: string): string {
  return raw
    .replace(/^@/, '')
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '')
    .replace(/\/$/, '')
    .trim()
}

/** Normalise a Facebook profile URL or username to just the path segment. */
export function parseFacebook(raw: string): string {
  return raw
    .replace(/^(https?:\/\/)?(www\.)?facebook\.com\//, '')
    .replace(/\/$/, '')
    .trim()
}
