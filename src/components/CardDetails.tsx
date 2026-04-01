'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Profile, PartnerRequest, GearSet } from '@/lib/types/database'
import type { CompatibilityInfo } from '@/lib/actions/discover'
import { Button } from '@/components/Button'
import { blockUser, reportUser } from '@/lib/actions/safety'
import { useToast } from '@/hooks/useToast'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  profile: Profile
  request: PartnerRequest
  compatibility?: CompatibilityInfo
  onClose: () => void
  onInterested: () => void
  onPass: () => void
}

export function CardDetails({ profile, request, compatibility, onClose, onInterested, onPass }: Props) {
  const [showReport, setShowReport] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [imgError, setImgError] = useState(false)
  const toast = useToast()
  const { t } = useLanguage()

  const GOAL_LABELS: Record<string, string> = {
    project: t.goalTypes.project, mileage: t.goalTypes.mileage, easy_day: t.goalTypes.easyDay,
    training: t.goalTypes.training, any: t.goalTypes.any,
  }
  const GEAR_LABELS: Record<string, string> = {
    rope: t.gearLabels.rope, quickdraws: t.gearLabels.quickdraws, belayDevice: t.gearLabels.belayDevice,
    crashPad: t.gearLabels.crashPad, helmet: t.gearLabels.helmet,
  }

  const gear = profile.gear as GearSet
  const needsGear = request.needs_gear as GearSet
  const gearList = Object.entries(gear).filter(([, v]) => v).map(([k]) => GEAR_LABELS[k])
  const needsList = Object.entries(needsGear).filter(([, v]) => v).map(([k]) => GEAR_LABELS[k])

  const formattedDate = new Date(request.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })
  const timeStr = request.flexible
    ? t.cardDetails.flexibleTime
    : `${request.start_time?.slice(0, 5) ?? ''}${request.end_time ? ` – ${request.end_time.slice(0, 5)}` : ''}`

  const handleBlock = async () => {
    await blockUser(profile.id)
    toast.addToast(t.toasts.userBlocked, 'success')
    setShowBlockConfirm(false)
    onPass()
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return
    await reportUser(profile.id, reportReason)
    setShowReport(false)
    toast.addToast(t.toasts.reportSubmitted, 'success')
  }

  const hasCompatibility = compatibility && (
    compatibility.gearMatches.length > 0 || compatibility.carpoolAvailable || compatibility.carpoolNeeded
  )

  const hasPhoto = !!profile.photo_url && !imgError
  const initials = profile.display_name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="fixed inset-0 z-[60] flex items-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet — full-width on mobile, centered on wide screens */}
      <div
        className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl animate-slide-up flex flex-col"
        style={{ maxHeight: 'calc(100dvh - 90px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="relative flex-shrink-0 rounded-t-3xl overflow-hidden" style={{ height: 220 }}>
          {hasPhoto ? (
            <Image
              src={profile.photo_url!}
              alt={profile.display_name}
              fill
              sizes="(max-width: 512px) 100vw, 512px"
              className="object-cover"
              onError={() => setImgError(true)}
              priority
            />
          ) : (
            /* Gradient placeholder with initials */
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <span className="text-5xl font-extrabold text-white/80 select-none">{initials}</span>
            </div>
          )}

          {/* Dark-to-transparent gradient so name is readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Handle */}
          <div className="absolute top-3 left-0 right-0 flex justify-center">
            <div className="w-10 h-1 bg-white/40 rounded-full" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Name + location overlaid on photo */}
          <div className="absolute bottom-4 left-5 right-14">
            <h2 className="text-xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
              {profile.display_name}
            </h2>
            {profile.home_area && (
              <div className="flex items-center gap-1 mt-0.5">
                <svg className="w-3 h-3 text-white/70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="text-sm text-white/80 font-medium drop-shadow-sm">{profile.home_area}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick stat pills ─────────────────────────────────────── */}
        {(profile.sport_grade_range || profile.boulder_grade_range || profile.has_car || request.flexible || (profile.share_weight && profile.weight_kg)) && (
          <div className="flex-shrink-0 px-4 py-2.5 flex flex-wrap gap-2 border-b border-slate-100">
            {profile.sport_grade_range && (
              <Pill icon="🧗" label={`Sport ${profile.sport_grade_range}`} color="blue" />
            )}
            {profile.boulder_grade_range && (
              <Pill icon="🪨" label={`Boulder ${profile.boulder_grade_range}`} color="indigo" />
            )}
            {profile.has_car && <Pill icon="🚗" label="Has a car" color="slate" />}
            {request.flexible && <Pill icon="🕐" label="Flexible time" color="slate" />}
            {profile.share_weight && profile.weight_kg && (
              <Pill icon="⚖️" label={`${profile.weight_kg} kg`} color="slate" />
            )}
          </div>
        )}

        {/* ── Scrollable body ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 py-4 space-y-4 pb-4">

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
            )}

            {/* Request details */}
            <div>
              <SectionLabel>{t.cardDetails.requestDetails}</SectionLabel>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <InfoTile label={t.cardDetails.date} value={formattedDate} />
                <InfoTile label={t.cardDetails.time} value={timeStr} />
                <InfoTile label={t.cardDetails.location} value={request.location_name} />
                {request.goal_type && request.goal_type !== 'any' && (
                  <InfoTile label={t.cardDetails.goal} value={GOAL_LABELS[request.goal_type]} />
                )}
                {request.desired_grade_range && (
                  <InfoTile label={t.cardDetails.grade} value={request.desired_grade_range} />
                )}
              </div>

              {request.notes && (
                <div className="mt-2 bg-slate-50 rounded-2xl p-4">
                  <SectionLabel className="mb-1">Notes</SectionLabel>
                  <p className="text-sm text-slate-600 leading-relaxed">{request.notes}</p>
                </div>
              )}

              {needsList.length > 0 && (
                <div className="mt-3">
                  <SectionLabel>{t.cardDetails.needsGear}</SectionLabel>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {needsList.map(g => (
                      <span key={g} className="bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gear they have */}
            {gearList.length > 0 && (
              <div>
                <SectionLabel>{t.cardDetails.gear}</SectionLabel>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {gearList.map(g => (
                    <span key={g} className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <div>
                <SectionLabel>{t.cardDetails.languages}</SectionLabel>
                <p className="text-sm font-semibold text-slate-700 mt-1">{profile.languages.join(' · ')}</p>
              </div>
            )}

            {/* Compatibility */}
            {hasCompatibility && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-2">
                <SectionLabel className="text-emerald-600">{t.cardDetails.compatibility}</SectionLabel>
                {compatibility!.gearMatches.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-emerald-700">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    <span>{t.cardDetails.youHave}: <strong>{compatibility!.gearMatches.join(', ')}</strong></span>
                  </div>
                )}
                {compatibility!.carpoolAvailable && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{t.cardDetails.canOfferRide}</span>
                  </div>
                )}
                {!compatibility!.carpoolAvailable && compatibility!.carpoolNeeded && (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <span className="text-amber-500 font-bold">!</span>
                    <span>{t.cardDetails.theyNeedRide}</span>
                  </div>
                )}
              </div>
            )}

            {/* Block / Report */}
            <div className="flex gap-4 justify-center pt-1 pb-1">
              {showBlockConfirm ? (
                <div className="flex items-center gap-3 animate-fade-in">
                  <span className="text-xs text-slate-500 font-medium">{t.cardDetails.areYouSure}</span>
                  <Button variant="danger" onClick={handleBlock} className="!text-xs !px-3 !py-1.5">{t.cardDetails.yesBlock}</Button>
                  <Button variant="ghost" onClick={() => setShowBlockConfirm(false)} className="!text-xs !px-3 !py-1.5">{t.cardDetails.cancel}</Button>
                </div>
              ) : (
                <>
                  <button onClick={() => setShowBlockConfirm(true)} className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium">
                    {t.cardDetails.blockUser}
                  </button>
                  <span className="text-slate-200">|</span>
                  <button onClick={() => setShowReport(true)} className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium">
                    {t.cardDetails.reportUser}
                  </button>
                </>
              )}
            </div>

            {showReport && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl space-y-3 animate-fade-in">
                <textarea
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  placeholder={t.cardDetails.reportPlaceholder}
                  className="w-full text-sm border-0 bg-white ring-1 ring-red-200 rounded-xl p-3 resize-none focus:ring-2 focus:ring-red-400 outline-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button variant="danger" onClick={handleReport} className="text-xs">{t.cardDetails.submitReport}</Button>
                  <Button variant="ghost" onClick={() => setShowReport(false)} className="text-xs">{t.cardDetails.cancel}</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Fixed bottom CTA ─────────────────────────────────────── */}
        <div
          className="flex-shrink-0 px-5 py-4 bg-white border-t border-slate-100 flex gap-3"
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={onPass}
            className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm active:scale-[0.97] transition-transform"
          >
            {t.cardDetails.pass}
          </button>
          <button
            onClick={onInterested}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-bold text-sm shadow-md shadow-blue-400/25 active:scale-[0.97] transition-transform"
          >
            {t.cardDetails.interested}
          </button>
        </div>
      </div>
    </div>
  )
}

function Pill({ icon, label, color }: { icon: string; label: string; color: 'blue' | 'indigo' | 'slate' }) {
  const cls = {
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    slate:  'bg-slate-100 text-slate-600 border-slate-200',
  }[color]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cls}`}>
      <span>{icon}</span>
      {label}
    </span>
  )
}

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] font-bold uppercase tracking-widest text-slate-400 ${className}`}>
      {children}
    </p>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-3 bg-blue-50">
      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{label}</p>
      <p className="font-semibold text-sm mt-0.5 text-slate-800">{value}</p>
    </div>
  )
}
