'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Phone, Mail, Clock, GraduationCap, BookOpen, Users, Building2 } from 'lucide-react'

const galleryImages = [
  { src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop', alt: 'Učionica' },
  { src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop', alt: 'Školski hodnik' },
  { src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=400&fit=crop', alt: 'Biblioteka' },
  { src: 'https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=600&h=400&fit=crop', alt: 'Sportska sala' },
]

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null)
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
      {/* Hero */}
      <div ref={heroRef} className="relative -mx-4 -mt-4 overflow-hidden rounded-b-3xl">
        <div className="relative h-56">
          <img
            src="https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=800&h=500&fit=crop"
            alt="Gimnazija Niko Rolović"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--theme-primary, #a78bfa)' }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-white/70 uppercase tracking-wider">O školi</span>
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight">
              Gimnazija<br />
              <span className="gradient-text">&quot;Niko Rolović&quot;</span>
            </h1>
            <p className="text-sm text-white/70 mt-1">Podgorica, Crna Gora</p>
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
                Gimnazija &quot;Niko Rolović&quot; je jedna od najpoznatijih srednjih škola u Podgorici, Crna Gora.
                Škola nosi ime po Niku Roloviću, jugoslovenskom ambasadoru u Švedskoj koji je tragično stradao 1971. godine.
              </p>
              <p>
                Osnovana kao opšta gimnazija, škola ima dugu tradiciju obrazovanja i vaspitanja mladih generacija.
                Kroz decenije svog postojanja, škola je iznjela mnogo uspješnih đaka koji su nastavili karijere u
                nauci, umjetnosti, sportu i drugim oblastima.
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
              <h2 className="text-lg font-semibold">Programi</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Opšti smjer', desc: 'Sveobuhvatno obrazovanje' },
                { title: 'Prirodno-matematički', desc: 'Matematika, fizika, hemija' },
                { title: 'Društveno-jezički', desc: 'Jezici, istorija, sociologija' },
                { title: 'Informatički', desc: 'IT, programiranje, digitalne vještine' },
              ].map((prog) => (
                <div
                  key={prog.title}
                  className="p-3 rounded-xl bg-muted/30 border border-border/20 hover:border-primary/30 transition-colors"
                >
                  <p className="text-sm font-medium">{prog.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{prog.desc}</p>
                </div>
              ))}
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
            { icon: Users, label: 'Učenika', value: '800+' },
            { icon: GraduationCap, label: 'Profesora', value: '60+' },
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

      {/* Photo Gallery */}
      <div
        ref={(el) => { sectionsRef.current[3] = el }}
        className="animate-on-scroll"
      >
        <h2 className="text-lg font-semibold mb-3">Galerija</h2>
        <div className="grid grid-cols-2 gap-3">
          {galleryImages.map((img, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 h-44' : 'h-32'}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-2 left-3 text-xs font-medium text-white">{img.alt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div
        ref={(el) => { sectionsRef.current[4] = el }}
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
                  <p className="text-sm">Bulevar Svetog Petra Cetinjskog</p>
                  <p className="text-xs text-muted-foreground">81000 Podgorica, Crna Gora</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm">+382 20 234 567</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm">info@nikorolovic.me</p>
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
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .animate-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  )
}
