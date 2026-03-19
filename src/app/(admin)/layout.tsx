'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const isSubPage = pathname !== '/admin'

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator' && profile.role !== 'creator')) {
      router.push('/news')
      return
    }

    setAuthorized(true)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-background, #0a0a12)' }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--theme-background, #0a0a12)' }}>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href={isSubPage ? '/admin' : '/profile'}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:border-primary/30 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">{isSubPage ? 'Admin panel' : 'Nazad'}</span>
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary/80 tracking-wide uppercase">Admin Panel</span>
          </div>
        </div>
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  )
}
