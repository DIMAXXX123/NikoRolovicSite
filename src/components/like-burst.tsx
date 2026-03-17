'use client'

import { useEffect, useState } from 'react'

interface LikeBurstProps {
  x: number
  y: number
  onDone: () => void
}

interface ThumbParticle {
  id: number
  emoji: string
  startX: number
  startY: number
  size: number
  rotation: number
  duration: number
  delay: number
  drift: number
}

export function LikeBurst({ x, y, onDone }: LikeBurstProps) {
  const [particles] = useState<ThumbParticle[]>(() => {
    const thumbs = ['👍', '👍', '👍', '👍', '👍', '👍', '👍']
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      emoji: thumbs[i % thumbs.length],
      startX: Math.random() * 100,
      startY: 60 + Math.random() * 30,
      size: 24 + Math.random() * 28,
      rotation: (Math.random() - 0.5) * 60,
      duration: 1.2 + Math.random() * 1.0,
      delay: Math.random() * 0.4,
      drift: (Math.random() - 0.5) * 60,
    }))
  })

  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute"
          style={{
            left: `${p.startX}%`,
            bottom: `${p.startY - 60}%`,
            fontSize: p.size,
            animation: `likeBurstFloat ${p.duration}s ease-out ${p.delay}s both`,
            '--drift': `${p.drift}px`,
            '--rotation': `${p.rotation}deg`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}
      <style>{`
        @keyframes likeBurstFloat {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0deg) scale(0.3);
          }
          30% {
            opacity: 1;
            transform: translateY(-120px) translateX(var(--drift)) rotate(var(--rotation)) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-400px) translateX(var(--drift)) rotate(var(--rotation)) scale(0.6);
          }
        }
      `}</style>
    </div>
  )
}
