'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RoleBadge } from '@/components/role-badge'
import { LikeButton, useTapLike } from '@/components/tap-like'
import { isOptimizableImage } from '@/lib/remote-image'
import type { NewsItem } from '@/lib/types'

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

interface CardProps {
  item: NewsItem
  expanded: boolean
  showImage: boolean
  priority: boolean
  onToggleExpand: (id: string) => void
  onToggleLike: (id: string, currentlyLiked: boolean) => void
  onImageError: (id: string) => void
}

/**
 * TikTok tap rules on the card: double tap likes (never unlikes) and shows a
 * heart; a single tap toggles the expanded text after the 300 ms wait.
 */
function useCardTap(
  item: NewsItem,
  onToggleExpand: (id: string) => void,
  onToggleLike: (id: string, currentlyLiked: boolean) => void
) {
  const liked = !!item.user_liked
  const onLike = useCallback(() => {
    if (!liked) onToggleLike(item.id, false)
  }, [item.id, liked, onToggleLike])
  const onSingleTap = useCallback(() => onToggleExpand(item.id), [item.id, onToggleExpand])
  return useTapLike({ onLike, onSingleTap })
}

function CoverImage({
  item,
  priority,
  onImageError,
}: {
  item: NewsItem
  priority: boolean
  onImageError: (id: string) => void
}) {
  return (
    <Image
      src={item.image_url!}
      alt={item.title}
      fill
      // The content column is capped at 448px; ask for a matching source.
      sizes="(max-width: 480px) 100vw, 448px"
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      unoptimized={!isOptimizableImage(item.image_url)}
      className="object-cover"
      // A native image drag would cancel the pointer gesture (mouse double tap on the cover).
      draggable={false}
      onError={() => onImageError(item.id)}
    />
  )
}

// Role-tinted fallback initials (§4.7): student blue, moderator orange, admin red, creator purple.
const AVATAR_TINT: Record<string, string> = {
  student: 'bg-secondary-light text-secondary',
  moderator: 'bg-[#FFF0E0] text-orange',
  admin: 'bg-[#FFDFE0] text-[#EA2B2B]',
  creator: 'bg-[#F3E3FF] text-accent-dark',
}

function AuthorChip({ item, size }: { item: NewsItem; size: 'lg' | 'sm' }) {
  if (!item.author) return null
  const avatar = size === 'lg' ? 'w-8 h-8 text-xs' : 'w-7 h-7 text-[10px]'
  const tint = AVATAR_TINT[item.author.role || 'student'] || AVATAR_TINT.student
  return (
    <>
      <div
        className={`${avatar} rounded-full border-2 border-border ${tint} flex items-center justify-center font-extrabold shrink-0`}
      >
        {item.author.first_name?.[0]}
        {item.author.last_name?.[0]}
      </div>
      <div className={size === 'lg' ? 'flex flex-col gap-0.5' : 'flex items-center gap-2'}>
        <span
          className={
            size === 'lg'
              ? 'text-[13px] font-bold text-foreground'
              : 'text-[12px] font-bold text-muted-foreground'
          }
        >
          {item.author.first_name} {item.author.last_name}
        </span>
        <RoleBadge role={item.author.role || 'student'} />
      </div>
    </>
  )
}

function ExpandToggle({
  item,
  expanded,
  onToggleExpand,
  threshold,
}: {
  item: NewsItem
  expanded: boolean
  onToggleExpand: (id: string) => void
  threshold: number
}) {
  if (!item.content || item.content.length <= threshold) return null
  return (
    <Button
      variant="link"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        onToggleExpand(item.id)
      }}
      className="h-11 px-0 text-[12px]"
    >
      {expanded ? 'Prikaži manje' : 'Prikaži više'}
    </Button>
  )
}

// §4.2 card look on a semantic <article> (kept from the original markup).
const ARTICLE_CLASS =
  'relative flex flex-col gap-3 overflow-hidden rounded-2xl border-2 border-border bg-card p-4 text-[15px] font-bold text-card-foreground shadow-[0_2px_0_var(--color-border)] cursor-pointer select-none active:translate-y-[2px] active:shadow-none transition-[transform,box-shadow] duration-[80ms]'

const BODY_CLASS = 'text-[15px] leading-[1.5] font-bold text-foreground'

export function NewsHeroCard({
  item,
  expanded,
  showImage,
  priority,
  onToggleExpand,
  onToggleLike,
  onImageError,
}: CardProps) {
  const { surfaceProps } = useCardTap(item, onToggleExpand, onToggleLike)
  return (
    <article className={ARTICLE_CLASS} data-news-id={item.id} {...surfaceProps}>
      {showImage && (
        <div className="relative h-64 rounded-xl overflow-hidden border-2 border-border">
          <CoverImage item={item} priority={priority} onImageError={onImageError} />
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="outline">{formatDateShort(item.created_at)}</Badge>
          </div>
        </div>
      )}

      {!showImage && (
        <div>
          <Badge variant="outline">{formatDate(item.created_at)}</Badge>
        </div>
      )}

      <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">{item.title}</h2>

      {item.content && (
        <div>
          <p className={`${BODY_CLASS} ${expanded ? '' : showImage ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {item.content}
          </p>
          <ExpandToggle
            item={item}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            threshold={showImage ? 120 : 150}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t-2 border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <AuthorChip item={item} size="lg" />
        </div>
        <LikeButton
          liked={!!item.user_liked}
          count={item.likes_count || 0}
          onToggle={() => onToggleLike(item.id, item.user_liked || false)}
          size={showImage ? 'md' : 'sm'}
        />
      </div>
    </article>
  )
}

export function NewsRegularCard({
  item,
  expanded,
  showImage,
  priority,
  onToggleExpand,
  onToggleLike,
  onImageError,
}: CardProps) {
  const { surfaceProps } = useCardTap(item, onToggleExpand, onToggleLike)
  return (
    <article className={ARTICLE_CLASS} data-news-id={item.id} {...surfaceProps}>
      {showImage && (
        <div className="relative h-48 rounded-xl overflow-hidden border-2 border-border">
          <CoverImage item={item} priority={priority} onImageError={onImageError} />
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="outline">{formatDateShort(item.created_at)}</Badge>
          </div>
        </div>
      )}

      <h2 className="text-[17px] leading-[1.3] font-extrabold text-heading">{item.title}</h2>

      <div>
        <p className={`${BODY_CLASS} ${expanded ? '' : 'line-clamp-3'}`}>
          {item.content}
        </p>
        <ExpandToggle
          item={item}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          threshold={150}
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t-2 border-border">
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <AuthorChip item={item} size="sm" />
          {!showImage && (
            <span className="text-[12px] font-bold text-muted-foreground">{formatDate(item.created_at)}</span>
          )}
        </div>
        <LikeButton
          liked={!!item.user_liked}
          count={item.likes_count || 0}
          onToggle={() => onToggleLike(item.id, item.user_liked || false)}
          size="sm"
        />
      </div>
    </article>
  )
}
