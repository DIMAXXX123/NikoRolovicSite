'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Heart } from 'lucide-react'
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

  async function toggleLike(newsId: string, currentlyLiked: boolean) {
    if (!userId) return

    if (currentlyLiked) {
      await supabase
        .from('news_likes')
        .delete()
        .eq('news_id', newsId)
        .eq('user_id', userId)
    } else {
      await supabase
        .from('news_likes')
        .insert({ news_id: newsId, user_id: userId })
    }

    setNews((prev) =>
      prev.map((item) =>
        item.id === newsId
          ? {
              ...item,
              user_liked: !currentlyLiked,
              likes_count: (item.likes_count || 0) + (currentlyLiked ? -1 : 1),
            }
          : item
      )
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {news.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Još nema novosti</p>
        </div>
      ) : (
        news.map((item) => (
          <Card key={item.id} className="border-border/30 bg-card/50 backdrop-blur overflow-hidden animate-slide-up card-hover gradient-overlay glow-hover">
            {item.image_url && (
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
              </div>
            )}
            <CardContent className="p-4 space-y-2">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="text-muted-foreground text-sm line-clamp-3">{item.content}</p>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {item.author && (
                    <>
                      <span>{item.author.first_name} {item.author.last_name}</span>
                      <RoleBadge role={item.author.role || 'student'} />
                    </>
                  )}
                  <span>· {new Date(item.created_at).toLocaleDateString('sr-Latn')}</span>
                </div>
                <button
                  onClick={() => toggleLike(item.id, item.user_liked || false)}
                  className="flex items-center gap-1 text-sm transition-all duration-200 active:scale-110"
                >
                  <Heart
                    className={`w-5 h-5 transition-all ${
                      item.user_liked
                        ? 'fill-red-500 text-red-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <span className={item.user_liked ? 'text-red-500' : 'text-muted-foreground'}>
                    {item.likes_count || 0}
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))
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
