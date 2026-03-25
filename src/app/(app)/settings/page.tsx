'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { PageHeader } from '@/components/PageHeader'

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div>
      <PageHeader title={t.settings.title} subtitle={t.settings.subtitle} />
      <div className="px-5 space-y-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.settings.language}</span>
          </div>
          <button
            onClick={() => setLanguage('en')}
            className={`w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 transition-colors ${language === 'en' ? 'bg-blue-50' : 'hover:bg-stone-50'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🇺🇸</span>
              <span className="font-semibold text-sm text-gray-800">{t.settings.english}</span>
            </div>
            {language === 'en' && (
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setLanguage('he')}
            className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${language === 'he' ? 'bg-blue-50' : 'hover:bg-stone-50'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🇮🇱</span>
              <span className="font-semibold text-sm text-gray-800">{t.settings.hebrew}</span>
            </div>
            {language === 'he' && (
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
