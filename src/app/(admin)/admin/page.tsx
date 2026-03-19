'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Newspaper, Camera, Users, BookOpen, Calendar, ShieldAlert, LayoutDashboard } from 'lucide-react'

const adminLinks = [
  { href: '/admin/news', label: 'Upravljanje novostima', icon: Newspaper, desc: 'Dodaj, uredi, obriši novosti', color: 'from-purple-500 to-violet-600', iconColor: 'text-purple-300' },
  { href: '/admin/events', label: 'Kalendar', icon: Calendar, desc: 'Kreiraj školske događaje', color: 'from-emerald-500 to-teal-600', iconColor: 'text-emerald-300' },
  { href: '/admin/lectures', label: 'Upravljanje lekcijama', icon: BookOpen, desc: 'Dodaj lekcije po razredima', color: 'from-amber-500 to-orange-600', iconColor: 'text-amber-300' },
  { href: '/admin/photos', label: 'Moderacija fotografija', icon: Camera, desc: 'Odobri ili odbij fotografije', color: 'from-pink-500 to-rose-600', iconColor: 'text-pink-300' },
  { href: '/admin/students', label: 'Upravljanje učenicima', icon: Users, desc: 'Dodaj verifikovane učenike', color: 'from-cyan-500 to-blue-600', iconColor: 'text-cyan-300' },
  { href: '/admin/roles', label: 'Upravljanje ulogama', icon: ShieldAlert, desc: 'Promijeni uloge korisnika', color: 'from-red-500 to-rose-600', iconColor: 'text-red-300' },
]

export default function AdminPage() {
  const [userRole, setUserRole] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (data) setUserRole(data.role)
    }
    getRole()
  }, [])

  const visibleLinks = adminLinks.filter(link => {
    if (link.href === '/admin/roles') return userRole === 'admin' || userRole === 'creator'
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dashboard Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin panel</h1>
          <p className="text-sm text-white/40">Upravljajte svim sadržajima</p>
        </div>
      </div>

      {/* Admin Link Cards */}
      <div className="space-y-3">
        {visibleLinks.map((link, index) => (
          <Link key={link.href} href={link.href}>
            <div
              className="animate-stagger-item rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] p-4 flex items-center gap-4 hover:-translate-y-[2px] hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-300 active:scale-[0.98] mb-3 group"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                <link.icon className={`w-6 h-6 ${link.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors">{link.label}</h3>
                <p className="text-sm text-white/40">{link.desc}</p>
              </div>
              <div className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
