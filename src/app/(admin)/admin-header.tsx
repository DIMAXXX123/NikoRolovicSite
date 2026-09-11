'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export function AdminHeader() {
  const pathname = usePathname()
  const isSubPage = pathname !== '/admin'

  return (
    <div className="flex items-center justify-between mb-5">
      <Link
        href={isSubPage ? '/admin' : '/profile'}
        className="flex items-center gap-2 text-sm text-[#7c5cfc] hover:text-[#7c5cfc]/80 transition-colors group"
      >
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-[#1a1a2e] flex items-center justify-center group-hover:border-[#7c5cfc]/30 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="font-medium">{isSubPage ? 'Admin panel' : 'Nazad'}</span>
      </Link>
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0c0c14] border border-[#1a1a2e]">
        <ShieldCheck className="w-4 h-4 text-[#7c5cfc]" />
        <span className="text-xs font-semibold text-[#7c5cfc]/80 tracking-wide uppercase">Admin Panel</span>
      </div>
    </div>
  )
}
