'use client'

import { createContext, useContext } from 'react'
import { type Translations, en } from '@/lib/i18n'

interface LanguageContextValue {
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue>({ t: en })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return (
    <LanguageContext.Provider value={{ t: en }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
