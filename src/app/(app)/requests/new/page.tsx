'use client'

import { PageHeader } from '@/components/PageHeader'
import { RequestForm } from '@/components/RequestForm'
import { useLanguage } from '@/contexts/LanguageContext'

export default function NewRequestPage() {
  const { t } = useLanguage()
  return (
    <div>
      <PageHeader title={t.newRequest.title} subtitle={t.newRequest.subtitle} />
      <RequestForm />
    </div>
  )
}
