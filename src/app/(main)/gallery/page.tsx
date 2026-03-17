'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Plus, X, Send, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoleBadge } from '@/components/role-badge'
import type { Photo, Profile } from '@/lib/types'

export default function GalleryPage() {
  const [photos, setPhotos] = useState<(Photo & { user?: Profile })[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [caption, setCaption] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({})
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ id: string; key: number } | null>(null)
  const lastTapRef = useRef<{ id: string; time: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    loadPhotos()
    const savedLikes = localStorage.getItem('photo_likes')
    if (savedLikes) setLikedPhotos(JSON.parse(savedLikes))

    // Realtime subscription for new approved photos
    const channel = supabase
      .channel('photos-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'photos', filter: 'status=eq.approved' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          const newPhoto = payload.new as Photo
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, class_number, section_number, role')
            .eq('id', newPhoto.user_id)
            .single()
          const photoWithUser = { ...newPhoto, user: profile || undefined }
          setPhotos((prev) => [photoWithUser, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos', filter: 'status=eq.approved' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          const updated = payload.new as Photo
          setPhotos((prev) => {
            if (prev.some((p) => p.id === updated.id)) return prev
            supabase
              .from('profiles')
              .select('first_name, last_name, class_number, section_number, role')
              .eq('id', updated.user_id)
              .single()
              .then(({ data: profile }: { data: any }) => {
                setPhotos((current) => {
                  if (current.some((p) => p.id === updated.id)) return current
                  return [{ ...updated, user: profile || undefined }, ...current]
                })
              })
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*, user:profiles!user_id(first_name, last_name, class_number, section_number, role)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setPhotos(data)
    setLoading(false)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  function handleDoubleTap(photoId: string) {
    const now = Date.now()
    const last = lastTapRef.current
    if (last && last.id === photoId && now - last.time < 300) {
      // Double tap detected
      if (!likedPhotos[photoId]) {
        const updated = { ...likedPhotos, [photoId]: true }
        setLikedPhotos(updated)
        localStorage.setItem('photo_likes', JSON.stringify(updated))
      }
      setDoubleTapHeart({ id: photoId, key: now })
      setTimeout(() => setDoubleTapHeart(null), 1000)
      lastTapRef.current = null
    } else {
      lastTapRef.current = { id: photoId, time: now }
    }
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
      showToast('Greška pri uploadu')
      setUploading(false)
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

    if (anonymous) {
      insertData.anonymous = true
    }

    const { data: photoData, error: insertError } = await supabase.from('photos').insert(insertData).select('id').single()

    if (insertError && anonymous) {
      await supabase.from('photos').insert({
        image_url: publicUrl,
        caption: caption || null,
        user_id: user.id,
        status: 'pending',
      }).select('id').single()
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    const pid = photoData?.id
    if (pid) {
      try {
        await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoId: pid,
            imageUrl: publicUrl,
            userName: anonymous ? 'Anonim' : (profile ? `${profile.first_name} ${profile.last_name}` : 'Nepoznat'),
            caption: caption || '',
          }),
        })
      } catch (e) {
        // Notification failed silently
      }
    }

    setShowUpload(false)
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
    setAnonymous(false)
    setUploading(false)
    showToast('Fotografija poslata na moderaciju')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-shimmer" />
        ))}
      </div>
    )
  }

  const isAnon = (photo: Photo) => (photo as Photo & { anonymous?: boolean }).anonymous

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-lg animate-slide-down">
          {toast}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-sm space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Nova fotografija</h2>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {previewUrl ? (
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
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

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Input
              placeholder="Opis (opciono)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-background/50"
            />

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${anonymous ? 'bg-primary' : 'bg-muted'}`}
                onClick={() => setAnonymous(!anonymous)}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${anonymous ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-muted-foreground">Anonimno</span>
            </label>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-700"
            >
              {uploading ? 'Šalje se...' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Pošalji na moderaciju
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Vertical photo feed */}
      {photos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground animate-fade-in">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Još nema fotografija</p>
        </div>
      ) : (
        <div ref={feedRef} className="space-y-4 pb-24 animate-fade-in">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative rounded-2xl overflow-hidden bg-card border border-border/30"
              onClick={() => handleDoubleTap(photo.id)}
            >
              {/* Shimmer while loading */}
              {!loadedImages.has(photo.id) && (
                <div className="aspect-[3/4] bg-muted animate-shimmer" />
              )}

              {/* Photo */}
              <img
                src={photo.image_url}
                alt={photo.caption || ''}
                className={`w-full aspect-[3/4] object-cover transition-opacity duration-500 ${loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'} ${!loadedImages.has(photo.id) ? 'h-0' : ''}`}
                onLoad={() => setLoadedImages((prev) => new Set(prev).add(photo.id))}
              />

              {/* Bottom gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Double-tap heart animation */}
              {doubleTapHeart?.id === photo.id && (
                <div key={doubleTapHeart.key} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <Heart
                    className="w-24 h-24 text-white fill-white drop-shadow-lg"
                    style={{ animation: 'doubleTapHeart 1s ease-out forwards' }}
                  />
                </div>
              )}

              {/* Like button */}
              <div className="absolute right-3 bottom-3 z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(photo.id) }}
                  className="p-2 transition-all active:scale-125"
                >
                  <Heart
                    className={`w-6 h-6 drop-shadow-lg transition-all ${
                      likedPhotos[photo.id]
                        ? 'fill-red-500 text-red-500'
                        : 'text-white'
                    }`}
                  />
                </button>
              </div>

              {/* User info at bottom */}
              {!isAnon(photo) && photo.user && (
                <div className="absolute bottom-3 left-3 right-14 z-10">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm drop-shadow-lg">
                      {photo.user.first_name} {photo.user.last_name}
                    </p>
                    {photo.user.role && <RoleBadge role={photo.user.role} />}
                  </div>
                  <p className="text-white/60 text-[11px] mt-0.5">
                    {photo.user.class_number}-{photo.user.section_number}
                  </p>
                  {photo.caption && (
                    <p className="text-white/80 text-sm mt-1 line-clamp-2">{photo.caption}</p>
                  )}
                </div>
              )}

              {/* Anonymous: only show caption */}
              {isAnon(photo) && photo.caption && (
                <div className="absolute bottom-3 left-3 right-14 z-10">
                  <p className="text-white/80 text-sm line-clamp-2">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 shadow-lg shadow-purple-500/30 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7" />
      </button>

      <style>{`
        @keyframes doubleTapHeart {
          0% { opacity: 0; transform: scale(0); }
          15% { opacity: 1; transform: scale(1.2); }
          30% { transform: scale(0.95); }
          45% { transform: scale(1.05); opacity: 1; }
          100% { opacity: 0; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
