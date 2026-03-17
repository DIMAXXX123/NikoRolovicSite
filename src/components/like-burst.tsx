'use client'

import { useEffect, useState } from 'react'

interface LikeBurstProps {
  x: number
  y: number
  onDone: () => void
}

interface HeartParticle {
  id: number
  emoji: string
  x: number
  size: number
  rotation: number
  duration: number
  delay: number
  drift: number
}

export function LikeBurst({ x, y, onDone }: LikeBurstProps) {
  const [particles] = useState<HeartParticle[]>(() => {
    const hearts = ['❤️', '💖', '💕', '💗', '💓', '♥️']
    return Array.from({ length: 7 }, (_, i) => ({
      id: i,
      emoji: hearts[i % hearts.length],
      x: (Math.random() - 0.5) * 80,
      size: 20 + Math.random() * 24,
      rotation: (Math.random() - 0.5) * 60,
      duration: 1.0 + Math.random() * 0.8,
      delay: Math.random() * 0.2,
      drift: (Math.random() - 0.5) * 40,
    }))
  })

  useEffect(() => {
    const t = setTimeout(onDone, 1800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute"
          style={{
            left: x + p.x,
            top: y,
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
            transform: translateY(-80px) translateX(var(--drift)) rotate(var(--rotation)) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-300px) translateX(var(--drift)) rotate(var(--rotation)) scale(0.6);
          }
        }
      `}</style>
    </div>
  )
}
