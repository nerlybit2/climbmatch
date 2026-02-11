'use client'

import { useState, useRef } from 'react'
import type { Profile, PartnerRequest, GearSet } from '@/lib/types/database'

interface SwipeCardProps {
  profile: Profile
  request: PartnerRequest
  onSwipeRight: () => void
  onSwipeLeft: () => void
  onTap: () => void
}

const CLIMBING_LABELS: Record<string, string> = {
  indoor: 'Indoor', sport: 'Sport', boulder: 'Boulder', trad: 'Trad', multi_pitch: 'Multi-pitch',
}

const GOAL_LABELS: Record<string, string> = {
  project: 'Project', mileage: 'Mileage', easy_day: 'Easy Day', training: 'Training', any: 'Any',
}

export function SwipeCard({ profile, request, onSwipeRight, onSwipeLeft, onTap }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isLeaving, setIsLeaving] = useState<'left' | 'right' | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false)

  const SWIPE_THRESHOLD = 100

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    setIsDragging(true)
    hasMoved.current = false
    startPos.current = { x: e.clientX, y: e.clientY }
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true
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
      setIsLeaving('right')
      setTimeout(onSwipeRight, 300)
    } else if (offset.x < -SWIPE_THRESHOLD) {
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
        <img src={profile.photo_url} alt={profile.display_name} className="w-full h-full object-cover" draggable={false} />

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
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-28">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-white text-2xl font-extrabold tracking-tight">{profile.display_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {profile.home_area && (
                  <span className="text-white/60 text-sm flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {profile.home_area}
                  </span>
                )}
                {profile.experience_level && (
                  <span className="text-white/40 text-xs capitalize">· {profile.experience_level}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
                  {CLIMBING_LABELS[request.climbing_type] || request.climbing_type}
                </span>
                {request.desired_grade_range && (
                  <span className="bg-white/15 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium">{request.desired_grade_range}</span>
                )}
                {request.goal_type && request.goal_type !== 'any' && (
                  <span className="bg-white/15 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium">{GOAL_LABELS[request.goal_type]}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2.5 text-white/60 text-sm">
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
