'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { GearCheckboxes } from '@/components/GearCheckboxes'
import { Button } from '@/components/Button'
import { createClient } from '@/lib/supabase/client'
import type { GearSet, LocationType, GoalType } from '@/lib/types/database'
import { useToast } from '@/hooks/useToast'
import { useLanguage } from '@/contexts/LanguageContext'

const DEFAULT_GEAR: GearSet = { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false }

export default function NewRequestPage() {
  const router = useRouter()
  const toast = useToast()
  const { t } = useLanguage()

  const LOCATION_TYPE_OPTIONS = [
    { value: 'gym', label: t.locationTypes.gym },
    { value: 'crag', label: t.locationTypes.crag },
  ]

  const GOAL_OPTIONS = [
    { value: 'any', label: t.goalTypes.any },
    { value: 'project', label: t.goalTypes.project },
    { value: 'mileage', label: t.goalTypes.mileage },
    { value: 'easy_day', label: t.goalTypes.easyDay },
    { value: 'training', label: t.goalTypes.training },
  ]
  const today = new Date().toISOString().split('T')[0]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState(today)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [flexible, setFlexible] = useState(false)
  const [locationType, setLocationType] = useState<string>('gym')
  const [locationName, setLocationName] = useState('')
  const [goalType, setGoalType] = useState<string>('any')
  const [desiredGrade, setDesiredGrade] = useState('')
  const [notes, setNotes] = useState('')
  const [needsGear, setNeedsGear] = useState<GearSet>(DEFAULT_GEAR)
  const [carpoolNeeded, setCarpoolNeeded] = useState(false)
  const [weightRelevant, setWeightRelevant] = useState(false)
  const [maxWeightDiff, setMaxWeightDiff] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !locationName.trim()) {
      setError(t.newRequest.errors.required); return
    }
    if (!flexible && !startTime) {
      setError(t.newRequest.errors.noTime); return
    }
    if (weightRelevant && maxWeightDiff && (parseFloat(maxWeightDiff) < 1 || parseFloat(maxWeightDiff) > 100)) {
      setError(t.newRequest.errors.weightRange); return
    }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        router.push('/profile')
        return
      }

      const { count } = await supabase
        .from('partner_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (count && count >= 2) {
        setError(t.newRequest.errors.maxRequests)
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase.from('partner_requests').insert({
        user_id: user.id,
        date,
        start_time: flexible ? null : startTime || null,
        end_time: flexible ? null : endTime || null,
        flexible,
        location_type: locationType as LocationType,
        location_name: locationName.trim(),
        goal_type: (goalType as GoalType) || 'any',
        desired_grade_range: desiredGrade.trim() || null,
        notes: notes.trim() || null,
        needs_gear: needsGear,
        carpool_needed: carpoolNeeded,
        weight_relevant: weightRelevant,
        max_weight_difference_kg: maxWeightDiff ? parseFloat(maxWeightDiff) : null,
      })

      if (insertError) throw insertError
      toast.addToast(t.toasts.requestCreated, 'success')
      router.push('/requests')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title={t.newRequest.title} subtitle={t.newRequest.subtitle} />
      <form onSubmit={handleSubmit} className="px-5 space-y-5 pb-8">
        <Input label={t.newRequest.date} type="date" value={date} onChange={e => setDate(e.target.value)} min={today} required />

        <label className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 cursor-pointer">
          <input type="checkbox" checked={flexible} onChange={e => setFlexible(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5" />
          <span className="text-sm font-semibold text-gray-700">{t.newRequest.flexibleTime}</span>
        </label>

        {!flexible && (
          <div className="grid grid-cols-2 gap-3">
            <Input label={t.newRequest.startTime} type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <Input label={t.newRequest.endTime} type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        )}

        <Select label={t.newRequest.locationType} value={locationType} onChange={e => setLocationType(e.target.value)} options={LOCATION_TYPE_OPTIONS} />
        <Input label={t.newRequest.locationName} value={locationName} onChange={e => setLocationName(e.target.value)} placeholder={t.newRequest.locationPlaceholder} required />
        <Select label={t.newRequest.goal} value={goalType} onChange={e => setGoalType(e.target.value)} options={GOAL_OPTIONS} />
        <Input label={t.newRequest.gradeRange} value={desiredGrade} onChange={e => setDesiredGrade(e.target.value)} placeholder={t.newRequest.gradePlaceholder} />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.newRequest.notes}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-sm shadow-sm ring-1 ring-gray-200 placeholder:text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
            placeholder={t.newRequest.notesPlaceholder} />
        </div>

        <GearCheckboxes label={t.newRequest.gearNeeded} gear={needsGear} onChange={setNeedsGear} />

        <label className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 cursor-pointer">
          <input type="checkbox" checked={carpoolNeeded} onChange={e => setCarpoolNeeded(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5" />
          <span className="text-sm font-semibold text-gray-700">{t.newRequest.carpoolNeeded}</span>
        </label>

        <label className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 cursor-pointer">
          <input type="checkbox" checked={weightRelevant} onChange={e => setWeightRelevant(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5" />
          <span className="text-sm font-semibold text-gray-700">{t.newRequest.weightRelevant}</span>
        </label>

        {weightRelevant && (
          <Input label={t.newRequest.maxWeightDiff} type="number" value={maxWeightDiff} onChange={e => setMaxWeightDiff(e.target.value)} placeholder={t.newRequest.maxWeightPlaceholder} min={1} max={100} />
        )}

        {error && <p className="text-sm text-red-500 bg-red-50 p-4 rounded-2xl font-medium">{error}</p>}
        <Button type="submit" loading={loading} className="w-full !py-4 !text-base">{t.newRequest.submit}</Button>
      </form>
    </div>
  )
}
