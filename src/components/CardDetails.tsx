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
  const [imgSrc, setImgSrc] = useState(profile.photo_url || '/default-avatar.svg')
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="sticky top-0 bg-white/90 backdrop-blur-xl px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-extrabold">{profile.display_name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">
          <Image src={imgSrc} alt={profile.display_name} width={512} height={288} className="w-full h-72 object-cover rounded-2xl" onError={() => setImgSrc('/default-avatar.svg')} />
          {profile.bio && <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>}

          <div className="grid grid-cols-2 gap-4">
            {profile.experience_level && (
              <div className="bg-stone-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.cardDetails.level}</span>
                <p className="font-semibold text-sm mt-0.5 capitalize">{profile.experience_level}</p>
              </div>
            )}
            {profile.home_area && (
              <div className="bg-stone-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.cardDetails.area}</span>
                <p className="font-semibold text-sm mt-0.5">{profile.home_area}</p>
              </div>
            )}
            {profile.sport_grade_range && (
              <div className="bg-stone-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.cardDetails.sport}</span>
                <p className="font-semibold text-sm mt-0.5">{profile.sport_grade_range}</p>
              </div>
            )}
            {profile.boulder_grade_range && (
              <div className="bg-stone-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.cardDetails.boulder}</span>
                <p className="font-semibold text-sm mt-0.5">{profile.boulder_grade_range}</p>
              </div>
            )}
          </div>

          {gearList.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.cardDetails.gear}</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {gearList.map(g => <span key={g} className="bg-stone-100 text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium">{g}</span>)}
              </div>
            </div>
          )}

          {profile.languages && profile.languages.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.cardDetails.languages}</span>
              <p className="text-sm mt-0.5 font-medium">{profile.languages.join(', ')}</p>
            </div>
          )}

          {/* Compatibility */}
          {compatibility && (compatibility.gearMatches.length > 0 || compatibility.carpoolAvailable || compatibility.carpoolNeeded) && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t.cardDetails.compatibility}</h3>
              <div className="bg-emerald-50 rounded-2xl p-3 space-y-2">
                {compatibility.gearMatches.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <span className="text-emerald-500">✓</span>
                    <span>{t.cardDetails.youHave}: {compatibility.gearMatches.join(', ')}</span>
                  </div>
                )}
                {compatibility.carpoolAvailable && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <span className="text-emerald-500">✓</span>
                    <span>{t.cardDetails.canOfferRide}</span>
                  </div>
                )}
                {!compatibility.carpoolAvailable && compatibility.carpoolNeeded && (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <span className="text-amber-500">!</span>
                    <span>{t.cardDetails.theyNeedRide}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.cardDetails.requestDetails}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{t.cardDetails.date}</span>
                <p className="font-semibold text-sm mt-0.5">{request.date}</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{t.cardDetails.time}</span>
                <p className="font-semibold text-sm mt-0.5">{request.flexible ? t.cardDetails.flexibleTime : `${request.start_time?.slice(0, 5) || ''} - ${request.end_time?.slice(0, 5) || ''}`}</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{t.cardDetails.location}</span>
                <p className="font-semibold text-sm mt-0.5">{request.location_name}</p>
              </div>
              {request.goal_type && request.goal_type !== 'any' && (
                <div className="bg-blue-50 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{t.cardDetails.goal}</span>
                  <p className="font-semibold text-sm mt-0.5">{GOAL_LABELS[request.goal_type]}</p>
                </div>
              )}
              {request.desired_grade_range && (
                <div className="bg-blue-50 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{t.cardDetails.grade}</span>
                  <p className="font-semibold text-sm mt-0.5">{request.desired_grade_range}</p>
                </div>
              )}
            </div>
            {request.notes && <p className="text-sm text-gray-600 mt-3 bg-stone-50 p-4 rounded-2xl leading-relaxed">{request.notes}</p>}
            {needsList.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.cardDetails.needsGear}</span>
                <p className="text-sm font-medium mt-0.5">{needsList.join(', ')}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onPass} className="flex-1">{t.cardDetails.pass}</Button>
            <Button onClick={onInterested} className="flex-1">{t.cardDetails.interested}</Button>
          </div>

          <div className="flex gap-4 pt-3 border-t border-gray-100 justify-center">
            {showBlockConfirm ? (
              <div className="flex items-center gap-3 animate-fade-in">
                <span className="text-xs text-gray-500 font-medium">{t.cardDetails.areYouSure}</span>
                <Button variant="danger" onClick={handleBlock} className="text-xs !px-3 !py-1.5">{t.cardDetails.yesBlock}</Button>
                <Button variant="ghost" onClick={() => setShowBlockConfirm(false)} className="text-xs !px-3 !py-1.5">{t.cardDetails.cancel}</Button>
              </div>
            ) : (
              <>
                <button onClick={() => setShowBlockConfirm(true)} className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">{t.cardDetails.blockUser}</button>
                <span className="text-gray-200">|</span>
                <button onClick={() => setShowReport(true)} className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">{t.cardDetails.reportUser}</button>
              </>
            )}
          </div>

          {showReport && (
            <div className="bg-red-50 p-4 rounded-2xl space-y-3 animate-fade-in">
              <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder={t.cardDetails.reportPlaceholder} className="w-full text-sm border-0 bg-white ring-1 ring-red-200 rounded-xl p-3 resize-none focus:ring-2 focus:ring-red-400 outline-none" rows={2} />
              <div className="flex gap-2">
                <Button variant="danger" onClick={handleReport} className="text-xs">{t.cardDetails.submitReport}</Button>
                <Button variant="ghost" onClick={() => setShowReport(false)} className="text-xs">{t.cardDetails.cancel}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
