'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, Camera } from 'lucide-react'
import type { Photo, Profile } from '@/lib/types'

export default function AdminPhotosPage() {
  const [pendingPhotos, setPendingPhotos] = useState<(Photo & { user?: Profile })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadPending() }, [])

  async function loadPending() {
    const { data } = await supabase
      .from('photos')
      .select('*, user:profiles!user_id(first_name, last_name, class_number, section_number)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setPendingPhotos(data)
    setLoading(false)
  }

  async function moderate(photoId: string, status: 'approved' | 'rejected') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('photos')
      .update({ status, moderator_id: user.id })
      .eq('id', photoId)

    setPendingPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold gradient-text">Moderacija fotografija</h1>
        {[1, 2].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold gradient-text">Moderacija fotografija</h1>
      <p className="text-sm text-muted-foreground">{pendingPhotos.length} fotografija čeka odobrenje</p>

      {pendingPhotos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nema fotografija na čekanju</p>
        </div>
      ) : (
        pendingPhotos.map((photo) => (
          <Card key={photo.id} className="border-border/30 bg-card/50 overflow-hidden animate-slide-up">
            <div className="relative">
              <img
                src={photo.image_url}
                alt={photo.caption || ''}
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1">
                <p className="text-white text-sm font-medium">
                  {photo.user?.first_name} {photo.user?.last_name}
                </p>
                <p className="text-white/60 text-xs">
                  {photo.user?.class_number}-{photo.user?.section_number}
                </p>
              </div>
            </div>
            <CardContent className="p-4">
              {photo.caption && (
                <p className="text-sm mb-3">{photo.caption}</p>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={() => moderate(photo.id, 'approved')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Odobri
                </Button>
                <Button
                  onClick={() => moderate(photo.id, 'rejected')}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Odbij
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
