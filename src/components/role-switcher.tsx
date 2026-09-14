'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { GraduationCap, Presentation, LayoutDashboard, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, DEMO_ROLE_KEY, readDemoRole, roleFromEmail, type DemoRole } from '@/lib/demo-accounts'
import { haptic } from '@/lib/haptics'

const ICONS: Record<DemoRole, typeof GraduationCap> = {
  ucenik: GraduationCap,
  nastavnik: Presentation,
  direktor: LayoutDashboard,
}

const TINT: Record<DemoRole, { bg: string; border: string; text: string; edge: string }> = {
  ucenik: { bg: '#DDF4FF', border: '#84D8FF', text: '#1899D6', edge: '#84D8FF' },
  nastavnik: { bg: '#D7FFB8', border: '#B5EE8A', text: '#58A700', edge: '#B5EE8A' },
  direktor: { bg: '#FFF4C4', border: '#FFE28A', text: '#C79000', edge: '#FFE28A' },
}

/**
 * Switches the whole app between the three demo experiences (učenik / nastavnik /
 * direktor): signs out, signs into the matching demo account, remembers the choice
 * and lands on that role's home — behind a full-screen transition.
 */
export function RoleSwitcher() {
  const [current, setCurrent] = useState<DemoRole>('ucenik')
  const [switching, setSwitching] = useState<DemoRole | null>(null)
  const [phase, setPhase] = useState<'in' | 'done'>('in')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const fromEmail = roleFromEmail(session?.user.email)
      if (!cancelled) setCurrent(fromEmail ?? readDemoRole())
    })()
    return () => { cancelled = true }
  }, [])

  async function switchTo(role: DemoRole) {
    if (switching || role === current) return
    haptic(12)
    setSwitching(role)
    setPhase('in')
    try { localStorage.setItem(DEMO_ROLE_KEY, role) } catch {}
    const supabase = createClient()
    const started = Date.now()
    await supabase.auth.signOut({ scope: 'local' })
    const { error } = await supabase.auth.signInWithPassword({ email: DEMO_ACCOUNTS[role].email, password: DEMO_PASSWORD })
    // Keep the animation on screen for at least 900 ms so it reads as a transition, not a flash.
    const wait = Math.max(0, 900 - (Date.now() - started))
    await new Promise((r) => setTimeout(r, wait))
    if (error) {
      setSwitching(null)
      return
    }
    setPhase('done')
    haptic(20)
    await new Promise((r) => setTimeout(r, 450))
    window.location.href = DEMO_ACCOUNTS[role].home
  }

  return (
    <section aria-label="Promijeni ulogu" className="rounded-2xl border-2 border-border bg-card shadow-[0_2px_0_var(--color-border)] p-4 space-y-3">
      <div>
        <p className="text-[12px] leading-none text-muted-foreground font-extrabold uppercase tracking-[0.04em]">Isprobaj kao</p>
        <p className="mt-1.5 text-[13px] leading-[1.4] font-bold text-muted-foreground">Prebaci cijelu aplikaciju na iskustvo učenika, nastavnika ili direktora.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map((role) => {
          const Icon = ICONS[role]
          const t = TINT[role]
          const active = role === current
          return (
            <button
              key={role}
              type="button"
              onClick={() => switchTo(role)}
              aria-pressed={active}
              disabled={!!switching}
              className="min-h-[92px] rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-center transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-70"
              style={
                active
                  ? { background: t.bg, borderColor: t.border, color: t.text, boxShadow: `0 4px 0 ${t.edge}` }
                  : { background: '#FFFFFF', borderColor: '#E5E5E5', color: '#777777', boxShadow: '0 4px 0 #E5E5E5' }
              }
            >
              <span className="relative">
                <Icon className="w-7 h-7" strokeWidth={2.4} />
                {active && (
                  <span className="absolute -top-1.5 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em]">{DEMO_ACCOUNTS[role].label}</span>
            </button>
          )
        })}
      </div>
      <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">
        {DEMO_ACCOUNTS[current].label}: {DEMO_ACCOUNTS[current].description}
      </p>

      {switching && typeof document !== 'undefined' && createPortal(
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.92)' }}
        >
          <span
            className="absolute rounded-full"
            style={{
              width: 60,
              height: 60,
              background: TINT[switching].bg,
              border: `3px solid ${TINT[switching].border}`,
              animation: 'roleRipple 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            }}
          />
          <div className="relative flex flex-col items-center gap-3" style={{ animation: 'roleCardIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
            <span
              className="w-24 h-24 rounded-full border-2 flex items-center justify-center bg-card"
              style={{ borderColor: TINT[switching].border, color: TINT[switching].text, boxShadow: `0 6px 0 ${TINT[switching].edge}` }}
            >
              {phase === 'done'
                ? <Check className="w-12 h-12" strokeWidth={3} />
                : (() => { const Icon = ICONS[switching]; return <Icon className="w-12 h-12" strokeWidth={2.4} /> })()}
            </span>
            <p className="text-[20px] leading-[1.25] font-extrabold text-heading">{DEMO_ACCOUNTS[switching].label}</p>
            <p className="flex items-center gap-2 text-[13px] font-bold text-muted-foreground">
              {phase === 'done' ? 'Spremno' : <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.6} /> Prebacujem nalog…</>}
            </p>
          </div>
          <style>{`
            @keyframes roleRipple { from { transform: scale(1); opacity: .9 } to { transform: scale(40); opacity: 0 } }
            @keyframes roleCardIn { from { transform: scale(.6); opacity: 0 } to { transform: scale(1); opacity: 1 } }
          `}</style>
        </div>,
        document.body
      )}
    </section>
  )
}
