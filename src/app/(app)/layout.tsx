import { Navbar } from '@/components/Navbar'
import { ToastProvider } from '@/contexts/ToastContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { DiscoverProvider } from '@/contexts/DiscoverContext'
import { InboxProvider } from '@/contexts/InboxContext'
import { MyPostsProvider } from '@/contexts/MyPostsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { ToastContainer } from '@/components/Toast'
import { CapacitorHandlers } from '@/components/CapacitorHandlers'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <DiscoverProvider>
      <InboxProvider>
      <MyPostsProvider>
      <ProfileProvider>
      <div className="min-h-[100dvh] flex flex-col bg-[#EDF1F7]">
        <ToastProvider>
          <CapacitorHandlers />
          <main className="flex-1 pb-28 overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            {children}
          </main>
          <ToastContainer />
        </ToastProvider>
        <Navbar />
      </div>
      </ProfileProvider>
      </MyPostsProvider>
      </InboxProvider>
      </DiscoverProvider>
    </LanguageProvider>
  )
}
