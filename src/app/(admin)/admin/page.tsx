'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Newspaper, Camera, Users, BookOpen, Calendar, ShieldAlert, LayoutDashboard } from 'lucide-react'

const adminLinks = [
  { href: '/admin/news', label: 'Upravljanje novostima', icon: Newspaper, desc: 'Dodaj, uredi, obriši novosti', color: 'from-purple-500 to-violet-600', iconColor: 'text-purple-200' },
  { href: '/admin/events', label: 'Kalendar', icon: Calendar, desc: 'Kreiraj školske događaje', color: 'from-emerald-500 to-teal-600', iconColor: 'text-emerald-200' },
  { href: '/admin/lectures', label: 'Upravljanje lekcijama', icon: BookOpen, desc: 'Dodaj lekcije po razredima', color: 'from-amber-500 to-orange-600', iconColor: 'text-amber-200' },
  { href: '/admin/photos', label: 'Moderacija fotografija', icon: Camera, desc: 'Odobri ili odbij fotografije', color: 'from-pink-500 to-rose-600', iconColor: 'text-pink-200' },
  { href: '/admin/students', label: 'Upravljanje učenicima', icon: Users, desc: 'Dodaj verifikovane učenike', color: 'from-cyan-500 to-blue-600', iconColor: 'text-cyan-200' },
  { href: '/admin/roles', label: 'Upravljanje ulogama', icon: ShieldAlert, desc: 'Promijeni uloge korisnika', color: 'from-red-500 to-rose-600', iconColor: 'text-red-200' },
]

export default function AdminPage() {
  const [userRole, setUserRole] = useState<string>('')
  const [stats, setStats] = useState<{ news: number; photos: number; students: number }>({ news: 0, photos: 0, students: 0 })
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (data) setUserRole(data.role)

      // Fetch stats
      const [newsRes, photosRes, studentsRes] = await Promise.all([
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('photos').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        news: newsRes.count || 0,
        photos: photosRes.count || 0,
        students: studentsRes.count || 0,
      })
    }
    init()
  }, [])

  const visibleLinks = adminLinks.filter(link => {
    if (link.href === '/admin/roles') return userRole === 'admin' || userRole === 'creator'
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dashboard Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
          style={{
            background: 'linear-gradient(135deg, var(--theme-primary, #a78bfa), var(--theme-accent, #7c3aed))',
            boxShadow: '0 0 16px -4px var(--theme-primary, rgba(167, 139, 250, 0.4))',
          }}
        >
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin panel</h1>
          <p className="text-sm text-muted-foreground">Upravljajte svim sadržajima</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Novosti', value: stats.news, gradient: 'from-purple-500 to-violet-600' },
          { label: 'Čekaju', value: stats.photos, gradient: 'from-amber-500 to-orange-600' },
          { label: 'Učenika', value: stats.students, gradient: 'from-cyan-500 to-blue-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Admin Link Cards */}
      <div className="space-y-3">
        {visibleLinks.map((link, index) => (
          <Link key={link.href} href={link.href}>
            <div
              className="animate-stagger-item rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 active:scale-[0.98] mb-3 group hover:translate-y-[-1px]"
              style={{
                animationDelay: `${index * 80}ms`,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)'
                e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0,0,0,0.3), 0 12px 40px -8px rgba(167, 139, 250, 0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}
                style={{ boxShadow: '0 4px 12px -2px rgba(0,0,0,0.3)' }}
              >
                <link.icon className={`w-6 h-6 ${link.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{link.label}</h3>
                <p className="text-sm text-muted-foreground">{link.desc}</p>
              </div>
              <div className="w-6 h-6 rounded-lg bg-white/[0.03] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
