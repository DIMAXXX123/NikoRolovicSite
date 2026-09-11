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
        className="flex items-center gap-1.5 transition-all duration-200 active:scale-110"
      >
        <ThumbsUp
          className={`w-5 h-5 transition-all ${liked ? 'fill-blue-500 text-blue-500' : 'text-muted-foreground'}`}
        />
        <span className={`text-sm ${liked ? 'text-blue-500' : 'text-muted-foreground'}`}>
          {liked ? 1 : 0}
        </span>
      </button>
    </>
  )
}
