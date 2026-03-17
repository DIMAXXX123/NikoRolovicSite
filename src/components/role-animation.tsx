'use client'

import { useEffect, useState } from 'react'

interface RoleAnimationProps {
  role: string
  onDone: () => void
}

const PARTICLE_COUNT = 24

function randomBetween(a: number, b: number) {
  return Math.random() * (b - a) + a
}

export function RoleAnimation({ role, onDone }: RoleAnimationProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  const config: Record<string, { emojis: string[]; bg: string; title: string; glow: string }> = {
    creator: {
      emojis: ['👑', '✨', '💫', '⭐', '🌟'],
      bg: 'from-yellow-900/90 via-amber-950/95 to-yellow-900/90',
      title: 'Kreator',
      glow: 'shadow-[0_0_120px_40px_rgba(255,215,0,0.3)]',
    },
    admin: {
      emojis: ['🛡️', '⭐', '💜', '🔮', '✨'],
      bg: 'from-purple-950/95 via-violet-950/95 to-purple-950/95',
      title: 'Administrator',
      glow: 'shadow-[0_0_120px_40px_rgba(139,92,246,0.3)]',
    },
    moderator: {
      emojis: ['🌊', '💙', '🔵', '✨', '⚡'],
      bg: 'from-blue-950/95 via-cyan-950/95 to-blue-950/95',
      title: 'Moderator',
      glow: 'shadow-[0_0_120px_40px_rgba(59,130,246,0.3)]',
    },
    student: {
      emojis: ['🎉', '🎊', '✨', '💫', '🌟', '🎈'],
      bg: 'from-zinc-950/95 via-zinc-900/95 to-zinc-950/95',
      title: 'Učenik',
      glow: '',
    },
  }

  const c = config[role] || config.student

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    emoji: c.emojis[i % c.emojis.length],
    x: randomBetween(5, 95),
    delay: randomBetween(0, 0.8),
    duration: randomBetween(1.2, 2.5),
    size: randomBetween(20, 40),
    startY: randomBetween(-10, 110),
  }))

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b ${c.bg} transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={() => { setVisible(false); setTimeout(onDone, 300) }}
    >
      {/* Particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.startY}%`,
            fontSize: `${p.size}px`,
            animation: `roleParticleFall ${p.duration}s ease-in ${p.delay}s both`,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Center content */}
      <div className={`text-center z-10 ${c.glow} rounded-full p-12`}>
        <div className="text-6xl mb-4" style={{ animation: 'rolePulse 0.8s ease-in-out infinite alternate' }}>
          {c.emojis[0]}
        </div>
        <h1
          className="text-3xl font-bold text-white"
          style={{ animation: 'roleScaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          {c.title}
        </h1>
      </div>

      <style>{`
        @keyframes roleParticleFall {
          0% { opacity: 0; transform: translateY(-40px) rotate(0deg) scale(0); }
          20% { opacity: 1; transform: translateY(0) rotate(30deg) scale(1); }
          100% { opacity: 0; transform: translateY(60vh) rotate(180deg) scale(0.5); }
        }
        @keyframes rolePulse {
          from { transform: scale(1); }
          to { transform: scale(1.15); }
        }
        @keyframes roleScaleIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
