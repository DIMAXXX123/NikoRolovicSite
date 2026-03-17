'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, UserPlus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const slides = [
  {
    title: 'Gimnazija Niko Rolović',
    subtitle: 'Studentski Portal',
    description: 'Tvoj digitalni školski prostor — lekcije, novosti, galerija i zajednica na jednom mjestu.',
    illustration: 'logo' as const,
    accent: '#a78bfa',
    accentAlt: '#6d28d9',
  },
  {
    title: 'Dumbs',
    subtitle: 'Školska galerija',
    description: 'Dijeli slike iz školskog života! Moderacija sadržaja, anonimni mod i like sistem.',
    illustration: 'photos' as const,
    accent: '#f472b6',
    accentAlt: '#e11d48',
  },
  {
    title: 'Novosti',
    subtitle: 'Školski feed',
    description: 'Budi u toku sa svim dešavanjima, obavještenjima i lajkuj objave koje ti se sviđaju.',
    illustration: 'news' as const,
    accent: '#60a5fa',
    accentAlt: '#2563eb',
  },
  {
    title: 'Kalendar',
    subtitle: 'Testovi & ispiti',
    description: 'Testovi, kontrolni, rokovi — sve označeno bojama. Nikad više zaboravljenih ispita!',
    illustration: 'calendar' as const,
    accent: '#34d399',
    accentAlt: '#059669',
  },
  {
    title: 'Lekcije',
    subtitle: 'Materijali & kvizovi',
    description: 'Predmeti, materijali za učenje i kvizovi. Pripremi se za svaki čas i test.',
    illustration: 'lectures' as const,
    accent: '#fbbf24',
    accentAlt: '#d97706',
  },
  {
    title: 'Tvoj Profil',
    subtitle: 'Personalizacija',
    description: 'Biraj teme, prilagodi izgled, pogledaj svoju ulogu i statistiku. Portal po tvojoj mjeri.',
    illustration: 'profile' as const,
    accent: '#c084fc',
    accentAlt: '#7c3aed',
  },
]

function Illustration({ type, accent, accentAlt }: { type: string; accent: string; accentAlt: string }) {
  switch (type) {
    case 'logo':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Outer ring */}
          <div
            className="absolute w-44 h-44 rounded-full animate-[spin_20s_linear_infinite]"
            style={{ border: `1px dashed ${accent}30` }}
          />
          {/* Middle ring */}
          <div
            className="absolute w-36 h-36 rounded-full animate-[spin_15s_linear_infinite_reverse]"
            style={{ border: `1px solid ${accent}18` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full" style={{ background: accentAlt, opacity: 0.6 }} />
          </div>
          {/* Logo block */}
          <div
            className="w-28 h-28 rounded-3xl flex items-center justify-center animate-pulse-glow relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accentAlt})` }}
          >
            <div className="absolute inset-0 bg-white/10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 70%)' }} />
            <span className="text-5xl font-black text-white tracking-tight relative z-10">NR</span>
          </div>
          {/* Floating accents */}
          <div className="absolute -top-2 right-6 w-4 h-4 rounded-full animate-float" style={{ background: `${accent}60`, animationDelay: '0.3s' }} />
          <div className="absolute bottom-4 left-4 w-3 h-3 rounded-md rotate-45 animate-float" style={{ background: `${accentAlt}50`, animationDelay: '1s' }} />
        </div>
      )

    case 'photos':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Stacked photo cards */}
          <div className="relative w-56 h-36">
            {[
              { rotate: '-12deg', x: '-10px', delay: '0s', emoji: '📸', label: 'Slika' },
              { rotate: '0deg', x: '0px', delay: '0.2s', emoji: '🙈', label: 'Anon' },
              { rotate: '10deg', x: '10px', delay: '0.4s', emoji: '❤️', label: 'Like' },
            ].map((card, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-2xl animate-slide-up flex flex-col items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(145deg, ${accent}18, ${accent}08)`,
                  border: `1.5px solid ${accent}35`,
                  transform: `rotate(${card.rotate}) translateX(${card.x})`,
                  animationDelay: card.delay,
                  zIndex: 3 - i,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span className="text-4xl">{card.emoji}</span>
                <span className="text-xs font-medium" style={{ color: `${accent}cc` }}>{card.label}</span>
              </div>
            ))}
          </div>
          {/* Shield icon for moderation */}
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-xl flex items-center justify-center animate-scale-in" style={{ background: `${accentAlt}25`, border: `1px solid ${accentAlt}40`, animationDelay: '0.6s' }}>
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
              className="rounded-2xl p-3.5 flex items-center gap-3 animate-slide-up"
              style={{
                background: `linear-gradient(135deg, ${accent}10, ${accent}05)`,
                border: `1px solid ${accent}25`,
                animationDelay: `${i * 0.15}s`,
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}20` }}>
                <span className="text-xl">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground/80 truncate">{item.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-1.5 rounded-full flex-1" style={{ background: `${accent}20` }} />
                  {item.tag && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#ef444425', color: '#ef4444' }}>
                      {item.tag}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs" style={{ color: `${accent}80` }}>❤️ 12</span>
            </div>
          ))}
        </div>
      )

    case 'calendar':
      return (
        <div className="w-60">
          {/* Mini calendar header */}
          <div className="text-center mb-2">
            <span className="text-xs font-semibold" style={{ color: accent }}>Mart 2026</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['P', 'U', 'S', 'Č', 'P', 'S', 'N'].map((d) => (
              <div key={d} className="w-7 h-5 flex items-center justify-center text-[9px] text-muted-foreground/50 font-medium">{d}</div>
            ))}
            {Array.from({ length: 28 }, (_, i) => {
              const day = i + 1
              const isTest = [5, 12, 19].includes(day)
              const isExam = [8, 22].includes(day)
              const isEvent = [15, 25].includes(day)
              const color = isTest ? '#ef4444' : isExam ? '#f59e0b' : isEvent ? '#3b82f6' : ''
              return (
                <div
                  key={i}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-medium animate-scale-in relative"
                  style={{
                    background: color ? `${color}18` : `${accent}06`,
                    border: color ? `1px solid ${color}35` : `1px solid ${accent}10`,
                    color: color || `${accent}70`,
                    animationDelay: `${i * 0.02}s`,
                  }}
                >
                  {day}
                  {color && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-3 mt-2.5">
            {[['#ef4444', 'Test'], ['#f59e0b', 'Ispit'], ['#3b82f6', 'Event']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span className="text-[9px] text-muted-foreground/60">{l}</span>
              </div>
            ))}
          </div>
        </div>
      )

    case 'lectures':
      return (
        <div className="flex flex-col gap-2.5 w-56">
          {[
            { emoji: '🔢', name: 'Matematika', progress: 75 },
            { emoji: '⚛️', name: 'Fizika', progress: 60 },
            { emoji: '🏛️', name: 'Istorija', progress: 45 },
          ].map((subj, i) => (
            <div
              key={subj.name}
              className="rounded-2xl p-3 flex items-center gap-3 animate-slide-up"
              style={{
                background: `linear-gradient(135deg, ${accent}10, ${accent}05)`,
                border: `1px solid ${accent}25`,
                animationDelay: `${i * 0.15}s`,
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}20` }}>
                <span className="text-xl">{subj.emoji}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: `${accent}dd` }}>{subj.name}</div>
                <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: `${accent}15` }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${subj.progress}%`, background: `linear-gradient(90deg, ${accent}, ${accentAlt})` }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-semibold" style={{ color: `${accent}90` }}>🧠</span>
            </div>
          ))}
        </div>
      )

    case 'profile':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center animate-float relative"
            style={{ background: `linear-gradient(135deg, ${accent}30, ${accentAlt}20)`, border: `2px solid ${accent}50` }}
          >
            <span className="text-4xl">👤</span>
            {/* Role badge */}
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${accent}30`, color: accent, border: `1px solid ${accent}40` }}>
              Učenik
            </div>
          </div>
          {/* Theme orbs */}
          {['#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa'].map((c, i) => {
            const angle = (i * 72 - 90) * (Math.PI / 180)
            const x = Math.cos(angle) * 64
            const y = Math.sin(angle) * 64
            return (
              <div
                key={c}
                className="absolute w-6 h-6 rounded-full animate-scale-in flex items-center justify-center"
                style={{
                  background: `${c}30`,
                  border: `1.5px solid ${c}60`,
                  left: `calc(50% + ${x}px - 12px)`,
                  top: `calc(50% + ${y}px - 12px)`,
                  animationDelay: `${i * 0.1}s`,
                  boxShadow: `0 0 16px ${c}30`,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              </div>
            )
          })}
          {/* Stats */}
          <div className="absolute -bottom-6 flex gap-3">
            {[['🎨', 'Teme'], ['⭐', 'Uloge'], ['📊', 'Stats']].map(([emoji, label], i) => (
              <div key={label} className="flex items-center gap-1 px-2 py-1 rounded-lg animate-fade-in text-[10px]" style={{ background: `${accent}12`, border: `1px solid ${accent}20`, color: `${accent}90`, animationDelay: `${0.5 + i * 0.1}s` }}>
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

  const goTo = useCallback((index: number) => {
    if (index === current || index < 0 || index >= slides.length) return
    setDirection('out')
    setTimeout(() => {
      setCurrent(index)
      setDirection('in')
    }, 300)
  }, [current])

  const goNext = useCallback(() => {
    if (current < slides.length - 1) goTo(current + 1)
  }, [current, goTo])

  // Auto-advance every 4s
  useEffect(() => {
    if (paused || current >= slides.length - 1) return
    const timer = setTimeout(goNext, 4000)
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
      className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden"
      onMouseDown={() => setPaused(true)}
      onMouseUp={() => setPaused(false)}
    >
      {/* Animated background */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 20%, ${slide.accent}12 0%, transparent 100%),
            radial-gradient(ellipse 60% 40% at 80% 80%, ${slide.accentAlt}08 0%, transparent 100%)
          `,
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: `${4 + (i % 3) * 3}px`,
              height: `${4 + (i % 3) * 3}px`,
              background: `${slide.accent}${15 + i * 4}`,
              left: `${8 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Skip / top bar */}
      <div className="relative z-10 flex justify-between items-center px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-2">
        <span className="text-xs text-muted-foreground/50 font-medium">{current + 1}/{slides.length}</span>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground transition-all hover:bg-muted/50"
        >
          Preskoči <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div
          key={current}
          className={`flex flex-col items-center text-center max-w-sm w-full ${
            direction === 'in' ? 'tour-slide-in' : 'tour-slide-out'
          }`}
        >
          {/* Illustration */}
          <div className="h-44 w-full flex items-center justify-center mb-8">
            <Illustration type={slide.illustration} accent={slide.accent} accentAlt={slide.accentAlt} />
          </div>

          {/* Subtitle chip */}
          <div
            className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase mb-3"
            style={{ background: `${slide.accent}15`, color: slide.accent, border: `1px solid ${slide.accent}25` }}
          >
            {slide.subtitle}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold mb-3" style={{ color: slide.accent }}>
            {slide.title}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-[15px] leading-relaxed max-w-xs">
            {slide.description}
          </p>

          {/* CTA on last slide */}
          {isLast && (
            <div className="flex flex-col gap-3 w-full mt-8 animate-fade-in">
              <Link href="/register" onClick={onClose}>
                <button
                  className="w-full py-3.5 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow"
                  style={{ background: `linear-gradient(135deg, ${slide.accent}, ${slide.accentAlt})` }}
                >
                  <UserPlus className="w-5 h-5" />
                  Registruj se
                </button>
              </Link>
              <button
                onClick={onClose}
                className="py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Nazad na prijavu
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: progress dots + next button */}
      <div className="relative z-10 flex items-center justify-between px-8 pb-[max(env(safe-area-inset-bottom),2rem)]">
        {/* Progress dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: i === current ? 28 : 8,
                background: i === current
                  ? slide.accent
                  : i < current
                    ? `${slide.accent}50`
                    : `${slide.accent}20`,
              }}
            />
          ))}
        </div>

        {/* Next button */}
        {!isLast && (
          <button
            onClick={goNext}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{
              background: `${slide.accent}15`,
              border: `1.5px solid ${slide.accent}30`,
              color: slide.accent,
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
