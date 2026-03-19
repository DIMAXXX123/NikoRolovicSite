'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'
import { BetaDisclaimer } from '@/components/beta-disclaimer'
import { RoleBadge } from '@/components/role-badge'
import type { NewsItem } from '@/lib/types'

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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

  const [likingIds, setLikingIds] = useState<Set<string>>(new Set())

  async function toggleLike(newsId: string, currentlyLiked: boolean) {
    if (!userId) return
    if (likingIds.has(newsId)) return // prevent double-click

    setLikingIds((prev) => new Set(prev).add(newsId))

    // Optimistic update
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
      // Revert on error
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

  if (loading) {
    return (
      <div className="space-y-4 pt-2">
        <div className="space-y-1 mb-6">
          <div className="h-8 w-32 skeleton" />
          <div className="h-4 w-48 skeleton" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden">
            <div className="h-48 skeleton" />
            <div className="p-4 space-y-3 bg-card/30 rounded-b-2xl">
              <div className="h-5 w-3/4 skeleton" />
              <div className="h-4 w-full skeleton" />
              <div className="h-4 w-2/3 skeleton" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <BetaDisclaimer />

      {/* Page header */}
      <div className="pt-1 pb-2">
        <h1 className="text-2xl font-bold gradient-text">Novosti</h1>
        <p className="text-xs text-muted-foreground mt-1">Najnovije vijesti iz škole</p>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground text-sm">Još nema novosti</p>
        </div>
      ) : (
        <div className="space-y-4 animate-stagger">
          {news.map((item) => (
            <article
              key={item.id}
              className="group rounded-2xl overflow-hidden bg-card/40 backdrop-blur-sm border border-white/[0.04] transition-all duration-300 hover:border-purple-500/15 hover:shadow-[0_8px_32px_-8px_rgba(167,139,250,0.12)] active:scale-[0.98]"
            >
              {item.image_url && (
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  {/* Date badge on image */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md text-[10px] text-white/80 font-medium">
                    {new Date(item.created_at).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              )}
              <div className="p-5 space-y-3">
                <h2 className="text-lg font-bold leading-snug">{item.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{item.content}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.author && (
                      <>
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-600/20 flex items-center justify-center text-[10px] font-bold text-purple-300">
                          {item.author.first_name?.[0]}{item.author.last_name?.[0]}
                        </div>
                        <span className="font-medium text-foreground/70">{item.author.first_name} {item.author.last_name}</span>
                        <RoleBadge role={item.author.role || 'student'} />
                      </>
                    )}
                    {!item.image_url && (
                      <span className="text-muted-foreground/50">· {new Date(item.created_at).toLocaleDateString('sr-Latn')}</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleLike(item.id, item.user_liked || false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-110 hover:bg-red-500/10"
                  >
                    <Heart
                      className={`w-4.5 h-4.5 transition-all duration-300 ${
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
