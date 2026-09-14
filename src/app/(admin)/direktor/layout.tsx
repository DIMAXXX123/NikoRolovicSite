import { redirect } from 'next/navigation'
import { DIREKTOR_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { DEMO_AUTO_ADMIN } from '@/lib/demo'
import { DirektorShell } from './_components/shell'
import { AutoLoginWait } from './_components/auto-login-wait'

export const dynamic = 'force-dynamic'

/**
 * /direktor — server-side role gate (spec §2.3: roles are checked on the
 * server, never only in the UI). direktor / admin / creator / pedagog get the
 * panel; everyone else is sent back to Još with a notice.
 */
export default async function DirektorLayout({ children }: { children: React.ReactNode }) {
  const caller = await getCallerProfile()

  if (!caller) {
    // Demo mode: <AutoLogin /> in the root layout signs the visitor in and
    // reloads the page — show a spinner instead of bouncing to /login.
    if (DEMO_AUTO_ADMIN) return <AutoLoginWait />
    redirect('/login')
  }

  if (!hasRole(caller, DIREKTOR_ROLES)) redirect('/profile?panel=denied')

  return <DirektorShell>{children}</DirektorShell>
}
