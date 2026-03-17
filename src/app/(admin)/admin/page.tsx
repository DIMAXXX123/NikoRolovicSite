'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Newspaper, Camera, Users, BookOpen, Calendar } from 'lucide-react'

const adminLinks = [
  { href: '/admin/news', label: 'Upravljanje novostima', icon: Newspaper, desc: 'Dodaj, uredi, obriši novosti' },
  { href: '/admin/events', label: 'Upravljanje događajima', icon: Calendar, desc: 'Kreiraj školske događaje' },
  { href: '/admin/lectures', label: 'Upravljanje lekcijama', icon: BookOpen, desc: 'Dodaj lekcije po razredima' },
  { href: '/admin/photos', label: 'Moderacija fotografija', icon: Camera, desc: 'Odobri ili odbij fotografije' },
  { href: '/admin/students', label: 'Upravljanje učenicima', icon: Users, desc: 'Dodaj verifikovane učenike' },
]

export default function AdminPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold gradient-text">Admin panel</h1>
      
      {adminLinks.map((link) => (
        <Link key={link.href} href={link.href}>
          <Card className="border-border/30 bg-card/50 backdrop-blur hover:bg-card/80 transition-all active:scale-[0.98] mb-3">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-700/20 flex items-center justify-center flex-shrink-0">
                <link.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{link.label}</h3>
                <p className="text-sm text-muted-foreground">{link.desc}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
