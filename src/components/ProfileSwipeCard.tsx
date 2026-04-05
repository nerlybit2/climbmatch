'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import type { Profile, PartnerRequest, GearSet } from '@/lib/types/database'
import { hapticFeedback } from '@/lib/capacitor/haptics'

interface ProfileSwipeCardProps {
  profile: Profile
  posts: PartnerRequest[]
  onSwipeRight: () => void
  onSwipeLeft: () => void
  onTap: () => void
  onPostTap?: () => void
}

export function ProfileSwipeCard({ profile, posts, onSwipeRight, onSwipeLeft, onTap, onPostTap }: ProfileSwipeCardProps) {
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
    if ((e.target as HTMLElement).closest('button, .post-banner')) return
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

  const gear = profile.gear as GearSet
  const nearestPost = posts[0]

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

        {/* LIKE stamp */}
        {offset.x > 40 && (
          <div className="absolute top-12 left-6 stamp border-green-400 text-green-400 rotate-[-20deg] bg-green-500/10 backdrop-blur-sm">
            LIKE
          </div>
        )}
        {/* NOPE stamp */}
        {offset.x < -40 && (
          <div className="absolute top-12 right-6 stamp border-red-400 text-red-400 rotate-[20deg] bg-red-500/10 backdrop-blur-sm">
            NOPE
          </div>
        )}

        {/* Floating Post Banner */}
        {posts.length > 0 && nearestPost && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPostTap?.() }}
            className="post-banner absolute top-12 left-3 right-3 z-[15] bg-white/95 backdrop-blur-2xl rounded-2xl p-2.5 flex items-center gap-2.5 shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0a5048] flex items-center justify-center flex-shrink-0">
              <svg className="w-[18px] h-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[12px] font-extrabold text-slate-800 leading-tight">Looking for partners</p>
              <p className="text-[10px] text-slate-400 font-semibold truncate leading-tight mt-0.5">
                {new Date(nearestPost.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' · '}
                {nearestPost.location_name}
                {nearestPost.start_time && ` · ${nearestPost.start_time.slice(0, 5)}`}
              </p>
            </div>
            {posts.length > 1 && (
              <span className="w-6 h-6 rounded-lg bg-[#0a5048] text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">
                {posts.length}
              </span>
            )}
            <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Bottom gradient info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent p-5 pt-32">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-white text-[26px] font-extrabold tracking-tight leading-tight">{profile.display_name}</h2>
              {profile.home_area && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-white/50 text-sm flex items-center gap-1 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {profile.home_area}
                  </span>
                </div>
              )}
              {profile.bio && (
                <p className="text-white/50 text-[13px] font-medium mt-1.5 line-clamp-2 leading-relaxed">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {profile.sport_grade_range && (
                  <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-semibold border border-white/10">🧗 Sport {profile.sport_grade_range}</span>
                )}
                {profile.boulder_grade_range && (
                  <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-semibold border border-white/10">🪨 Boulder {profile.boulder_grade_range}</span>
                )}
                {profile.experience_level && (
                  <span className="bg-white/15 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium capitalize">{profile.experience_level}</span>
                )}
              </div>
              {profile.languages && profile.languages.length > 0 && (
                <p className="text-white/40 text-xs font-medium mt-2">{profile.languages.join(' · ')}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 items-center ml-3">
              {gear?.rope && <span className="bg-white/15 backdrop-blur-sm p-2 rounded-full text-xs text-white" title="Has rope">🪢</span>}
              {profile.has_car && <span className="bg-white/15 backdrop-blur-sm p-2 rounded-full text-xs text-white" title="Has car">🚗</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
