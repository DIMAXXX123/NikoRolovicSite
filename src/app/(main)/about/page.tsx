'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Phone, Mail, Clock, GraduationCap, BookOpen, Users, Building2, Globe } from 'lucide-react'
import { BetaDisclaimer } from '@/components/beta-disclaimer'

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
    <div className="space-y-6 animate-fade-in pb-8">
      <BetaDisclaimer />
      {/* Hero */}
      <div className="relative -mx-4 -mt-4 overflow-hidden rounded-b-3xl">
        <div className="relative h-56">
          <div className="w-full h-full bg-gradient-to-br from-purple-900/80 via-violet-800/60 to-indigo-900/80 flex items-center justify-center">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: 'var(--theme-primary, #a78bfa)' }}>
              <span className="text-4xl font-bold text-white">NR</span>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-white/70" />
              <span className="text-xs font-medium text-white/70 uppercase tracking-wider">O školi</span>
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight">
              Gimnazija<br />
              <span className="gradient-text">&quot;Niko Rolović&quot;</span>
            </h1>
            <p className="text-sm text-white/70 mt-1">Bar, Crna Gora</p>
          </div>
        </div>
      </div>

      {/* History */}
      <div
        ref={(el) => { sectionsRef.current[0] = el }}
        className="animate-on-scroll"
      >
        <Card className="border-border/30 bg-card/50 backdrop-blur overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Istorija</h2>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
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
          </CardContent>
        </Card>
      </div>

      {/* Programs */}
      <div
        ref={(el) => { sectionsRef.current[1] = el }}
        className="animate-on-scroll"
      >
        <Card className="border-border/30 bg-card/50 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Obrazovanje</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                <p className="text-sm font-medium">Opšta gimnazija</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sveobuhvatno opšte obrazovanje — priprema za sve univerzitetske smjerove. 
                  Matematika, jezici, nauke, istorija, informatika i mnogo više.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Školske aktivnosti:</p>
              <div className="flex flex-wrap gap-2">
                {['Međunarodni programi', 'Sportska takmičenja', 'Školski časopis', 'Naučni projekti', 'Kulturni eventi', 'Laboratorijske vježbe'].map((a) => (
                  <span key={a} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
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
            <Card key={stat.label} className="border-border/30 bg-card/50 backdrop-blur">
              <CardContent className="p-4 text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div
        ref={(el) => { sectionsRef.current[3] = el }}
        className="animate-on-scroll"
      >
        <Card className="border-border/30 bg-card/50 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Kontakt</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm">Ulica Mila Boškovića br. 1</p>
                  <p className="text-xs text-muted-foreground">85000 Bar, Crna Gora</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href="https://gimnazijabar.me" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  gimnazijabar.me
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm">Pon - Pet: 07:00 - 20:00</p>
                  <p className="text-xs text-muted-foreground">Sub: 08:00 - 14:00</p>
                </div>
              </div>
            </div>
          </CardContent>
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
