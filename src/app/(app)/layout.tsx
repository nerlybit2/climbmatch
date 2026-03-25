import { Navbar } from '@/components/Navbar'
import { ToastProvider } from '@/contexts/ToastContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ToastContainer } from '@/components/Toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-[100dvh] flex flex-col bg-stone-50">
        <ToastProvider>
          <main className="flex-1 pb-20 overflow-y-auto">
            {children}
          </main>
          <ToastContainer />
        </ToastProvider>
        <Navbar />
      </div>
    </LanguageProvider>
  )
}
