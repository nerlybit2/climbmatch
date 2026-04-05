'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { MatchResult } from '@/lib/actions/interests'
import { hapticNotification } from '@/lib/capacitor/haptics'
import { digitsOnly, parseInstagram, parseFacebook } from '@/lib/phone'
import { useEffect } from 'react'

interface MatchCelebrationProps {
  result: MatchResult
  onClose: () => void
  closeLabel?: string
}

const CONFETTI_COLORS = ['#0a5048', '#e48b34', '#1b7a6a', '#ffffff', '#f5e3cf', '#2f4f4f']

export function MatchCelebration({ result, onClose, closeLabel }: MatchCelebrationProps) {
  const [imgSrc, setImgSrc] = useState(result.matchedProfile?.photo_url || '/logo.png')

  useEffect(() => {
    hapticNotification('success')
  }, [])

  const msg = `Hey! We matched on ClimbMatch at ${result.requestDetails?.location_name || 'the crag'}. Let's plan! 🧗`
  const waUrl = result.matchedProfile?.phone
    ? `https://wa.me/${digitsOnly(result.matchedProfile.phone)}?text=${encodeURIComponent(msg)}`
    : null
  const igHandle = result.matchedProfile?.instagram ? parseInstagram(result.matchedProfile.instagram) : null
  const fbHandle = result.matchedProfile?.facebook ? parseFacebook(result.matchedProfile.facebook) : null

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      {/* Confetti — only on mutual match */}
      {result.matched && (
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
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        {result.matched ? (
          <h1 className="text-4xl font-extrabold gradient-text mb-5">It&apos;s a Match!</h1>
        ) : (
          <>
            <div className="text-4xl mb-2">🧗</div>
            <h1 className="text-3xl font-extrabold text-white mb-1">Interest Sent!</h1>
            <p className="text-white/50 text-sm mb-5">We&apos;ll notify them — fingers crossed!</p>
          </>
        )}

        <div className="w-32 h-32 rounded-full border-4 border-[#0a5048] shadow-2xl shadow-[#0a5048]/30 overflow-hidden mb-4 relative">
          <Image
            src={imgSrc}
            alt={result.matchedProfile?.display_name || 'Match'}
            fill
            className="object-cover"
            onError={() => setImgSrc('/logo.png')}
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

        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold rounded-2xl px-6 py-3.5 active:scale-[0.96] transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.359 0-4.55-.822-6.262-2.192l-.438-.362-2.657.891.891-2.657-.362-.438A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              WhatsApp
            </a>
          )}
          {igHandle && (
            <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 text-white font-bold rounded-2xl px-6 py-3.5 active:scale-[0.96] transition-transform"
              style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              @{igHandle}
            </a>
          )}
          {fbHandle && (
            <a href={`https://facebook.com/${fbHandle}`} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#1877F2] text-white font-bold rounded-2xl px-6 py-3.5 active:scale-[0.96] transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </a>
          )}
          <button onClick={onClose}
            className="w-full bg-white/10 backdrop-blur-sm text-white font-bold rounded-2xl px-6 py-3.5 active:scale-[0.96] transition-transform">
            {closeLabel ?? 'Keep Swiping'}
          </button>
        </div>
      </div>
    </div>
  )
}
