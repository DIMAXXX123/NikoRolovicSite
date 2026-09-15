'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { isOptimizableImage } from '@/lib/remote-image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, X, Camera, Trash2 } from 'lucide-react'
import type { Photo, Profile } from '@/lib/types'

type Tab = 'pending' | 'approved'

export default function AdminPhotosPage() {
  const [pendingPhotos, setPendingPhotos] = useState<(Photo & { user?: Profile })[]>([])
  const [approvedPhotos, setApprovedPhotos] = useState<(Photo & { user?: Profile })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [userRole, setUserRole] = useState<string>('')
  const supabase = createClient()

  async function loadUserRole() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (data) setUserRole(data.role)
  }

  async function loadPending() {
    const { data } = await supabase
      .from('photos')
      .select('*, user:profiles!user_id(first_name, last_name, class_number, section_number)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setPendingPhotos(data)
    setLoading(false)
  }

  async function loadApproved() {
    const { data } = await supabase
      .from('photos')
      .select('*, user:profiles!user_id(first_name, last_name, class_number, section_number)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    if (data) setApprovedPhotos(data)
  }

  useEffect(() => {
    loadPending()
    loadApproved()
    loadUserRole()
  }, [])

  async function moderate(photoId: string, status: 'approved' | 'rejected') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('photos')
      .update({ status, moderator_id: user.id })
      .eq('id', photoId)
    if (error) {
      alert('Nije uspjelo: ' + error.message)
      return
    }

    setPendingPhotos((prev) => prev.filter((p) => p.id !== photoId))
    if (status === 'approved') loadApproved()
  }

  async function deleteApprovedPhoto(photoId: string) {
    if (!confirm('Obriši ovu fotografiju?')) return
    const res = await fetch('/api/delete-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    })
    if (res.ok) {
      setApprovedPhotos((prev) => prev.filter((p) => p.id !== photoId))
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">Moderacija fotografija</h1>
        {[1, 2].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl skeleton" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">Moderacija fotografija</h1>

      {/* Tabs */}
      <Tabs id="admin-photos-tabs" value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)}>
        <TabsList>
          <TabsTrigger value="pending">Na čekanju ({pendingPhotos.length})</TabsTrigger>
          <TabsTrigger value="approved">Objavljene ({approvedPhotos.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'pending' && (
        <>
          {pendingPhotos.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <Camera className="w-8 h-8 text-disabled" strokeWidth={2.4} />
              </div>
              <p className="text-[17px] font-extrabold text-foreground">Nema fotografija na čekanju</p>
            </div>
          ) : (
            pendingPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="animate-stagger-item rounded-2xl bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] overflow-hidden"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={photo.image_url}
                    alt={photo.caption || ''}
                    fill
                    sizes="(max-width: 480px) 100vw, 448px"
                    unoptimized={!isOptimizableImage(photo.image_url)}
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-background rounded-xl px-3 py-1.5 border-2 border-border shadow-[0_2px_0_var(--color-border)]">
                    <p className="text-heading text-[15px] font-extrabold">
                      {photo.user?.first_name} {photo.user?.last_name}
                    </p>
                    <p className="text-muted-foreground text-[13px] font-bold">
                      {photo.user?.class_number}-{photo.user?.section_number}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  {photo.caption && (
                    <p className="text-[15px] font-bold text-foreground mb-3">{photo.caption}</p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => moderate(photo.id, 'approved')}
                      className="flex-1"
                    >
                      <Check strokeWidth={2.6} />
                      Odobri
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => moderate(photo.id, 'rejected')}
                      className="flex-1"
                    >
                      <X strokeWidth={2.6} />
                      Odbij
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {activeTab === 'approved' && (
        <>
          {approvedPhotos.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <Camera className="w-8 h-8 text-disabled" strokeWidth={2.4} />
              </div>
              <p className="text-[17px] font-extrabold text-foreground">Nema objavljenih fotografija</p>
            </div>
          ) : (
            approvedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="animate-stagger-item rounded-2xl bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] overflow-hidden"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={photo.image_url}
                    alt={photo.caption || ''}
                    fill
                    sizes="(max-width: 480px) 100vw, 448px"
                    unoptimized={!isOptimizableImage(photo.image_url)}
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-background rounded-xl px-3 py-1.5 border-2 border-border shadow-[0_2px_0_var(--color-border)]">
                    <p className="text-heading text-[15px] font-extrabold">
                      {photo.user?.first_name} {photo.user?.last_name}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  {photo.caption && (
                    <p className="text-[15px] font-bold text-foreground mb-3">{photo.caption}</p>
                  )}
                  {userRole === 'creator' && (
                    <Button
                      variant="destructive"
                      onClick={() => deleteApprovedPhoto(photo.id)}
                      className="w-full"
                    >
                      <Trash2 strokeWidth={2.6} />
                      Obriši fotografiju
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
