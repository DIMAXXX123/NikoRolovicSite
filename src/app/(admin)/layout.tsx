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
      <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-[#0f1729]">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href={isSubPage ? '/admin' : '/profile'}
            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:border-purple-500/30 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">{isSubPage ? 'Admin panel' : 'Nazad'}</span>
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08]">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">Admin Panel</span>
          </div>
        </div>
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  )
}
