'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ProfileSwipeCard } from '@/components/ProfileSwipeCard'
import { CardDetails } from '@/components/CardDetails'
import { MatchCelebration } from '@/components/MatchCelebration'
import { EmptyState } from '@/components/EmptyState'
import { PullToRefreshWrapper } from '@/components/PullToRefreshWrapper'
import { createInterest, type MatchResult } from '@/lib/actions/interests'
import { useSwipeDiscover } from '@/contexts/SwipeDiscoverContext'
import { useToast } from '@/hooks/useToast'
import { useLanguage } from '@/contexts/LanguageContext'
import { emit } from '@/lib/dataEvents'
import type { ProfileCard } from '@/lib/actions/discoverProfiles'
import type { PartnerRequest } from '@/lib/types/database'

export default function SwipeClient() {
  const { t } = useLanguage()
  const router = useRouter()
  const { profiles, loading, removeProfile, markSwiped, refresh } = useSwipeDiscover()
  const toast = useToast()

  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [detailCard, setDetailCard] = useState<ProfileCard | null>(null)
  const [postSheet, setPostSheet] = useState<{ profile: ProfileCard; posts: PartnerRequest[] } | null>(null)

  const unswiped = profiles.filter(c => !c.swiped)
  const visibleCards = unswiped.slice(0, 3)
  const topCard = visibleCards[0] ?? null

  const handleSwipeRight = useCallback(async (card: ProfileCard) => {
    try {
      // If they have posts, express interest on the nearest one; otherwise profile-level connect
      const requestId = card.posts.length > 0 ? card.posts[0].id : null
      const result = await createInterest(requestId, card.profile.id)
      emit('interest:created')
      markSwiped(card.profile.id)
      // Always show the celebration — mutual match shows contacts, otherwise "Interest Sent"
      setMatchResult({
        matched: result.matched,
        matchedProfile: result.matchedProfile ?? {
          display_name: card.profile.display_name,
          photo_url: card.profile.photo_url,
          phone: null,
          instagram: null,
          facebook: null,
        },
        requestDetails: result.requestDetails,
      })
    } catch (err) {
      if (err instanceof Error && err.message === 'PROFILE_REQUIRED') {
        toast.addToast('Complete your profile to connect with climbers', 'error')
        router.push('/profile')
        return
      }
      toast.addToast('Something went wrong. Please try again.', 'error')
      console.error(err)
    }
  }, [markSwiped, toast, router, t])

  const handleSwipeLeft = useCallback((card: ProfileCard) => {
    removeProfile(card.profile.id)
  }, [removeProfile])

  const handlePostTap = useCallback((card: ProfileCard) => {
    setPostSheet({ profile: card, posts: card.posts })
  }, [])

  const handlePostSelect = useCallback(async (card: ProfileCard, post: PartnerRequest) => {
    setPostSheet(null)
    try {
      const result = await createInterest(post.id, card.profile.id)
      emit('interest:created')
      markSwiped(card.profile.id)
      setMatchResult({
        matched: result.matched,
        matchedProfile: result.matchedProfile ?? {
          display_name: card.profile.display_name,
          photo_url: card.profile.photo_url,
          phone: null,
          instagram: null,
          facebook: null,
        },
        requestDetails: result.requestDetails,
      })
    } catch (err) {
      if (err instanceof Error && err.message === 'PROFILE_REQUIRED') {
        toast.addToast('Complete your profile to connect with climbers', 'error')
        router.push('/profile')
        return
      }
      toast.addToast('Something went wrong. Please try again.', 'error')
      console.error(err)
    }
  }, [markSwiped, toast, router, t])

  return (
    <PullToRefreshWrapper onRefresh={refresh}>
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-7 pb-1">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 leading-tight">Discover</h1>
          {!loading && unswiped.length > 0 && (
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {unswiped.length} {unswiped.length === 1 ? 'climber' : 'climbers'}
            </span>
          )}
        </div>
      </div>

      {/* Card stack area */}
      <div className="flex-1 relative mx-4 mt-2 mb-3 min-h-0">
        {loading ? (
          <div className="absolute inset-0 rounded-3xl bg-white animate-pulse card-shadow-lg flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-3 border-[#0a5048]/25 border-t-[#0a5048] animate-spin" />
          </div>
        ) : visibleCards.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              icon={
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
              title="All caught up!"
              subtitle="Check back later or post your own request to attract climbing partners."
              actionLabel={t.discover.postRequest}
              actionHref="/requests/new"
            />
          </div>
        ) : (
          visibleCards.map((card, i) => {
            const reverseI = visibleCards.length - 1 - i
            return (
              <div
                key={card.profile.id}
                className="absolute inset-0"
                style={{
                  zIndex: reverseI,
                  transform: i > 0 ? `scale(${1 - i * 0.04}) translateY(${i * 10}px)` : undefined,
                  opacity: i > 0 ? 0.6 : 1,
                  pointerEvents: i === 0 ? 'auto' : 'none',
                }}
              >
                {i === 0 ? (
                  <ProfileSwipeCard
                    profile={card.profile}
                    posts={card.posts}
                    onSwipeRight={() => handleSwipeRight(card)}
                    onSwipeLeft={() => handleSwipeLeft(card)}
                    onTap={() => setDetailCard(card)}
                    onPostTap={() => handlePostTap(card)}
                  />
                ) : (
                  <div className="absolute inset-0 rounded-3xl overflow-hidden card-shadow-lg bg-gray-900">
                    <Image
                      src={card.profile.photo_url || '/logo.png'}
                      alt=""
                      fill
                      sizes="(max-width: 512px) 100vw, 512px"
                      className="object-cover"
                      draggable={false}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent p-5 pt-20">
                      <h2 className="text-white text-[22px] font-extrabold">{card.profile.display_name}</h2>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Action buttons */}
      {!loading && topCard && (
        <div className="flex-shrink-0 flex items-center justify-center gap-6 px-4" style={{ paddingBottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))' }}>
          <button
            onClick={() => handleSwipeLeft(topCard)}
            className="w-16 h-16 rounded-full bg-white shadow-lg shadow-red-100 border border-red-100 flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => setDetailCard(topCard)}
            className="w-12 h-12 rounded-full bg-white shadow-lg shadow-[#0a5048]/10 border border-[#0a5048]/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg className="w-5 h-5 text-[#0a5048]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => handleSwipeRight(topCard)}
            className="w-16 h-16 rounded-full bg-white shadow-lg shadow-green-100 border border-green-100 flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      )}

      {/* Detail sheet — show profile info with their nearest post (or none) */}
      {detailCard && (
        <CardDetails
          profile={detailCard.profile}
          request={detailCard.posts[0] ?? {
            id: '', user_id: '', date: '', start_time: null, end_time: null,
            flexible: false, location_type: 'crag' as const, location_name: detailCard.profile.home_area || '',
            goal_type: 'any' as const, desired_grade_range: null, notes: null,
            needs_gear: { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false },
            carpool_needed: false, weight_relevant: false, max_weight_difference_kg: null,
            status: 'active' as const, created_at: '', updated_at: '',
          }}
          swiped={detailCard.swiped}
          onClose={() => setDetailCard(null)}
          onInterested={() => { setDetailCard(null); handleSwipeRight(detailCard) }}
          onPass={() => { setDetailCard(null); handleSwipeLeft(detailCard) }}
        />
      )}

      {/* Post selection sheet */}
      {postSheet && (
        <div className="fixed inset-0 z-[60] flex items-end" onClick={() => setPostSheet(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl animate-slide-up"
            style={{ maxHeight: 'calc(100dvh - 120px)' }}
            onClick={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="px-5 pb-2">
              <h3 className="text-lg font-extrabold text-slate-900">{postSheet.profile.profile.display_name}&apos;s Posts</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{postSheet.posts.length} active {postSheet.posts.length === 1 ? 'post' : 'posts'}</p>
            </div>
            <div className="overflow-y-auto px-5 pb-6 space-y-2.5" style={{ maxHeight: 'calc(100dvh - 220px)', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
              {postSheet.posts.map(post => (
                <button
                  key={post.id}
                  onClick={() => handlePostSelect(postSheet.profile, post)}
                  className="w-full text-left bg-[#f0f7f5] rounded-2xl p-3.5 active:scale-[0.98] transition-all border border-[#0a5048]/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-slate-800">
                        {new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 font-medium">
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {post.location_name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {post.start_time && (
                          <span className="text-[10px] font-bold text-[#0a5048]">
                            {post.start_time.slice(0, 5)}{post.end_time ? ` – ${post.end_time.slice(0, 5)}` : ''}
                          </span>
                        )}
                        {post.goal_type && post.goal_type !== 'any' && (
                          <span className="text-[10px] font-bold text-[#0a5048] bg-[#f0f7f5] px-2 py-0.5 rounded-full capitalize">{post.goal_type}</span>
                        )}
                        {post.desired_grade_range && (
                          <span className="text-[10px] font-bold text-[#0a5048] bg-[#f0f7f5] px-2 py-0.5 rounded-full">{post.desired_grade_range}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[#0a5048]">
                      <span className="text-xs font-bold">Join</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                  {post.notes && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{post.notes}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Match celebration */}
      {matchResult && (
        <MatchCelebration
          result={matchResult}
          onClose={() => setMatchResult(null)}
          closeLabel="Keep Swiping"
        />
      )}
    </div>
    </PullToRefreshWrapper>
  )
}
