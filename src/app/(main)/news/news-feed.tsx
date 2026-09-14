'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchNewsPage } from '@/lib/news-data'
import { NewsHeroCard, NewsRegularCard } from './news-card'
import { Button } from '@/components/ui/button'
import type { NewsItem } from '@/lib/types'

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
  const lastTapRef = useRef<Record<string, number>>({})
  const heartsContainerRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

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

  useEffect(() => {
    // Container for the floating like hearts — created once, outside React.
    let container = document.getElementById('news-hearts-container') as HTMLDivElement | null
    if (!container) {
      container = document.createElement('div')
      container.id = 'news-hearts-container'
      container.style.cssText =
        'position:fixed;inset:0;z-index:100;pointer-events:none;overflow:hidden;'
      document.body.appendChild(container)
    }
    heartsContainerRef.current = container
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
      if (!userId) return
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
    [supabase, userId]
  )

  const spawnHeart = useCallback((clientX: number, clientY: number) => {
    const container = heartsContainerRef.current
    if (!container) return
    const scale = 0.8 + Math.random() * 0.6
    const size = 80 * scale
    const driftX = (Math.random() - 0.5) * 80
    const rot = (Math.random() - 0.5) * 40

    const el = document.createElement('div')
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
    el.style.cssText = `position:absolute;left:${clientX - size / 2}px;top:${clientY - size / 2}px;width:${size}px;height:${size}px;pointer-events:none;will-change:transform;`

    container.appendChild(el)

    const anim = el.animate(
      [
        { opacity: 1, transform: `scale(0) rotate(0deg) translate(0, 0)` },
        {
          opacity: 1,
          transform: `scale(1.1) rotate(${rot * 0.3}deg) translate(${driftX * 0.15}px, -30px)`,
          offset: 0.12,
        },
        {
          opacity: 1,
          transform: `scale(1) rotate(${rot * 0.6}deg) translate(${driftX * 0.4}px, -80px)`,
          offset: 0.3,
        },
        {
          opacity: 0.6,
          transform: `scale(0.9) rotate(${rot}deg) translate(${driftX * 0.8}px, -200px)`,
          offset: 0.65,
        },
        { opacity: 0, transform: `scale(0.7) rotate(${rot}deg) translate(${driftX}px, -320px)` },
      ],
      {
        duration: 1400,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards',
      }
    )

    anim.onfinish = () => el.remove()
  }, [])

  const likeOnDoubleTap = useCallback(
    (newsId: string, clientX: number, clientY: number) => {
      setNews((prev) => {
        const item = prev.find((n) => n.id === newsId)
        if (item && !item.user_liked) toggleLike(newsId, false)
        return prev // no mutation, just reading current state
      })
      spawnHeart(clientX, clientY)
    },
    [spawnHeart, toggleLike]
  )

  const handleDoubleTap = useCallback(
    (newsId: string, e: React.MouseEvent) => {
      const now = Date.now()
      const lastTap = lastTapRef.current[newsId] || 0
      if (now - lastTap < 300) {
        likeOnDoubleTap(newsId, e.clientX, e.clientY)
        lastTapRef.current[newsId] = 0
      } else {
        lastTapRef.current[newsId] = now
      }
    },
    [likeOnDoubleTap]
  )

  const handleDoubleTapTouch = useCallback(
    (newsId: string, e: React.TouchEvent) => {
      const now = Date.now()
      const lastTap = lastTapRef.current[newsId] || 0
      const touch = e.changedTouches[0]
      if (now - lastTap < 400) {
        likeOnDoubleTap(newsId, touch.clientX, touch.clientY)
        lastTapRef.current[newsId] = 0
      } else {
        lastTapRef.current[newsId] = now
      }
    },
    [likeOnDoubleTap]
  )

  if (news.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Newspaper className="w-8 h-8 text-disabled" />
        </div>
        <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">Jos nema novosti</p>
      </div>
    )
  }

  const [heroItem, ...restItems] = news

  const cardProps = {
    onToggleExpand: toggleExpand,
    onToggleLike: toggleLike,
    onImageError: handleImageError,
    onTap: handleDoubleTap,
    onTouchEnd: handleDoubleTapTouch,
  }

  return (
    <div className="space-y-4 animate-stagger">
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
