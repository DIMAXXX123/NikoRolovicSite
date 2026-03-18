'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, X, Send, Heart } from 'lucide-react'
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
  const lastTapRef = useRef<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const feedEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPhotos()
    loadCurrentUser()
    const saved = localStorage.getItem('photo_likes')
    if (saved) setLikedPhotos(JSON.parse(saved))
  }, [])

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)
  }

  async function loadPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*, user:profiles!user_id(first_name, last_name, class_number, section_number, role)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setPhotos(data as any)
    setLoading(false)
  }

  function toggleLike(photoId: string) {
    const updated = { ...likedPhotos }
    if (updated[photoId]) {
      delete updated[photoId]
    } else {
      updated[photoId] = true
    }
    setLikedPhotos(updated)
    localStorage.setItem('photo_likes', JSON.stringify(updated))
  }

  const handleDoubleTap = useCallback((photoId: string) => {
    const now = Date.now()
    const lastTap = lastTapRef.current[photoId] || 0
    if (now - lastTap < 300) {
      // Double tap detected
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

  function isOwnPhoto(photo: Photo) {
    return currentUserId != null && photo.user_id === currentUserId
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

  // Group photos by date
  function groupByDate(photos: (Photo & { user?: Profile })[]) {
    const groups: { date: string; photos: (Photo & { user?: Profile })[] }[] = []
    const reversed = [...photos].reverse() // oldest first for chat feel

    for (const photo of reversed) {
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

  // Sender colors (Telegram-style rotating colors for different users)
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

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="mx-auto max-w-[85%]">
            <div className="rounded-2xl rounded-br-sm p-2.5 space-y-2"
                 style={{ background: 'rgba(255,255,255,0.04)' }}>
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

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-background flex items-end justify-center" onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }}>
          <div className="bg-card w-full rounded-t-2xl p-5 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Nova fotografija</h2>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {previewUrl ? (
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
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
                className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary transition-colors"
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
        </div>
      )}

      {/* Chat-style photo feed */}
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

              {/* Photos in this date group */}
              <div className="space-y-2">
                {group.photos.map((photo) => {
                  const own = isOwnPhoto(photo)
                  const anon = isAnon(photo)

                  return (
                    <div key={photo.id} className="mx-auto max-w-[85%] animate-fade-in">
                      <div className="relative rounded-2xl rounded-br-sm bg-card/80 p-2">
                        {/* Sender name */}
                        {!anon && photo.user && (
                          <p className={`${getSenderColor(photo.user_id)} text-xs font-medium px-1 pb-1`}>
                            {photo.user.first_name} {photo.user.last_name}
                          </p>
                        )}

                        {/* Photo with double-tap */}
                        <div
                          className="relative select-none"
                          onTouchEnd={() => handleDoubleTap(photo.id)}
                          onClick={() => handleDoubleTap(photo.id)}
                        >
                          <img
                            src={photo.image_url}
                            alt={photo.caption || ''}
                            className="rounded-xl w-full object-cover aspect-[3/4]"
                            draggable={false}
                          />

                          {/* Heart animation overlay */}
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

                        {/* Timestamp & like indicator - bottom right */}
                        <div className="flex items-center justify-end gap-1.5 px-1 pt-1">
                          {likedPhotos[photo.id] && (
                            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(photo.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Floating upload button - bottom right */}
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-[5.5rem] right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 shadow-lg shadow-purple-500/30 flex items-center justify-center text-white active:scale-90 transition-transform animate-bounce-in"
      >
        <Camera className="w-6 h-6" />
      </button>
    </>
  )
}
