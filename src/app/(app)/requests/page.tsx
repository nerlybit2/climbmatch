'use client'

import { useState, useEffect, useCallback } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/Button'
import type { PartnerRequest } from '@/lib/types/database'
import Link from 'next/link'
import { useToast } from '@/hooks/useToast'
import { useLanguage } from '@/contexts/LanguageContext'
import { getMyRequests, cancelRequest } from '@/lib/actions/requests'
import { getApplicantCounts } from '@/lib/actions/interests'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-600',
  matched: 'bg-blue-50 text-blue-600',
  cancelled: 'bg-gray-100 text-gray-400',
  expired: 'bg-gray-100 text-gray-400',
}

export default function MyRequestsPage() {
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
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse mx-auto mb-3" />
            <p className="text-gray-300 font-medium">{t.requests.loading}</p>
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
            title={t.requests.noRequestsTitle}
            subtitle={t.requests.noRequestsSubtitle}
            actionLabel={t.requests.createFirst}
            actionHref="/requests/new"
          />
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white rounded-3xl card-shadow border border-gray-50 overflow-hidden">
              {/* Post header: status + actions */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${STATUS_STYLES[req.status]}`}>
                    {t.requests.status[req.status as keyof typeof t.requests.status] || req.status}
                  </span>
                  {req.status === 'active' && applicantCounts[req.id] > 0 && (
                    <Link href="/inbox" className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-600">
                      {applicantCounts[req.id]} {applicantCounts[req.id] === 1 ? t.requests.applicant : t.requests.applicants}
                    </Link>
                  )}
                </div>
                {req.status === 'active' && (
                  cancellingId === req.id ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <span className="text-xs text-gray-500 font-medium">{t.requests.areYouSure}</span>
                      <Button variant="danger" onClick={() => handleCancel(req.id)} loading={cancelling} className="text-xs !px-3 !py-1.5">{t.requests.yesCancel}</Button>
                      <Button variant="ghost" onClick={() => setCancellingId(null)} className="text-xs !px-3 !py-1.5">{t.requests.no}</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Link href={`/requests/${req.id}/edit`} className="text-xs font-bold text-blue-500 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors">Edit</Link>
                      <Button variant="ghost" onClick={() => setCancellingId(req.id)} className="text-xs !text-red-400 !px-3 !py-1.5">{t.requests.cancel}</Button>
                    </div>
                  )
                )}
              </div>

              {/* Post body */}
              {req.notes && (
                <p className="px-4 pb-3 text-sm text-slate-800 leading-relaxed">{req.notes}</p>
              )}

              {/* Metadata footer */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 pb-4 pt-1 border-t border-gray-50">
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {req.location_name}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {req.date}
                  {!req.flexible && req.start_time && <span className="text-slate-400 font-medium"> · {req.start_time.slice(0, 5)}{req.end_time ? `–${req.end_time.slice(0, 5)}` : ''}</span>}
                  {req.flexible && <span className="text-slate-400 font-medium"> · {t.requests.flexible}</span>}
                </span>
                {req.desired_grade_range && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {req.desired_grade_range}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
