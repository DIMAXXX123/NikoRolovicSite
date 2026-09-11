'use client'

import Image from 'next/image'
import { Heart } from 'lucide-react'
import { RoleBadge } from '@/components/role-badge'
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
  onTap: (id: string, e: React.MouseEvent) => void
  onTouchEnd: (id: string, e: React.TouchEvent) => void
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
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      style={{ willChange: 'transform' }}
      onError={() => onImageError(item.id)}
    />
  )
}

function LikeButton({
  item,
  onToggleLike,
  variant,
}: {
  item: NewsItem
  onToggleLike: (id: string, currentlyLiked: boolean) => void
  variant: 'overlay' | 'plain'
}) {
  const iconSize = variant === 'overlay' ? 'w-5 h-5' : 'w-4 h-4'
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggleLike(item.id, item.user_liked || false)
      }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-[0.97] ${
        variant === 'overlay'
          ? 'bg-white/10 backdrop-blur-md hover:bg-red-500/20'
          : 'hover:bg-red-500/10'
      }`}
    >
      <Heart
        className={`${iconSize} transition-all duration-200 ${
          item.user_liked
            ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'
            : variant === 'overlay'
              ? 'text-white/70'
              : 'text-[#6b6b80]'
        }`}
      />
      <span
        className={`text-sm font-medium ${
          item.user_liked ? 'text-red-400' : variant === 'overlay' ? 'text-white/70' : 'text-[#6b6b80]'
        }`}
      >
        {item.likes_count || 0}
      </span>
    </button>
  )
}

function AuthorChip({ item, size }: { item: NewsItem; size: 'lg' | 'sm' }) {
  if (!item.author) return null
  const avatar = size === 'lg' ? 'w-8 h-8 text-xs' : 'w-7 h-7 text-[10px]'
  return (
    <>
      <div
        className={`${avatar} rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#5b3fd9] flex items-center justify-center font-bold text-white shadow-md`}
      >
        {item.author.first_name?.[0]}
        {item.author.last_name?.[0]}
      </div>
      <div className={size === 'lg' ? 'flex flex-col' : 'flex items-center gap-2'}>
        <span
          className={
            size === 'lg'
              ? 'text-sm font-medium text-[#e8e8f0]/90'
              : 'text-xs font-medium text-[#e8e8f0]/70'
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
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggleExpand(item.id)
      }}
      className="text-[#7c5cfc] text-xs font-medium hover:text-[#9b82fc] transition-colors"
    >
      {expanded ? 'Prikaži manje' : 'Prikaži više'}
    </button>
  )
}

const ARTICLE_CLASS =
  'group relative rounded-2xl overflow-hidden cursor-pointer select-none bg-[#0c0c14] border border-[#1a1a2e] transition-all duration-250 hover:border-[#7c5cfc]/30 hover:shadow-[0_8px_32px_rgba(124,92,252,0.08)]'

export function NewsHeroCard({
  item,
  expanded,
  showImage,
  priority,
  onToggleExpand,
  onToggleLike,
  onImageError,
  onTap,
  onTouchEnd,
}: CardProps) {
  return (
    <article
      className={ARTICLE_CLASS}
      style={{ willChange: 'transform' }}
      onClick={(e) => onTap(item.id, e)}
      onTouchEnd={(e) => onTouchEnd(item.id, e)}
    >
      {showImage && (
        <div className="relative h-72 overflow-hidden">
          <CoverImage item={item} priority={priority} onImageError={onImageError} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-xl bg-white/10 backdrop-blur-md text-[11px] text-white/80 font-medium">
                {formatDateShort(item.created_at)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-snug mb-3 drop-shadow-lg break-words">
              {item.title}
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AuthorChip item={item} size="lg" />
              </div>
              <LikeButton item={item} onToggleLike={onToggleLike} variant="overlay" />
            </div>
          </div>
        </div>
      )}

      {showImage && item.content && (
        <div className="px-5 py-4">
          <p className={`text-[#6b6b80] text-sm leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {item.content}
          </p>
          <div className="mt-1.5">
            <ExpandToggle
              item={item}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              threshold={120}
            />
          </div>
        </div>
      )}

      {!showImage && (
        <div className="relative p-5 space-y-3">
          <span className="text-xs text-[#6b6b80]">{formatDate(item.created_at)}</span>
          <h2 className="text-xl font-bold text-[#e8e8f0] leading-snug break-words">{item.title}</h2>
          <p className={`text-[#6b6b80] text-sm leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {item.content}
          </p>
          <ExpandToggle
            item={item}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            threshold={150}
          />
          <div className="flex items-center justify-between pt-3 border-t border-[#1a1a2e]">
            <div className="flex items-center gap-2.5">
              <AuthorChip item={item} size="lg" />
            </div>
            <LikeButton item={item} onToggleLike={onToggleLike} variant="plain" />
          </div>
        </div>
      )}
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
  onTap,
  onTouchEnd,
}: CardProps) {
  return (
    <article
      className={ARTICLE_CLASS}
      style={{ willChange: 'transform' }}
      onClick={(e) => onTap(item.id, e)}
      onTouchEnd={(e) => onTouchEnd(item.id, e)}
    >
      {showImage && (
        <div className="relative h-48 overflow-hidden">
          <CoverImage item={item} priority={priority} onImageError={onImageError} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/60 via-transparent to-transparent" />
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md text-[10px] text-white/80 font-medium">
            {formatDateShort(item.created_at)}
          </div>
        </div>
      )}

      <div className="p-5 space-y-3">
        <h2 className="text-lg font-bold text-[#e8e8f0] leading-snug break-words">{item.title}</h2>
        <p className={`text-[#6b6b80] text-sm leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {item.content}
        </p>
        <ExpandToggle
          item={item}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          threshold={150}
        />

        <div className="flex items-center justify-between pt-3 border-t border-[#1a1a2e]">
          <div className="flex items-center gap-2.5">
            <AuthorChip item={item} size="sm" />
            {!showImage && (
              <span className="text-xs text-[#3d3d50]">{formatDate(item.created_at)}</span>
            )}
          </div>
          <LikeButton item={item} onToggleLike={onToggleLike} variant="plain" />
        </div>
      </div>
    </article>
  )
}
