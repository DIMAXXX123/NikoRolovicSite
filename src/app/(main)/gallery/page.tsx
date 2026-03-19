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
      <div className="flex flex-col gap-4 p-4 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="mx-auto max-w-[85%]">
            <div className="rounded-2xl p-3 space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="h-3 w-24 skeleton" />
              <div className={`rounded-2xl skeleton ${i === 1 ? 'w-56 h-64' : i === 2 ? 'w-48 h-52' : 'w-60 h-72'}`} />
              <div className="flex items-center justify-between">
                <div className="h-3 w-8 skeleton" />
                <div className="h-3 w-12 skeleton" />
              </div>
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
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium shadow-xl shadow-green-500/20 animate-slide-down backdrop-blur-sm">
          {toast}
        </div>
      )}

      {/* Upload modal — Portal to body to escape transform stacking context */}
      {showUpload && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }} className="bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center" onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }}>
          <div className="bg-card/95 backdrop-blur-xl w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-5 animate-slide-up border-t border-white/[0.08] sm:border sm:border-white/[0.06]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Nova fotografija</h2>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }} className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Drag handle for bottom sheet feel */}
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20" />

            {previewUrl ? (
              <div className="relative aspect-square max-h-[50vh] rounded-2xl overflow-hidden border border-white/[0.06]">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square max-h-[50vh] rounded-2xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-purple-400" />
                </div>
                <span className="text-sm font-medium">Izaberi fotografiju</span>
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            <Input
              placeholder="Opis (opciono)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-white/[0.04] rounded-xl border-white/[0.06] focus:border-purple-500/40 h-11"
            />

            <label className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Anonimno</span>
              <button
                type="button"
                onClick={() => setAnonymous(!anonymous)}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${anonymous ? 'bg-gradient-to-r from-purple-500 to-violet-600' : 'bg-white/[0.08]'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${anonymous ? 'translate-x-5' : ''}`} />
              </button>
            </label>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 active:scale-[0.98] transition-transform text-base font-semibold shadow-lg shadow-purple-500/20 border-0"
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
            <div className="w-16 h-16 rounded-3xl bg-white/[0.03] flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 opacity-30" />
            </div>
            <p className="text-sm">Još nema fotografija</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex justify-center my-4">
                <span className="text-[11px] text-muted-foreground/60 px-4 py-1 rounded-full font-medium backdrop-blur-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {formatDate(group.photos[0].created_at)}
                </span>
              </div>

              {/* Photos */}
              <div className="space-y-3">
                {group.photos.map((photo) => {
                  const anon = isAnon(photo)

                  return (
                    <div key={photo.id} className={`mx-auto max-w-[85%] ${(photo as any)._new ? 'animate-slide-down' : 'animate-fade-in'}`}>
                      <div className="relative rounded-2xl bg-card/60 backdrop-blur-sm p-2.5 border border-white/[0.04] transition-all hover:border-white/[0.08]">
                        {/* Sender name */}
                        {!anon && photo.user && (
                          <p className={`${getSenderColor(photo.user_id)} text-xs font-semibold px-1.5 pb-1.5 flex items-center gap-1.5`}>
                            {photo.user.first_name} {photo.user.last_name}
                            {photo.user.role && photo.user.role !== 'student' && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-lg font-bold ${
                                photo.user.role === 'creator' ? 'bg-amber-500/15 text-amber-400' :
                                photo.user.role === 'admin' ? 'bg-purple-500/15 text-purple-400' :
                                photo.user.role === 'moderator' ? 'bg-blue-500/15 text-blue-400' :
                                'bg-green-500/15 text-green-400'
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
                                style={{ filter: 'drop-shadow(0 4px 16px rgba(239, 68, 68, 0.5))' }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Caption */}
                        {photo.caption && (
                          <p className="text-sm text-foreground/80 px-1.5 pt-2 leading-snug">
                            {photo.caption}
                          </p>
                        )}

                        {/* Actions: like + time + report */}
                        <div className="flex items-center justify-between px-1.5 pt-2">
                          {/* Like button */}
                          <button
                            onClick={() => toggleLike(photo.id)}
                            className="flex items-center gap-1.5 active:scale-90 transition-all px-2 py-1 -ml-2 rounded-lg hover:bg-red-500/10"
                          >
                            <Heart className={`w-4 h-4 transition-all duration-300 ${likedPhotos[photo.id] ? 'fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]' : 'text-muted-foreground'}`} />
                            <span className={`text-[11px] font-medium ${likedPhotos[photo.id] ? 'text-red-400' : 'text-muted-foreground'}`}>
                              {likeCounts[photo.id] || 0}
                            </span>
                          </button>

                          {/* Time */}
                          <span className="text-[10px] text-muted-foreground/60 font-medium">
                            {formatTime(photo.created_at)}
                          </span>

                          {/* Report button */}
                          <button
                            onClick={() => setShowReportConfirm(photo.id)}
                            className="p-1.5 -mr-1.5 active:scale-90 transition-all rounded-lg hover:bg-orange-500/10"
                          >
                            <Flag className="w-3 h-3 text-muted-foreground/40 hover:text-orange-400 transition-colors" />
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} className="bg-black/70 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowReportConfirm(null)}>
          <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full space-y-4 animate-scale-in border border-white/[0.06]" onClick={e => e.stopPropagation()}>
            {reportCooldown ? (
              <>
                <p className="text-center text-orange-400 font-bold text-lg">⚠️ Previše prijava</p>
                <p className="text-center text-sm text-muted-foreground">Možeš prijaviti maksimalno 5 fotografija na sat.</p>
                <Button onClick={() => { setShowReportConfirm(null); setReportCooldown(false) }} className="w-full rounded-2xl h-11" variant="outline">Zatvori</Button>
              </>
            ) : (
              <>
                <p className="text-center font-bold text-lg">Prijavi fotografiju?</p>
                <p className="text-center text-sm text-muted-foreground leading-relaxed">Da li si siguran/na da želiš prijaviti ovu fotografiju? Prijava će biti poslata administratoru.</p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowReportConfirm(null)} className="flex-1 rounded-2xl h-11" variant="outline">Ne</Button>
                  <Button onClick={() => handleReport(showReportConfirm)} className="flex-1 rounded-2xl h-11 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white border-0">Da, prijavi</Button>
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
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 shadow-xl shadow-purple-500/30 flex items-center justify-center text-white active:scale-90 transition-all hover:shadow-purple-500/40 animate-bounce-in"
        >
          <Camera className="w-6 h-6" />
        </button>,
        document.body
      )}
    </>
  )
}
