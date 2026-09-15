'use client'

import { BarChart3, BookOpen, ClipboardPen, MessageSquareWarning, Users } from 'lucide-react'
import { SKOLA_ROLES } from '@/lib/roles'
import { SKOLA_PERIODS, type SkolaPeriod } from '@/lib/skola-types'
import { PanelShell, type PanelTab } from '../_shared/panel-shell'
import { SKOLA_PERIOD_LABELS } from './_lib/skola-client'

const TABS: PanelTab[] = [
  { href: '/skola', label: 'Ocjene', Icon: BarChart3, exact: true },
  { href: '/skola/ucenje', label: 'Učenje', Icon: BookOpen },
  { href: '/skola/odjeljenja', label: 'Odjeljenja', Icon: Users },
  { href: '/skola/ponasanje', label: 'Ponašanje', Icon: MessageSquareWarning },
  { href: '/skola/unos', label: 'Unos', Icon: ClipboardPen },
]

export default function SkolaLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelShell<SkolaPeriod>
      title="Škola"
      eyebrow="Ocjene · izostanci · ponašanje"
      roles={SKOLA_ROLES}
      deniedText="Pristup imaju direktor, pedagog i razredne starješine."
      tabs={TABS}
      periods={SKOLA_PERIODS}
      periodLabels={SKOLA_PERIOD_LABELS}
      defaultPeriod="year"
      storageKey="skola_period"
      accent={{ text: 'text-[#3E8A00]', bg: 'bg-[#E6FAD2]', border: 'border-[#B8F28B]' }}
    >
      {children}
    </PanelShell>
  )
}
