'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

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

    if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
      router.push('/news')
      return
    }

    setAuthorized(true)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        <Link href="/profile" className="flex items-center gap-1 text-sm text-primary mb-4 hover:text-primary/80 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Nazad
        </Link>
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  )
}
