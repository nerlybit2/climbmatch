'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/Input'
import { PhoneInput } from '@/components/PhoneInput'
import { GearCheckboxes } from '@/components/GearCheckboxes'
import { Button } from '@/components/Button'
import type { Profile, GearSet } from '@/lib/types/database'
import { signOut } from '@/lib/actions/auth'
import { useLanguage } from '@/contexts/LanguageContext'

const DEFAULT_GEAR: GearSet = { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false }

interface Props {
  profile: Profile | null
  userEmail: string
  prefill?: { displayName: string; photoUrl: string }
}

export function ProfileForm({ profile, userEmail, prefill }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || prefill?.photoUrl || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || prefill?.displayName || '')
  const [homeArea, setHomeArea] = useState(profile?.home_area || '')
  const [sportGrade, setSportGrade] = useState(profile?.sport_grade_range || '')
  const [boulderGrade, setBoulderGrade] = useState(profile?.boulder_grade_range || '')
  const [weightKg, setWeightKg] = useState(profile?.weight_kg?.toString() || '')
  const [shareWeight, setShareWeight] = useState(profile?.share_weight || false)
  const [gear, setGear] = useState<GearSet>((profile?.gear as GearSet) || DEFAULT_GEAR)
  const [hasCar, setHasCar] = useState(profile?.has_car || false)
  const [bio, setBio] = useState(profile?.bio || '')
  const [languages, setLanguages] = useState(profile?.languages?.join(', ') || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [instagram, setInstagram] = useState(profile?.instagram || '')
  const [facebook, setFacebook] = useState(profile?.facebook || '')
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
    if (!displayName.trim()) { setError(t.profile.errors.displayName); return }
    if (!photoUrl) { setError(t.profile.errors.photo); return }
    if (!phone.trim()) { setError(t.profile.errors.phone); return }
    if (weightKg && (parseFloat(weightKg) < 30 || parseFloat(weightKg) > 200)) { setError(t.profile.errors.weight); return }
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
        experience_level: null,
        sport_grade_range: sportGrade.trim() || null,
        boulder_grade_range: boulderGrade.trim() || null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        share_weight: shareWeight,
        gear,
        has_car: hasCar,
        bio: bio.trim() || null,
        languages: languages ? languages.split(',').map(l => l.trim()).filter(Boolean) : [],
        phone: phone.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
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
    <>
    <div className="pt-6 pb-3">
      <h1 className="text-2xl font-extrabold tracking-tight">{profile ? t.profile.editTitle : t.profile.createTitle}</h1>
      <p className="text-sm text-gray-400 mt-0.5 font-medium">{profile ? t.profile.editSubtitle : t.profile.createSubtitle}</p>
    </div>
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Photo */}
      <div className="flex items-center gap-5">
        {photoUrl ? (
          <Image src={photoUrl || '/default-avatar.svg'} alt="Avatar" width={96} height={96} className="w-24 h-24 rounded-3xl object-cover shadow-lg" />
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
            {photoUrl ? t.profile.changePhoto : t.profile.uploadPhoto}
          </Button>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">{t.profile.required}</p>
        </div>
      </div>

      <Input label={t.profile.displayName} value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder={t.profile.displayNamePlaceholder} />
      <PhoneInput label={t.profile.phone} value={phone} onChange={setPhone} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t.profile.instagram} value={instagram} onChange={e => setInstagram(e.target.value)} placeholder={t.profile.instagramPlaceholder} />
        <Input label={t.profile.facebook} value={facebook} onChange={e => setFacebook(e.target.value)} placeholder={t.profile.facebookPlaceholder} />
      </div>
      <Input label={t.profile.homeArea} value={homeArea} onChange={e => setHomeArea(e.target.value)} placeholder={t.profile.homeAreaPlaceholder} />

      <div className="grid grid-cols-2 gap-3">
        <Input label={t.profile.sportGrade} value={sportGrade} onChange={e => setSportGrade(e.target.value)} placeholder={t.profile.sportGradePlaceholder} />
        <Input label={t.profile.boulderGrade} value={boulderGrade} onChange={e => setBoulderGrade(e.target.value)} placeholder={t.profile.boulderGradePlaceholder} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.profile.weightPrivate}</span>
        </div>
        <Input label="" type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder={t.profile.weightPlaceholder} min={30} max={200} />
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={shareWeight} onChange={e => setShareWeight(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5" />
          <div>
            <span className="text-sm font-semibold text-gray-700">{t.profile.showWeight}</span>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {shareWeight ? t.profile.weightVisible : t.profile.weightHidden}
            </p>
          </div>
        </label>
      </div>

      <GearCheckboxes label={t.profile.gearIHave} gear={gear} onChange={setGear} />

      <label className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 cursor-pointer">
        <input type="checkbox" checked={hasCar} onChange={e => setHasCar(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5" />
        <span className="text-sm font-semibold text-gray-700">{t.profile.hasCar}</span>
      </label>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.profile.bio}</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
          className="w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-sm shadow-sm ring-1 ring-gray-200 placeholder:text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
          placeholder={t.profile.bioPlaceholder}
        />
      </div>

      <Input label={t.profile.languages} value={languages} onChange={e => setLanguages(e.target.value)} placeholder={t.profile.languagesPlaceholder} />

      {error && <p className="text-sm text-red-500 bg-red-50 p-4 rounded-2xl font-medium">{error}</p>}

      <Button type="submit" loading={loading} className="w-full !py-4 !text-base">
        {profile ? t.profile.save : t.profile.create}
      </Button>

    </form>
    <div className="pt-5 border-t border-gray-100 space-y-3">
      {profile && (
        <>
          <p className="text-xs text-gray-400 font-medium">{t.profile.signedInAs} {userEmail}</p>
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="w-full !text-red-400">{t.profile.signOut}</Button>
          </form>
        </>
      )}
    </div>
    </>
  )
}
