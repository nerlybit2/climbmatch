'use client'

import { useState, useCallback } from 'react'
import { SwipeCard } from '@/components/SwipeCard'
import { CardDetails } from '@/components/CardDetails'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { discoverRequests, type ScoredCard, type DiscoverFilters } from '@/lib/actions/discover'
import { createInterest } from '@/lib/actions/interests'

const TIME_CHIPS = [
  { value: '', label: 'Any Time' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'flexible', label: 'Flexible' },
]

const CLIMBING_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'sport', label: 'Sport' },
  { value: 'boulder', label: 'Boulder' },
  { value: 'trad', label: 'Trad' },
  { value: 'multi_pitch', label: 'Multi-pitch' },
]

export default function DiscoverPage() {
  const [showFilters, setShowFilters] = useState(true)
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState<ScoredCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [detailCard, setDetailCard] = useState<ScoredCard | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [locationName, setLocationName] = useState('')
  const [climbingType, setClimbingType] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('')

  const handleSearch = async () => {
    setLoading(true)
    try {
      const filters: DiscoverFilters = {
        date,
        location_name: locationName || undefined,
        climbing_type: climbingType || undefined,
        time_of_day: timeOfDay || undefined,
      }
      const results = await discoverRequests(filters)
      setCards(results)
      setCurrentIndex(0)
      setShowFilters(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const currentCard = cards[currentIndex]
  const remaining = cards.length - currentIndex

  const handleSwipeRight = useCallback(async () => {
    if (!currentCard) return
    try {
      await createInterest(currentCard.request.id, currentCard.profile.id)
    } catch (err) {
      console.error(err)
    }
    setCurrentIndex(i => i + 1)
    setDetailCard(null)
  }, [currentCard])

  const handleSwipeLeft = useCallback(() => {
    setCurrentIndex(i => i + 1)
    setDetailCard(null)
  }, [])

  if (showFilters) {
    return (
      <div className="min-h-[80dvh] flex flex-col">
        <div className="px-5 pt-8 pb-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Discover</h1>
          <p className="text-gray-400 mt-1 font-medium">Find your climbing partner</p>
        </div>
        <div className="px-5 space-y-5 pb-8 flex-1">
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Input label="Location" value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="Gym or crag name..." />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Climbing Type</label>
            <div className="flex flex-wrap gap-2">
              {CLIMBING_TYPES.map(ct => (
                <button key={ct.value} type="button" onClick={() => setClimbingType(ct.value)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    climbingType === ct.value
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300'
                  }`}
                >{ct.label}</button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Time of Day</label>
            <div className="flex flex-wrap gap-2">
              {TIME_CHIPS.map(tc => (
                <button key={tc.value} type="button" onClick={() => setTimeOfDay(tc.value)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    timeOfDay === tc.value
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300'
                  }`}
                >{tc.label}</button>
              ))}
            </div>
          </div>

          <Button onClick={handleSearch} loading={loading} className="w-full !py-4 !text-base mt-4">
            Search Partners
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <h1 className="text-xl font-extrabold gradient-text">Discover</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">{remaining} left</span>
          <button onClick={() => setShowFilters(true)}
            className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-orange-500 transition-colors">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 relative mx-3 mb-2">
        {currentCard ? (
          <>
            {cards[currentIndex + 1] && (
              <div className="absolute inset-0 scale-[0.94] opacity-40 translate-y-2">
                <div className="w-full h-full rounded-3xl overflow-hidden bg-gray-200">
                  <img src={cards[currentIndex + 1].profile.photo_url} alt="" className="w-full h-full object-cover" draggable={false} />
                </div>
              </div>
            )}
            <SwipeCard
              key={currentCard.request.id}
              profile={currentCard.profile}
              request={currentCard.request}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onTap={() => setDetailCard(currentCard)}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mb-5">
              <span className="text-3xl">🧗</span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-700 mb-2">No more climbers</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">Try adjusting your filters or check back later for new partners</p>
            <Button variant="secondary" onClick={() => setShowFilters(true)}>Change Filters</Button>
          </div>
        )}
      </div>

      {/* Tinder-style action buttons */}
      {currentCard && (
        <div className="flex justify-center items-center gap-6 pb-4 px-5">
          <button onClick={handleSwipeLeft}
            className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-rose-400 border-2 border-rose-100 hover:border-rose-300 active:scale-90 transition-all duration-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button onClick={handleSwipeRight}
            className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-orange-400 to-rose-500 shadow-xl shadow-orange-500/30 flex items-center justify-center text-white active:scale-90 transition-all duration-200">
            <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
      )}

      {detailCard && (
        <CardDetails profile={detailCard.profile} request={detailCard.request} onClose={() => setDetailCard(null)} onInterested={handleSwipeRight} onPass={handleSwipeLeft} />
      )}
    </div>
  )
}
