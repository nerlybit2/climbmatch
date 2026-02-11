'use client'

import { useState } from 'react'
import type { Profile, PartnerRequest, GearSet } from '@/lib/types/database'
import { Button } from '@/components/Button'
import { blockUser, reportUser } from '@/lib/actions/safety'

const CLIMBING_LABELS: Record<string, string> = {
  indoor: 'Indoor', sport: 'Sport', boulder: 'Boulder', trad: 'Trad', multi_pitch: 'Multi-pitch',
}
const GOAL_LABELS: Record<string, string> = {
  project: 'Project', mileage: 'Mileage', easy_day: 'Easy Day', training: 'Training', any: 'Any',
}
const GEAR_LABELS: Record<string, string> = {
  rope: 'Rope', quickdraws: 'Quickdraws', belayDevice: 'Belay Device', crashPad: 'Crash Pad', helmet: 'Helmet',
}

interface Props {
  profile: Profile
  request: PartnerRequest
  onClose: () => void
  onInterested: () => void
  onPass: () => void
}

export function CardDetails({ profile, request, onClose, onInterested, onPass }: Props) {
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const gear = profile.gear as GearSet
  const needsGear = request.needs_gear as GearSet
  const gearList = Object.entries(gear).filter(([, v]) => v).map(([k]) => GEAR_LABELS[k])
  const needsList = Object.entries(needsGear).filter(([, v]) => v).map(([k]) => GEAR_LABELS[k])

  const handleBlock = async () => {
    if (!confirm('Block this user? You won\'t see each other anymore.')) return
    await blockUser(profile.id)
    onPass()
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return
    await reportUser(profile.id, reportReason)
    setShowReport(false)
    alert('Report submitted. Thank you.')
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
          <img src={profile.photo_url} alt={profile.display_name} className="w-full h-72 object-cover rounded-2xl" />
          {profile.bio && <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>}

          <div className="grid grid-cols-2 gap-4">
            {profile.home_area && (
              <div className="bg-stone-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Area</span>
                <p className="font-semibold text-sm mt-0.5">{profile.home_area}</p>
              </div>
            )}
            {profile.experience_level && (
              <div className="bg-stone-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Level</span>
                <p className="font-semibold text-sm mt-0.5 capitalize">{profile.experience_level}</p>
              </div>
            )}
            {profile.sport_grade_range && (
              <div className="bg-stone-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sport</span>
                <p className="font-semibold text-sm mt-0.5">{profile.sport_grade_range}</p>
              </div>
            )}
            {profile.boulder_grade_range && (
              <div className="bg-stone-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Boulder</span>
                <p className="font-semibold text-sm mt-0.5">{profile.boulder_grade_range}</p>
              </div>
            )}
          </div>

          {gearList.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gear</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {gearList.map(g => <span key={g} className="bg-stone-100 text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium">{g}</span>)}
              </div>
            </div>
          )}

          {profile.languages && profile.languages.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Languages</span>
              <p className="text-sm mt-0.5 font-medium">{profile.languages.join(', ')}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Request Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Date</span>
                <p className="font-semibold text-sm mt-0.5">{request.date}</p>
              </div>
              <div className="bg-orange-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Time</span>
                <p className="font-semibold text-sm mt-0.5">{request.flexible ? 'Flexible' : `${request.start_time?.slice(0, 5) || ''} - ${request.end_time?.slice(0, 5) || ''}`}</p>
              </div>
              <div className="bg-orange-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Location</span>
                <p className="font-semibold text-sm mt-0.5">{request.location_name}</p>
              </div>
              <div className="bg-orange-50 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Type</span>
                <p className="font-semibold text-sm mt-0.5">{CLIMBING_LABELS[request.climbing_type]}</p>
              </div>
              {request.goal_type && request.goal_type !== 'any' && (
                <div className="bg-orange-50 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Goal</span>
                  <p className="font-semibold text-sm mt-0.5">{GOAL_LABELS[request.goal_type]}</p>
                </div>
              )}
              {request.desired_grade_range && (
                <div className="bg-orange-50 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Grade</span>
                  <p className="font-semibold text-sm mt-0.5">{request.desired_grade_range}</p>
                </div>
              )}
            </div>
            {request.notes && <p className="text-sm text-gray-600 mt-3 bg-stone-50 p-4 rounded-2xl leading-relaxed">{request.notes}</p>}
            {needsList.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Needs gear</span>
                <p className="text-sm font-medium mt-0.5">{needsList.join(', ')}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onPass} className="flex-1">Pass</Button>
            <Button onClick={onInterested} className="flex-1">Interested</Button>
          </div>

          <div className="flex gap-4 pt-3 border-t border-gray-100 justify-center">
            <button onClick={handleBlock} className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">Block User</button>
            <span className="text-gray-200">|</span>
            <button onClick={() => setShowReport(true)} className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">Report User</button>
          </div>

          {showReport && (
            <div className="bg-red-50 p-4 rounded-2xl space-y-3 animate-fade-in">
              <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Why are you reporting this user?" className="w-full text-sm border-0 bg-white ring-1 ring-red-200 rounded-xl p-3 resize-none focus:ring-2 focus:ring-red-400 outline-none" rows={2} />
              <div className="flex gap-2">
                <Button variant="danger" onClick={handleReport} className="text-xs">Submit Report</Button>
                <Button variant="ghost" onClick={() => setShowReport(false)} className="text-xs">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
