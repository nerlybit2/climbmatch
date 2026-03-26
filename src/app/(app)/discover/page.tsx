'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { EmptyState } from '@/components/EmptyState'
import { CardDetails } from '@/components/CardDetails'
import { discoverRequests, searchLocations, type ScoredCard, type DiscoverFilters } from '@/lib/actions/discover'
import { createInterest, type MatchResult } from '@/lib/actions/interests'
import { MatchCelebration } from '@/components/MatchCelebration'
import { useToast } from '@/hooks/useToast'
import { useLanguage } from '@/contexts/LanguageContext'

export default function DiscoverPage() {
  const { t } = useLanguage()
  const router = useRouter()

  const TIME_CHIPS = [
    { value: '', label: t.timeChips.anyTime },
    { value: 'morning', label: t.timeChips.morning },
    { value: 'afternoon', label: t.timeChips.afternoon },
    { value: 'evening', label: t.timeChips.evening },
    { value: 'flexible', label: t.timeChips.flexible },
  ]

  const today = new Date().toISOString().split('T')[0]

  const PAGE_SIZE = 20

  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<ScoredCard[]>([])
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [detailCard, setDetailCard] = useState<ScoredCard | null>(null)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  // Filter state
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const activeFilterCount = [dateFrom, locationName, timeOfDay].filter(Boolean).length

  const handleLocationChange = (value: string) => {
    setLocationName(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 2) { setLocationSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      const results = await searchLocations(value)
      setLocationSuggestions(results)
      setShowSuggestions(results.length > 0)
    }, 250)
  }

  const selectLocation = (loc: string) => {
    setLocationName(loc)
    setShowSuggestions(false)
    setLocationSuggestions([])
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = useCallback(async (filters: DiscoverFilters = {}) => {
    setLoading(true)
    try {
      const results = await discoverRequests(filters)
      setCards(results)
    } catch (err) {
      console.error(err)
      toast.addToast('Failed to load climbers. Pull down to retry.', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Load all on mount
  useEffect(() => { loadData() }, [loadData])

  // Reset display count when cards change (new search)
  useEffect(() => { setDisplayCount(PAGE_SIZE) }, [cards])

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount(prev => Math.min(prev + PAGE_SIZE, cards.length))
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [cards.length])

  const handleApplyFilters = () => {
    loadData({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      location_name: locationName || undefined,
      time_of_day: timeOfDay || undefined,
    })
    setShowFilters(false)
  }

  const handleClearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setLocationName('')
    setTimeOfDay('')
    loadData()
  }

  const removeCard = useCallback((requestId: string) => {
    setCards(prev => prev.filter(c => c.request.id !== requestId))
    setDetailCard(null)
  }, [])

  const handleInterested = useCallback(async (card: ScoredCard) => {
    try {
      const result = await createInterest(card.request.id, card.profile.id)
      removeCard(card.request.id)
      setDetailCard(null)
      if (result.matchedProfile) {
        setMatchResult(result)
      } else {
        toast.addToast(t.toasts.interestSent, 'success')
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'PROFILE_REQUIRED') {
        toast.addToast('Complete your profile to connect with climbers', 'error')
        router.push('/profile')
        return
      }
      toast.addToast('Something went wrong. Please try again.', 'error')
      console.error(err)
    }
  }, [removeCard, toast, router, t])

  const handlePass = useCallback((card: ScoredCard) => {
    removeCard(card.request.id)
  }, [removeCard])

  return (
    <div className="flex flex-col min-h-[80dvh]">

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#EDF1F7]/90 backdrop-blur-xl px-5 pt-7 pb-3">
        <div className="mb-3">
          <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 leading-tight mb-3">{t.discover.title}</h1>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] ${
              showFilters || activeFilterCount > 0
                ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md shadow-blue-400/25'
                : 'bg-white text-gray-500 shadow-md border border-gray-150 ring-1 ring-gray-200/60'
            }`}
            style={!(showFilters || activeFilterCount > 0) ? { boxShadow: '0 2px 12px rgba(79,142,247,0.10), 0 1px 3px rgba(0,0,0,0.06)' } : {}}
          >
            <svg className={`w-5 h-5 flex-shrink-0 ${showFilters || activeFilterCount > 0 ? 'text-white' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className={`text-sm font-semibold flex-1 ${showFilters || activeFilterCount > 0 ? 'text-white' : 'text-gray-400'}`}>
              {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : 'Search by location, date, time…'}
            </span>
            {activeFilterCount > 0 && (
              <span className="bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          {!loading && (
            <p className="text-xs text-slate-400 font-medium mt-2 px-1">
              {cards.length} partner{cards.length !== 1 ? 's' : ''} available
            </p>
          )}
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 space-y-4 animate-fade-in mb-1">
            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.discover.dateFrom}</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); if (dateTo && dateTo < e.target.value) setDateTo(e.target.value) }}
                  min={today}
                  className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.discover.dateTo}</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  min={dateFrom || today}
                  className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Location */}
            <div className="relative" ref={suggestionsRef}>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t.discover.location}</label>
              <div className="relative">
                <input
                  type="text"
                  value={locationName}
                  onChange={e => handleLocationChange(e.target.value)}
                  onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder={t.discover.locationPlaceholder}
                  className="w-full rounded-xl border-0 bg-slate-50 pl-9 pr-9 py-2.5 text-sm ring-1 ring-gray-200 placeholder:text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {locationName && (
                  <button type="button" onClick={() => { setLocationName(''); setLocationSuggestions([]); setShowSuggestions(false) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 overflow-hidden animate-fade-in">
                  {locationSuggestions.map((loc, i) => (
                    <button key={loc + i} type="button" onClick={() => selectLocation(loc)}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2.5 border-b border-gray-50 last:border-0">
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">{loc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time of day chips */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t.discover.timeOfDay}</label>
              <div className="flex flex-wrap gap-2">
                {TIME_CHIPS.map(tc => (
                  <button key={tc.value} type="button" onClick={() => setTimeOfDay(tc.value)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      timeOfDay === tc.value
                        ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-sm shadow-blue-400/20'
                        : 'bg-slate-50 text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300'
                    }`}
                  >{tc.label}</button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleApplyFilters}
                className="flex-1 bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-sm font-bold rounded-2xl py-3 shadow-sm shadow-blue-400/20 active:scale-[0.97] transition-transform"
              >
                Apply Filters
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 bg-white text-gray-500 text-sm font-bold rounded-2xl py-3 border border-gray-100 shadow-sm active:scale-[0.97] transition-transform"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {!showFilters && activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {locationName && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                📍 {locationName}
                <button onClick={() => { setLocationName(''); loadData({ date_from: dateFrom || undefined, date_to: dateTo || undefined, time_of_day: timeOfDay || undefined }) }} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
              </span>
            )}
            {dateFrom && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                📅 {dateFrom}{dateTo && dateTo !== dateFrom ? ` → ${dateTo}` : ''}
                <button onClick={() => { setDateFrom(''); setDateTo(''); loadData({ location_name: locationName || undefined, time_of_day: timeOfDay || undefined }) }} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
              </span>
            )}
            {timeOfDay && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                ⏰ {TIME_CHIPS.find(c => c.value === timeOfDay)?.label}
                <button onClick={() => { setTimeOfDay(''); loadData({ date_from: dateFrom || undefined, date_to: dateTo || undefined, location_name: locationName || undefined }) }} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-3 card-shadow animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded-full w-2/3" />
                    <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                    <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="pt-6">
            <EmptyState
              icon={
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              }
              title={t.discover.noClimbersTitle}
              subtitle={t.discover.noClimbersSubtitle}
              actionLabel={t.discover.postRequest}
              actionHref="/requests/new"
            />
          </div>
        ) : (
          cards.slice(0, displayCount).map(card => (
            <button
              key={card.request.id}
              type="button"
              onClick={() => setDetailCard(card)}
              className="w-full text-left bg-white rounded-3xl card-shadow border border-gray-50 overflow-hidden hover:shadow-md hover:border-blue-100 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 p-3.5">
                {/* Avatar */}
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
                  <Image
                    src={card.profile.photo_url || '/default-avatar.svg'}
                    alt={card.profile.display_name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 truncate">{card.profile.display_name}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 font-medium">
                    <svg className="w-3 h-3 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{card.request.location_name}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs font-bold text-slate-700">
                    <svg className="w-3 h-3 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(card.request.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {card.request.start_time && (
                      <span className="text-slate-400 font-medium">· {card.request.start_time.slice(0, 5)}{card.request.end_time ? `–${card.request.end_time.slice(0, 5)}` : ''}</span>
                    )}
                  </div>
                  {card.request.desired_grade_range && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {card.request.desired_grade_range}
                    </span>
                  )}
                  {card.request.notes && (
                    <p className="mt-1.5 text-xs text-slate-500 leading-snug line-clamp-2">{card.request.notes}</p>
                  )}
                </div>

                <svg className="w-4 h-4 text-gray-300 flex-shrink-0 self-start mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Compatibility badges */}
              {(card.compatibility.gearMatches.length > 0 || card.compatibility.carpoolAvailable) && (
                <div className="flex gap-2 px-3.5 pb-3 flex-wrap">
                  {card.compatibility.carpoolAvailable && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{t.discover.canOfferRide}</span>
                  )}
                  {card.compatibility.gearMatches.slice(0, 2).map(g => (
                    <span key={g} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{t.cardDetails.youHave}: {g}</span>
                  ))}
                </div>
              )}
            </button>
          ))
        )}

        {/* Infinite scroll sentinel */}
        {cards.length > displayCount && (
          <div ref={sentinelRef} className="py-4 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
          </div>
        )}
      </div>

      {detailCard && (
        <CardDetails
          profile={detailCard.profile}
          request={detailCard.request}
          compatibility={detailCard.compatibility}
          onClose={() => setDetailCard(null)}
          onInterested={() => handleInterested(detailCard)}
          onPass={() => handlePass(detailCard)}
        />
      )}

      {matchResult && (
        <MatchCelebration
          result={matchResult}
          onClose={() => setMatchResult(null)}
          closeLabel="Keep Browsing"
        />
      )}
    </div>
  )
}
