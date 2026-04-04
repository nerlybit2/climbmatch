import { Navbar } from '@/components/Navbar'
import { ToastProvider } from '@/contexts/ToastContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { DiscoverProvider } from '@/contexts/DiscoverContext'
import { SwipeDiscoverProvider } from '@/contexts/SwipeDiscoverContext'
import { InboxProvider } from '@/contexts/InboxContext'
import { MyPostsProvider } from '@/contexts/MyPostsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { ToastContainer } from '@/components/Toast'
import { CapacitorHandlers } from '@/components/CapacitorHandlers'
import { AppSplashWrapper } from '@/components/AppSplashWrapper'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SwipeDiscoverProvider>
      <DiscoverProvider>
      <InboxProvider>
      <MyPostsProvider>
      <ProfileProvider>
      <AppSplashWrapper>
      <div className="h-[100dvh] overflow-hidden flex flex-col bg-[#EDF1F7]">
        <ToastProvider>
          <CapacitorHandlers />
          <main className="flex-1 overflow-hidden flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            {children}
          </main>
          <ToastContainer />
        </ToastProvider>
        <Navbar />
      </div>
      </AppSplashWrapper>
      </ProfileProvider>
      </MyPostsProvider>
      </InboxProvider>
      </DiscoverProvider>
      </SwipeDiscoverProvider>
    </LanguageProvider>
  )
}
