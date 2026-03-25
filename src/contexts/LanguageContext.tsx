'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { type Language, type Translations, translations } from '@/lib/i18n'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('climbmatch_lang') as Language | null
    if (saved === 'en' || saved === 'he') {
      setLanguageState(saved)
      applyLang(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('climbmatch_lang', lang)
    applyLang(lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

function applyLang(lang: Language) {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
}

export function useLanguage() {
  return useContext(LanguageContext)
}
