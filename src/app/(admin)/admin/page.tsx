'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Newspaper, Camera, Users, BookOpen, Calendar, ShieldAlert } from 'lucide-react'

const adminLinks = [
  { href: '/admin/news', label: 'Upravljanje novostima', icon: Newspaper, desc: 'Dodaj, uredi, obriši novosti', color: 'from-blue-500/20 to-blue-700/20' },
  { href: '/admin/events', label: 'Kalendar', icon: Calendar, desc: 'Kreiraj školske događaje', color: 'from-emerald-500/20 to-emerald-700/20' },
  { href: '/admin/lectures', label: 'Upravljanje lekcijama', icon: BookOpen, desc: 'Dodaj lekcije po razredima', color: 'from-amber-500/20 to-amber-700/20' },
  { href: '/admin/photos', label: 'Moderacija fotografija', icon: Camera, desc: 'Odobri ili odbij fotografije', color: 'from-pink-500/20 to-pink-700/20' },
  { href: '/admin/students', label: 'Upravljanje učenicima', icon: Users, desc: 'Dodaj verifikovane učenike', color: 'from-cyan-500/20 to-cyan-700/20' },
  { href: '/admin/roles', label: 'Upravljanje ulogama', icon: ShieldAlert, desc: 'Promijeni uloge korisnika', color: 'from-red-500/20 to-red-700/20' },
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
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Admin panel</h1>

      <div className="space-y-3">
        {visibleLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="rounded-xl bg-[#1e293b] border border-slate-700/50 p-4 flex items-center gap-4 hover:bg-[#253348] transition-all active:scale-[0.98] mb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center flex-shrink-0`}>
                <link.icon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">{link.label}</h3>
                <p className="text-sm text-slate-400">{link.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
