'use client'

import { Newspaper, Smartphone, Users } from 'lucide-react'
import { APLIKACIJA_ROLES } from '@/lib/roles'
import { DIREKTOR_PERIODS, type DirektorPeriod } from '@/lib/direktor-types'
import { PanelShell, type PanelTab } from '../_shared/panel-shell'
import { PERIOD_LABELS } from '../direktor/_lib/direktor-client'

const TABS: PanelTab[] = [
  { href: '/aplikacija', label: 'Publika', Icon: Users, exact: true },
  { href: '/aplikacija/sadrzaj', label: 'Sadržaj', Icon: Newspaper },
  { href: '/aplikacija/uredjaji', label: 'Uređaji', Icon: Smartphone },
]

export default function AplikacijaLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelShell<DirektorPeriod>
      title="Aplikacija"
      eyebrow="Ko i kako koristi aplikaciju"
      roles={APLIKACIJA_ROLES}
      deniedText="Pristup imaju direktor i administratori."
      tabs={TABS}
      periods={DIREKTOR_PERIODS}
      periodLabels={PERIOD_LABELS}
      defaultPeriod="7d"
      storageKey="aplikacija_period"
      accent={{ text: 'text-secondary', bg: 'bg-[#DDF4FF]', border: 'border-[#84D8FF]' }}
    >
      {children}
    </PanelShell>
  )
}
