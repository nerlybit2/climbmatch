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

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-600',
  matched: 'bg-blue-50 text-blue-600',
  cancelled: 'bg-gray-100 text-gray-400',
  expired: 'bg-gray-100 text-gray-400',
}

export default function MyRequestsPage() {
  const { t } = useLanguage()

  const CLIMBING_LABELS: Record<string, string> = {
    indoor: t.climbingTypes.indoor, sport: t.climbingTypes.sport, boulder: t.climbingTypes.boulder,
    trad: t.climbingTypes.trad, multi_pitch: t.climbingTypes.multiPitch,
  }

  const [requests, setRequests] = useState<PartnerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelRequest(id)
      setCancellingId(null)
      toast.addToast(t.toasts.requestCancelled, 'info')
      await loadRequests()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div ref={pullRef}>
      {indicatorElement}
      <PageHeader title={t.requests.title} subtitle={t.requests.subtitle} />
      <div className="px-5 space-y-3 pb-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 animate-pulse mx-auto mb-3" />
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
            <div key={req.id} className="bg-white rounded-2xl p-4 card-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-sm">{CLIMBING_LABELS[req.climbing_type]}</h3>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full capitalize font-bold ${STATUS_STYLES[req.status]}`}>{t.requests.status[req.status as keyof typeof t.requests.status] || req.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{req.location_name}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    {req.date} {req.flexible ? `(${t.requests.flexible})` : `${req.start_time?.slice(0, 5) || ''} - ${req.end_time?.slice(0, 5) || ''}`}
                  </p>
                  {req.desired_grade_range && <p className="text-xs text-gray-400 mt-0.5">{t.requests.grade}: {req.desired_grade_range}</p>}
                </div>
                {req.status === 'active' && (
                  cancellingId === req.id ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <span className="text-xs text-gray-500 font-medium">{t.requests.areYouSure}</span>
                      <Button variant="danger" onClick={() => handleCancel(req.id)} className="text-xs !px-3 !py-1.5">{t.requests.yesCancel}</Button>
                      <Button variant="ghost" onClick={() => setCancellingId(null)} className="text-xs !px-3 !py-1.5">{t.requests.no}</Button>
                    </div>
                  ) : (
                    <Button variant="ghost" onClick={() => setCancellingId(req.id)} className="text-xs !text-red-400 !px-3 !py-1.5">{t.requests.cancel}</Button>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
