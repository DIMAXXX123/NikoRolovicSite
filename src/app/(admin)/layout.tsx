'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DEMO_AUTO_ADMIN } from '@/components/auto-login'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const isSubPage = pathname !== '/admin'
  // /direktor and /nastavnik live in this route group but have their own
  // server-side role gate and chrome (src/app/(admin)/direktor/layout.tsx).
  const isPanel = pathname.startsWith('/direktor') || pathname.startsWith('/nastavnik')

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Demo mode: <AutoLogin /> signs the visitor in and reloads — keep
      // showing the spinner instead of bouncing to /login.
      if (!DEMO_AUTO_ADMIN) router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator' && profile.role !== 'creator' && profile.role !== 'direktor')) {
      router.push('/news')
      return
    }

    setAuthorized(true)
    setLoading(false)
  }

  useEffect(() => {
    if (isPanel) return
    checkAuth()
  }, [])

  if (isPanel) return <>{children}</>

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-[3px] border-border border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto px-4 pt-4 pb-8">
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href={isSubPage ? '/admin' : '/profile'}
            className="inline-flex items-center gap-2 min-h-[44px] text-[15px] font-extrabold text-secondary transition-colors hover:text-secondary-dark group"
          >
            <div className="w-11 h-11 rounded-xl bg-background border-2 border-border shadow-[0_2px_0_var(--color-border)] flex items-center justify-center group-active:translate-y-[2px] group-active:shadow-none transition-[transform,box-shadow] duration-[80ms]">
              <ArrowLeft className="w-5 h-5" strokeWidth={2.6} />
            </div>
            <span>{isSubPage ? 'Admin panel' : 'Nazad'}</span>
          </Link>
          <Badge variant="destructive" className="h-7 gap-1.5 px-3">
            <ShieldCheck strokeWidth={2.6} />
            Admin Panel
          </Badge>
        </div>
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  )
}
