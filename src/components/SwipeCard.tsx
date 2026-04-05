'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import type { Profile, PartnerRequest, GearSet } from '@/lib/types/database'
import type { CompatibilityInfo } from '@/lib/actions/discover'
import { hapticFeedback } from '@/lib/capacitor/haptics'

interface SwipeCardProps {
  profile: Profile
  request: PartnerRequest
  compatibility?: CompatibilityInfo
  onSwipeRight: () => void
  onSwipeLeft: () => void
  onTap: () => void
}

const GOAL_LABELS: Record<string, string> = {
  project: 'Project', mileage: 'Mileage', easy_day: 'Easy Day', training: 'Training', any: 'Any',
}

export function SwipeCard({ profile, request, compatibility, onSwipeRight, onSwipeLeft, onTap }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isLeaving, setIsLeaving] = useState<'left' | 'right' | null>(null)
  const [imgSrc, setImgSrc] = useState(profile.photo_url || '/logo.png')
  const startPos = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false)
  const hapticFired = useRef(false)

  const SWIPE_THRESHOLD = 100

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    setIsDragging(true)
    hasMoved.current = false
    hapticFired.current = false
    startPos.current = { x: e.clientX, y: e.clientY }
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true
    if (Math.abs(dx) > 40 && !hapticFired.current) {
      hapticFired.current = true
      hapticFeedback('light')
    }
    setOffset({ x: dx, y: dy * 0.3 })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    cardRef.current?.releasePointerCapture(e.pointerId)

    if (!hasMoved.current) {
      onTap()
      return
    }

    if (offset.x > SWIPE_THRESHOLD) {
      hapticFeedback('medium')
      setIsLeaving('right')
      setTimeout(onSwipeRight, 300)
    } else if (offset.x < -SWIPE_THRESHOLD) {
      hapticFeedback('medium')
      setIsLeaving('left')
      setTimeout(onSwipeLeft, 300)
    } else {
      setOffset({ x: 0, y: 0 })
    }
  }

  const rotation = offset.x * 0.08
  const opacity = Math.max(0, 1 - Math.abs(offset.x) / 500)

  const leaveTransform = isLeaving === 'right'
    ? 'translateX(150%) rotate(25deg)'
    : isLeaving === 'left'
    ? 'translateX(-150%) rotate(-25deg)'
    : `translateX(${offset.x}px) translateY(${offset.y}px) rotate(${rotation}deg)`

  const profileGear = profile.gear as GearSet
  const formatTime = (t: string | null) => t ? t.slice(0, 5) : ''
  const dateLabel = new Date(request.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { setIsDragging(false); setOffset({ x: 0, y: 0 }) }}
      className="absolute inset-0 select-none touch-none"
      style={{
        transform: leaveTransform,
        transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s',
        opacity: isLeaving ? 0 : opacity,
      }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden card-shadow-lg bg-gray-900">
        <Image src={imgSrc} alt={profile.display_name} fill sizes="(max-width: 512px) 100vw, 512px" className="object-cover" draggable={false} priority onError={() => setImgSrc('/logo.png')} />

        {/* INTERESTED stamp */}
        {offset.x > 40 && (
          <div className="absolute top-12 left-6 stamp border-green-400 text-green-400 rotate-[-20deg] bg-green-500/10 backdrop-blur-sm">
            LIKE
          </div>
        )}
        {/* PASS stamp */}
        {offset.x < -40 && (
          <div className="absolute top-12 right-6 stamp border-red-400 text-red-400 rotate-[20deg] bg-red-500/10 backdrop-blur-sm">
            NOPE
          </div>
        )}

        {/* Bottom gradient info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent p-5 pt-32">
          {/* Compatibility pills */}
          {compatibility && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {compatibility.gearMatches.length > 0 && (
                <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide">
                  🎒 Has {compatibility.gearMatches.length === 1 ? compatibility.gearMatches[0] : `${compatibility.gearMatches.length} gear items`}
                </span>
              )}
              {compatibility.carpoolAvailable ? (
                <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide">
                  🚗 You can drive
                </span>
              ) : compatibility.carpoolNeeded ? (
                <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide">
                  🚗 Needs ride
                </span>
              ) : null}
              {compatibility.timeMatch && (
                <span className="bg-[#0a5048]/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide">
                  ⏰ Time match
                </span>
              )}
            </div>
          )}
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-white text-[26px] font-extrabold tracking-tight leading-tight">{profile.display_name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {profile.home_area && (
                  <span className="text-white/50 text-sm flex items-center gap-1 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {profile.home_area}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {request.desired_grade_range && (
                  <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-semibold border border-white/10">{request.desired_grade_range}</span>
                )}
                {request.goal_type && request.goal_type !== 'any' && (
                  <span className="bg-white/15 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium">{GOAL_LABELS[request.goal_type]}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-white/60 text-sm">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {dateLabel}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {request.location_name}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  {request.flexible ? 'Flexible' : `${formatTime(request.start_time)}${request.end_time ? ' - ' + formatTime(request.end_time) : ''}`}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 items-center ml-3">
              {profileGear?.rope && <span className="bg-white/15 backdrop-blur-sm p-2 rounded-full text-xs text-white" title="Has rope">🪢</span>}
              {profile.has_car && <span className="bg-white/15 backdrop-blur-sm p-2 rounded-full text-xs text-white" title="Has car">🚗</span>}
              {request.carpool_needed && <span className="bg-amber-500/80 backdrop-blur-sm p-2 rounded-full text-xs text-white" title="Needs ride">🤝</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
