import { BottomNav } from '@/components/bottom-nav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-lg mx-auto px-4 pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
