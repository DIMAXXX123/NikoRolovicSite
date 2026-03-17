'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Plus, X, Send } from 'lucide-react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPhotos()
  }, [])

  async function loadPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*, user:profiles!user_id(first_name, last_name, class_number, section_number)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

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
      alert('Greška pri uploadu')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName)

    await supabase.from('photos').insert({
      image_url: publicUrl,
      caption: caption || null,
      user_id: user.id,
      status: 'pending',
    })

    setShowUpload(false)
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
    setUploading(false)
    alert('Foto je poslat na moderaciju! 📸')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold gradient-text">Galerija</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gradient-text">Galerija</h1>
        <Button
          size="sm"
          onClick={() => setShowUpload(true)}
          className="bg-gradient-to-r from-purple-600 to-violet-700 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1" />
          Dodaj
        </Button>
      </div>

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

      {/* TikTok-style photo feed */}
      {photos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Još nema fotografija</p>
        </div>
      ) : (
        <div className="space-y-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative rounded-2xl overflow-hidden animate-slide-up">
              <img
                src={photo.image_url}
                alt={photo.caption || ''}
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-semibold text-white text-sm">
                  {photo.user?.first_name} {photo.user?.last_name}
                </p>
                <p className="text-white/60 text-xs">
                  {photo.user?.class_number}-{photo.user?.section_number}
                </p>
                {photo.caption && (
                  <p className="text-white/80 text-sm mt-1">{photo.caption}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
