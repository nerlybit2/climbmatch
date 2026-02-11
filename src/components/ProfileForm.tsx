'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { MultiSelect } from '@/components/MultiSelect'
import { GearCheckboxes } from '@/components/GearCheckboxes'
import { Button } from '@/components/Button'
import type { Profile, GearSet, ClimbingType, ExperienceLevel } from '@/lib/types/database'
import { signOut } from '@/lib/actions/auth'

const CLIMBING_TYPE_OPTIONS = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'sport', label: 'Sport' },
  { value: 'boulder', label: 'Boulder' },
  { value: 'trad', label: 'Trad' },
  { value: 'multi_pitch', label: 'Multi-pitch' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const DEFAULT_GEAR: GearSet = { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false }

interface Props {
  profile: Profile | null
  userEmail: string
}

export function ProfileForm({ profile, userEmail }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [homeArea, setHomeArea] = useState(profile?.home_area || '')
  const [climbingTypes, setClimbingTypes] = useState<string[]>(profile?.climbing_types || [])
  const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level || '')
  const [sportGrade, setSportGrade] = useState(profile?.sport_grade_range || '')
  const [boulderGrade, setBoulderGrade] = useState(profile?.boulder_grade_range || '')
  const [weightKg, setWeightKg] = useState(profile?.weight_kg?.toString() || '')
  const [shareWeight, setShareWeight] = useState(profile?.share_weight || false)
  const [gear, setGear] = useState<GearSet>((profile?.gear as GearSet) || DEFAULT_GEAR)
  const [hasCar, setHasCar] = useState(profile?.has_car || false)
  const [bio, setBio] = useState(profile?.bio || '')
  const [languages, setLanguages] = useState(profile?.languages?.join(', ') || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [uploading, setUploading] = useState(false)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setPhotoUrl(publicUrl)
    } catch (err: unknown) {
      setError('Failed to upload photo: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) { setError('Display name is required'); return }
    if (!photoUrl) { setError('Photo is required'); return }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const profileData = {
        id: user.id,
        display_name: displayName.trim(),
        photo_url: photoUrl,
        home_area: homeArea.trim() || null,
        climbing_types: climbingTypes as ClimbingType[],
        experience_level: (experienceLevel as ExperienceLevel) || null,
        sport_grade_range: sportGrade.trim() || null,
        boulder_grade_range: boulderGrade.trim() || null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        share_weight: shareWeight,
        gear,
        has_car: hasCar,
        bio: bio.trim() || null,
        languages: languages ? languages.split(',').map(l => l.trim()).filter(Boolean) : [],
        phone: phone.trim() || null,
      }
      const { error: upsertError } = await supabase.from('profiles').upsert(profileData)
      if (upsertError) throw upsertError
      router.push('/discover')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Photo */}
      <div className="flex items-center gap-5">
        {photoUrl ? (
          <img src={photoUrl} alt="Avatar" className="w-24 h-24 rounded-3xl object-cover shadow-lg" />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-stone-100 flex items-center justify-center text-gray-300">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
            </svg>
          </div>
        )}
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}>
            {photoUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">Required</p>
        </div>
      </div>

      <Input label="Display Name *" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="Your climbing name" />
      <Input label="Phone (WhatsApp)" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+972..." />
      <Input label="Home Area" value={homeArea} onChange={e => setHomeArea(e.target.value)} placeholder="e.g., Tel Aviv" />
      <MultiSelect label="Climbing Types" options={CLIMBING_TYPE_OPTIONS} selected={climbingTypes} onChange={setClimbingTypes} />
      <Select label="Experience Level" value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)} options={EXPERIENCE_OPTIONS} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Sport Grade" value={sportGrade} onChange={e => setSportGrade(e.target.value)} placeholder="e.g., 6a-7a" />
        <Input label="Boulder Grade" value={boulderGrade} onChange={e => setBoulderGrade(e.target.value)} placeholder="e.g., V3-V6" />
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <Input label="Weight (kg)" type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="kg" />
        <label className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm ring-1 ring-gray-100 cursor-pointer">
          <input type="checkbox" checked={shareWeight} onChange={e => setShareWeight(e.target.checked)} className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-5 h-5" />
          <span className="text-sm font-semibold text-gray-700">Share</span>
        </label>
      </div>

      <GearCheckboxes label="Gear I Have" gear={gear} onChange={setGear} />

      <label className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 cursor-pointer">
        <input type="checkbox" checked={hasCar} onChange={e => setHasCar(e.target.checked)} className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-5 h-5" />
        <span className="text-sm font-semibold text-gray-700">I have a car</span>
      </label>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Bio</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
          className="w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-sm shadow-sm ring-1 ring-gray-200 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500 outline-none resize-none transition-all"
          placeholder="Tell others about yourself..."
        />
      </div>

      <Input label="Languages" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Hebrew" />

      {error && <p className="text-sm text-red-500 bg-red-50 p-4 rounded-2xl font-medium">{error}</p>}

      <Button type="submit" loading={loading} className="w-full !py-4 !text-base">
        {profile ? 'Save Profile' : 'Create Profile'}
      </Button>

      {profile && (
        <div className="pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-3 font-medium">Signed in as {userEmail}</p>
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="w-full !text-red-400">Sign Out</Button>
          </form>
        </div>
      )}
    </form>
  )
}
