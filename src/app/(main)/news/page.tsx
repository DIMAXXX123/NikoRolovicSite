import { createClient } from '@/lib/supabase/server'
import { fetchNewsPage, NEWS_PAGE_SIZE } from '@/lib/news-data'
import { BetaDisclaimer } from '@/components/beta-disclaimer'
import { NewsFeed } from './news-feed'

// News changes often and depends on the signed-in reader's likes.
export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { items, hasMore } = await fetchNewsPage(supabase, 0, user?.id ?? null)

  return (
    <div className="space-y-6 animate-fade-in pb-4 relative">
      <BetaDisclaimer />

      {/* Page header */}
      <div className="pt-1 pb-1">
        <h1 className="text-3xl font-bold text-[#e8e8f0] tracking-tight">Novosti</h1>
        <p className="text-sm text-[#6b6b80] mt-1">Najnovije vijesti iz skole</p>
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
