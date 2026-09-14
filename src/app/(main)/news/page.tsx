import { createClient } from '@/lib/supabase/server'
import { fetchNewsPage, NEWS_PAGE_SIZE } from '@/lib/news-data'
import { NewsFeed } from './news-feed'

// News changes often and depends on the signed-in reader's likes.
export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { items, hasMore } = await fetchNewsPage(supabase, 0, user?.id ?? null)

  return (
    <div className="space-y-6 animate-fade-in pb-4 relative">

      {/* Page header */}
      <div className="pt-1 pb-1">
        <h1 className="text-[26px] leading-[1.2] font-extrabold text-heading tracking-[-0.01em]">Novosti</h1>
        <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground mt-1">Najnovije vijesti iz skole</p>
      </div>

      <NewsFeed
        initialItems={items}
        initialHasMore={hasMore}
        userId={user?.id ?? null}
        pageSize={NEWS_PAGE_SIZE}
      />
    </div>
  )
}
