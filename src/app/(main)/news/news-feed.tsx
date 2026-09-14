'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLoginPrompt } from '@/components/login-prompt'
import { fetchNewsPage } from '@/lib/news-data'
import { NewsHeroCard, NewsRegularCard } from './news-card'
import { FloatingHearts } from '@/components/tap-like'
import { Button } from '@/components/ui/button'
import type { NewsItem } from '@/lib/types'
import { track, trackOnce } from '@/lib/analytics'

interface NewsFeedProps {
  initialItems: NewsItem[]
  initialHasMore: boolean
  userId: string | null
  pageSize: number
}

export function NewsFeed({ initialItems, initialHasMore, userId, pageSize }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const likingIdsRef = useRef<Set<string>>(new Set())
  const likeDebounceRef = useRef<Record<string, number>>({})
  const { prompt: promptLogin, element: loginPrompt } = useLoginPrompt()
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const feedRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

  // news_view: a card counts as seen once ≥50% of it has been on screen,
  // at most once per tab session.
  useEffect(() => {
    const root = feedRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const id = (entry.target as HTMLElement).dataset.newsId
          if (id) trackOnce(id, 'news_view', { entity_id: id })
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.5 }
    )
    root.querySelectorAll<HTMLElement>('[data-news-id]').forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [news])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleImageError = useCallback((id: string) => {
    setFailedImages((prev) => new Set(prev).add(id))
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const result = await fetchNewsPage(supabase, nextPage, userId, pageSize)
      setNews((prev) => {
        const seen = new Set(prev.map((item) => item.id))
        return [...prev, ...result.items.filter((item) => !seen.has(item.id))]
      })
      setHasMore(result.hasMore)
      setPage(nextPage)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, supabase, userId, pageSize])

  // Auto-load the next page when the sentinel scrolls into view.
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '400px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  const toggleLike = useCallback(
    async (newsId: string, currentlyLiked: boolean) => {
      if (!currentlyLiked) track('news_like', { entity_id: newsId })
      if (!userId) { promptLogin(); return }
      if (likingIdsRef.current.has(newsId)) return

      // Debounce: prevent rapid-fire likes (300ms cooldown)
      const now = Date.now()
      const lastLike = likeDebounceRef.current[newsId] || 0
      if (now - lastLike < 300) return
      likeDebounceRef.current[newsId] = now

      likingIdsRef.current.add(newsId)

      const applyDelta = (liked: boolean, delta: number) =>
        setNews((prev) =>
          prev.map((item) =>
            item.id === newsId
              ? {
                  ...item,
                  user_liked: liked,
                  likes_count: Math.max(0, (item.likes_count || 0) + delta),
                }
              : item
          )
        )

      applyDelta(!currentlyLiked, currentlyLiked ? -1 : 1)

      try {
        if (currentlyLiked) {
          const { error } = await supabase
            .from('news_likes')
            .delete()
            .eq('news_id', newsId)
            .eq('user_id', userId)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('news_likes')
            .upsert({ news_id: newsId, user_id: userId }, { onConflict: 'news_id,user_id' })
          if (error) throw error
        }
      } catch {
        applyDelta(currentlyLiked, currentlyLiked ? 1 : -1)
      } finally {
        likingIdsRef.current.delete(newsId)
      }
    },
    [supabase, userId, promptLogin]
  )

  if (news.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Newspaper className="w-8 h-8 text-disabled" />
        </div>
        <p className="text-[17px] leading-[1.3] font-extrabold text-foreground">Jos nema novosti</p>
      </div>
    )
  }

  const [heroItem, ...restItems] = news

  const cardProps = {
    onToggleExpand: toggleExpand,
    onToggleLike: toggleLike,
    onImageError: handleImageError,
  }

  return (
    <div ref={feedRef} className="space-y-4 animate-stagger">
      {loginPrompt}
      <FloatingHearts />
      <NewsHeroCard
        item={heroItem}
        expanded={expandedIds.has(heroItem.id)}
        showImage={!!heroItem.image_url && !failedImages.has(heroItem.id)}
        priority
        {...cardProps}
      />

      {restItems.map((item) => (
        <NewsRegularCard
          key={item.id}
          item={item}
          expanded={expandedIds.has(item.id)}
          showImage={!!item.image_url && !failedImages.has(item.id)}
          priority={false}
          {...cardProps}
        />
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="pt-2">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full"
          >
            {loadingMore ? 'Učitavanje…' : 'Učitaj još'}
          </Button>
        </div>
      )}
    </div>
  )
}

function Newspaper({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  )
}
