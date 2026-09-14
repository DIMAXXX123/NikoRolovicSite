'use client'

import { useEffect, useState } from 'react'

interface SuccessAnimationProps {
  message: string
  onComplete: () => void
  delay?: number
}

export function SuccessAnimation({ message, onComplete, delay = 2000 }: SuccessAnimationProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter')
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      angle: i * 18,
      distance: 80 + Math.random() * 120,
      delay: Math.random() * 0.3,
      size: 4 + Math.random() * 8,
      color: ['#58CC02', '#1CB0F6', '#FFC800', '#CE82FF', '#FF9600'][i % 5],
    }))
  )

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 100)
    const t2 = setTimeout(() => setPhase('exit'), delay - 400)
    const t3 = setTimeout(onComplete, delay)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete, delay])

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-300 ${phase === 'enter' ? 'opacity-0' : 'opacity-100'}`}>
      {/* Particle burst */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="success-particle absolute left-1/2 top-1/2"
            style={{
              '--angle': `${p.angle}deg`,
              '--distance': `${p.distance}px`,
              '--delay': `${p.delay}s`,
              '--size': `${p.size}px`,
              backgroundColor: p.color,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className={`relative flex flex-col items-center gap-6 transition-all duration-500 ${phase === 'show' ? 'scale-100 opacity-100' : phase === 'exit' ? 'scale-110 opacity-0' : 'scale-50 opacity-0'}`}>
        {/* Checkmark circle */}
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="#58CC02"
              strokeWidth="4"
              className="success-circle"
            />
            <polyline
              points="30,52 45,66 72,36"
              fill="none"
              stroke="#58CC02"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="success-check"
            />
          </svg>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-primary-light animate-ping" style={{ animationDuration: '1.5s' }} />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-[26px] leading-[1.2] font-extrabold text-heading tracking-[-0.01em]">{message}</h1>
          <p className="text-muted-foreground text-[13px] font-bold animate-pulse">Preusmeravanje...</p>
        </div>
      </div>
    </div>
  )
}
