import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewsItem } from '@/lib/types'

export const NEWS_PAGE_SIZE = 8

const NEWS_SELECT = '*, author:profiles!author_id(first_name, last_name, role)'

export interface NewsPage {
  items: NewsItem[]
  hasMore: boolean
}

interface NewsLikeRow {
  news_id: string
  user_id: string
}

/**
 * Fetch one page of news together with like counts.
 *
 * Likes are resolved with a single `in(...)` query instead of two queries per
 * item, so a page costs 2 round trips no matter how many articles it holds.
 * Works with both the server and the browser Supabase client.
 */
export async function fetchNewsPage(
  supabase: SupabaseClient,
  page: number,
  userId: string | null,
  pageSize: number = NEWS_PAGE_SIZE
): Promise<NewsPage> {
  const from = page * pageSize
  // Ask for one extra row to learn whether another page exists.
  const { data } = await supabase
    .from('news')
    .select(NEWS_SELECT)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize)

  const rows = (data ?? []) as unknown as NewsItem[]
  const hasMore = rows.length > pageSize
  const items = hasMore ? rows.slice(0, pageSize) : rows

  if (items.length === 0) return { items, hasMore: false }

  const { data: likeData } = await supabase
    .from('news_likes')
    .select('news_id, user_id')
    .in('news_id', items.map((item) => item.id))

  const likeRows = (likeData ?? []) as NewsLikeRow[]
  const counts = new Map<string, number>()
  const liked = new Set<string>()
  for (const row of likeRows) {
    counts.set(row.news_id, (counts.get(row.news_id) ?? 0) + 1)
    if (userId && row.user_id === userId) liked.add(row.news_id)
  }

  return {
    items: items.map((item) => ({
      ...item,
      likes_count: counts.get(item.id) ?? 0,
      user_liked: liked.has(item.id),
    })),
    hasMore,
  }
}
