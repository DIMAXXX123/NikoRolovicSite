'use client'

interface AvatarProps {
  className?: string
}

// Boy 1: Student with books
function BookBoy({ className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="28" r="20" fill="#6366f1" />
      <circle cx="40" cy="28" r="16" fill="#818cf8" />
      <circle cx="34" cy="25" r="2.5" fill="#1e1b4b" />
      <circle cx="46" cy="25" r="2.5" fill="#1e1b4b" />
      <path d="M36 32 Q40 36 44 32" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M22 16 Q26 8 40 10 Q54 8 58 16" fill="#6366f1" />
      <rect x="28" y="50" width="24" height="20" rx="4" fill="#4f46e5" />
      <rect x="20" y="55" width="12" height="15" rx="2" fill="#f59e0b" />
      <rect x="48" y="55" width="12" height="15" rx="2" fill="#ef4444" />
    </svg>
  )
}

// Boy 2: Gamer student
function GamerBoy({ className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="28" r="20" fill="#10b981" />
      <circle cx="40" cy="28" r="16" fill="#34d399" />
      <rect x="28" y="22" width="24" height="8" rx="4" fill="#1e1b4b" opacity="0.9" />
      <circle cx="34" cy="26" r="2" fill="#4ade80" />
      <circle cx="46" cy="26" r="2" fill="#4ade80" />
      <path d="M36 33 Q40 35 44 33" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M22 14 Q30 6 40 10 Q50 6 58 14" fill="#10b981" />
      <rect x="28" y="50" width="24" height="20" rx="4" fill="#059669" />
      <path d="M32 18 L32 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Boy 3: Sporty student
function SportyBoy({ className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="28" r="20" fill="#f97316" />
      <circle cx="40" cy="28" r="16" fill="#fb923c" />
      <circle cx="34" cy="25" r="2.5" fill="#1e1b4b" />
      <circle cx="46" cy="25" r="2.5" fill="#1e1b4b" />
      <path d="M35 32 Q40 37 45 32" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M20 20 Q24 10 40 12 Q56 10 60 20" fill="#f97316" />
      <rect x="20" y="16" width="40" height="6" rx="3" fill="#ffffff" opacity="0.9" />
      <rect x="28" y="50" width="24" height="20" rx="4" fill="#ea580c" />
      <circle cx="56" cy="60" r="7" fill="#f97316" stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

// Boy 4: Artist student
function ArtistBoy({ className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="28" r="20" fill="#ec4899" />
      <circle cx="40" cy="28" r="16" fill="#f472b6" />
      <circle cx="34" cy="25" r="2.5" fill="#1e1b4b" />
      <circle cx="46" cy="25" r="2.5" fill="#1e1b4b" />
      <path d="M37 33 Q40 35 43 33" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M24 14 Q32 6 40 10 Q48 6 56 14" fill="#ec4899" />
      <rect x="28" y="50" width="24" height="20" rx="4" fill="#db2777" />
      <ellipse cx="18" cy="58" rx="6" ry="8" fill="#fbbf24" opacity="0.9" />
      <circle cx="15" cy="54" r="2" fill="#ef4444" />
      <circle cx="21" cy="53" r="2" fill="#3b82f6" />
      <circle cx="18" cy="58" r="2" fill="#22c55e" />
    </svg>
  )
}

// Boy 5: Nerd student
function NerdBoy({ className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="28" r="20" fill="#8b5cf6" />
      <circle cx="40" cy="28" r="16" fill="#a78bfa" />
      <circle cx="33" cy="25" r="5" fill="none" stroke="#1e1b4b" strokeWidth="1.5" />
      <circle cx="47" cy="25" r="5" fill="none" stroke="#1e1b4b" strokeWidth="1.5" />
      <line x1="38" y1="25" x2="42" y2="25" stroke="#1e1b4b" strokeWidth="1.5" />
      <circle cx="33" cy="25" r="2" fill="#1e1b4b" />
      <circle cx="47" cy="25" r="2" fill="#1e1b4b" />
      <path d="M37 33 Q40 35 43 33" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M24 16 Q32 8 40 10 Q48 8 56 16" fill="#8b5cf6" />
      <rect x="28" y="50" width="24" height="20" rx="4" fill="#7c3aed" />
      <rect x="36" y="56" width="8" height="10" rx="1" fill="#c4b5fd" />
    </svg>
  )
}

// Girl 1: Student with books
function BookGirl({ className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="28" r="20" fill="#f43f5e" />
      <circle cx="40" cy="28" r="16" fill="#fb7185" />
      <circle cx="34" cy="25" r="2.5" fill="#1e1b4b" />
      <circle cx="46" cy="25" r="2.5" fill="#1e1b4b" />
      <path d="M36 32 Q40 36 44 32" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M18 24 Q20 6 40 10 Q60 6 62 24" fill="#f43f5e" />
      <path d="M18 24 Q16 36 22 42" stroke="#f43f5e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M62 24 Q64 36 58 42" stroke="#f43f5e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="28" y="50" width="24" height="20" rx="4" fill="#e11d48" />
      <rect x="20" y="55" width="12" height="15" rx="2" fill="#a78bfa" />
      <rect x="48" y="55" width="12" height="15" rx="2" fill="#38bdf8" />
    </svg>
  )
}

// Girl 2: Gamer girl
function GamerGirl({ className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="28" r="20" fill="#06b6d4" />
      <circle cx="40" cy="28" r="16" fill="#22d3ee" />
      <circle cx="34" cy="25" r="2.5" fill="#1e1b4b" />
      <circle cx="46" cy="25" r="2.5" fill="#1e1b4b" />
      <path d="M36 33 Q40 35 44 33" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M18 22 Q22 4 40 8 Q58 4 62 22" fill="#06b6d4" />
      <path d="M18 22 Q14 34 20 44" stroke="#06b6d4" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M62 22 Q66 34 60 44" stroke="#06b6d4" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="26" y="14" width="28" height="6" rx="3" fill="#a78bfa" />
      <rect x="28" y="50" width="24" height="20" rx="4" fill="#0891b2" />
    </svg>
  )
}

// Girl 3: Sporty girl
function SportyGirl({ className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="28" r="20" fill="#f59e0b" />
      <circle cx="40" cy="28" r="16" fill="#fbbf24" />
      <circle cx="34" cy="25" r="2.5" fill="#1e1b4b" />
      <circle cx="46" cy="25" r="2.5" fill="#1e1b4b" />
      <path d="M35 32 Q40 37 45 32" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M20 20 Q26 4 40 8 Q54 4 60 20" fill="#f59e0b" />
      <path d="M20 20 Q16 32 22 42" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M60 20 Q64 32 58 42" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="20" y="16" width="40" height="6" rx="3" fill="#ffffff" opacity="0.8" />
      <rect x="28" y="50" width="24" height="20" rx="4" fill="#d97706" />
    </svg>
  )
}

// Girl 4: Artist girl
function ArtistGirl({ className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="28" r="20" fill="#d946ef" />
      <circle cx="40" cy="28" r="16" fill="#e879f9" />
      <circle cx="34" cy="25" r="2.5" fill="#1e1b4b" />
      <circle cx="46" cy="25" r="2.5" fill="#1e1b4b" />
      <path d="M37 33 Q40 35 43 33" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M18 24 Q22 4 40 10 Q58 4 62 24" fill="#d946ef" />
      <path d="M18 24 Q14 38 22 46" stroke="#d946ef" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M62 24 Q66 38 58 46" stroke="#d946ef" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="18" r="3" fill="#fbbf24" />
      <rect x="28" y="50" width="24" height="20" rx="4" fill="#c026d3" />
      <path d="M16 62 L12 50" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="49" r="3" fill="#f472b6" />
    </svg>
  )
}

// Girl 5: Nerd girl
function NerdGirl({ className }: AvatarProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="28" r="20" fill="#14b8a6" />
      <circle cx="40" cy="28" r="16" fill="#2dd4bf" />
      <circle cx="33" cy="25" r="5" fill="none" stroke="#1e1b4b" strokeWidth="1.5" />
      <circle cx="47" cy="25" r="5" fill="none" stroke="#1e1b4b" strokeWidth="1.5" />
      <line x1="38" y1="25" x2="42" y2="25" stroke="#1e1b4b" strokeWidth="1.5" />
      <circle cx="33" cy="25" r="2" fill="#1e1b4b" />
      <circle cx="47" cy="25" r="2" fill="#1e1b4b" />
      <path d="M37 33 Q40 35 43 33" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M18 22 Q22 4 40 8 Q58 4 62 22" fill="#14b8a6" />
      <path d="M18 22 Q14 36 22 44" stroke="#14b8a6" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M62 22 Q66 36 58 44" stroke="#14b8a6" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="28" y="50" width="24" height="20" rx="4" fill="#0d9488" />
      <rect x="36" y="56" width="8" height="10" rx="1" fill="#99f6e4" />
    </svg>
  )
}

export const AVATARS = [
  { id: 'book-boy', label: 'Đak sa knjigama', Component: BookBoy },
  { id: 'gamer-boy', label: 'Gejmer', Component: GamerBoy },
  { id: 'sporty-boy', label: 'Sportista', Component: SportyBoy },
  { id: 'artist-boy', label: 'Umjetnik', Component: ArtistBoy },
  { id: 'nerd-boy', label: 'Štreber', Component: NerdBoy },
  { id: 'book-girl', label: 'Đak sa knjigama', Component: BookGirl },
  { id: 'gamer-girl', label: 'Gejmerka', Component: GamerGirl },
  { id: 'sporty-girl', label: 'Sportistkinja', Component: SportyGirl },
  { id: 'artist-girl', label: 'Umjetnica', Component: ArtistGirl },
  { id: 'nerd-girl', label: 'Štreberka', Component: NerdGirl },
]

export function AvatarById({ id, className }: { id: string; className?: string }) {
  const avatar = AVATARS.find(a => a.id === id)
  if (!avatar) return null
  return <avatar.Component className={className} />
}
