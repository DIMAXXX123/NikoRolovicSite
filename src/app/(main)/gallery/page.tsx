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
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; photoId: string; x: number; y: number; scale: number; rotation: number; drift: number }[]>([])
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
        async (payload: any) => {
          const newPhoto = payload.new as Photo
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
            // Show "new photos" button instead of auto-adding
            setNewPhotosCount(prev => prev + 1)
            // Still add to list in background
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
        userLikes.forEach((l: any) => { liked[l.photo_id] = true })
        setLikedPhotos(liked)
      }
    }
  }

  async function loadLikeCounts(photoIds: string[]) {
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

  const spawnHeart = useCallback((photoId: string, clientX: number, clientY: number) => {
    const id = Date.now() + Math.random()
    const heart = {
      id,
      photoId,
      x: clientX,
      y: clientY,
      scale: 0.8 + Math.random() * 0.6,
      rotation: (Math.random() - 0.5) * 40,
      drift: (Math.random() - 0.5) * 80,
    }
    setFloatingHearts(prev => [...prev, heart])
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id))
    }, 1400)
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
      spawnHeart(photoId, clientX, clientY)
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

  function getInitials(photo: any) {
    if (isAnon(photo) || !photo.user) return '?'
    const first = photo.user.first_name?.[0] || ''
    const last = photo.user.last_name?.[0] || ''
    return (first + last).toUpperCase()
  }

  function getDisplayName(photo: any) {
    if (isAnon(photo)) return 'Anonimno'
    if (!photo.user) return 'Nepoznat'
    return `${photo.user.first_name} ${photo.user.last_name}`
  }

  function getRoleBadge(role: string | undefined) {
    if (!role || role === 'student') return null
    const config: Record<string, { label: string; bg: string; text: string }> = {
      creator: { label: '👑 Creator', bg: 'bg-amber-500/15', text: 'text-amber-400' },
      admin: { label: 'Admin', bg: 'bg-[#7c5cfc]/15', text: 'text-[#7c5cfc]' },
      moderator: { label: 'Mod', bg: 'bg-[#3b82f6]/15', text: 'text-[#3b82f6]' },
    }
    const c = config[role] || { label: role, bg: 'bg-[#10b981]/15', text: 'text-[#10b981]' }
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="py-3 space-y-6 pb-24">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-[#0c0c14] border border-[#1a1a2e]">
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-28 skeleton rounded-lg" />
                <div className="h-2.5 w-16 skeleton rounded-lg" />
              </div>
            </div>
            <div className={`w-full skeleton ${i === 1 ? 'aspect-[4/5]' : i === 2 ? 'aspect-square' : 'aspect-[4/5]'}`} style={{ borderRadius: 0 }} />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-6 w-6 skeleton rounded-full" />
                <div className="h-6 w-6 skeleton rounded-full" />
              </div>
              <div className="h-3 w-16 skeleton rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-emerald-600 text-white text-sm font-medium shadow-xl shadow-[#10b981]/20 animate-slide-down backdrop-blur-sm">
          {toast}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }} className="bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center" onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }}>
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 animate-slide-up border-t sm:border border-[#1a1a2e]" style={{ background: '#0c0c14' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-[#e8e8f0]">Nova fotografija</h2>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }} className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors">
                <X className="w-5 h-5 text-[#6b6b80]" />
              </button>
            </div>

            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20" />

            {previewUrl ? (
              <div className="relative aspect-square max-h-[50vh] rounded-2xl overflow-hidden border border-[#1a1a2e]">
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
                className="w-full aspect-square max-h-[50vh] rounded-2xl border-2 border-dashed border-[#1a1a2e] flex flex-col items-center justify-center gap-3 text-[#6b6b80] hover:border-[#7c5cfc]/30 hover:bg-[#7c5cfc]/5 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#7c5cfc]/10 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-[#7c5cfc]" />
                </div>
                <span className="text-sm font-medium">Izaberi fotografiju</span>
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            <Input
              placeholder="Opis (opciono)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-white/[0.04] rounded-xl border-[#1a1a2e] focus:border-[#7c5cfc]/40 h-11"
            />

            <label className="flex items-center justify-between text-sm">
              <span className="text-[#6b6b80]">Anonimno</span>
              <button
                type="button"
                onClick={() => setAnonymous(!anonymous)}
                className={`relative w-11 h-6 rounded-full transition-all duration-200 ${anonymous ? 'bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9]' : 'bg-white/[0.08]'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${anonymous ? 'translate-x-5' : ''}`} />
              </button>
            </label>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full h-12 rounded-xl bg-[#7c5cfc] hover:bg-[#6b4fe0] active:scale-[0.97] transition-all text-base font-semibold shadow-lg border-0 text-white"
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
        <button
          onClick={() => { loadPhotos(); setNewPhotosCount(0); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          className="sticky top-16 z-30 w-full py-2.5 rounded-xl bg-[#7c5cfc] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#7c5cfc]/30 animate-slide-down active:scale-[0.97] transition-all mb-2"
        >
          <Camera className="w-4 h-4" />
          {newPhotosCount} {newPhotosCount === 1 ? 'nova fotografija' : 'nove fotografije'} — prikaži
        </button>
      )}

      <div className="py-3 space-y-6 pb-24">
        {photos.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-[#6b6b80]">
            <div className="w-16 h-16 rounded-3xl bg-[#0c0c14] border border-[#1a1a2e] flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 opacity-30" />
            </div>
            <p className="text-sm">Još nema fotografija</p>
          </div>
        ) : (
          photos.map((photo) => {
            const anon = isAnon(photo)

            return (
              <div
                key={photo.id}
                className={`rounded-2xl overflow-hidden bg-[#0c0c14] border border-[#1a1a2e] ${(photo as any)._new ? 'animate-slide-down' : 'animate-fade-in'}`}
              >
                {/* Card header — user info */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7c5cfc, #5b3fd9)' }}
                  >
                    <span className="text-[11px] font-bold text-white leading-none">
                      {getInitials(photo)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#e8e8f0] truncate">
                        {getDisplayName(photo)}
                      </span>
                      {!anon && photo.user && getRoleBadge(photo.user.role)}
                    </div>
                    <span className="text-[11px] text-[#3d3d50]">
                      {formatTime(photo.created_at)}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowReportConfirm(photo.id)}
                    className="p-2 -mr-2 active:scale-[0.97] transition-all rounded-lg hover:bg-orange-500/10"
                  >
                    <Flag className="w-3.5 h-3.5 text-[#3d3d50] hover:text-orange-400 transition-colors" />
                  </button>
                </div>

                {/* Photo with double-tap like — TikTok style */}
                <div
                  className="relative select-none w-full"
                  onClick={(e) => handleDoubleTap(photo.id, e)}
                >
                  <img
                    src={photo.image_url}
                    alt={photo.caption || ''}
                    className="w-full object-cover"
                    style={{ maxHeight: '600px' }}
                    draggable={false}
                  />
                </div>

                {/* Action row + caption */}
                <div className="px-4 pt-3 pb-3.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleLike(photo.id)}
                      className="flex items-center gap-1.5 active:scale-[0.97] transition-all px-2 py-1.5 -ml-2 rounded-xl hover:bg-red-500/10"
                    >
                      <Heart
                        className={`w-[22px] h-[22px] transition-all duration-200 ${
                          likedPhotos[photo.id]
                            ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                            : 'text-[#e8e8f0]/80'
                        }`}
                      />
                    </button>
                  </div>

                  {(likeCounts[photo.id] || 0) > 0 && (
                    <p className="text-[13px] font-semibold text-[#e8e8f0] mt-1.5">
                      {likeCounts[photo.id]} {likeCounts[photo.id] === 1 ? 'lajk' : 'lajkova'}
                    </p>
                  )}

                  {photo.caption && (
                    <p className="text-[13px] text-[#e8e8f0]/80 mt-1.5 leading-snug">
                      <span className="font-semibold text-[#e8e8f0] mr-1.5">
                        {getDisplayName(photo)}
                      </span>
                      {photo.caption}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Report confirmation modal */}
      {showReportConfirm && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} className="bg-black/70 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowReportConfirm(null)}>
          <div className="rounded-3xl p-6 max-w-sm w-full space-y-4 animate-scale-in bg-[#0c0c14] border border-[#1a1a2e]" onClick={e => e.stopPropagation()}>
            {reportCooldown ? (
              <>
                <p className="text-center text-orange-400 font-bold text-lg">⚠️ Previše prijava</p>
                <p className="text-center text-sm text-[#6b6b80]">Možeš prijaviti maksimalno 5 fotografija na sat.</p>
                <Button onClick={() => { setShowReportConfirm(null); setReportCooldown(false) }} className="w-full rounded-xl h-11" variant="outline">Zatvori</Button>
              </>
            ) : (
              <>
                <p className="text-center font-bold text-lg text-[#e8e8f0]">Prijavi fotografiju?</p>
                <p className="text-center text-sm text-[#6b6b80] leading-relaxed">Da li si siguran/na da želiš prijaviti ovu fotografiju? Prijava će biti poslata administratoru.</p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowReportConfirm(null)} className="flex-1 rounded-xl h-11 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-[#e8e8f0]" variant="outline">Ne</Button>
                  <Button onClick={() => handleReport(showReportConfirm)} className="flex-1 rounded-xl h-11 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white border-0">Da, prijavi</Button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* FLOATING HEARTS — TikTok style */}
      {floatingHearts.length > 0 && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {floatingHearts.map((heart) => (
            <Heart
              key={heart.id}
              className="absolute fill-red-500 text-red-500 animate-tiktok-heart"
              style={{
                left: heart.x - 40,
                top: heart.y - 40,
                width: 80 * heart.scale,
                height: 80 * heart.scale,
                '--heart-drift': `${heart.drift}px`,
                '--heart-rotation': `${heart.rotation}deg`,
                filter: 'drop-shadow(0 6px 20px rgba(239, 68, 68, 0.6))',
              } as React.CSSProperties}
            />
          ))}
        </div>,
        document.body
      )}

      {/* CAMERA BUTTON */}
      {typeof document !== 'undefined' && createPortal(
        <button
          onClick={() => setShowUpload(true)}
          style={{
            position: 'fixed',
            bottom: '6rem',
            right: '1rem',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #7c5cfc, #5b3fd9)',
            boxShadow: '0 4px 16px -4px rgba(124, 92, 252, 0.4), 0 8px 24px -4px rgba(0,0,0,0.3)',
          }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white active:scale-[0.97] transition-all animate-bounce-in"
        >
          <Camera className="w-6 h-6" />
        </button>,
        document.body
      )}
    </>
  )
}
