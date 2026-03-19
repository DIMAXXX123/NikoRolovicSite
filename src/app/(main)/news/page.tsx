'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'
import { BetaDisclaimer } from '@/components/beta-disclaimer'
import { RoleBadge } from '@/components/role-badge'
import type { NewsItem } from '@/lib/types'

interface FloatingHeart {
  id: number
  x: number
  y: number
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set())
  const [heartAnimId, setHeartAnimId] = useState<string | null>(null)
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([])
  const lastTapRef = useRef<Record<string, number>>({})
  const heartKeyRef = useRef(0)
  const supabase = createClient()

  useEffect(() => {
    loadNews()
  }, [])

  async function loadNews() {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user?.id || null)

    const { data: newsData } = await supabase
      .from('news')
      .select('*, author:profiles!author_id(first_name, last_name, role)')
      .order('created_at', { ascending: false })

    if (newsData) {
      const newsWithLikes = await Promise.all(
        newsData.map(async (item: any) => {
          const { count } = await supabase
            .from('news_likes')
            .select('*', { count: 'exact', head: true })
            .eq('news_id', item.id)

          let userLiked = false
          if (user) {
            const { data: liked } = await supabase
              .from('news_likes')
              .select('id')
              .eq('news_id', item.id)
              .eq('user_id', user.id)
              .single()
            userLiked = !!liked
          }

          return {
            ...item,
            likes_count: count || 0,
            user_liked: userLiked,
          }
        })
      )
      setNews(newsWithLikes)
    }
    setLoading(false)
  }

  async function toggleLike(newsId: string, currentlyLiked: boolean) {
    if (!userId) return
    if (likingIds.has(newsId)) return

    setLikingIds((prev) => new Set(prev).add(newsId))

    setNews((prev) =>
      prev.map((item) =>
        item.id === newsId
          ? {
              ...item,
              user_liked: !currentlyLiked,
              likes_count: Math.max(0, (item.likes_count || 0) + (currentlyLiked ? -1 : 1)),
            }
          : item
      )
    )

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
      setNews((prev) =>
        prev.map((item) =>
          item.id === newsId
            ? {
                ...item,
                user_liked: currentlyLiked,
                likes_count: Math.max(0, (item.likes_count || 0) + (currentlyLiked ? 1 : -1)),
              }
            : item
        )
      )
    } finally {
      setLikingIds((prev) => {
        const next = new Set(prev)
        next.delete(newsId)
        return next
      })
    }
  }

  function spawnFloatingHearts(e: React.MouseEvent | React.TouchEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const hearts: FloatingHeart[] = []
    for (let i = 0; i < 3; i++) {
      heartKeyRef.current++
      hearts.push({
        id: heartKeyRef.current,
        x: rect.width / 2 + (Math.random() - 0.5) * 40,
        y: rect.height / 2 + (Math.random() - 0.5) * 20,
      })
    }
    setFloatingHearts(prev => [...prev, ...hearts])
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => !hearts.find(nh => nh.id === h.id)))
    }, 1100)
  }

  function handleDoubleTap(newsId: string, e: React.MouseEvent) {
    const now = Date.now()
    const lastTap = lastTapRef.current[newsId] || 0

    if (now - lastTap < 300) {
      const item = news.find((n) => n.id === newsId)
      if (item && !item.user_liked) {
        toggleLike(newsId, false)
      }
      setHeartAnimId(newsId)
      spawnFloatingHearts(e)
      setTimeout(() => setHeartAnimId(null), 600)
      lastTapRef.current[newsId] = 0
    } else {
      lastTapRef.current[newsId] = now
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('sr-Latn', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  function formatDateShort(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('sr-Latn', {
      day: 'numeric',
      month: 'short',
    })
  }

  if (loading) {
    return (
      <div className="space-y-4 pt-2">
        <div className="space-y-1 mb-6">
          <div className="h-8 w-32 skeleton" />
          <div className="h-4 w-48 skeleton" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="h-48 skeleton" style={{ borderRadius: 0 }} />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 skeleton" />
              <div className="h-4 w-full skeleton" />
              <div className="h-4 w-2/3 skeleton" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const heroItem = news.length > 0 ? news[0] : null
  const restItems = news.length > 1 ? news.slice(1) : []

  return (
    <div className="space-y-6 animate-fade-in pb-4 relative">
      <BetaDisclaimer />

      {/* Floating hearts container */}
      {floatingHearts.map(h => (
        <div
          key={h.id}
          className="fixed pointer-events-none z-[100]"
          style={{ left: h.x, top: h.y }}
        >
          <Heart className="w-6 h-6 fill-red-500 text-red-500 animate-heart-float" />
        </div>
      ))}

      {/* Page header */}
      <div className="pt-1 pb-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Novosti</h1>
        <p className="text-sm text-muted-foreground mt-1">Najnovije vijesti iz skole</p>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground text-sm">Jos nema novosti</p>
        </div>
      ) : (
        <div className="space-y-4 animate-stagger">
          {/* Hero card - first news item */}
          {heroItem && (
            <article
              key={heroItem.id}
              className="group relative rounded-2xl overflow-hidden cursor-pointer select-none v4-card"
              style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.03) inset',
              }}
              onClick={(e) => handleDoubleTap(heroItem.id, e)}
            >
              {heroItem.image_url && (
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={heroItem.image_url}
                    alt={heroItem.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                  {/* Heart animation overlay */}
                  {heartAnimId === heroItem.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <Heart
                        className="w-20 h-20 fill-red-500 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)] absolute top-1/2 left-1/2 animate-heart-pop"
                      />
                    </div>
                  )}

                  {/* Overlaid content at bottom of image */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-xl bg-white/10 backdrop-blur-md text-[11px] text-white/80 font-medium">
                        {formatDateShort(heroItem.created_at)}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white leading-snug mb-3 drop-shadow-lg">
                      {heroItem.title}
                    </h2>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {heroItem.author && (
                          <>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shadow-lg">
                              {heroItem.author.first_name?.[0]}{heroItem.author.last_name?.[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-white/90">
                                {heroItem.author.first_name} {heroItem.author.last_name}
                              </span>
                              <RoleBadge role={heroItem.author.role || 'student'} />
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLike(heroItem.id, heroItem.user_liked || false)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md transition-all duration-200 active:scale-110 hover:bg-red-500/20"
                      >
                        <Heart
                          className={`w-5 h-5 transition-all duration-300 ${
                            heroItem.user_liked
                              ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                              : 'text-white/70'
                          }`}
                        />
                        <span className={`text-sm font-medium ${heroItem.user_liked ? 'text-red-400' : 'text-white/70'}`}>
                          {heroItem.likes_count || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* If no image, show content in card body */}
              {!heroItem.image_url && (
                <div className="relative p-5 space-y-3">
                  {heartAnimId === heroItem.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <Heart
                        className="w-20 h-20 fill-red-500 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)] absolute top-1/2 left-1/2 animate-heart-pop"
                      />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(heroItem.created_at)}</span>
                  <h2 className="text-xl font-bold text-foreground leading-snug">{heroItem.title}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{heroItem.content}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      {heroItem.author && (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
                            {heroItem.author.first_name?.[0]}{heroItem.author.last_name?.[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground/80">
                              {heroItem.author.first_name} {heroItem.author.last_name}
                            </span>
                            <RoleBadge role={heroItem.author.role || 'student'} />
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLike(heroItem.id, heroItem.user_liked || false)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-110 hover:bg-red-500/10"
                    >
                      <Heart
                        className={`w-5 h-5 transition-all duration-300 ${
                          heroItem.user_liked
                            ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <span className={`text-sm font-medium ${heroItem.user_liked ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {heroItem.likes_count || 0}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Content preview below image for hero */}
              {heroItem.image_url && heroItem.content && (
                <div className="px-5 py-4">
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{heroItem.content}</p>
                </div>
              )}
            </article>
          )}

          {/* Regular cards */}
          {restItems.map((item) => (
            <article
              key={item.id}
              className="group relative rounded-2xl overflow-hidden cursor-pointer select-none v4-card"
              onClick={(e) => handleDoubleTap(item.id, e)}
            >
              {/* Heart animation overlay */}
              {heartAnimId === item.id && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <Heart
                    className="w-16 h-16 fill-red-500 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)] absolute top-1/2 left-1/2 animate-heart-pop"
                  />
                </div>
              )}

              {item.image_url && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md text-[10px] text-white/80 font-medium">
                    {formatDateShort(item.created_at)}
                  </div>
                </div>
              )}

              <div className="p-5 space-y-3">
                <h2 className="text-lg font-bold text-foreground leading-snug">{item.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{item.content}</p>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    {item.author && (
                      <>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                          {item.author.first_name?.[0]}{item.author.last_name?.[0]}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground/70">
                            {item.author.first_name} {item.author.last_name}
                          </span>
                          <RoleBadge role={item.author.role || 'student'} />
                        </div>
                      </>
                    )}
                    {!item.image_url && (
                      <span className="text-xs text-muted-foreground/50">
                        {formatDate(item.created_at)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLike(item.id, item.user_liked || false)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-110 hover:bg-red-500/10"
                  >
                    <Heart
                      className={`w-4 h-4 transition-all duration-300 ${
                        item.user_liked
                          ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <span className={`text-sm font-medium ${item.user_liked ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {item.likes_count || 0}
                    </span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function Newspaper({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
    </svg>
  )
}
