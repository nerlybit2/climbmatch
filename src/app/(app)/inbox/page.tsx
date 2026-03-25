'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { EmptyState } from '@/components/EmptyState'
import { MatchCelebration } from '@/components/MatchCelebration'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/Button'
import { getInbox, getSentInterests, acceptInterest, declineInterest, type InboxItem } from '@/lib/actions/interests'
import type { MatchResult } from '@/lib/actions/interests'
import { useToast } from '@/hooks/useToast'
import { useRealtimeInterests } from '@/hooks/useRealtimeInterests'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'

export default function InboxPage() {
  const { t } = useLanguage()

  const [tab, setTab] = useState<'applicants' | 'applications'>('applicants')
  const [received, setReceived] = useState<InboxItem[]>([])
  const [sent, setSent] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [acceptResult, setAcceptResult] = useState<MatchResult | null>(null)
  const toast = useToast()

  const handlePullRefresh = useCallback(async () => {
    await loadData()
  }, [])

  const { containerRef: pullRef, indicatorElement } = usePullToRefresh({
    onRefresh: handlePullRefresh,
  })

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  useEffect(() => { loadData() }, [])

  useRealtimeInterests({
    userId,
    onChange: () => {
      loadData()
    },
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([getInbox(), getSentInterests()])
      setReceived(r)
      setSent(s)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (interestId: string) => {
    try {
      const result = await acceptInterest(interestId)
      setAcceptResult(result)
      await loadData()
    } catch (err) { console.error(err) }
  }

  const handleDecline = async (interestId: string) => {
    try { await declineInterest(interestId); toast.addToast(t.toasts.interestDeclined, 'info'); await loadData() } catch (err) { console.error(err) }
  }

  const items = tab === 'applicants' ? received : sent
  const pendingCount = received.filter(r => r.interest.status === 'pending').length

  return (
    <div ref={pullRef}>
      {indicatorElement}
      <PageHeader title={t.inbox.title} subtitle={t.inbox.subtitle} />

      <div className="flex gap-1 mx-5 mb-5 bg-slate-100 rounded-2xl p-1">
        <button onClick={() => setTab('applicants')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${tab === 'applicants' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          {t.inbox.applicants}
          {pendingCount > 0 && (
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center justify-center ${tab === 'applicants' ? 'bg-blue-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
              {pendingCount}
            </span>
          )}
        </button>
        <button onClick={() => setTab('applications')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${tab === 'applications' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          {t.inbox.myApplications} ({sent.length})
        </button>
      </div>

      <div className="px-5 space-y-3 pb-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse mx-auto mb-3" />
            <p className="text-gray-300 font-medium">{t.inbox.loading}</p>
          </div>
        ) : items.length === 0 ? (
          tab === 'applicants' ? (
            <EmptyState
              icon={
                <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51" />
                </svg>
              }
              title={t.inbox.noApplicantsTitle}
              subtitle={t.inbox.noApplicantsSubtitle}
              actionLabel={t.inbox.discoverPartners}
              actionHref="/discover"
            />
          ) : (
            <EmptyState
              icon={
                <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              }
              title={t.inbox.noApplicationsTitle}
              subtitle={t.inbox.noApplicationsSubtitle}
              actionLabel={t.inbox.startSwiping}
              actionHref="/discover"
            />
          )
        ) : (
          items.map((item) => (
            <div key={item.interest.id} className="bg-white rounded-3xl p-4 card-shadow animate-fade-in border border-gray-50">
              <div className="flex items-start gap-3">
                <Image src={item.fromProfile.photo_url || '/default-avatar.svg'} alt={item.fromProfile.display_name} width={56} height={56} className={`w-14 h-14 rounded-2xl object-cover flex-shrink-0 ${item.interest.status === 'accepted' ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{item.fromProfile.display_name}</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{item.request.location_name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-700">{new Date(item.request.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {item.interest.status === 'pending' && tab === 'applicants' && (
                      <>
                        <div className="flex gap-2">
                          <Button onClick={() => handleAccept(item.interest.id)} className="text-xs !px-4 !py-2">{t.inbox.accept}</Button>
                          <Button variant="secondary" onClick={() => handleDecline(item.interest.id)} className="text-xs !px-4 !py-2">{t.inbox.decline}</Button>
                        </div>
                        <ContactButtons phone={item.phone} location={item.request.location_name} waLabel={t.inbox.whatsapp} smsLabel={t.inbox.sms} />
                      </>
                    )}
                    {item.interest.status === 'pending' && tab === 'applications' && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-bold">{t.inbox.pending}</span>
                    )}
                    {item.interest.status === 'accepted' && (
                      <div className="space-y-2">
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-bold">{t.inbox.accepted}</span>
                        <ContactButtons phone={item.phone} location={item.request.location_name} waLabel={t.inbox.whatsapp} smsLabel={t.inbox.sms} />
                      </div>
                    )}
                    {item.interest.status === 'declined' && (
                      <div className="space-y-2">
                        <span className="text-xs text-red-400 bg-red-50 px-3 py-1 rounded-full font-bold">{t.inbox.declined}</span>
                        <ContactButtons phone={item.phone} location={item.request.location_name} waLabel={t.inbox.whatsapp} smsLabel={t.inbox.sms} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {acceptResult?.matched && (
        <MatchCelebration
          result={acceptResult}
          onClose={() => { setAcceptResult(null); loadData() }}
          closeLabel={t.inbox.backToInbox}
        />
      )}
    </div>
  )
}

function ContactButtons({ phone, location, waLabel, smsLabel }: { phone: string | null; location: string; waLabel: string; smsLabel: string }) {
  if (!phone) return null
  const clean = phone.replace(/[^0-9]/g, '')
  const msg = encodeURIComponent(`Hey! I saw your ClimbMatch request at ${location}. Let's connect! 🧗`)
  return (
    <div className="flex gap-2 flex-wrap">
      <a
        href={`https://wa.me/${clean}?text=${msg}`}
        target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 bg-[#25D366] text-white text-xs px-3 py-1.5 rounded-full font-bold active:scale-95 transition-all">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.359 0-4.55-.822-6.262-2.192l-.438-.362-2.657.891.891-2.657-.362-.438A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        {waLabel}
      </a>
      <a
        href={`sms:+${clean}`}
        className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full font-bold active:scale-95 transition-all">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        {smsLabel}
      </a>
    </div>
  )
}
