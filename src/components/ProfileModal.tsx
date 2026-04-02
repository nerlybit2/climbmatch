'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Profile, GearSet } from '@/lib/types/database'
import { digitsOnly, parseInstagram, parseFacebook } from '@/lib/phone'

interface Props {
  profile: Profile
  /** Contact info — only pass when the current user is entitled to see it */
  phone?: string | null
  instagram?: string | null
  facebook?: string | null
  /** Used to pre-fill the WhatsApp message */
  location?: string
  onClose: () => void
}

export function ProfileModal({ profile, phone, instagram, facebook, location, onClose }: Props) {
  const [imgSrc, setImgSrc] = useState(profile.photo_url || '/logo.png')

  const gear = profile.gear as GearSet
  const gearLabels: Record<string, string> = {
    rope: 'Rope', quickdraws: 'Quickdraws', belayDevice: 'Belay device',
    crashPad: 'Crash pad', helmet: 'Helmet',
  }
  const gearList = Object.entries(gear).filter(([, v]) => v).map(([k]) => gearLabels[k])

  const cleanPhone = phone ? digitsOnly(phone) : ''
  const hasPhone = cleanPhone.length > 0
  const igHandle = instagram ? parseInstagram(instagram) : null
  const fbHandle = facebook ? parseFacebook(facebook) : null
  const hasContact = hasPhone || igHandle || fbHandle

  const waMsg = encodeURIComponent(
    location
      ? `Hey! I saw your ClimbMatch post at ${location}. Let's climb together! 🧗`
      : `Hey! I found you on ClimbMatch. Let's climb together! 🧗`
  )

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center pb-[80px]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Sticky header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl px-5 py-3 flex items-center justify-between z-10 border-b border-gray-50">
          <h2 className="text-lg font-extrabold text-slate-900">{profile.display_name}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5 pt-4">
          {/* Photo */}
          <Image
            src={imgSrc}
            alt={profile.display_name}
            width={480}
            height={320}
            className="w-full h-64 object-cover rounded-2xl"
            onError={() => setImgSrc('/logo.png')}
          />

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {profile.home_area && (
              <Stat label="Home area" value={profile.home_area} />
            )}
            {profile.sport_grade_range && (
              <Stat label="Sport" value={profile.sport_grade_range} />
            )}
            {profile.boulder_grade_range && (
              <Stat label="Boulder" value={profile.boulder_grade_range} />
            )}
            {profile.share_weight && profile.weight_kg && (
              <Stat label="Weight" value={`${profile.weight_kg} kg`} />
            )}
            {profile.has_car && (
              <Stat label="Car" value="Has a car 🚗" />
            )}
            {profile.languages && profile.languages.length > 0 && (
              <Stat label="Languages" value={profile.languages.join(', ')} />
            )}
          </div>

          {/* Gear */}
          {gearList.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Gear they have</p>
              <div className="flex flex-wrap gap-1.5">
                {gearList.map(g => (
                  <span key={g} className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact buttons */}
          {hasContact && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact</p>

              {hasPhone && (
                <>
                  <a
                    href={`https://wa.me/${cleanPhone}?text=${waMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] text-white text-sm font-bold rounded-2xl py-3.5 active:scale-[0.97] transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.359 0-4.55-.822-6.262-2.192l-.438-.362-2.657.891.891-2.657-.362-.438A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href={`sms:+${cleanPhone}`}
                    className="flex items-center justify-center gap-2.5 w-full bg-slate-100 text-slate-700 text-sm font-bold rounded-2xl py-3.5 active:scale-[0.97] transition-transform border border-slate-200/60"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    SMS
                  </a>
                </>
              )}

              <div className="flex gap-2.5">
                {igHandle && (
                  <a
                    href={`https://instagram.com/${igHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-bold rounded-2xl py-3.5 active:scale-[0.97] transition-transform"
                    style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    @{igHandle}
                  </a>
                )}
                {fbHandle && (
                  <a
                    href={`https://facebook.com/${fbHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1877F2] text-white text-sm font-bold rounded-2xl py-3.5 active:scale-[0.97] transition-transform"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="font-semibold text-sm mt-0.5 text-slate-800">{value}</p>
    </div>
  )
}
