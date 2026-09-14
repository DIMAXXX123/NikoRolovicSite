'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Shown while the demo auto-login (root layout) creates a session and reloads.
 * If nothing happens within a few seconds the visitor gets a way out.
 */
export function AutoLoginWait() {
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setStuck(true), 6000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4">
      <div className="w-8 h-8 border-[3px] border-border border-t-primary rounded-full animate-spin" />
      <p className="text-[13px] font-bold text-muted-foreground">Prijava u toku…</p>
      {stuck && (
        <Link href="/login" className="text-[15px] font-extrabold text-secondary min-h-[44px] inline-flex items-center">
          Prijavi se
        </Link>
      )}
    </div>
  )
}
