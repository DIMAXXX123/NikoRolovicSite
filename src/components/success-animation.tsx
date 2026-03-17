'use client'

import { useEffect, useState } from 'react'

interface SuccessAnimationProps {
  message: string
  onComplete: () => void
  delay?: number
}

export function SuccessAnimation({ message, onComplete, delay = 2000 }: SuccessAnimationProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter')

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
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="success-particle absolute left-1/2 top-1/2"
            style={{
              '--angle': `${(i * 18)}deg`,
              '--distance': `${80 + Math.random() * 120}px`,
              '--delay': `${Math.random() * 0.3}s`,
              '--size': `${4 + Math.random() * 8}px`,
              backgroundColor: ['#a78bfa', '#6d28d9', '#8b5cf6', '#c4b5fd', '#22c55e'][i % 5],
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
              stroke="url(#successGradient)"
              strokeWidth="3"
              className="success-circle"
            />
            <polyline
              points="30,52 45,66 72,36"
              fill="none"
              stroke="#22c55e"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="success-check"
            />
            <defs>
              <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" style={{ animationDuration: '1.5s' }} />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold gradient-text">{message}</h1>
          <p className="text-muted-foreground text-sm animate-pulse">Preusmeravanje...</p>
        </div>
      </div>
    </div>
  )
}
