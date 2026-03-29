'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/Button'
import type { PartnerRequest } from '@/lib/types/database'
import Link from 'next/link'
import { useToast } from '@/hooks/useToast'
import { useLanguage } from '@/contexts/LanguageContext'
import { getMyRequests, cancelRequest } from '@/lib/actions/requests'
import { getApplicantCounts } from '@/lib/actions/interests'

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  active:    { bg: 'bg-emerald-50',  text: 'text-emerald-600', dot: 'bg-emerald-400', border: 'border-emerald-100' },
  matched:   { bg: 'bg-blue-50',     text: 'text-blue-600',    dot: 'bg-blue-400',    border: 'border-blue-100'    },
  cancelled: { bg: 'bg-slate-100',   text: 'text-slate-400',   dot: 'bg-slate-300',   border: 'border-slate-200'   },
  expired:   { bg: 'bg-slate-100',   text: 'text-slate-400',   dot: 'bg-slate-300',   border: 'border-slate-200'   },
}

export default function MyPostsPage() {
  const { t } = useLanguage()

  const [requests, setRequests] = useState<PartnerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({})
  const toast = useToast()

  const handlePullRefresh = useCallback(async () => {
    await loadRequests()
  }, [])

  const { containerRef: pullRef, indicatorElement } = usePullToRefresh({
    onRefresh: handlePullRefresh,
  })

  useEffect(() => { loadRequests() }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await getMyRequests()
      setRequests(data)
      const activeIds = data.filter(r => r.status === 'active').map(r => r.id)
      if (activeIds.length > 0) {
        const counts = await getApplicantCounts(activeIds)
        setApplicantCounts(counts)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (cancelling) return
    setCancelling(true)
    try {
      await cancelRequest(id)
      setCancellingId(null)
      toast.addToast(t.toasts.requestCancelled, 'info')
      await loadRequests()
    } catch (err) {
      toast.addToast('Failed to cancel. Please try again.', 'error')
      console.error(err)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div ref={pullRef}>
      {indicatorElement}
      <PageHeader title={t.requests.title} subtitle={t.requests.subtitle} />

      <div className="px-5 space-y-3 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-3xl p-5 card-shadow animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-24 bg-slate-100 rounded-full" />
                  <div className="h-6 w-20 bg-slate-100 rounded-xl" />
                </div>
                <div className="h-5 bg-slate-200 rounded-full w-2/3 mb-2" />
                <div className="h-4 bg-slate-100 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-5 shadow-lg shadow-blue-400/25">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 mb-1">{t.requests.noRequestsTitle}</h3>
            <p className="text-sm text-slate-400 font-medium mb-6 max-w-[240px] leading-relaxed">{t.requests.noRequestsSubtitle}</p>
            <Link
              href="/requests/new"
              className="inline-flex items-center gap-2 bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-md shadow-blue-400/25 active:scale-[0.97] transition-transform"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t.requests.createFirst}
            </Link>
          </div>
        ) : (
          requests.map((req) => {
            const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.expired
            const isActive = req.status === 'active'
            const count = applicantCounts[req.id] ?? 0
            const formattedDate = new Date(req.date).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
            })

            return (
              <div key={req.id} className="bg-white rounded-3xl card-shadow border border-gray-50 overflow-hidden animate-fade-in">

                {/* ── Card top: location + date prominent ── */}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-slate-900 text-[17px] leading-tight truncate">
                        {req.location_name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-semibold text-slate-600">{formattedDate}</span>
                        {!req.flexible && req.start_time && (
                          <span className="text-sm text-slate-400 font-medium">
                            · {req.start_time.slice(0, 5)}{req.end_time ? `–${req.end_time.slice(0, 5)}` : ''}
                          </span>
                        )}
                        {req.flexible && (
                          <span className="text-xs font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {t.requests.flexible}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {t.requests.status[req.status as keyof typeof t.requests.status] || req.status}
                    </span>
                  </div>

                  {/* Grade pill */}
                  {req.desired_grade_range && (
                    <span className="inline-flex mt-2.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                      {req.desired_grade_range}
                    </span>
                  )}

                  {/* Notes */}
                  {req.notes && (
                    <p className="mt-2.5 text-sm text-slate-500 leading-relaxed line-clamp-2">{req.notes}</p>
                  )}
                </div>

                {/* ── Card bottom: applicants + actions ── */}
                {isActive && (
                  <div className="border-t border-slate-50 px-5 py-3 flex items-center justify-between gap-3">

                    {/* Applicant count */}
                    {count > 0 ? (
                      <Link
                        href="/inbox"
                        className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold px-3 py-2 rounded-xl"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                        </svg>
                        {count} {count === 1 ? t.requests.applicant : t.requests.applicants}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-300 font-medium">No applicants yet</span>
                    )}

                    {/* Actions */}
                    {cancellingId === req.id ? (
                      <div className="flex items-center gap-2 animate-fade-in">
                        <span className="text-xs text-slate-500 font-medium">{t.requests.areYouSure}</span>
                        <Button variant="danger" onClick={() => handleCancel(req.id)} loading={cancelling} className="!text-xs !px-3 !py-1.5 !rounded-xl">
                          {t.requests.yesCancel}
                        </Button>
                        <Button variant="ghost" onClick={() => setCancellingId(null)} className="!text-xs !px-3 !py-1.5 !rounded-xl">
                          {t.requests.no}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/requests/${req.id}/edit`}
                          className="text-xs font-bold text-blue-500 bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl active:scale-[0.97] transition-transform"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setCancellingId(req.id)}
                          className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl active:scale-[0.97] transition-transform"
                        >
                          {t.requests.cancel}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
