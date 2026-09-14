import { ThemeSwitcher } from '@/components/theme-switcher'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>
      <div className="relative w-full max-w-md animate-fade-in transition-all duration-300 ease-in-out">
        {children}
      </div>
    </div>
  )
}
