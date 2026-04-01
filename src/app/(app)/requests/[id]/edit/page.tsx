'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { RequestForm } from '@/components/RequestForm'
import { getRequestById } from '@/lib/actions/requests'
import type { PartnerRequest } from '@/lib/types/database'
import { useLanguage } from '@/contexts/LanguageContext'

export default function EditRequestPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useLanguage()
  const [request, setRequest] = useState<PartnerRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRequestById(id).then(req => {
      if (!req || req.status !== 'active') {
        router.replace('/requests')
        return
      }
      setRequest(req)
      setLoading(false)
    })
  }, [id, router])

  if (loading) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-2xl w-1/3" />
          <div className="h-4 bg-slate-100 rounded-full w-1/2" />
          {[1,2,3,4].map(i => <div key={i} className="h-14 bg-white rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <PageHeader title={t.newRequest.editTitle} subtitle={t.newRequest.editSubtitle} />
      <RequestForm existing={request!} />
    </div>
  )
}
