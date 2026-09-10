import Image from 'next/image'
import { FLAG_SUBJECTS } from './subjects'

export function SubjectIcon({
  name,
  emoji,
  size = 'lg',
}: {
  name: string
  emoji: string
  size?: 'lg' | 'sm'
}) {
  const flagUrl = FLAG_SUBJECTS[name]
  if (flagUrl) {
    const dims = size === 'lg' ? 'w-10 h-7' : 'w-6 h-4'
    return (
      <Image
        src={flagUrl}
        alt={name}
        width={24}
        height={18}
        // flagcdn is not in images.remotePatterns; the assets are already tiny.
        unoptimized
        className={`${dims} object-contain`}
      />
    )
  }
  return <span className={size === 'lg' ? 'text-5xl' : 'text-xl'}>{emoji}</span>
}
