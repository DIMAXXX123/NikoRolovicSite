'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Newspaper, Camera, Users, BookOpen, Calendar, ShieldAlert, LayoutDashboard, ChevronRight } from 'lucide-react'

const adminLinks = [
  { href: '/admin/news', label: 'Upravljanje novostima', icon: Newspaper, desc: 'Dodaj, uredi, obriši novosti', color: '#1CB0F6' },
  { href: '/admin/events', label: 'Kalendar', icon: Calendar, desc: 'Kreiraj školske događaje', color: '#58CC02' },
  { href: '/admin/lectures', label: 'Upravljanje lekcijama', icon: BookOpen, desc: 'Dodaj lekcije po razredima', color: '#FF9600' },
  { href: '/admin/photos', label: 'Moderacija fotografija', icon: Camera, desc: 'Odobri ili odbij fotografije', color: '#FF86D0' },
  { href: '/admin/students', label: 'Upravljanje učenicima', icon: Users, desc: 'Dodaj verifikovane učenike', color: '#CE82FF' },
  { href: '/admin/roles', label: 'Upravljanje ulogama', icon: ShieldAlert, desc: 'Promijeni uloge korisnika', color: '#FF4B4B' },
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
        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary shadow-[0_3px_0_var(--color-primary-dark)]">
          <LayoutDashboard className="w-5 h-5 text-white" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">Admin panel</h1>
          <p className="text-[13px] font-bold text-muted-foreground">Upravljajte svim sadržajima</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Novosti', value: stats.news, color: 'text-secondary' },
          { label: 'Čekaju', value: stats.photos, color: 'text-orange' },
          { label: 'Učenika', value: stats.students, color: 'text-primary-text' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 text-center bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)]"
          >
            <p className={`text-[28px] leading-none font-black tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Admin Link Cards */}
      <div className="space-y-3">
        {visibleLinks.map((link, index) => (
          <Link key={link.href} href={link.href} className="block">
            <div
              className="animate-stagger-item rounded-2xl p-4 min-h-[64px] flex items-center gap-3 mb-3 bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: `color-mix(in srgb, ${link.color} 18%, white)`,
                  color: link.color,
                }}
              >
                <link.icon className="w-6 h-6" strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] leading-[1.3] font-extrabold text-heading">{link.label}</h3>
                <p className="text-[13px] font-bold text-muted-foreground">{link.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-disabled flex-shrink-0" strokeWidth={2.6} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
