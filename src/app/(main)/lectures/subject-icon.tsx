import Image from 'next/image'
import { FLAG_SUBJECTS } from './subjects'

// Per-subject colours (§2). The circle is the colour at 18% over white.
const SUBJECT_COLORS: Record<string, string> = {
  Fizika: '#1CB0F6',
  Matematika: '#58CC02',
  CSBH: '#FF4B4B',
  Hemija: '#CE82FF',
  Engleski: '#1CB0F6',
  Italjanski: '#58CC02',
  Fizicko: '#FF9600',
  Likovno: '#FF86D0',
  Biologija: '#58CC02',
  Istorija: '#FFC800',
  Geografija: '#1CB0F6',
  Njemacki: '#FFC800',
  Spanski: '#FF9600',
  Izb_spanski: '#FF9600',
}

const FALLBACK_COLOR = '#1CB0F6'

export function SubjectIcon({
  name,
  emoji,
  size = 'lg',
}: {
  name: string
  emoji: string
  size?: 'lg' | 'sm'
}) {
  const color = SUBJECT_COLORS[name] ?? FALLBACK_COLOR
  const box = size === 'lg' ? 'w-14 h-14' : 'w-11 h-11'
  const flagUrl = FLAG_SUBJECTS[name]

  return (
    <span
      className={`${box} rounded-full flex items-center justify-center shrink-0`}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, white)` }}
    >
      {flagUrl ? (
        <Image
          src={flagUrl}
          alt={name}
          width={24}
          height={18}
          // flagcdn is not in images.remotePatterns; the assets are already tiny.
          unoptimized
          className={`${size === 'lg' ? 'w-8 h-6' : 'w-6 h-[18px]'} object-contain rounded-[3px]`}
        />
      ) : (
        <span className={size === 'lg' ? 'text-[28px] leading-none' : 'text-xl leading-none'}>
          {emoji}
        </span>
      )}
    </span>
  )
}
