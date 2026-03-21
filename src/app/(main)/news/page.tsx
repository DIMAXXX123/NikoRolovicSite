'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'
import { BetaDisclaimer } from '@/components/beta-disclaimer'
import { RoleBadge } from '@/components/role-badge'
import type { NewsItem } from '@/lib/types'

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set())
  const [heartAnimId, setHeartAnimId] = useState<string | null>(null)
  const lastTapRef = useRef<Record<string, number>>({})
  const heartsContainerRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadNews()
    // Create hearts container once
    let container = document.getElementById('news-hearts-container') as HTMLDivElement | null
    if (!container) {
      container = document.createElement('div')
      container.id = 'news-hearts-container'
      container.style.cssText = 'position:fixed;inset:0;z-index:100;pointer-events:none;overflow:hidden;'
      document.body.appendChild(container)
    }
    heartsContainerRef.current = container
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

  function spawnHeart(clientX: number, clientY: number) {
    const container = heartsContainerRef.current
    if (!container) return
    const scale = 0.8 + Math.random() * 0.6
    const size = 80 * scale
    const driftX = (Math.random() - 0.5) * 80
    const rot = (Math.random() - 0.5) * 40

    const el = document.createElement('div')
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
    el.style.cssText = `position:absolute;left:${clientX - size / 2}px;top:${clientY - size / 2}px;width:${size}px;height:${size}px;pointer-events:none;`

    container.appendChild(el)

    const anim = el.animate([
      { opacity: 1, transform: `scale(0) rotate(0deg) translate(0, 0)` },
      { opacity: 1, transform: `scale(1.1) rotate(${rot * 0.3}deg) translate(${driftX * 0.15}px, -30px)`, offset: 0.12 },
      { opacity: 1, transform: `scale(1) rotate(${rot * 0.6}deg) translate(${driftX * 0.4}px, -80px)`, offset: 0.3 },
      { opacity: 0.6, transform: `scale(0.9) rotate(${rot}deg) translate(${driftX * 0.8}px, -200px)`, offset: 0.65 },
      { opacity: 0, transform: `scale(0.7) rotate(${rot}deg) translate(${driftX}px, -320px)` },
    ], {
      duration: 1400,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards',
    })

    anim.onfinish = () => el.remove()
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
      spawnHeart(e.clientX, e.clientY)
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
          <div key={i} className="rounded-2xl overflow-hidden bg-[#0c0c14] border border-[#1a1a2e]">
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

      {/* Page header */}
      <div className="pt-1 pb-1">
        <h1 className="text-3xl font-bold text-[#e8e8f0] tracking-tight">Novosti</h1>
        <p className="text-sm text-[#6b6b80] mt-1">Najnovije vijesti iz skole</p>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-3xl bg-[#0c0c14] border border-[#1a1a2e] flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-8 h-8 text-[#3d3d50]" />
          </div>
          <p className="text-[#6b6b80] text-sm">Jos nema novosti</p>
        </div>
      ) : (
        <div className="space-y-4 animate-stagger">
          {/* Hero card — first news item with gradient overlay */}
          {heroItem && (
            <article
              key={heroItem.id}
              className="group relative rounded-2xl overflow-hidden cursor-pointer select-none bg-[#0c0c14] border border-[#1a1a2e] transition-all duration-250 hover:border-[#7c5cfc]/30 hover:shadow-[0_8px_32px_rgba(124,92,252,0.08)]"
              onClick={(e) => handleDoubleTap(heroItem.id, e)}
            >
              {heroItem.image_url && (
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={heroItem.image_url}
                    alt={heroItem.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/40 to-transparent" />

                  {heartAnimId === heroItem.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <Heart
                        className="w-32 h-32 md:w-40 md:h-40 fill-red-500 text-red-500 drop-shadow-[0_8px_32px_rgba(239,68,68,0.7)] absolute top-1/2 left-1/2 animate-heart-pop"
                      />
                    </div>
                  )}

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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#5b3fd9] flex items-center justify-center text-xs font-bold text-white shadow-lg">
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md transition-all duration-200 active:scale-[0.97] hover:bg-red-500/20"
                      >
                        <Heart
                          className={`w-5 h-5 transition-all duration-200 ${
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

              {!heroItem.image_url && (
                <div className="relative p-5 space-y-3">
                  {heartAnimId === heroItem.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <Heart
                        className="w-32 h-32 md:w-40 md:h-40 fill-red-500 text-red-500 drop-shadow-[0_8px_32px_rgba(239,68,68,0.7)] absolute top-1/2 left-1/2 animate-heart-pop"
                      />
                    </div>
                  )}
                  <span className="text-xs text-[#6b6b80]">{formatDate(heroItem.created_at)}</span>
                  <h2 className="text-xl font-bold text-[#e8e8f0] leading-snug">{heroItem.title}</h2>
                  <p className="text-[#6b6b80] text-sm leading-relaxed line-clamp-3">{heroItem.content}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-[#1a1a2e]">
                    <div className="flex items-center gap-2.5">
                      {heroItem.author && (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#5b3fd9] flex items-center justify-center text-xs font-bold text-white">
                            {heroItem.author.first_name?.[0]}{heroItem.author.last_name?.[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#e8e8f0]/80">
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-[0.97] hover:bg-red-500/10"
                    >
                      <Heart
                        className={`w-5 h-5 transition-all duration-200 ${
                          heroItem.user_liked
                            ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                            : 'text-[#6b6b80]'
                        }`}
                      />
                      <span className={`text-sm font-medium ${heroItem.user_liked ? 'text-red-400' : 'text-[#6b6b80]'}`}>
                        {heroItem.likes_count || 0}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {heroItem.image_url && heroItem.content && (
                <div className="px-5 py-4">
                  <p className="text-[#6b6b80] text-sm leading-relaxed line-clamp-2">{heroItem.content}</p>
                </div>
              )}
            </article>
          )}

          {/* Regular cards */}
          {restItems.map((item) => (
            <article
              key={item.id}
              className="group relative rounded-2xl overflow-hidden cursor-pointer select-none bg-[#0c0c14] border border-[#1a1a2e] transition-all duration-250 hover:border-[#7c5cfc]/30 hover:shadow-[0_8px_32px_rgba(124,92,252,0.08)]"
              onClick={(e) => handleDoubleTap(item.id, e)}
            >
              {heartAnimId === item.id && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <Heart
                    className="w-24 h-24 fill-red-500 text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] absolute top-1/2 left-1/2 animate-heart-pop"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/60 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md text-[10px] text-white/80 font-medium">
                    {formatDateShort(item.created_at)}
                  </div>
                </div>
              )}

              <div className="p-5 space-y-3">
                <h2 className="text-lg font-bold text-[#e8e8f0] leading-snug">{item.title}</h2>
                <p className="text-[#6b6b80] text-sm leading-relaxed line-clamp-3">{item.content}</p>

                <div className="flex items-center justify-between pt-3 border-t border-[#1a1a2e]">
                  <div className="flex items-center gap-2.5">
                    {item.author && (
                      <>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#5b3fd9] flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                          {item.author.first_name?.[0]}{item.author.last_name?.[0]}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#e8e8f0]/70">
                            {item.author.first_name} {item.author.last_name}
                          </span>
                          <RoleBadge role={item.author.role || 'student'} />
                        </div>
                      </>
                    )}
                    {!item.image_url && (
                      <span className="text-xs text-[#3d3d50]">
                        {formatDate(item.created_at)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLike(item.id, item.user_liked || false)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-[0.97] hover:bg-red-500/10"
                  >
                    <Heart
                      className={`w-4 h-4 transition-all duration-200 ${
                        item.user_liked
                          ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                          : 'text-[#6b6b80]'
                      }`}
                    />
                    <span className={`text-sm font-medium ${item.user_liked ? 'text-red-400' : 'text-[#6b6b80]'}`}>
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
