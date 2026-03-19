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
          <div className="w-full h-full bg-gradient-to-br from-[#7c5cfc]/40 via-[#5b3fd9]/30 to-[#3b82f6]/20 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.4), rgba(91,63,217,0.3), rgba(59,130,246,0.2))' }}>
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c5cfc, #5b3fd9)' }}>
              <span className="text-4xl font-bold text-white">NR</span>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/30 to-transparent" />
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
        <div className="rounded-2xl bg-[#0c0c14] border border-[#1a1a2e] overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-[#7c5cfc]" />
              <h2 className="text-lg font-semibold text-[#e8e8f0]">Istorija</h2>
            </div>
            <div className="space-y-3 text-sm text-[#6b6b80] leading-relaxed">
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
          </div>
        </div>
      </div>

      {/* Programs */}
      <div
        ref={(el) => { sectionsRef.current[1] = el }}
        className="animate-on-scroll"
      >
        <div className="rounded-2xl bg-[#0c0c14] border border-[#1a1a2e]">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-[#7c5cfc]" />
              <h2 className="text-lg font-semibold text-[#e8e8f0]">Obrazovanje</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-[#1a1a2e]">
                <p className="text-sm font-medium text-[#e8e8f0]">Opšta gimnazija</p>
                <p className="text-xs text-[#6b6b80] mt-0.5">
                  Sveobuhvatno opšte obrazovanje — priprema za sve univerzitetske smjerove.
                  Matematika, jezici, nauke, istorija, informatika i mnogo više.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-[#e8e8f0]">Školske aktivnosti:</p>
              <div className="flex flex-wrap gap-2">
                {['Međunarodni programi', 'Sportska takmičenja', 'Školski časopis', 'Naučni projekti', 'Kulturni eventi', 'Laboratorijske vježbe'].map((a) => (
                  <span key={a} className="text-xs px-2.5 py-1 rounded-full bg-[#7c5cfc]/10 text-[#7c5cfc] border border-[#7c5cfc]/20">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
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
            <div key={stat.label} className="rounded-2xl bg-[#0c0c14] border border-[#1a1a2e]">
              <div className="p-4 text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-[#7c5cfc]" />
                <p className="text-xl font-bold text-[#e8e8f0]">{stat.value}</p>
                <p className="text-xs text-[#6b6b80]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div
        ref={(el) => { sectionsRef.current[3] = el }}
        className="animate-on-scroll"
      >
        <div className="rounded-2xl bg-[#0c0c14] border border-[#1a1a2e]">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#7c5cfc]" />
              <h2 className="text-lg font-semibold text-[#e8e8f0]">Kontakt</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#6b6b80] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#e8e8f0]">Ulica Mila Boškovića br. 1</p>
                  <p className="text-xs text-[#6b6b80]">85000 Bar, Crna Gora</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-[#6b6b80] flex-shrink-0" />
                <a href="https://gimnazijabar.me" target="_blank" rel="noopener noreferrer" className="text-sm text-[#7c5cfc] hover:underline">
                  gimnazijabar.me
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#6b6b80] flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#e8e8f0]">Pon - Pet: 07:00 - 20:00</p>
                  <p className="text-xs text-[#6b6b80]">Sub: 08:00 - 14:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
