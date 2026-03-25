'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { EmptyState } from '@/components/EmptyState'
import { CardDetails } from '@/components/CardDetails'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
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

  const [showFilters, setShowFilters] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState<ScoredCard[]>([])
  const [detailCard, setDetailCard] = useState<ScoredCard | null>(null)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const toast = useToast()

  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [locationName, setLocationName] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const [timeOfDay, setTimeOfDay] = useState('')

  const handleLocationChange = (value: string) => {
    setLocationName(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 2) {
      setLocationSuggestions([])
      setShowSuggestions(false)
      return
    }
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

  const handleSearch = async () => {
    setLoading(true)
    try {
      const filters: DiscoverFilters = {
        date_from: dateFrom,
        date_to: dateTo < dateFrom ? dateFrom : dateTo,
        location_name: locationName || undefined,
        time_of_day: timeOfDay || undefined,
      }
      const results = await discoverRequests(filters)
      setCards(results)
      setShowFilters(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
      console.error(err)
    }
  }, [removeCard, toast, router, t])

  const handlePass = useCallback((card: ScoredCard) => {
    removeCard(card.request.id)
  }, [removeCard])

  if (showFilters) {
    return (
      <div className="min-h-[80dvh] flex flex-col">
        <div className="px-5 pt-8 pb-2">
          <h1 className="text-3xl font-extrabold tracking-tight">{t.discover.title}</h1>
          <p className="text-gray-400 mt-1 font-medium">{t.discover.subtitle}</p>
        </div>
        <div className="px-5 space-y-5 pb-8 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <Input label={t.discover.dateFrom} type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); if (dateTo < e.target.value) setDateTo(e.target.value) }} min={today} />
            <Input label={t.discover.dateTo} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom} />
          </div>

          {/* Location autocomplete */}
          <div className="relative" ref={suggestionsRef}>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.discover.location}</label>
              <div className="relative">
                <input
                  type="text"
                  value={locationName}
                  onChange={e => handleLocationChange(e.target.value)}
                  onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder={t.discover.locationPlaceholder}
                  className="w-full rounded-2xl border-0 bg-white pl-10 pr-4 py-3.5 text-sm shadow-sm ring-1 ring-gray-200 placeholder:text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <svg className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            </div>
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 overflow-hidden animate-fade-in">
                {locationSuggestions.map((loc, i) => (
                  <button
                    key={loc + i}
                    type="button"
                    onClick={() => selectLocation(loc)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2.5 border-b border-gray-50 last:border-0"
                  >
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

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {t.discover.advancedFilters}
            {timeOfDay && <span className="w-2 h-2 rounded-full bg-blue-600" />}
          </button>

          {showAdvanced && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.discover.timeOfDay}</label>
                <div className="flex flex-wrap gap-2">
                  {TIME_CHIPS.map(tc => (
                    <button key={tc.value} type="button" onClick={() => setTimeOfDay(tc.value)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                        timeOfDay === tc.value
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300'
                      }`}
                    >{tc.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleSearch} loading={loading} className="w-full !py-4 !text-base mt-4">
            {t.discover.searchPartners}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[80dvh]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 sticky top-0 bg-white/90 backdrop-blur-xl z-10 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-extrabold gradient-text">{t.discover.title}</h1>
          <p className="text-xs text-gray-400 font-medium">{cards.length} {t.discover.searchPartners.toLowerCase()}</p>
        </div>
        <button onClick={() => setShowFilters(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white shadow-sm ring-1 ring-gray-200 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {t.discover.filters}
        </button>
      </div>

      {/* Results list */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {cards.length === 0 ? (
          <div className="pt-10">
            <EmptyState
              icon={
                <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
          cards.map(card => (
            <button
              key={card.request.id}
              type="button"
              onClick={() => setDetailCard(card)}
              className="w-full text-left bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden hover:shadow-md hover:ring-blue-200 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 p-3">
                {/* Avatar */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
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
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-900 truncate">{card.profile.display_name}</span>
                    {card.score > 0 && (
                      <span className="flex-shrink-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {card.score}pts
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {card.profile.experience_level && (
                      <span className="text-xs text-gray-400 font-medium capitalize">{card.profile.experience_level}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{card.request.location_name}</span>
                    <span className="mx-1">·</span>
                    <span>{card.request.date}</span>
                  </div>
                </div>

                {/* Chevron */}
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Compatibility badges */}
              {(card.compatibility.gearMatches.length > 0 || card.compatibility.carpoolAvailable) && (
                <div className="flex gap-2 px-3 pb-3 flex-wrap">
                  {card.compatibility.carpoolAvailable && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{t.discover.canOfferRide}</span>
                  )}
                  {card.compatibility.gearMatches.slice(0, 2).map(g => (
                    <span key={g} className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{t.cardDetails.youHave}: {g}</span>
                  ))}
                </div>
              )}
            </button>
          ))
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
