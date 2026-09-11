'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ThumbsUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatMath, parseLectureDate } from '../lecture-utils'
import { fetchLecturesPage } from '../lecture-queries'
import { useLikedLectures } from '../liked-lectures'
import type { Lecture } from '@/lib/types'

interface LectureListProps {
  subject: string
  classNumber: number
  initialItems: Lecture[]
  initialHasMore: boolean
  pageSize: number
}

export function LectureList({
  subject,
  classNumber,
  initialItems,
  initialHasMore,
  pageSize,
}: LectureListProps) {
  const [lectures, setLectures] = useState<Lecture[]>(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const liked = useLikedLectures()
  const supabase = createClient()

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)
    const nextPage = page + 1
    try {
      const result = await fetchLecturesPage(supabase, classNumber, subject, nextPage, pageSize)
      setLectures((prev) => {
        const seen = new Set(prev.map((l) => l.id))
        return [...prev, ...result.items.filter((l) => !seen.has(l.id))]
      })
      setHasMore(result.hasMore)
      setPage(nextPage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2.5 animate-stagger-scale">
      {lectures.map((lecture, idx) => {
        const isCurrent = lecture.content?.includes('<!-- CURRENT -->')
        const lDate = parseLectureDate(lecture.content)
        return (
          <Link
            key={lecture.id}
            href={`/lectures/${encodeURIComponent(subject)}/${lecture.id}`}
            className={`w-full text-left rounded-2xl border bg-[#0c0c14] cursor-pointer hover:bg-white/[0.04] transition-all active:scale-[0.98] p-4 flex items-center justify-between hover-float ${
              isCurrent ? 'border-violet-500/30 bg-violet-500/5' : 'border-[#1a1a2e]'
            }`}
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <span
                className={`text-xs font-mono w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isCurrent ? 'bg-violet-500/15 text-violet-400 font-bold' : 'bg-white/[0.04] text-muted-foreground'
                }`}
              >
                {idx + 1}
              </span>
              <div className="space-y-0.5 min-w-0">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  {formatMath(lecture.title)}
                  {isCurrent && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/20 whitespace-nowrap flex-shrink-0">
                      📍 OVDJE SI
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {lDate
                    ? new Date(lDate).toLocaleDateString('sr-Latn')
                    : new Date(lecture.created_at).toLocaleDateString('sr-Latn')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {liked[lecture.id] && <ThumbsUp className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />}
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </div>
          </Link>
        )
      })}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl border border-dashed border-white/[0.08] text-sm text-muted-foreground hover:border-[#7c5cfc]/30 hover:text-[#7c5cfc] transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Učitavanje…' : 'Učitaj još'}
        </button>
      )}
    </div>
  )
}
