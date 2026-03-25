'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { MatchResult } from '@/lib/actions/interests'
import { hapticNotification } from '@/lib/capacitor/haptics'
import { useEffect } from 'react'

interface MatchCelebrationProps {
  result: MatchResult
  onClose: () => void
  closeLabel?: string
}

const CONFETTI_COLORS = ['#f97316', '#fb7185', '#fbbf24', '#ffffff', '#a78bfa', '#34d399']

export function MatchCelebration({ result, onClose, closeLabel }: MatchCelebrationProps) {
  const [imgSrc, setImgSrc] = useState(result.matchedProfile?.photo_url || '/default-avatar.svg')

  useEffect(() => {
    hapticNotification('success')
  }, [])

  const whatsappUrl = result.matchedProfile?.phone
    ? `https://wa.me/${result.matchedProfile.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        `Hey! We matched on ClimbMatch at ${result.requestDetails?.location_name || 'the crag'}. Let's plan! 🧗`
      )}`
    : null

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${Math.random() * 1.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              width: `${6 + Math.random() * 6}px`,
              height: `${6 + Math.random() * 6}px`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        <h1 className="text-4xl font-extrabold gradient-text mb-6">It&apos;s a Match!</h1>

        <div className="w-32 h-32 rounded-full border-4 border-orange-500 shadow-2xl shadow-orange-500/30 overflow-hidden mb-4 relative">
          <Image
            src={imgSrc}
            alt={result.matchedProfile?.display_name || 'Match'}
            fill
            className="object-cover"
            onError={() => setImgSrc('/default-avatar.svg')}
          />
        </div>

        <p className="text-xl font-bold text-white mb-2">
          {result.matchedProfile?.display_name}
        </p>

        {result.requestDetails && (
          <p className="text-white/60 text-sm mb-8">
            {result.requestDetails.location_name} on{' '}
            {new Date(result.requestDetails.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold rounded-2xl px-6 py-3.5 text-center shadow-lg shadow-orange-500/25 active:scale-[0.96] transition-transform"
            >
              Send a Message
            </a>
          )}
          <button
            onClick={onClose}
            className="w-full bg-white/10 backdrop-blur-sm text-white font-bold rounded-2xl px-6 py-3.5 active:scale-[0.96] transition-transform"
          >
            {closeLabel ?? 'Keep Swiping'}
          </button>
        </div>
      </div>
    </div>
  )
}
