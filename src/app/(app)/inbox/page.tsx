'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { EmptyState } from '@/components/EmptyState'
import { MatchCelebration } from '@/components/MatchCelebration'
import { PageHeader } from '@/components/PageHeader'
import { acceptInterest, declineInterest, type InboxItem } from '@/lib/actions/interests'
import type { MatchResult } from '@/lib/actions/interests'
import { useToast } from '@/hooks/useToast'
import { useRealtimeInterests } from '@/hooks/useRealtimeInterests'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'
import { useInbox } from '@/contexts/InboxContext'
import { PullToRefreshWrapper } from '@/components/PullToRefreshWrapper'
import { ProfileModal } from '@/components/ProfileModal'
import { digitsOnly, parseInstagram, parseFacebook } from '@/lib/phone'

export default function InboxPage() {
  const { t } = useLanguage()
  const { received, sent, loading, refresh, updateItem } = useInbox()

  const [tab, setTab] = useState<'applicants' | 'applications'>('applicants')
  const [userId, setUserId] = useState<string | null>(null)
  const [acceptResult, setAcceptResult] = useState<MatchResult | null>(null)
  const [viewingProfile, setViewingProfile] = useState<InboxItem | null>(null)
  const toast = useToast()

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  // Only refresh when a NEW interest arrives — don't re-fetch on our own actions
  useRealtimeInterests({ userId, onChange: refresh })

  const handleAccept = useCallback(async (interestId: string) => {
    try {
      const result = await acceptInterest(interestId)
      updateItem(interestId, 'accepted')
      setAcceptResult(result)
    } catch (err) {
      toast.addToast('Failed to accept. Please try again.', 'error')
      console.error(err)
    }
  }, [updateItem, toast])

  const handleDecline = useCallback(async (interestId: string) => {
    try {
      await declineInterest(interestId)
      updateItem(interestId, 'declined')
      toast.addToast(t.toasts.interestDeclined, 'info')
    } catch (err) {
      toast.addToast('Failed to decline. Please try again.', 'error')
      console.error(err)
    }
  }, [updateItem, toast, t])

  const items = tab === 'applicants' ? received : sent
  const pendingCount = received.filter(r => r.interest.status === 'pending').length

  return (
    <PullToRefreshWrapper onRefresh={refresh}>
    <div>
      <PageHeader title={t.inbox.title} subtitle={t.inbox.subtitle} />

      {/* Tab switcher */}
      <div className="flex gap-1 mx-5 mb-5 bg-slate-100/80 rounded-2xl p-1 border border-slate-200/60">
        <button
          onClick={() => setTab('applicants')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
            tab === 'applicants'
              ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md shadow-blue-400/25'
              : 'text-slate-500 hover:text-slate-700'
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
              ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md shadow-blue-400/25'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.inbox.myApplications}
          {sent.length > 0 && (
            <span className={`text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 ${
              tab === 'applications' ? 'bg-white/25 text-white' : 'bg-slate-400 text-white'
            }`}>
              {sent.length}
            </span>
          )}
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
              onViewProfile={() => setViewingProfile(item)}
              t={t}
            />
          ))
        )}
      </div>

      {acceptResult?.matched && (
        <MatchCelebration
          result={acceptResult}
          onClose={() => setAcceptResult(null)}
          closeLabel={t.inbox.backToInbox}
        />
      )}

      {viewingProfile && (
        <ProfileModal
          profile={viewingProfile.fromProfile}
          phone={viewingProfile.phone}
          instagram={viewingProfile.instagram}
          facebook={viewingProfile.facebook}
          location={viewingProfile.request.location_name}
          onClose={() => setViewingProfile(null)}
        />
      )}
    </div>
    </PullToRefreshWrapper>
  )
}

function InboxCard({
  item, tab, onAccept, onDecline, onViewProfile, t,
}: {
  item: InboxItem
  tab: 'applicants' | 'applications'
  onAccept: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
  onViewProfile: () => void
  t: ReturnType<typeof useLanguage>['t']
}) {
  const [imgSrc, setImgSrc] = useState(item.fromProfile.photo_url || '/logo.png')
  const [actioning, setActioning] = useState(false)
  const status = item.interest.status
  const isPending = status === 'pending'
  const isAccepted = status === 'accepted'
  const isDeclined = status === 'declined'

  const statusConfig = {
    pending:  { label: t.inbox.pending,  bg: 'bg-amber-50',   text: 'text-amber-600',  dot: 'bg-amber-400',   border: 'border-amber-100' },
    accepted: { label: t.inbox.accepted, bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400', border: 'border-emerald-100' },
    declined: { label: t.inbox.declined, bg: 'bg-red-50',     text: 'text-red-500',    dot: 'bg-red-400',     border: 'border-red-100' },
  }[status] ?? { label: status, bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-300', border: 'border-slate-100' }

  return (
    <div className="bg-white rounded-3xl card-shadow border border-gray-50 overflow-hidden animate-fade-in">
      <div className="flex items-center gap-4 p-5">
        <button onClick={onViewProfile} className="relative flex-shrink-0 active:scale-95 transition-transform">
          <Image
            src={imgSrc}
            alt={item.fromProfile.display_name}
            width={56}
            height={56}
            className={`w-14 h-14 rounded-2xl object-cover ${isAccepted ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}
            onError={() => setImgSrc('/logo.png')}
          />
        </button>

        <div className="flex-1 min-w-0">
          <button onClick={onViewProfile} className="text-left w-full">
          <h3 className="font-bold text-slate-900 text-[15px] leading-tight mb-1.5">
            {item.fromProfile.display_name}
          </h3>
          </button>
          <p className="text-sm text-slate-500 truncate mb-1">{item.request.location_name}</p>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold text-slate-600">
              {new Date(item.request.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className={`flex-shrink-0 flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border} text-[11px] font-bold px-2.5 py-1.5 rounded-full self-start`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig.dot}`} />
          {statusConfig.label}
        </div>
      </div>

      {item.request.notes && (
        <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-3 -mt-1">
          {item.request.notes}
        </p>
      )}

      {isPending && tab === 'applicants' && (
        <div className="px-5 pb-5 space-y-3 border-t border-slate-50 pt-4">
          <div className="flex gap-2.5">
            <button
              onClick={async () => { setActioning(true); await onAccept(item.interest.id); setActioning(false) }}
              disabled={actioning}
              className="flex-1 bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-sm font-bold rounded-2xl py-3 shadow-sm shadow-blue-400/20 active:scale-[0.97] transition-transform disabled:opacity-60 disabled:scale-100"
            >
              {actioning ? '…' : t.inbox.accept}
            </button>
            <button
              onClick={async () => { setActioning(true); await onDecline(item.interest.id); setActioning(false) }}
              disabled={actioning}
              className="flex-1 bg-slate-100 text-slate-600 text-sm font-bold rounded-2xl py-3 active:scale-[0.97] transition-transform disabled:opacity-60 disabled:scale-100"
            >
              {actioning ? '…' : t.inbox.decline}
            </button>
          </div>
          <ContactButtons
            phone={item.phone}
            instagram={item.instagram}
            facebook={item.facebook}
            location={item.request.location_name}
            waLabel={t.inbox.whatsapp}
            smsLabel={t.inbox.sms}
          />
        </div>
      )}

      {isPending && tab === 'applications' && (
        <div className="px-5 pb-5 border-t border-slate-50 pt-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-2.5">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-bold text-amber-600">Waiting for their response</span>
          </div>
        </div>
      )}

      {isAccepted && (
        <div className="px-5 pb-5 border-t border-slate-50 pt-4">
          <ContactButtons
            phone={item.phone}
            instagram={item.instagram}
            facebook={item.facebook}
            location={item.request.location_name}
            waLabel={t.inbox.whatsapp}
            smsLabel={t.inbox.sms}
          />
        </div>
      )}

      {isDeclined && (
        <div className="px-5 pb-5 border-t border-slate-50 pt-4">
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2.5">
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

function ContactButtons({
  phone, instagram, facebook, location, waLabel, smsLabel,
}: {
  phone: string | null
  instagram: string | null
  facebook: string | null
  location: string
  waLabel: string
  smsLabel: string
}) {
  const cleanPhone = phone ? digitsOnly(phone) : ''
  const hasPhone = cleanPhone.length > 0
  const igHandle = instagram ? parseInstagram(instagram) : null
  const fbHandle = facebook ? parseFacebook(facebook) : null
  const hasAny = hasPhone || igHandle || fbHandle
  if (!hasAny) return null

  const msg = encodeURIComponent(`Hey! I saw your ClimbMatch request at ${location}. Let's connect! 🧗`)

  return (
    <div className="space-y-2.5">
      {hasPhone && (
        <>
          <a
            href={`https://wa.me/${cleanPhone}?text=${msg}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] text-white text-sm font-bold rounded-2xl py-3.5 active:scale-[0.97] transition-transform shadow-sm shadow-green-500/20"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.359 0-4.55-.822-6.262-2.192l-.438-.362-2.657.891.891-2.657-.362-.438A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            {waLabel}
          </a>
          <a
            href={`sms:+${cleanPhone}`}
            className="flex items-center justify-center gap-2.5 w-full bg-slate-100 text-slate-700 text-sm font-bold rounded-2xl py-3.5 active:scale-[0.97] transition-transform border border-slate-200/60"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            {smsLabel}
          </a>
        </>
      )}
      {(igHandle || fbHandle) && (
        <div className="flex gap-2.5">
          {igHandle && (
            <a
              href={`https://instagram.com/${igHandle}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-bold rounded-2xl py-3.5 active:scale-[0.97] transition-transform"
              style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              @{igHandle}
            </a>
          )}
          {fbHandle && (
            <a
              href={`https://facebook.com/${fbHandle}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#1877F2] text-white text-sm font-bold rounded-2xl py-3.5 active:scale-[0.97] transition-transform"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </a>
          )}
        </div>
      )}
    </div>
  )
}
