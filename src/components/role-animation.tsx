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

  const config: Record<string, { emojis: string[]; title: string }> = {
    creator: {
      emojis: ['👑', '✨', '💫', '⭐', '🌟'],
      title: 'Kreator',
    },
    admin: {
      emojis: ['🛡️', '⭐', '💜', '🔮', '✨'],
      title: 'Administrator',
    },
    moderator: {
      emojis: ['🌊', '💙', '🔵', '✨', '⚡'],
      title: 'Moderator',
    },
    student: {
      emojis: ['🎉', '🎊', '✨', '💫', '🌟', '🎈'],
      title: 'Učenik',
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
  }))

  return (
    <div
      className={`fixed inset-0 z-[100] pointer-events-auto transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={() => { setVisible(false); setTimeout(onDone, 300) }}
    >
      {/* Particles falling - no background */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: '-40px',
            fontSize: `${p.size}px`,
            animation: `roleParticleFall ${p.duration}s ease-in ${p.delay}s both`,
          }}
        >
          {p.emoji}
        </span>
      ))}

      <style>{`
        @keyframes roleParticleFall {
          0% { opacity: 0; transform: translateY(-40px) rotate(0deg) scale(0); }
          20% { opacity: 1; transform: translateY(0) rotate(30deg) scale(1); }
          100% { opacity: 0; transform: translateY(100vh) rotate(180deg) scale(0.5); }
        }
      `}</style>
    </div>
  )
}
