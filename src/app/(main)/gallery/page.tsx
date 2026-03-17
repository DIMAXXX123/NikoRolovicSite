'use client'

import { useEffect, useState, useRef } from 'react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPhotos()
    const saved = localStorage.getItem('photo_likes')
    if (saved) setLikedPhotos(JSON.parse(saved))
  }, [])

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

  if (loading) {
    return (
      <div className="space-y-0">
        {[1, 2].map((i) => (
          <div key={i} className="h-[calc(100dvh-144px)] bg-muted animate-shimmer" />
        ))}
      </div>
    )
  }

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

      {/* TikTok-style vertical scroll */}
      <div className="-mx-2" style={{ height: 'calc(100dvh - 144px)' }}>
        <div
          className="h-full overflow-y-scroll px-1"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {photos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Camera className="w-12 h-12 mb-3 opacity-30" />
              <p>Još nema fotografija</p>
            </div>
          ) : (
            photos.map((photo) => (
              <div
                key={photo.id}
                className="relative w-full rounded-2xl overflow-hidden mb-2"
                style={{ height: 'calc(100dvh - 160px)', scrollSnapAlign: 'start' }}
              >
                {/* Photo */}
                <img
                  src={photo.image_url}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover rounded-2xl"
                />

                {/* Right side: like button + count */}
                <div className="absolute right-3 bottom-24 flex flex-col items-center gap-1">
                  <button
                    onClick={() => toggleLike(photo.id)}
                    className="active:scale-125 transition-transform p-2"
                  >
                    <Heart
                      className={`w-8 h-8 transition-all ${
                        likedPhotos[photo.id]
                          ? 'fill-red-500 text-red-500'
                          : 'text-white'
                      }`}
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                    />
                  </button>
                  <span className="text-white text-xs font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    {likedPhotos[photo.id] ? 1 : 0}
                  </span>
                </div>

                {/* Bottom: user info */}
                <div className="absolute bottom-4 left-4 right-16">
                  <div className="relative">
                    {!isAnon(photo) && photo.user && (
                      <p className="text-white font-bold text-base" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        {photo.user.first_name} {photo.user.last_name}
                        <span className="font-normal text-white/70 ml-2 text-sm">
                          {photo.user.class_number}-{photo.user.section_number}
                        </span>
                      </p>
                    )}
                    {photo.caption && (
                      <p className="text-white/80 text-sm mt-1 line-clamp-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                        {photo.caption}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fixed upload button - bottom left */}
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-[5.5rem] left-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 shadow-lg shadow-purple-500/30 flex items-center justify-center text-white active:scale-90 transition-transform"
      >
        <Camera className="w-6 h-6" />
      </button>
    </>
  )
}
