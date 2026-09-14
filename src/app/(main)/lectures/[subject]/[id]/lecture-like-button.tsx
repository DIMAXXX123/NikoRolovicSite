'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { LikeBurst } from '@/components/like-burst'
import { setLectureLiked, useLikedLectures } from '../../liked-lectures'

export function LectureLikeButton({ lectureId }: { lectureId: string }) {
  const likedLectures = useLikedLectures()
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null)
  const liked = !!likedLectures[lectureId]

  function toggle(e: React.MouseEvent) {
    if (!liked) setBurst({ x: e.clientX - 20, y: e.clientY - 20, key: Date.now() })
    setLectureLiked(likedLectures, lectureId, !liked)
  }

  return (
    <>
      {burst && <LikeBurst key={burst.key} x={burst.x} y={burst.y} onDone={() => setBurst(null)} />}
      <button
        onClick={toggle}
        aria-pressed={liked}
        className={`inline-flex items-center justify-center gap-1.5 h-11 min-w-11 px-3 rounded-xl border-2 text-[13px] font-extrabold transition-[transform,box-shadow,background-color,border-color,color] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
          liked
            ? 'border-primary-light-border bg-primary-light text-primary-text shadow-[0_2px_0_var(--color-primary-light-border)]'
            : 'border-border bg-background text-muted-foreground shadow-[0_2px_0_var(--color-border)]'
        }`}
      >
        <ThumbsUp
          className={`w-5 h-5 transition-all ${liked ? 'fill-current' : ''}`}
          strokeWidth={2.4}
        />
        <span>{liked ? 1 : 0}</span>
      </button>
    </>
  )
}
