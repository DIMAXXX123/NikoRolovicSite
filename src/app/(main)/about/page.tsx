'use client'

import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, GraduationCap, BookOpen, Users, Building2, Globe } from 'lucide-react'
import { BetaDisclaimer } from '@/components/beta-disclaimer'

const H2_CLASS = 'text-[20px] leading-[1.25] font-extrabold text-heading'
const BODY_CLASS = 'text-[15px] leading-[1.5] font-bold text-foreground'
const META_CLASS = 'text-[13px] leading-[1.4] font-bold text-muted-foreground'
const ICON_CIRCLE_CLASS = 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0'

export default function AboutPage() {
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    sectionsRef.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <BetaDisclaimer />
      {/* Hero */}
      <Card className="items-center text-center p-6 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-primary shadow-[0_4px_0_var(--color-primary-dark)] flex items-center justify-center">
          <span className="text-[24px] font-black text-primary-foreground">NR</span>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <GraduationCap className="w-4 h-4 text-muted-foreground" strokeWidth={2.4} />
            <span className="text-[12px] leading-none font-extrabold text-muted-foreground uppercase tracking-[0.04em]">O školi</span>
          </div>
          <h1 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] text-heading">
            Gimnazija<br />
            <span className="text-primary-text">&quot;Niko Rolović&quot;</span>
          </h1>
          <p className={`${META_CLASS} mt-1`}>Bar, Crna Gora</p>
        </div>
      </Card>

      {/* History */}
      <div
        ref={(el) => { sectionsRef.current[0] = el }}
        className="animate-on-scroll"
      >
        <Card className="gap-3">
          <div className="flex items-center gap-3">
            <div className={`${ICON_CIRCLE_CLASS} bg-secondary-light text-secondary`}>
              <Building2 className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <h2 className={H2_CLASS}>Istorija</h2>
          </div>
          <div className={`space-y-3 ${BODY_CLASS}`}>
            <p>
              Gimnazija &quot;Niko Rolović&quot; je jedna od najpoznatijih i najprestižnijih srednjih škola u Baru, Crna Gora.
              Škola nosi ime po narodnom heroju Niku Roloviću, bivšem učeniku gimnazije, u čiju je čast škola preimenovana školske 1956/57. godine.
            </p>
            <p>
              Nova školska zgrada na Topolici počela je sa radom 24. novembra 1972. godine.
              Škola se nalazi na adresi Ulica Mila Boškovića br. 1 i predstavlja jednu od najvažnijih obrazovnih institucija na crnogorskom primorju.
            </p>
            <p>
              Osnovno usmjerenje je opšta gimnazija koja priprema učenike za upis na univerzitet.
              Škola je poznata po visokom kvalitetu nastave, a svake godine se za prvi razred podnese više prijava nego što ima slobodnih mjesta.
            </p>
          </div>
        </Card>
      </div>

      {/* Programs */}
      <div
        ref={(el) => { sectionsRef.current[1] = el }}
        className="animate-on-scroll"
      >
        <Card className="gap-3">
          <div className="flex items-center gap-3">
            <div className={`${ICON_CIRCLE_CLASS} bg-primary-light text-primary-text`}>
              <BookOpen className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <h2 className={H2_CLASS}>Obrazovanje</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 rounded-2xl bg-muted border-2 border-border">
              <p className="text-[17px] leading-[1.3] font-extrabold text-heading">Opšta gimnazija</p>
              <p className={`${META_CLASS} mt-1`}>
                Sveobuhvatno opšte obrazovanje — priprema za sve univerzitetske smjerove.
                Matematika, jezici, nauke, istorija, informatika i mnogo više.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[17px] leading-[1.3] font-extrabold text-heading">Školske aktivnosti:</p>
            <div className="flex flex-wrap gap-2">
              {['Međunarodni programi', 'Sportska takmičenja', 'Školski časopis', 'Naučni projekti', 'Kulturni eventi', 'Laboratorijske vježbe'].map((a) => (
                <span key={a} className="inline-flex items-center h-10 px-3.5 rounded-xl border-2 border-secondary-light-border bg-secondary-light text-secondary text-[12px] font-extrabold uppercase tracking-[0.04em] shadow-[0_2px_0_var(--color-secondary-light-border)]">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div
        ref={(el) => { sectionsRef.current[2] = el }}
        className="animate-on-scroll"
      >
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Razreda', value: 'I-IV' },
            { icon: GraduationCap, label: 'Odjeljenja', value: '6' },
            { icon: BookOpen, label: 'Predmeta', value: '20+' },
          ].map((stat) => (
            <Card key={stat.label} className="items-center text-center gap-1.5 p-4">
              <stat.icon className="w-6 h-6 text-secondary" strokeWidth={2.4} />
              <p className="text-[20px] leading-none font-black tabular-nums text-heading">{stat.value}</p>
              <p className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div
        ref={(el) => { sectionsRef.current[3] = el }}
        className="animate-on-scroll"
      >
        <Card className="gap-4">
          <div className="flex items-center gap-3">
            <div className={`${ICON_CIRCLE_CLASS} bg-[#FFDFE0] text-destructive`}>
              <MapPin className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <h2 className={H2_CLASS}>Kontakt</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" strokeWidth={2.4} />
              <div>
                <p className={BODY_CLASS}>Ulica Mila Boškovića br. 1</p>
                <p className={META_CLASS}>85000 Bar, Crna Gora</p>
              </div>
            </div>
            <div className="flex items-center gap-3 min-h-11">
              <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={2.4} />
              <a href="https://gimnazijabar.me" target="_blank" rel="noopener noreferrer" className="text-[15px] font-extrabold text-secondary underline-offset-4 hover:underline py-2.5">
                gimnazijabar.me
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={2.4} />
              <div>
                <p className={BODY_CLASS}>Pon - Pet: 07:00 - 20:00</p>
                <p className={META_CLASS}>Sub: 08:00 - 14:00</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <style jsx>{`
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.4s ease-out, transform 0.4s ease-out;
        }
        .animate-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  )
}
