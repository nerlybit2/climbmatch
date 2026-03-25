'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { EmptyState } from '@/components/EmptyState'
import { MatchCelebration } from '@/components/MatchCelebration'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PageHeader } from '@/components/PageHeader'
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
    onChange: () => { loadData() },
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
    try {
      await declineInterest(interestId)
      toast.addToast(t.toasts.interestDeclined, 'info')
      await loadData()
    } catch (err) { console.error(err) }
  }

  const items = tab === 'applicants' ? received : sent
  const pendingCount = received.filter(r => r.interest.status === 'pending').length

  return (
    <div ref={pullRef}>
      {indicatorElement}
      <PageHeader title={t.inbox.title} subtitle={t.inbox.subtitle} />

      {/* Tab switcher */}
      <div className="flex gap-1.5 mx-5 mb-5 bg-white/60 rounded-2xl p-1.5 shadow-sm border border-white/80">
        <button
          onClick={() => setTab('applicants')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
            tab === 'applicants'
              ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md shadow-blue-400/30'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {t.inbox.applicants}
          {pendingCount > 0 && (
            <span className={`text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 ${
              tab === 'applicants' ? 'bg-white/25 text-white' : 'bg-blue-500 text-white'
            }`}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('applications')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
            tab === 'applications'
              ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md shadow-blue-400/30'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {t.inbox.myApplications}
          <span className={`text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 ${
            tab === 'applications' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            {sent.length}
          </span>
        </button>
      </div>

      {/* Cards */}
      <div className="px-5 space-y-3 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-3xl p-5 card-shadow animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded-full w-1/3" />
                    <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                    <div className="h-3 bg-slate-100 rounded-full w-2/5" />
                  </div>
                </div>
                <div className="h-10 bg-slate-100 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          tab === 'applicants' ? (
            <EmptyState
              icon={
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
            <InboxCard
              key={item.interest.id}
              item={item}
              tab={tab}
              onAccept={handleAccept}
              onDecline={handleDecline}
              t={t}
            />
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

function InboxCard({
  item,
  tab,
  onAccept,
  onDecline,
  t,
}: {
  item: InboxItem
  tab: 'applicants' | 'applications'
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  t: ReturnType<typeof useLanguage>['t']
}) {
  const [imgSrc, setImgSrc] = useState(item.fromProfile.photo_url || '/default-avatar.svg')
  const status = item.interest.status
  const isPending = status === 'pending'
  const isAccepted = status === 'accepted'
  const isDeclined = status === 'declined'

  const statusConfig = {
    pending:  { label: t.inbox.pending,  bg: 'bg-amber-50',   text: 'text-amber-600',  dot: 'bg-amber-400' },
    accepted: { label: t.inbox.accepted, bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
    declined: { label: t.inbox.declined, bg: 'bg-red-50',     text: 'text-red-500',    dot: 'bg-red-400' },
  }[status] ?? { label: status, bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-300' }

  return (
    <div className="bg-white rounded-3xl card-shadow border border-gray-50 overflow-hidden animate-fade-in">
      {/* Person info */}
      <div className="flex items-center gap-4 p-5 pb-4">
        <div className="relative flex-shrink-0">
          <Image
            src={imgSrc}
            alt={item.fromProfile.display_name}
            width={56}
            height={56}
            className={`w-14 h-14 rounded-2xl object-cover ${isAccepted ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}
            onError={() => setImgSrc('/default-avatar.svg')}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-[15px] leading-tight">{item.fromProfile.display_name}</h3>
            {/* Status badge */}
            <span className={`flex-shrink-0 flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text} text-[11px] font-bold px-2.5 py-1 rounded-full`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5 truncate">{item.request.location_name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold text-slate-600">
              {new Date(item.request.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Action area */}
      {isPending && tab === 'applicants' && (
        <div className="px-5 pb-5 space-y-3">
          <div className="flex gap-2.5">
            <button
              onClick={() => onAccept(item.interest.id)}
              className="flex-1 bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-sm font-bold rounded-2xl py-3 shadow-sm shadow-blue-400/20 active:scale-[0.97] transition-transform"
            >
              {t.inbox.accept}
            </button>
            <button
              onClick={() => onDecline(item.interest.id)}
              className="flex-1 bg-slate-100 text-slate-600 text-sm font-bold rounded-2xl py-3 active:scale-[0.97] transition-transform"
            >
              {t.inbox.decline}
            </button>
          </div>
          {item.phone && <ContactButtons phone={item.phone} location={item.request.location_name} waLabel={t.inbox.whatsapp} smsLabel={t.inbox.sms} />}
        </div>
      )}

      {isPending && tab === 'applications' && (
        <div className="px-5 pb-5">
          <div className="bg-amber-50 rounded-2xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-bold text-amber-600">Waiting for their response</span>
          </div>
        </div>
      )}

      {isAccepted && item.phone && (
        <div className="px-5 pb-5">
          <ContactButtons phone={item.phone} location={item.request.location_name} waLabel={t.inbox.whatsapp} smsLabel={t.inbox.sms} />
        </div>
      )}

      {isDeclined && (
        <div className="px-5 pb-5">
          <div className="bg-red-50 rounded-2xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-bold text-red-500">This request was declined</span>
          </div>
        </div>
      )}
    </div>
  )
}

function ContactButtons({ phone, location, waLabel, smsLabel }: { phone: string; location: string; waLabel: string; smsLabel: string }) {
  const clean = phone.replace(/[^0-9]/g, '')
  const msg = encodeURIComponent(`Hey! I saw your ClimbMatch request at ${location}. Let's connect! 🧗`)
  return (
    <div className="flex gap-2.5">
      <a
        href={`https://wa.me/${clean}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-bold rounded-2xl py-3 active:scale-[0.97] transition-transform shadow-sm shadow-green-500/20"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.359 0-4.55-.822-6.262-2.192l-.438-.362-2.657.891.891-2.657-.362-.438A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        {waLabel}
      </a>
      <a
        href={`sms:+${clean}`}
        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-2xl py-3 active:scale-[0.97] transition-transform"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        {smsLabel}
      </a>
    </div>
  )
}
