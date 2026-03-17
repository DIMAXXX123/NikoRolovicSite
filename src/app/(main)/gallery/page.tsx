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
  const [anonymous, setAnonymous] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({})
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    loadPhotos()
    const savedLikes = localStorage.getItem('photo_likes')
    if (savedLikes) setLikedPhotos(JSON.parse(savedLikes))

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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      } catch {
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

  const isAnon = (photo: Photo) => (photo as Photo & { anonymous?: boolean }).anonymous

  if (loading) {
    return (
      <div className="h-[calc(100dvh-128px)] overflow-y-auto px-2 py-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] rounded-2xl bg-muted animate-shimmer"
          />
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium shadow-lg animate-slide-down">
          {toast}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }}>
          <div className="bg-card border border-border/50 rounded-2xl p-5 w-full max-w-sm space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Nova fotografija</h2>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null) }} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {previewUrl ? (
              <div className="relative aspect-square rounded-xl overflow-hidden">
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
                className="w-full aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all active:scale-[0.98]"
              >
                <Camera className="w-10 h-10" />
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
              className="bg-background/50 rounded-xl"
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
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 active:scale-[0.98] transition-transform"
            >
              {uploading ? 'Šalje se...' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Pošalji
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Photo feed - natural scrolling */}
      {photos.length === 0 ? (
        <div className="flex items-center justify-center text-muted-foreground animate-fade-in h-[calc(100dvh-128px)]">
          <div className="text-center">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Još nema fotografija</p>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto animate-fade-in space-y-3 px-2 py-4 pb-20" style={{ height: 'calc(100dvh - 128px)' }}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative rounded-2xl overflow-hidden bg-black"
            >
              {/* Shimmer skeleton while loading */}
              {!loadedImages.has(photo.id) && (
                <div className="absolute inset-0 bg-muted animate-shimmer" />
              )}

              {/* Photo with natural aspect ratio, max 4/5 */}
              <div className="aspect-[3/4] max-h-[75vh]">
                <img
                  src={photo.image_url}
                  alt={photo.caption || ''}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setLoadedImages((prev) => new Set(prev).add(photo.id))}
                />
              </div>

              {/* Right side actions - heart outline only, no bg */}
              <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
                <button
                  onClick={() => toggleLike(photo.id)}
                  className="active:scale-125 transition-transform"
                >
                  <Heart
                    className={`w-7 h-7 transition-all ${
                      likedPhotos[photo.id]
                        ? 'fill-red-500 text-red-500'
                        : 'text-white'
                    }`}
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
                  />
                </button>
              </div>

              {/* Bottom overlay: gradient only bottom 30%, user info + caption */}
              <div className="absolute bottom-0 left-0 right-14 pb-16 px-4">
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="relative">
                  {!isAnon(photo) && photo.user && (
                    <p className="text-white font-semibold text-sm drop-shadow-lg">
                      {photo.user.first_name} {photo.user.last_name}
                      {photo.user.class_number && photo.user.section_number && (
                        <span className="font-normal text-white/70 ml-1.5 text-xs">
                          {photo.user.class_number}/{photo.user.section_number}
                        </span>
                      )}
                    </p>
                  )}
                  {photo.caption && (
                    <p className="text-white/90 text-sm mt-1 drop-shadow-lg line-clamp-2">
                      {photo.caption}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fixed upload button - bottom left, bigger */}
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-24 left-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 shadow-lg shadow-purple-500/30 flex items-center justify-center text-white active:scale-90 transition-transform animate-bounce-in"
      >
        <Camera className="w-6 h-6" />
      </button>
    </>
  )
}
