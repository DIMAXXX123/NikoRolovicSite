'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Camera, X, Send, Heart, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Photo, Profile } from '@/lib/types'

export default function GalleryPage() {
  const [photos, setPhotos] = useState<(Photo & { user?: Profile })[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [anonymous, setAnonymous] = useState(false)
  const [toast, setToast] = useState('')
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({})
  const [heartAnimId, setHeartAnimId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [showReportConfirm, setShowReportConfirm] = useState<string | null>(null)
  const [reportCooldown, setReportCooldown] = useState(false)
  const lastTapRef = useRef<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Load user first, then photos + likes
  useEffect(() => {
    async function init() {
      await loadCurrentUser()
      await loadPhotos()
    }
    init()
  }, [])

  // Realtime subscription — new approved photos appear at top
  useEffect(() => {
    const channel = supabase
      .channel('gallery-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'photos', filter: 'status=eq.approved' },
        async (payload: any) => {
          const newPhoto = payload.new as Photo
          // Fetch user profile for the new photo
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, class_number, section_number, role')
            .eq('id', newPhoto.user_id)
            .single()
          const photoWithUser = { ...newPhoto, user: profile || undefined } as any
          setPhotos((prev) => [photoWithUser, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos' },
        async (payload: any) => {
          const updated = payload.new as Photo
          if (updated.status === 'approved') {
            // Photo just got approved — fetch profile and add to top with animation
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name, class_number, section_number, role')
              .eq('id', updated.user_id)
              .single()
            const photoWithUser = { ...updated, user: profile || undefined, _new: true } as any
            setPhotos((prev) => {
              if (prev.some((p) => p.id === updated.id)) return prev
              return [photoWithUser, ...prev]
            })
            // Load like count for new photo
            loadLikeCounts([updated.id])
          } else if (updated.status === 'rejected') {
            // Remove rejected photos
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
      // Load user's likes from DB
      const { data: userLikes } = await supabase
        .from('photo_likes')
        .select('photo_id')
        .eq('user_id', user.id)
      if (userLikes) {
        const liked: Record<string, boolean> = {}
        userLikes.forEach((l: any) => { liked[l.photo_id] = true })
        setLikedPhotos(liked)
      }
    }
  }

  async function loadLikeCounts(photoIds: string[]) {
    // Load like counts for all photos
    const counts: Record<string, number> = {}
    for (const id of photoIds) {
      const { count } = await supabase
        .from('photo_likes')
        .select('*', { count: 'exact', head: true })
        .eq('photo_id', id)
      counts[id] = count || 0
    }
    setLikeCounts(counts)
  }

  async function loadPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*, user:profiles!user_id(first_name, last_name, class_number, section_number, role)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) {
      setPhotos(data as any)
      loadLikeCounts(data.map((p: any) => p.id))
    }
    setLoading(false)
  }

  async function toggleLike(photoId: string) {
    if (!currentUserId) return
    const wasLiked = !!likedPhotos[photoId]
    const prevCounts = { ...likeCounts }
    const prevLiked = { ...likedPhotos }

    // Optimistic update
    const updated = { ...likedPhotos }
    if (wasLiked) { delete updated[photoId] } else { updated[photoId] = true }
    setLikedPhotos(updated)
    setLikeCounts((prev) => ({ ...prev, [photoId]: Math.max(0, (prev[photoId] || 0) + (wasLiked ? -1 : 1)) }))

    // DB update
    try {
      if (wasLiked) {
        const { error } = await supabase.from('photo_likes').delete().eq('photo_id', photoId).eq('user_id', currentUserId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('photo_likes').upsert({ photo_id: photoId, user_id: currentUserId }, { onConflict: 'photo_id,user_id' })
        if (error) throw error
      }
    } catch {
      // Revert on error
      setLikedPhotos(prevLiked)
      setLikeCounts(prevCounts)
    }
  }

  async function handleReport(photoId: string) {
    // Check cooldown (max 5 reports per hour)
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

    // Send report to Telegram
    try {
      await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          imageUrl: photos.find((p) => p.id === photoId)?.image_url || '',
          userName: 'REPORT',
          caption: '⚠️ REPORT: Korisnik je prijavio ovu fotografiju',
        }),
      })
    } catch {}

    // Log report
    recentReports.push(Date.now())
    localStorage.setItem('photo_reports_log', JSON.stringify(recentReports))
    setShowReportConfirm(null)
    setToast('Fotografija prijavljena ⚠️')
    setTimeout(() => setToast(''), 3000)
  }

  const handleDoubleTap = useCallback((photoId: string) => {
    const now = Date.now()
    const lastTap = lastTapRef.current[photoId] || 0
    if (now - lastTap < 300) {
      toggleLike(photoId)
      setHeartAnimId(photoId)
      setTimeout(() => setHeartAnimId(null), 1000)
      lastTapRef.current[photoId] = 0
    } else {
      lastTapRef.current[photoId] = now
    }
  }, [likedPhotos])

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

    const insertData: any = {
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

  function isAnon(photo: any) {
    return photo.anonymous === true
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Danas'
    if (d.toDateString() === yesterday.toDateString()) return 'Juče'
    return d.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' })
  }

  // Sender colors
  const senderColors = [
    'text-purple-400', 'text-emerald-400', 'text-sky-400', 'text-amber-400',
    'text-rose-400', 'text-teal-400', 'text-indigo-400', 'text-orange-400',
  ]

  function getSenderColor(userId: string) {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i)
      hash |= 0
    }
    return senderColors[Math.abs(hash) % senderColors.length]
  }

  // Group photos by date (newest first — photos already sorted desc)
  function groupByDate(photos: (Photo & { user?: Profile })[]) {
    const groups: { date: string; photos: (Photo & { user?: Profile })[] }[] = []
    for (const photo of photos) {
      const dateKey = new Date(photo.created_at).toDateString()
      const last = groups[groups.length - 1]
      if (last && last.date === dateKey) {
        last.photos.push(photo)
      } else {
        groups.push({ date: dateKey, photos: [photo] })
      }
    }
    return groups
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="mx-auto max-w-[85%]">
            <div className="rounded-2xl p-2.5 space-y-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="h-3 w-20 rounded-full bg-muted animate-shimmer" />
              <div className={`rounded-xl bg-muted animate-shimmer ${i === 1 ? 'w-56 h-64' : i === 2 ? 'w-48 h-52' : 'w-60 h-72'}`} />
              <div className="h-2.5 w-10 rounded-full bg-muted animate-shimmer ml-auto" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const groups = groupByDate(photos)

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium shadow-lg animate-slide-down">
          {toast}
        </div>
      )}

      {/* Upload modal — Portal to body to escape transform stacking context */}
      {showUpload && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }} className="bg-background/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }}>
          <div className="bg-card w-full max-w-lg rounded-2xl p-5 space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Nova fotografija</h2>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {previewUrl ? (
              <div className="relative aspect-square max-h-[50vh] rounded-xl overflow-hidden">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square max-h-[50vh] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary transition-colors"
              >
                <Camera className="w-8 h-8" />
                <span className="text-sm">Izaberi fotografiju</span>
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            <Input
              placeholder="Opis (opciono)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-background/50 rounded-xl"
            />

            <label className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Anonimno</span>
              <button
                type="button"
                onClick={() => setAnonymous(!anonymous)}
                className={`relative w-10 h-5 rounded-full transition-colors ${anonymous ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${anonymous ? 'translate-x-5' : ''}`} />
              </button>
            </label>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 active:scale-[0.98] transition-transform"
            >
              {uploading ? 'Šalje se...' : <><Send className="w-4 h-4 mr-2" />Pošalji</>}
            </Button>
          </div>
        </div>,
        document.body
      )}

      {/* Photo feed — newest on top, scroll down for older */}
      <div className="px-3 py-2 space-y-1 pb-24">
        {photos.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-muted-foreground">
            <Camera className="w-12 h-12 mb-3 opacity-30" />
            <p>Još nema fotografija</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex justify-center my-3">
                <span className="text-[11px] text-muted-foreground/70 px-3 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {formatDate(group.photos[0].created_at)}
                </span>
              </div>

              {/* Photos */}
              <div className="space-y-2">
                {group.photos.map((photo) => {
                  const anon = isAnon(photo)

                  return (
                    <div key={photo.id} className={`mx-auto max-w-[85%] ${(photo as any)._new ? 'animate-slide-down' : 'animate-fade-in'}`}>
                      <div className="relative rounded-2xl bg-card/80 p-2">
                        {/* Sender name */}
                        {!anon && photo.user && (
                          <p className={`${getSenderColor(photo.user_id)} text-xs font-medium px-1 pb-1 flex items-center gap-1.5`}>
                            {photo.user.first_name} {photo.user.last_name}
                            {photo.user.role && photo.user.role !== 'student' && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                                photo.user.role === 'creator' ? 'bg-amber-500/20 text-amber-400' :
                                photo.user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                photo.user.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {photo.user.role === 'creator' ? '👑 Creator' :
                                 photo.user.role === 'admin' ? 'Admin' :
                                 photo.user.role === 'moderator' ? 'Mod' : photo.user.role}
                              </span>
                            )}
                          </p>
                        )}

                        {/* Photo with double-tap like */}
                        <div
                          className="relative select-none"
                          onClick={() => handleDoubleTap(photo.id)}
                        >
                          <img
                            src={photo.image_url}
                            alt={photo.caption || ''}
                            className="rounded-xl w-full object-cover aspect-[3/4]"
                            draggable={false}
                          />

                          {heartAnimId === photo.id && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <Heart
                                className="w-20 h-20 fill-red-500 text-red-500 animate-heart-pop"
                                style={{ filter: 'drop-shadow(0 4px 12px rgba(239, 68, 68, 0.5))' }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Caption */}
                        {photo.caption && (
                          <p className="text-sm text-foreground/80 px-1 pt-1.5 leading-snug">
                            {photo.caption}
                          </p>
                        )}

                        {/* Actions: like + time + report */}
                        <div className="flex items-center justify-between px-1 pt-1.5">
                          {/* Like button */}
                          <button
                            onClick={() => toggleLike(photo.id)}
                            className="flex items-center gap-1 active:scale-90 transition-transform"
                          >
                            <Heart className={`w-4 h-4 transition-colors ${likedPhotos[photo.id] ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                            <span className={`text-[11px] ${likedPhotos[photo.id] ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {likeCounts[photo.id] || 0}
                            </span>
                          </button>

                          {/* Time */}
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(photo.created_at)}
                          </span>

                          {/* Report button */}
                          <button
                            onClick={() => setShowReportConfirm(photo.id)}
                            className="p-0.5 active:scale-90 transition-transform"
                          >
                            <Flag className="w-3 h-3 text-muted-foreground/50 hover:text-orange-400 transition-colors" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report confirmation modal */}
      {showReportConfirm && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} className="bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowReportConfirm(null)}>
          <div className="bg-card rounded-2xl p-5 max-w-sm w-full space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            {reportCooldown ? (
              <>
                <p className="text-center text-orange-400 font-medium">⚠️ Previše prijava</p>
                <p className="text-center text-sm text-muted-foreground">Možeš prijaviti maksimalno 5 fotografija na sat.</p>
                <Button onClick={() => { setShowReportConfirm(null); setReportCooldown(false) }} className="w-full rounded-xl" variant="outline">Zatvori</Button>
              </>
            ) : (
              <>
                <p className="text-center font-medium">Prijavi fotografiju?</p>
                <p className="text-center text-sm text-muted-foreground">Da li si siguran/na da želiš prijaviti ovu fotografiju? Prijava će biti poslata administratoru.</p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowReportConfirm(null)} className="flex-1 rounded-xl" variant="outline">Ne</Button>
                  <Button onClick={() => handleReport(showReportConfirm)} className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 text-white">Da, prijavi</Button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* CAMERA BUTTON — Portal to body so parent transforms can't break fixed positioning */}
      {typeof document !== 'undefined' && createPortal(
        <button
          onClick={() => setShowUpload(true)}
          style={{ position: 'fixed', bottom: '6rem', right: '1rem', zIndex: 9999 }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 shadow-lg shadow-purple-500/30 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <Camera className="w-6 h-6" />
        </button>,
        document.body
      )}
    </>
  )
}
