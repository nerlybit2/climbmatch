'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { GearCheckboxes } from '@/components/GearCheckboxes'
import { Button } from '@/components/Button'
import { createClient } from '@/lib/supabase/client'
import type { GearSet, ClimbingType, LocationType, GoalType } from '@/lib/types/database'

const CLIMBING_TYPE_OPTIONS = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'sport', label: 'Sport' },
  { value: 'boulder', label: 'Boulder' },
  { value: 'trad', label: 'Trad' },
  { value: 'multi_pitch', label: 'Multi-pitch' },
]

const LOCATION_TYPE_OPTIONS = [
  { value: 'gym', label: 'Gym' },
  { value: 'crag', label: 'Crag' },
]

const GOAL_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'project', label: 'Project' },
  { value: 'mileage', label: 'Mileage' },
  { value: 'easy_day', label: 'Easy Day' },
  { value: 'training', label: 'Training' },
]

const DEFAULT_GEAR: GearSet = { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false }

export default function NewRequestPage() {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState(today)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [flexible, setFlexible] = useState(false)
  const [locationType, setLocationType] = useState<string>('gym')
  const [locationName, setLocationName] = useState('')
  const [climbingType, setClimbingType] = useState<string>('indoor')
  const [goalType, setGoalType] = useState<string>('any')
  const [desiredGrade, setDesiredGrade] = useState('')
  const [notes, setNotes] = useState('')
  const [needsGear, setNeedsGear] = useState<GearSet>(DEFAULT_GEAR)
  const [carpoolNeeded, setCarpoolNeeded] = useState(false)
  const [weightRelevant, setWeightRelevant] = useState(false)
  const [maxWeightDiff, setMaxWeightDiff] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !locationName.trim() || !climbingType) {
      setError('Date, location, and climbing type are required'); return
    }
    if (!flexible && !startTime) {
      setError('Set a start time or mark as flexible'); return
    }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { count } = await supabase
        .from('partner_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (count && count >= 2) {
        setError('Maximum 2 active requests allowed. Cancel an existing one first.')
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
        climbing_type: climbingType as ClimbingType,
        goal_type: (goalType as GoalType) || 'any',
        desired_grade_range: desiredGrade.trim() || null,
        notes: notes.trim() || null,
        needs_gear: needsGear,
        carpool_needed: carpoolNeeded,
        weight_relevant: weightRelevant,
        max_weight_difference_kg: maxWeightDiff ? parseFloat(maxWeightDiff) : null,
      })

      if (insertError) throw insertError
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
      <PageHeader title="Post Request" subtitle="Find a climbing partner" />
      <form onSubmit={handleSubmit} className="px-5 space-y-5 pb-8">
        <Input label="Date *" type="date" value={date} onChange={e => setDate(e.target.value)} min={today} required />

        <label className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 cursor-pointer">
          <input type="checkbox" checked={flexible} onChange={e => setFlexible(e.target.checked)} className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-5 h-5" />
          <span className="text-sm font-semibold text-gray-700">Flexible time</span>
        </label>

        {!flexible && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time *" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <Input label="End Time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        )}

        <Select label="Location Type *" value={locationType} onChange={e => setLocationType(e.target.value)} options={LOCATION_TYPE_OPTIONS} />
        <Input label="Location Name *" value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="e.g., Vertical Playground, Ein Prat" required />
        <Select label="Climbing Type *" value={climbingType} onChange={e => setClimbingType(e.target.value)} options={CLIMBING_TYPE_OPTIONS} />
        <Select label="Goal" value={goalType} onChange={e => setGoalType(e.target.value)} options={GOAL_OPTIONS} />
        <Input label="Desired Grade Range" value={desiredGrade} onChange={e => setDesiredGrade(e.target.value)} placeholder="e.g., 6a-6c" />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-sm shadow-sm ring-1 ring-gray-200 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500 outline-none resize-none transition-all"
            placeholder="Any additional info..." />
        </div>

        <GearCheckboxes label="Gear Needed From Partner" gear={needsGear} onChange={setNeedsGear} />

        <label className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 cursor-pointer">
          <input type="checkbox" checked={carpoolNeeded} onChange={e => setCarpoolNeeded(e.target.checked)} className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-5 h-5" />
          <span className="text-sm font-semibold text-gray-700">Need a ride / carpool</span>
        </label>

        <label className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 cursor-pointer">
          <input type="checkbox" checked={weightRelevant} onChange={e => setWeightRelevant(e.target.checked)} className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-5 h-5" />
          <span className="text-sm font-semibold text-gray-700">Weight matching relevant</span>
        </label>

        {weightRelevant && (
          <Input label="Max Weight Difference (kg)" type="number" value={maxWeightDiff} onChange={e => setMaxWeightDiff(e.target.value)} placeholder="e.g., 15" />
        )}

        {error && <p className="text-sm text-red-500 bg-red-50 p-4 rounded-2xl font-medium">{error}</p>}
        <Button type="submit" loading={loading} className="w-full !py-4 !text-base">Post Request</Button>
      </form>
    </div>
  )
}
