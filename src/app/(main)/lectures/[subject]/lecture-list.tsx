'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ThumbsUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
            className={`w-full min-h-16 px-4 py-3 rounded-2xl border-2 flex items-center gap-3 transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              isCurrent
                ? 'border-primary-light-border bg-[#F4FFEA] shadow-[0_2px_0_var(--color-primary-light-border)]'
                : 'border-border bg-card shadow-[0_2px_0_var(--color-border)]'
            }`}
          >
            <span
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-[15px] font-extrabold ${
                isCurrent ? 'bg-primary-light text-primary-text' : 'bg-muted text-muted-foreground'
              }`}
            >
              {idx + 1}
            </span>
            <div className="space-y-0.5 min-w-0 flex-1">
              <h3 className="text-[17px] font-extrabold leading-[1.3] text-heading flex items-center gap-2 flex-wrap">
                {formatMath(lecture.title)}
                {isCurrent && <Badge className="shrink-0">📍 OVDJE SI</Badge>}
              </h3>
              <p className="text-[13px] font-bold text-muted-foreground">
                {lDate
                  ? new Date(lDate).toLocaleDateString('sr-Latn')
                  : new Date(lecture.created_at).toLocaleDateString('sr-Latn')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {liked[lecture.id] && (
                <Badge variant="secondary">
                  <ThumbsUp className="fill-current" strokeWidth={2.6} />
                </Badge>
              )}
              <ChevronRight className="w-5 h-5 text-disabled" strokeWidth={2.6} />
            </div>
          </Link>
        )
      })}

      {hasMore && (
        <Button variant="outline" className="w-full" onClick={loadMore} disabled={loading}>
          {loading ? 'Učitavanje…' : 'Učitaj još'}
        </Button>
      )}
    </div>
  )
}
