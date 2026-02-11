'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/Button'
import { createClient } from '@/lib/supabase/client'
import type { PartnerRequest } from '@/lib/types/database'
import Link from 'next/link'

const CLIMBING_LABELS: Record<string, string> = {
  indoor: 'Indoor', sport: 'Sport', boulder: 'Boulder', trad: 'Trad', multi_pitch: 'Multi-pitch',
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-600',
  matched: 'bg-blue-50 text-blue-600',
  cancelled: 'bg-gray-100 text-gray-400',
  expired: 'bg-gray-100 text-gray-400',
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<PartnerRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadRequests() }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('partner_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setRequests(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this request?')) return
    try {
      const supabase = createClient()
      await supabase.from('partner_requests').update({ status: 'cancelled' }).eq('id', id)
      await loadRequests()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <PageHeader title="My Requests" subtitle="Manage your partner requests" />
      <div className="px-5 space-y-3 pb-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 animate-pulse mx-auto mb-3" />
            <p className="text-gray-300 font-medium">Loading...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-gray-400 font-medium mb-5">No requests yet</p>
            <Link href="/requests/new"><Button>Create Your First Request</Button></Link>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl p-4 card-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-sm">{CLIMBING_LABELS[req.climbing_type]}</h3>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full capitalize font-bold ${STATUS_STYLES[req.status]}`}>{req.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{req.location_name}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    {req.date} {req.flexible ? '(Flexible)' : `${req.start_time?.slice(0, 5) || ''} - ${req.end_time?.slice(0, 5) || ''}`}
                  </p>
                  {req.desired_grade_range && <p className="text-xs text-gray-400 mt-0.5">Grade: {req.desired_grade_range}</p>}
                </div>
                {req.status === 'active' && (
                  <Button variant="ghost" onClick={() => handleCancel(req.id)} className="text-xs !text-red-400 !px-3 !py-1.5">Cancel</Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
