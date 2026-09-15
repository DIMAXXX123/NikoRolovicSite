'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DEMO_AUTO_ADMIN } from '@/components/auto-login'

const ADMIN_AREA_ROLES = ['admin', 'moderator', 'creator', 'direktor']
const MODERATION_ROLES = ['admin', 'moderator', 'creator', 'direktor', 'pedagog', 'razredni', 'teacher']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const isSubPage = pathname !== '/admin'
  const isModerationPage = pathname.startsWith('/admin/photos') || pathname.startsWith('/admin/lectures')
  // /direktor and /nastavnik live in this route group but have their own
  // server-side role gate and chrome (src/app/(admin)/direktor/layout.tsx).
  const isPanel = pathname.startsWith('/direktor') || pathname.startsWith('/nastavnik') || pathname.startsWith('/skola') || pathname.startsWith('/aplikacija')

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

    // Moderation pages (photos, AI lecture drafts) are open to every staff
    // role; the rest of the admin area stays admin/moderator/creator/direktor.
    const allowed = isModerationPage ? MODERATION_ROLES : ADMIN_AREA_ROLES
    if (!profile || !allowed.includes(profile.role)) {
      router.push('/news')
      return
    }

    setRole(profile.role)
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
            href={isSubPage && ADMIN_AREA_ROLES.includes(role) ? '/admin' : '/profile'}
            className="inline-flex items-center gap-2 min-h-[44px] text-[15px] font-extrabold text-secondary transition-colors hover:text-secondary-dark group"
          >
            <div className="w-11 h-11 rounded-xl bg-background border-2 border-border shadow-[0_2px_0_var(--color-border)] flex items-center justify-center group-active:translate-y-[2px] group-active:shadow-none transition-[transform,box-shadow] duration-[80ms]">
              <ArrowLeft className="w-5 h-5" strokeWidth={2.6} />
            </div>
            <span>{isSubPage && ADMIN_AREA_ROLES.includes(role) ? 'Admin panel' : 'Nazad'}</span>
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
