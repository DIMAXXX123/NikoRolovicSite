'use client'

import { Link2, Smartphone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { KpiTile, Metric, SectionTitle } from '../../nastavnik/_components/widgets'
import { fmtNum, fmtPct, fmtSecs } from '../../direktor/_lib/direktor-client'
import { HeatmapGrid } from '../../direktor/_components/blocks'
import { AppPage } from '../_lib/app-client'

/** Uređaji: phones, PWA installs, eDnevnik connections, when people use the app. */
export default function AplikacijaUredjaji() {
  return (
    <AppPage>
      {(s) => {
        const D = s.devices
        const E = s.community.ednevnik
        return (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <KpiTile label="PWA na ekranu" value={fmtPct(D.pwa_share_pct, 0)} color="#CE82FF" info="Udio sesija iz instalirane aplikacije (dodato na početni ekran)." hint={`${fmtNum(D.installs, 0)} instalacija`} />
              <KpiTile label="eDnevnik povezan" value={fmtPct(E.connected_pct, 0)} color="#1CB0F6" info="Udio učenika koji su povezali svoj eDnevnik u aplikaciji." hint={`${fmtNum(E.connected, 0)} učenika`} />
              <KpiTile label="Sesija" value={fmtNum(D.sessions, 0)} info="Broj sesija u periodu." hint={`≈ ${fmtSecs(s.kpi.avg_session_s.value)} po sesiji`} />
              <KpiTile label="Ponuđeno instaliranje" value={fmtNum(D.install_prompts, 0)} color="#FF9600" info="Koliko puta je prikazan poziv za dodavanje na početni ekran." hint={D.install_prompts > 0 ? `${fmtPct((D.installs / D.install_prompts) * 100, 0)} prihvatilo` : undefined} />
            </div>

            <section className="space-y-2.5">
              <SectionTitle info="Sa kojih uređaja učenici ulaze.">Uređaji</SectionTitle>
              <Card className="gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#F3E3FF] text-accent-dark flex items-center justify-center flex-shrink-0"><Smartphone className="w-5 h-5" strokeWidth={2.6} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-extrabold text-heading">{D.os[0] ? `Najviše ${D.os[0].os} · ${fmtPct(D.os[0].share_pct, 0)}` : 'Nema podataka o uređajima'}</p>
                    <p className="text-[13px] font-bold text-muted-foreground">po broju sesija u periodu</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {D.os.map((o) => (
                    <div key={o.os} className="flex items-center gap-2 text-[13px] font-bold">
                      <span className="w-20 text-muted-foreground truncate">{o.os}</span>
                      <div className="flex-1 h-3 rounded-full bg-border overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${o.share_pct}%` }} /></div>
                      <span className="w-10 text-right tabular-nums text-heading">{fmtPct(o.share_pct, 0)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Koliko učenika je povezalo eDnevnik i koliko sinhronizacija prolazi dnevno. Povezani učenici hrane i panel Škola.">eDnevnik</SectionTitle>
              <Card className="gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#DDF4FF] text-secondary flex items-center justify-center flex-shrink-0"><Link2 className="w-5 h-5" strokeWidth={2.6} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] leading-[1.25] font-extrabold text-heading tabular-nums">{fmtNum(E.connected, 0)} povezano · {fmtPct(E.connected_pct, 0)}</p>
                    <p className="text-[13px] font-bold text-muted-foreground">{fmtNum(E.syncs_per_day, 1)} sinhronizacija dnevno</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <Metric label="Greške sinhronizacije" value={fmtNum(E.sync_errors, 0)} tone={E.sync_errors > 0 ? 'bad' : 'good'} />
                  <Metric label="Povezano (uređaji)" value={fmtNum(D.ednevnik_connected, 0)} />
                </div>
              </Card>
            </section>

            <section className="space-y-2.5">
              <SectionTitle info="Broj događaja po danu u sedmici i satu — kad se aplikacija koristi.">Kada koriste</SectionTitle>
              <Card><HeatmapGrid heatmap={s.heatmap} /></Card>
            </section>
          </>
        )
      }}
    </AppPage>
  )
}
