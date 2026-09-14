'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Camera, X, Send, Heart, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { isOptimizableImage } from '@/lib/remote-image'
import type { Photo, Profile } from '@/lib/types'

const PHOTOS_PAGE_SIZE = 9

type GalleryPhoto = Photo & { user?: Profile; anonymous?: boolean; _new?: boolean }

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [photoPage, setPhotoPage] = useState(0)
  const [hasMorePhotos, setHasMorePhotos] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [anonymous, setAnonymous] = useState(false)
  const [toast, setToast] = useState('')
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({})
  const heartsContainerRef = useRef<HTMLDivElement | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [showReportConfirm, setShowReportConfirm] = useState<string | null>(null)
  const [reportCooldown, setReportCooldown] = useState(false)
  const [newPhotosCount, setNewPhotosCount] = useState(0)
  const lastTapRef = useRef<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      await loadCurrentUser()
      await loadPhotos()
    }
    init()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('gallery-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'photos', filter: 'status=eq.approved' },
        async (payload: { new: Photo }) => {
          const newPhoto = payload.new
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, class_number, section_number, role')
            .eq('id', newPhoto.user_id)
            .single()
          const photoWithUser: GalleryPhoto = { ...newPhoto, user: profile || undefined }
          setPhotos((prev) => [photoWithUser, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos' },
        async (payload: { new: Photo }) => {
          const updated = payload.new
          if (updated.status === 'approved') {
            // Show "new photos" button instead of auto-adding
            setNewPhotosCount(prev => prev + 1)
            // Still add to list in background
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name, class_number, section_number, role')
              .eq('id', updated.user_id)
              .single()
            const photoWithUser: GalleryPhoto = { ...updated, user: profile || undefined, _new: true }
            setPhotos((prev) => {
              if (prev.some((p) => p.id === updated.id)) return prev
              return [photoWithUser, ...prev]
            })
            loadLikeCounts([updated.id])
          } else if (updated.status === 'rejected') {
            setPhotos((prev) => prev.filter(p => p.id !== updated.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      const { data: userLikes } = await supabase
        .from('photo_likes')
        .select('photo_id')
        .eq('user_id', user.id)
      if (userLikes) {
        const liked: Record<string, boolean> = {}
        userLikes.forEach((l: { photo_id: string }) => { liked[l.photo_id] = true })
        setLikedPhotos(liked)
      }
    }
  }

  // One query for the whole page instead of one per photo.
  async function loadLikeCounts(photoIds: string[]) {
    if (photoIds.length === 0) return
    const { data } = await supabase
      .from('photo_likes')
      .select('photo_id')
      .in('photo_id', photoIds)
    const counts: Record<string, number> = {}
    for (const id of photoIds) counts[id] = 0
    for (const row of (data || []) as { photo_id: string }[]) {
      counts[row.photo_id] = (counts[row.photo_id] || 0) + 1
    }
    setLikeCounts((prev) => ({ ...prev, ...counts }))
  }

  async function fetchPhotoPage(page: number) {
    const from = page * PHOTOS_PAGE_SIZE
    // Ask for one extra row to find out whether another page exists.
    const { data } = await supabase
      .from('photos')
      .select('*, user:profiles!user_id(first_name, last_name, class_number, section_number, role)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, from + PHOTOS_PAGE_SIZE)
    const rows = (data || []) as GalleryPhoto[]
    return { rows: rows.slice(0, PHOTOS_PAGE_SIZE), hasMore: rows.length > PHOTOS_PAGE_SIZE }
  }

  async function loadPhotos() {
    const { rows, hasMore } = await fetchPhotoPage(0)
    setPhotos(rows)
    setPhotoPage(0)
    setHasMorePhotos(hasMore)
    loadLikeCounts(rows.map((p) => p.id))
    setLoading(false)
  }

  async function loadMorePhotos() {
    if (loadingMore || !hasMorePhotos) return
    setLoadingMore(true)
    const nextPage = photoPage + 1
    try {
      const { rows, hasMore } = await fetchPhotoPage(nextPage)
      setPhotos((prev) => {
        const seen = new Set(prev.map((p) => p.id))
        return [...prev, ...rows.filter((p) => !seen.has(p.id))]
      })
      setHasMorePhotos(hasMore)
      setPhotoPage(nextPage)
      loadLikeCounts(rows.map((p) => p.id))
    } finally {
      setLoadingMore(false)
    }
  }

  async function toggleLike(photoId: string) {
    if (!currentUserId) return
    const wasLiked = !!likedPhotos[photoId]
    const prevCounts = { ...likeCounts }
    const prevLiked = { ...likedPhotos }

    const updated = { ...likedPhotos }
    if (wasLiked) { delete updated[photoId] } else { updated[photoId] = true }
    setLikedPhotos(updated)
    setLikeCounts((prev) => ({ ...prev, [photoId]: Math.max(0, (prev[photoId] || 0) + (wasLiked ? -1 : 1)) }))

    try {
      if (wasLiked) {
        const { error } = await supabase.from('photo_likes').delete().eq('photo_id', photoId).eq('user_id', currentUserId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('photo_likes').upsert({ photo_id: photoId, user_id: currentUserId }, { onConflict: 'photo_id,user_id' })
        if (error) throw error
      }
    } catch {
      setLikedPhotos(prevLiked)
      setLikeCounts(prevCounts)
    }
  }

  async function handleReport(photoId: string) {
    const reportsRaw = localStorage.getItem('photo_reports_log')
    const reportsLog: number[] = reportsRaw ? JSON.parse(reportsRaw) : []
    const oneHourAgo = Date.now() - 3600000
    const recentReports = reportsLog.filter((t) => t > oneHourAgo)

    if (recentReports.length >= 5) {
      setReportCooldown(true)
      setTimeout(() => setReportCooldown(false), 3000)
      setShowReportConfirm(null)
      return
    }

    try {
      // Get reporter name from auth
      const { data: { user } } = await supabase.auth.getUser()
      let reporterName = 'Nepoznat korisnik'
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
        if (profile) reporterName = `${profile.first_name} ${profile.last_name}`
      }

      const photo = photos.find((p) => p.id === photoId)
      const photoOwner = photo?.user ? `${photo.user.first_name} ${photo.user.last_name}` : 'Nepoznat'

      // Send report to Telegram with delete/keep buttons
      const BOT_TOKEN = '8702912868:AAEx02wKRq57WNRNFbrYq7KW9tCerPtDCTM'
      const ADMIN_ID = '6829550617'
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          photo: photo?.image_url || '',
          caption: `⚠️ REPORT\n\n👤 Prijavio: ${reporterName}\n📸 Autor: ${photoOwner}\n🆔 ${photoId}`,
          reply_markup: {
            inline_keyboard: [[
              { text: '🗑 Obriši', callback_data: `reject_${photoId}` },
              { text: '✅ Ostavi', callback_data: `approve_${photoId}` },
            ]],
          },
        }),
      })
    } catch {}

    recentReports.push(Date.now())
    localStorage.setItem('photo_reports_log', JSON.stringify(recentReports))
    setShowReportConfirm(null)
    setToast('Fotografija prijavljena ⚠️')
    setTimeout(() => setToast(''), 3000)
  }

  // Ensure hearts container exists in DOM (created once, never re-rendered)
  useEffect(() => {
    let container = document.getElementById('floating-hearts-container') as HTMLDivElement | null
    if (!container) {
      container = document.createElement('div')
      container.id = 'floating-hearts-container'
      container.style.cssText = 'position:fixed;inset:0;z-index:100;pointer-events:none;overflow:hidden;'
      document.body.appendChild(container)
    }
    heartsContainerRef.current = container
    return () => {
      // Don't remove — might still have hearts animating
    }
  }, [])

  const spawnHeart = useCallback((clientX: number, clientY: number) => {
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
  }, [])

  const handleDoubleTap = useCallback((photoId: string, e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now()
    const lastTap = lastTapRef.current[photoId] || 0

    // Get tap coordinates
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.changedTouches?.[0]?.clientX ?? 0
      clientY = e.changedTouches?.[0]?.clientY ?? 0
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    if (now - lastTap < 300) {
      // Double tap — like + heart
      if (!likedPhotos[photoId]) {
        toggleLike(photoId)
      }
      spawnHeart(clientX, clientY)
      lastTapRef.current[photoId] = 0
    } else {
      lastTapRef.current[photoId] = now
    }
  }, [likedPhotos, spawnHeart])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = selectedFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, selectedFile)

    if (uploadError) {
      setToast('Greška pri uploadu')
      setUploading(false)
      setTimeout(() => setToast(''), 3000)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName)

    const insertData: Record<string, unknown> = {
      image_url: publicUrl,
      caption: caption || null,
      user_id: user.id,
      status: 'pending',
    }
    try { insertData.anonymous = anonymous } catch {}

    const { data: photoData } = await supabase.from('photos').insert(insertData).select('id').single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    if (photoData) {
      try {
        await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoId: photoData.id,
            imageUrl: publicUrl,
            userName: profile ? `${profile.first_name} ${profile.last_name}` : 'Nepoznat',
            caption: caption || '',
          }),
        })
      } catch {}
    }

    setShowUpload(false)
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
    setAnonymous(false)
    setUploading(false)
    setToast('Fotografija poslata na moderaciju 📸')
    setTimeout(() => setToast(''), 3000)
  }

  function isAnon(photo: GalleryPhoto) {
    return photo.anonymous === true
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'upravo'
    if (diffMins < 60) return `pre ${diffMins} min`
    if (diffHours < 24) return `pre ${diffHours}h`
    if (diffDays < 7) return `pre ${diffDays}d`
    return d.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' })
  }

  function getInitials(photo: GalleryPhoto) {
    if (isAnon(photo) || !photo.user) return '?'
    const first = photo.user.first_name?.[0] || ''
    const last = photo.user.last_name?.[0] || ''
    return (first + last).toUpperCase()
  }

  function getDisplayName(photo: GalleryPhoto) {
    if (isAnon(photo)) return 'Anonimno'
    if (!photo.user) return 'Nepoznat'
    return `${photo.user.first_name} ${photo.user.last_name}`
  }

  // Role-tinted initials (§4.7): student blue, moderator orange, admin red, creator purple.
  function getAvatarTint(photo: GalleryPhoto) {
    if (isAnon(photo) || !photo.user) return 'bg-muted text-muted-foreground'
    const tints: Record<string, string> = {
      student: 'bg-secondary-light text-secondary',
      moderator: 'bg-[#FFF0E0] text-orange',
      admin: 'bg-[#FFDFE0] text-[#EA2B2B]',
      creator: 'bg-[#F3E3FF] text-accent-dark',
    }
    return tints[photo.user.role || 'student'] || tints.student
  }

  function getRoleBadge(role: string | undefined) {
    if (!role || role === 'student') return null
    const config: Record<string, { label: string; variant: 'purple' | 'destructive' | 'outline' | 'default'; className: string }> = {
      creator: { label: '👑 Creator', variant: 'purple', className: '' },
      admin: { label: 'Admin', variant: 'destructive', className: '' },
      moderator: { label: 'Mod', variant: 'outline', className: 'border-[#FFD1A3] bg-[#FFF0E0] text-orange' },
    }
    const c = config[role] || { label: role, variant: 'default' as const, className: '' }
    return (
      <Badge variant={c.variant} className={`h-5 px-2 text-[10px] ${c.className}`}>
        {c.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="py-3 space-y-6 pb-24">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-28 skeleton rounded-lg" />
                <div className="h-2.5 w-16 skeleton rounded-lg" />
              </div>
            </div>
            <div className={`w-full skeleton rounded-xl ${i === 1 ? 'aspect-[4/5]' : i === 2 ? 'aspect-square' : 'aspect-[4/5]'}`} />
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 skeleton rounded-xl" />
              </div>
              <div className="h-3 w-16 skeleton rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-2xl border-2 border-border bg-card text-foreground text-[13px] font-extrabold shadow-[0_2px_0_var(--color-border)] animate-slide-down whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }} className="bg-[rgba(0,0,0,0.4)] flex items-end sm:items-center justify-center" onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }}>
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 animate-slide-up animate-scale-in border-2 border-border bg-card text-foreground" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">Nova fotografija</h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Zatvori"
                onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }}
                className="text-muted-foreground"
              >
                <X strokeWidth={2.4} />
              </Button>
            </div>

            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border" />

            {previewUrl ? (
              <div className="relative aspect-square max-h-[50vh] rounded-xl overflow-hidden border-2 border-border">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Ukloni"
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}
                  className="absolute top-3 right-3 text-foreground"
                >
                  <X strokeWidth={2.4} />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square max-h-[50vh] rounded-xl border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="w-14 h-14 rounded-full bg-secondary-light border-2 border-secondary-light-border flex items-center justify-center">
                  <Camera className="w-7 h-7 text-secondary" strokeWidth={2.4} />
                </div>
                <span className="text-[15px] font-extrabold">Izaberi fotografiju</span>
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            <Input
              placeholder="Opis (opciono)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            <label className="flex items-center justify-between min-h-11 text-[15px] font-bold">
              <span className="text-foreground">Anonimno</span>
              <button
                type="button"
                role="switch"
                aria-checked={anonymous}
                onClick={() => setAnonymous(!anonymous)}
                className={`relative w-14 h-8 rounded-full border-2 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${anonymous ? 'bg-primary border-primary-dark' : 'bg-border border-border-strong'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-card transition-transform duration-200 ${anonymous ? 'translate-x-6' : ''}`} />
              </button>
            </label>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? 'Šalje se...' : <><Send className="w-4 h-4 mr-2" />Pošalji</>}
            </Button>
          </div>
        </div>,
        document.body
      )}

      {/* Instagram-style photo feed */}
      {/* New photos banner */}
      {newPhotosCount > 0 && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { loadPhotos(); setNewPhotosCount(0); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          className="sticky top-16 z-30 flex w-full h-11 animate-slide-down mb-2"
        >
          <Camera className="w-4 h-4" />
          {newPhotosCount} {newPhotosCount === 1 ? 'nova fotografija' : 'nove fotografije'} — prikaži
        </Button>
      )}

      <div className="py-3 space-y-6 pb-24 animate-stagger">
        {photos.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-disabled" strokeWidth={2.4} />
            </div>
            <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">Još nema fotografija</p>
          </div>
        ) : (
          photos.map((photo) => {
            const anon = isAnon(photo)

            return (
              <Card
                key={photo.id}
                className={`gap-3 ${photo._new ? 'animate-slide-down' : 'animate-fade-in'}`}
              >
                {/* Card header — user info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0 ${getAvatarTint(photo)}`}
                  >
                    <span className="text-[12px] font-extrabold leading-none">
                      {getInitials(photo)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-extrabold text-heading truncate">
                        {getDisplayName(photo)}
                      </span>
                      {!anon && photo.user && getRoleBadge(photo.user.role)}
                    </div>
                    <span className="text-[13px] font-bold text-muted-foreground">
                      {formatTime(photo.created_at)}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Prijavi"
                    onClick={() => setShowReportConfirm(photo.id)}
                    className="-mr-2 text-muted-foreground hover:text-orange"
                  >
                    <Flag className="size-4" strokeWidth={2.4} />
                  </Button>
                </div>

                {/* Photo with double-tap like — TikTok style */}
                <div
                  className="relative select-none w-full rounded-xl overflow-hidden border-2 border-border bg-muted"
                  onClick={(e) => handleDoubleTap(photo.id, e)}
                >
                  <Image
                    src={photo.image_url}
                    alt={photo.caption || ''}
                    // Uploads have no stored dimensions: these reserve a 4:5 box
                    // before load, then the file's real ratio takes over.
                    width={800}
                    height={1000}
                    sizes="(max-width: 480px) 100vw, 448px"
                    unoptimized={!isOptimizableImage(photo.image_url)}
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: '600px' }}
                    draggable={false}
                  />
                </div>

                {/* Action row + caption */}
                <div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Sviđa mi se"
                      aria-pressed={!!likedPhotos[photo.id]}
                      onClick={() => toggleLike(photo.id)}
                      className={
                        likedPhotos[photo.id]
                          ? 'border-[#FFB3B5] bg-[#FFDFE0] text-[#EA2B2B] shadow-[0_4px_0_#FFB3B5] hover:bg-[#FFDFE0]'
                          : 'text-muted-foreground'
                      }
                    >
                      <Heart
                        strokeWidth={2.4}
                        className={`size-[22px] transition-colors duration-200 ${
                          likedPhotos[photo.id] ? 'fill-current' : ''
                        }`}
                      />
                    </Button>
                  </div>

                  {(likeCounts[photo.id] || 0) > 0 && (
                    <p className="text-[13px] font-extrabold text-foreground mt-2">
                      {likeCounts[photo.id]} {likeCounts[photo.id] === 1 ? 'lajk' : 'lajkova'}
                    </p>
                  )}

                  {photo.caption && (
                    <p className="text-[15px] leading-[1.5] font-bold text-foreground mt-1.5">
                      <span className="font-extrabold text-heading mr-1.5">
                        {getDisplayName(photo)}
                      </span>
                      {photo.caption}
                    </p>
                  )}
                </div>
              </Card>
            )
          })
        )}

        {hasMorePhotos && (
          <Button
            variant="outline"
            onClick={loadMorePhotos}
            disabled={loadingMore}
            className="w-full"
          >
            {loadingMore ? 'Učitavanje…' : 'Učitaj još'}
          </Button>
        )}
      </div>

      {/* Report confirmation modal */}
      {showReportConfirm && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} className="bg-[rgba(0,0,0,0.4)] flex items-center justify-center p-6" onClick={() => setShowReportConfirm(null)}>
          <div className="rounded-3xl p-6 max-w-sm w-full space-y-4 animate-scale-in bg-card border-2 border-border text-foreground" onClick={e => e.stopPropagation()}>
            {reportCooldown ? (
              <>
                <p className="text-center text-orange font-extrabold text-[20px] leading-[1.25]">⚠️ Previše prijava</p>
                <p className="text-center text-[15px] leading-[1.5] font-bold text-muted-foreground">Možeš prijaviti maksimalno 5 fotografija na sat.</p>
                <Button onClick={() => { setShowReportConfirm(null); setReportCooldown(false) }} className="w-full" variant="outline">Zatvori</Button>
              </>
            ) : (
              <>
                <p className="text-center font-extrabold text-[20px] leading-[1.25] text-heading">Prijavi fotografiju?</p>
                <p className="text-center text-[15px] leading-[1.5] font-bold text-muted-foreground">Da li si siguran/na da želiš prijaviti ovu fotografiju? Prijava će biti poslata administratoru.</p>
                <div className="flex flex-col gap-3">
                  <Button onClick={() => handleReport(showReportConfirm)} className="w-full" variant="destructive">Da, prijavi</Button>
                  <Button onClick={() => setShowReportConfirm(null)} className="w-full" variant="outline">Ne</Button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* CAMERA BUTTON */}
      {typeof document !== 'undefined' && createPortal(
        <Button
          size="icon-lg"
          variant="default"
          aria-label="Nova fotografija"
          onClick={() => setShowUpload(true)}
          style={{
            position: 'fixed',
            bottom: '6rem',
            right: '1rem',
            zIndex: 9999,
          }}
          className="rounded-full animate-bounce-in"
        >
          <Camera className="w-6 h-6" strokeWidth={2.4} />
        </Button>,
        document.body
      )}
    </>
  )
}
