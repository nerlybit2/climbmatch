import { Navbar } from '@/components/Navbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-stone-50">
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <Navbar />
    </div>
  )
}
