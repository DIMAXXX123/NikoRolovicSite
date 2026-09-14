'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, UserPlus, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const slides = [
  {
    title: 'Gimnazija Niko Rolović',
    subtitle: 'Studentski Portal',
    description: 'Tvoj digitalni školski prostor — lekcije, novosti, galerija i zajednica na jednom mjestu.',
    illustration: 'logo' as const,
    accent: '#58CC02',
    accentAlt: '#46A302',
  },
  {
    title: 'O školi',
    subtitle: 'Tradicija i kvalitet',
    description: 'Jedna od najprestižnijih gimnazija u Baru, Crna Gora. Osnovana u čast narodnog heroja Nika Rolovića. Bogata istorija, izvrsni profesori i generacije uspješnih učenika.',
    illustration: 'school' as const,
    accent: '#1CB0F6',
    accentAlt: '#1899D6',
  },
  {
    title: 'Dumbs',
    subtitle: 'Školska galerija',
    description: 'Dijeli slike iz školskog života! Moderacija sadržaja, anonimni mod i like sistem.',
    illustration: 'photos' as const,
    accent: '#FF86D0',
    accentAlt: '#EA2B2B',
  },
  {
    title: 'Novosti',
    subtitle: 'Školski feed',
    description: 'Budi u toku sa svim dešavanjima, obavještenjima i lajkuj objave koje ti se sviđaju.',
    illustration: 'news' as const,
    accent: '#1CB0F6',
    accentAlt: '#1899D6',
  },
  {
    title: 'Kalendar',
    subtitle: 'Testovi & ispiti',
    description: 'Testovi, kontrolni, rokovi — sve označeno bojama. Nikad više zaboravljenih ispita!',
    illustration: 'calendar' as const,
    accent: '#58CC02',
    accentAlt: '#46A302',
  },
  {
    title: 'Lekcije',
    subtitle: 'Materijali po predmetima',
    description: 'Svi predmeti na jednom mjestu. Materijali organizovani po predmetima, spremni za učenje.',
    illustration: 'lectures' as const,
    accent: '#FFC800',
    accentAlt: '#C79000',
  },
  {
    title: 'Kvizovi',
    subtitle: 'Testiraj znanje',
    description: 'Poslije svake lekcije provjeri šta si naučio — flashcard kvizovi, bodovi i statistika.',
    illustration: 'quizzes' as const,
    accent: '#FF9600',
    accentAlt: '#E5A800',
  },
  {
    title: 'Raspored',
    subtitle: 'Časovi & smjene',
    description: 'Sedmični i dnevni pregled rasporeda. Uvijek znaj koji čas je sljedeći.',
    illustration: 'schedule' as const,
    accent: '#1CB0F6',
    accentAlt: '#1899D6',
  },
  {
    title: 'Moje Ocjene',
    subtitle: 'Praćenje uspjeha',
    description: 'Prati ocjene iz svih predmeta po trimestrima. Prosek, napredak i statistika na jednom mjestu.',
    illustration: 'grades' as const,
    accent: '#FF4B4B',
    accentAlt: '#EA2B2B',
  },
  {
    title: 'Tvoj Profil',
    subtitle: 'Personalizacija',
    description: 'Biraj teme, prilagodi izgled, postavi avatar. Pridruži se zajednici!',
    illustration: 'profile' as const,
    accent: '#CE82FF',
    accentAlt: '#A560E8',
  },
]

/** 18% tint of a palette colour over white (§2 subject-circle rule). */
const tint = (c: string) => `${c}2E`

const miniCard = 'rounded-2xl border-2 border-border bg-background shadow-[0_2px_0_var(--color-border)]'

function Illustration({ type, accent, accentAlt }: { type: string; accent: string; accentAlt: string }) {
  switch (type) {
    case 'logo':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div
            className="absolute w-44 h-44 rounded-full animate-[spin_20s_linear_infinite]"
            style={{ border: `2px dashed ${accent}55` }}
          />
          <div
            className="absolute w-36 h-36 rounded-full animate-[spin_15s_linear_infinite_reverse]"
            style={{ border: `2px solid ${accent}33` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full" style={{ background: accentAlt }} />
          </div>
          <div
            className="w-28 h-28 rounded-3xl flex items-center justify-center relative"
            style={{ background: accent, boxShadow: `0 4px 0 ${accentAlt}` }}
          >
            <span className="text-5xl font-black text-white tracking-tight relative z-10">NR</span>
          </div>
          <div className="absolute -top-2 right-6 w-4 h-4 rounded-full animate-float" style={{ background: accent, animationDelay: '0.3s' }} />
          <div className="absolute bottom-4 left-4 w-3 h-3 rounded-md rotate-45 animate-float" style={{ background: accentAlt, animationDelay: '1s' }} />
        </div>
      )

    case 'school':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          {/* School building */}
          <div className="relative">
            <div className={`w-40 h-28 flex flex-col items-center justify-center gap-1 animate-slide-up ${miniCard}`}>
              <span className="text-5xl">🏫</span>
              <span className="text-[10px] font-extrabold tracking-wider uppercase" style={{ color: accentAlt }}>EST. 1921</span>
            </div>
            {/* Diploma */}
            <div className="absolute -top-3 -right-4 animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2 border-border" style={{ background: tint(accentAlt) }}>
                <span className="text-xl">🎓</span>
              </div>
            </div>
            {/* Book */}
            <div className="absolute -bottom-3 -left-4 animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2 border-border" style={{ background: tint(accent) }}>
                <span className="text-xl">📚</span>
              </div>
            </div>
            {/* Star */}
            <div className="absolute -top-3 -left-2 animate-float" style={{ animationDelay: '0.2s' }}>
              <span className="text-lg">⭐</span>
            </div>
            <div className="absolute -bottom-2 -right-2 animate-float" style={{ animationDelay: '0.8s' }}>
              <span className="text-lg">🇲🇪</span>
            </div>
          </div>
        </div>
      )

    case 'photos':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="relative w-56 h-36">
            {[
              { rotate: '-12deg', x: '-10px', delay: '0s', emoji: '📸', label: 'Slika' },
              { rotate: '0deg', x: '0px', delay: '0.2s', emoji: '🙈', label: 'Anon' },
              { rotate: '10deg', x: '10px', delay: '0.4s', emoji: '❤️', label: 'Like' },
            ].map((card, i) => (
              <div
                key={i}
                className={`absolute inset-0 animate-slide-up flex flex-col items-center justify-center gap-2 ${miniCard}`}
                style={{
                  transform: `rotate(${card.rotate}) translateX(${card.x})`,
                  animationDelay: card.delay,
                  zIndex: 3 - i,
                }}
              >
                <span className="text-4xl">{card.emoji}</span>
                <span className="text-xs font-extrabold text-muted-foreground">{card.label}</span>
              </div>
            ))}
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-xl flex items-center justify-center animate-scale-in border-2 border-border" style={{ background: tint(accentAlt), animationDelay: '0.6s' }}>
            <span className="text-lg">🛡️</span>
          </div>
        </div>
      )

    case 'news':
      return (
        <div className="flex flex-col gap-2.5 w-64">
          {[
            { icon: '📢', title: 'Nova obavještenja', tag: 'NOVO' },
            { icon: '🏆', title: 'Rezultati takmičenja', tag: '' },
            { icon: '📝', title: 'Raspored za nedelju', tag: '' },
          ].map((item, i) => (
            <div
              key={i}
              className={`p-3 flex items-center gap-3 animate-slide-up ${miniCard}`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(accent) }}>
                <span className="text-xl">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold text-foreground truncate">{item.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-1.5 rounded-full flex-1 bg-border" />
                  {item.tag && (
                    <Badge variant="destructive" className="h-5 px-2 text-[9px]">
                      {item.tag}
                    </Badge>
                  )}
                </div>
              </div>
              <span className="text-xs font-bold text-muted-foreground">❤️ 12</span>
            </div>
          ))}
        </div>
      )

    case 'calendar': {
      const kinds = {
        test: { dot: '#FF4B4B', text: '#EA2B2B' },
        exam: { dot: '#FFC800', text: '#C79000' },
        event: { dot: '#1CB0F6', text: '#1899D6' },
      }
      return (
        <div className="w-60">
          <div className="text-center mb-2">
            <span className="text-xs font-extrabold" style={{ color: accentAlt }}>Mart 2026</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['P', 'U', 'S', 'Č', 'P', 'S', 'N'].map((d, i) => (
              <div key={`${d}-${i}`} className="w-7 h-5 flex items-center justify-center text-[9px] text-disabled font-extrabold">{d}</div>
            ))}
            {Array.from({ length: 28 }, (_, i) => {
              const day = i + 1
              const isTest = [5, 12, 19].includes(day)
              const isExam = [8, 22].includes(day)
              const isEvent = [15, 25].includes(day)
              const kind = isTest ? kinds.test : isExam ? kinds.exam : isEvent ? kinds.event : null
              return (
                <div
                  key={i}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold animate-scale-in relative border-2"
                  style={{
                    background: kind ? tint(kind.dot) : '#F7F7F7',
                    borderColor: kind ? kind.dot : '#E5E5E5',
                    color: kind ? kind.text : '#777777',
                    animationDelay: `${i * 0.02}s`,
                  }}
                >
                  {day}
                  {kind && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: kind.dot }} />}
                </div>
              )
            })}
          </div>
          <div className="flex justify-center gap-3 mt-2.5">
            {[[kinds.test.dot, 'Test'], [kinds.exam.dot, 'Ispit'], [kinds.event.dot, 'Event']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span className="text-[9px] font-bold text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'lectures':
      return (
        <div className="grid grid-cols-3 gap-2 w-64">
          {[
            { emoji: '🔢', name: 'Matem.' },
            { emoji: '⚛️', name: 'Fizika' },
            { emoji: '🏛️', name: 'Istorija' },
            { emoji: '🧬', name: 'Biolog.' },
            { emoji: '🌍', name: 'Geograf.' },
            { emoji: '🇬🇧', name: 'Engleski' },
            { emoji: '💻', name: 'Inform.' },
            { emoji: '🎨', name: 'Likovno' },
            { emoji: '📖', name: 'Crnog.' },
          ].map((subj, i) => (
            <div
              key={subj.name}
              className={`p-2 flex flex-col items-center gap-1.5 animate-scale-in ${miniCard} rounded-xl`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: tint(accent) }}>
                <span className="text-lg">{subj.emoji}</span>
              </div>
              <span className="text-[9px] font-extrabold text-muted-foreground">{subj.name}</span>
            </div>
          ))}
        </div>
      )

    case 'quizzes':
      return (
        <div className="relative flex flex-col items-center gap-3 w-60">
          {/* Flashcard stack */}
          <div className="relative w-52 h-28">
            <div
              className="absolute inset-0 rounded-2xl border-2 border-border bg-muted animate-slide-up"
              style={{
                transform: 'rotate(-4deg) translateY(4px)',
                animationDelay: '0s',
              }}
            />
            <div
              className={`absolute inset-0 animate-slide-up flex flex-col items-center justify-center gap-1 ${miniCard}`}
              style={{ animationDelay: '0.15s' }}
            >
              <span className="text-2xl">🧠</span>
              <span className="text-sm font-extrabold text-foreground">Koliko je 2+2?</span>
              <Badge className="mt-1 h-5 text-[9px]" style={{ background: tint(accent), borderColor: accent, color: accentAlt }}>
                Tap za odgovor
              </Badge>
            </div>
          </div>
          {/* Score */}
          <div className="flex gap-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {['✅ 8', '❌ 2', '⭐ 80%'].map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-lg font-extrabold border-2 border-border bg-muted text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
      )

    case 'schedule':
      return (
        <div className="w-60">
          <div className="flex gap-1 mb-2 justify-center">
            {['Pon', 'Uto', 'Sri', 'Čet', 'Pet'].map((d, i) => (
              <div
                key={d}
                className="px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase animate-scale-in border-2"
                style={{
                  background: i === 0 ? tint(accent) : '#FFFFFF',
                  color: i === 0 ? accentAlt : '#777777',
                  borderColor: i === 0 ? accent : '#E5E5E5',
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {[
              { time: '08:00', name: 'Matematika', room: 'U1', emoji: '🔢' },
              { time: '08:45', name: 'Fizika', room: 'U3', emoji: '⚛️' },
              { time: '09:30', name: 'Engleski', room: 'U7', emoji: '🇬🇧' },
              { time: '10:25', name: 'Istorija', room: 'U2', emoji: '🏛️' },
            ].map((cls, i) => (
              <div
                key={cls.name}
                className={`p-2 flex items-center gap-2.5 animate-slide-up ${miniCard} rounded-xl`}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <span className="text-base">{cls.emoji}</span>
                <div className="flex-1">
                  <div className="text-[11px] font-extrabold text-foreground">{cls.name}</div>
                  <div className="text-[9px] font-bold text-muted-foreground">{cls.time} · {cls.room}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'grades':
      return (
        <div className="w-56">
          <div className="flex gap-1.5 mb-2.5 justify-center">
            {['I', 'II', 'III'].map((t, i) => (
              <div
                key={t}
                className="px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase animate-scale-in border-2"
                style={{
                  background: i === 0 ? tint(accent) : '#FFFFFF',
                  color: i === 0 ? accentAlt : '#777777',
                  borderColor: i === 0 ? accent : '#E5E5E5',
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                {t} Trim.
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {[
              { name: 'Matematika', grade: 5, emoji: '🔢' },
              { name: 'Fizika', grade: 4, emoji: '⚛️' },
              { name: 'Engleski', grade: 5, emoji: '🇬🇧' },
              { name: 'Istorija', grade: 3, emoji: '🏛️' },
            ].map((subj, i) => (
              <div
                key={subj.name}
                className={`p-2 flex items-center gap-2.5 animate-slide-up ${miniCard} rounded-xl`}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <span className="text-base">{subj.emoji}</span>
                <div className="flex-1">
                  <div className="text-[11px] font-extrabold text-foreground">{subj.name}</div>
                </div>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2"
                  style={{ background: tint(accent), color: accentAlt, borderColor: accent }}
                >
                  {subj.grade}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Badge style={{ background: tint(accent), borderColor: accent, color: accentAlt }}>
              Prosek: 4.25
            </Badge>
          </div>
        </div>
      )

    case 'profile':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center animate-float relative border-2"
            style={{ background: tint(accent), borderColor: accent }}
          >
            <span className="text-4xl">👤</span>
            <Badge className="absolute -bottom-1 -right-1 h-5 px-2 text-[9px]" style={{ background: tint(accent), borderColor: accent, color: accentAlt }}>
              Učenik
            </Badge>
          </div>
          {['#CE82FF', '#FF86D0', '#58CC02', '#FFC800', '#1CB0F6'].map((c, i) => {
            const angle = (i * 72 - 90) * (Math.PI / 180)
            const x = Math.cos(angle) * 64
            const y = Math.sin(angle) * 64
            return (
              <div
                key={c}
                className="absolute w-6 h-6 rounded-full animate-scale-in flex items-center justify-center border-2"
                style={{
                  background: tint(c),
                  borderColor: c,
                  left: `calc(50% + ${x}px - 12px)`,
                  top: `calc(50% + ${y}px - 12px)`,
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              </div>
            )
          })}
          <div className="absolute -bottom-6 flex gap-3">
            {[['🎨', 'Teme'], ['⭐', 'Avatar'], ['📊', 'Stats']].map(([emoji, label], i) => (
              <div key={label} className="flex items-center gap-1 px-2 py-1 rounded-lg animate-fade-in text-[10px] font-extrabold border-2 border-border bg-background text-muted-foreground" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <span>{emoji}</span>{label}
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}

export function SiteTour({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [paused, setPaused] = useState(false)
  const [textVisible, setTextVisible] = useState(false)

  const goTo = useCallback((index: number) => {
    if (index === current || index < 0 || index >= slides.length) return
    setDirection('out')
    setTextVisible(false)
    setTimeout(() => {
      setCurrent(index)
      setDirection('in')
      // Text animates in after slide transition completes
      setTimeout(() => setTextVisible(true), 800)
    }, 400)
  }, [current])

  const goNext = useCallback(() => {
    if (current < slides.length - 1) goTo(current + 1)
  }, [current, goTo])

  // Show text on initial mount
  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 900)
    return () => clearTimeout(timer)
  }, [])

  // Auto-advance every 6s
  useEffect(() => {
    if (paused || current >= slides.length - 1) return
    const timer = setTimeout(goNext, 6000)
    return () => clearTimeout(timer)
  }, [current, paused, goNext])

  // Swipe support
  useEffect(() => {
    let startX = 0
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX }
    const onEnd = (e: TouchEvent) => {
      const diff = startX - e.changedTouches[0].clientX
      if (Math.abs(diff) > 50) {
        if (diff > 0 && current < slides.length - 1) goTo(current + 1)
        if (diff < 0 && current > 0) goTo(current - 1)
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [current, goTo])

  const slide = slides[current]
  const isLast = current === slides.length - 1

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)]"
      style={{ background: 'rgba(0,0,0,.4)' }}
      onMouseDown={() => setPaused(true)}
      onMouseUp={() => setPaused(false)}
    >
      {/* Floating particles (keep their colours) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${i % 3 === 0 ? 'tour-particle-drift' : 'animate-float'}`}
            style={{
              width: `${3 + (i % 4) * 2}px`,
              height: `${3 + (i % 4) * 2}px`,
              background: i % 2 === 0 ? `${slide.accent}${20 + i * 2}` : `${slide.accentAlt}${15 + i * 2}`,
              left: `${3 + i * 5.5}%`,
              top: `${8 + (i % 5) * 18}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${4 + (i % 4)}s`,
              borderRadius: i % 4 === 0 ? '2px' : '50%',
              transform: i % 4 === 0 ? 'rotate(45deg)' : undefined,
            }}
          />
        ))}
      </div>

      {/* Tour card (§4.6) */}
      <div className="relative z-10 flex w-full max-w-sm max-h-full flex-col overflow-x-hidden overflow-y-auto rounded-3xl border-2 border-border bg-background p-6">
        {/* Skip / top bar */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] font-bold text-muted-foreground">{current + 1}/{slides.length}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-11 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            Preskoči <X className="size-4" />
          </Button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center py-2">
          <div
            key={current}
            className={`flex flex-col items-center text-center w-full ${
              direction === 'in' ? 'tour-slide-in' : 'tour-slide-out'
            }`}
          >
            {/* Illustration */}
            <div className="h-44 w-full flex items-center justify-center mb-8">
              <Illustration type={slide.illustration} accent={slide.accent} accentAlt={slide.accentAlt} />
            </div>

            {/* Text content - animated in after slide transition */}
            <div className={`flex flex-col items-center transition-all duration-700 ease-out ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Subtitle chip */}
              <Badge
                className="mb-3"
                style={{
                  background: tint(slide.accent),
                  borderColor: slide.accent,
                  color: slide.accentAlt,
                  transitionDelay: textVisible ? '0ms' : '0ms',
                }}
              >
                {slide.subtitle}
              </Badge>

              {/* Title */}
              <h2
                className={`text-[20px] leading-[1.25] font-extrabold text-heading mb-3 transition-all duration-700 ease-out ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                style={{ transitionDelay: textVisible ? '150ms' : '0ms' }}
              >
                {slide.title}
              </h2>

              {/* Description */}
              <p
                className={`text-muted-foreground text-[15px] font-bold leading-[1.5] max-w-xs transition-all duration-700 ease-out ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                style={{ transitionDelay: textVisible ? '300ms' : '0ms' }}
              >
                {slide.description}
              </p>
            </div>

            {/* CTA on last slide */}
            {isLast && (
              <div className={`flex flex-col gap-3 w-full mt-8 transition-all duration-700 ease-out ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: textVisible ? '450ms' : '0ms' }}>
                <Link href="/register" onClick={onClose} className="block w-full">
                  <Button className="w-full">
                    <UserPlus className="size-5" />
                    Registruj se
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Nazad na prijavu
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: progress dots + next button */}
        <div className="flex items-center justify-between mt-4 min-h-11">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="h-11 flex items-center"
                aria-label={`${i + 1}/${slides.length}`}
              >
                <span
                  className="block h-2 rounded-full transition-all duration-500"
                  style={{
                    width: i === current ? 24 : 6,
                    background: i === current
                      ? slide.accent
                      : i < current
                        ? `${slide.accent}80`
                        : '#E5E5E5',
                  }}
                />
              </button>
            ))}
          </div>

          {/* Next button */}
          {!isLast && (
            <Button
              variant="default"
              size="icon"
              onClick={goNext}
            >
              <ChevronRight className="size-5" strokeWidth={2.6} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
