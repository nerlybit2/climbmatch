'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { PageHeader } from '@/components/PageHeader'

export default function SettingsPage() {
  const { t } = useLanguage()

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <PageHeader title={t.settings.title} subtitle={t.settings.subtitle} />
      <div className="px-5 space-y-4 pb-28">
      </div>
    </div>
  )
}
