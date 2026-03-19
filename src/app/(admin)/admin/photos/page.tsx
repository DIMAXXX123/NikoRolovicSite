'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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

  useEffect(() => {
    loadPending()
    loadApproved()
    loadUserRole()
  }, [])

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

  async function moderate(photoId: string, status: 'approved' | 'rejected') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('photos')
      .update({ status, moderator_id: user.id })
      .eq('id', photoId)

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
        <h1 className="text-2xl font-bold text-white">Moderacija fotografija</h1>
        {[1, 2].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Moderacija fotografija</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'pending'
              ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-500/20'
              : 'bg-white/[0.04] text-white/40 hover:text-white border border-white/[0.08] hover:border-purple-500/30'
          }`}
        >
          Na čekanju ({pendingPhotos.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'approved'
              ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-500/20'
              : 'bg-white/[0.04] text-white/40 hover:text-white border border-white/[0.08] hover:border-purple-500/30'
          }`}
        >
          Objavljene ({approvedPhotos.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <>
          {pendingPhotos.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nema fotografija na čekanju</p>
            </div>
          ) : (
            pendingPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="animate-stagger-item rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] overflow-hidden hover:-translate-y-[2px] hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/20 transition-all duration-300"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="relative">
                  <img
                    src={photo.image_url}
                    alt={photo.caption || ''}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/10">
                    <p className="text-white text-sm font-medium">
                      {photo.user?.first_name} {photo.user?.last_name}
                    </p>
                    <p className="text-white/50 text-xs">
                      {photo.user?.class_number}-{photo.user?.section_number}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  {photo.caption && (
                    <p className="text-sm text-white/60 mb-3">{photo.caption}</p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => moderate(photo.id, 'approved')}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-xl shadow-lg shadow-green-500/20"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Odobri
                    </Button>
                    <Button
                      onClick={() => moderate(photo.id, 'rejected')}
                      className="flex-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl shadow-lg shadow-red-500/20"
                    >
                      <X className="w-4 h-4 mr-2" />
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
            <div className="text-center py-20 text-white/30">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nema objavljenih fotografija</p>
            </div>
          ) : (
            approvedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="animate-stagger-item rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] overflow-hidden hover:-translate-y-[2px] hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/20 transition-all duration-300"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="relative">
                  <img
                    src={photo.image_url}
                    alt={photo.caption || ''}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/10">
                    <p className="text-white text-sm font-medium">
                      {photo.user?.first_name} {photo.user?.last_name}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  {photo.caption && (
                    <p className="text-sm text-white/60 mb-3">{photo.caption}</p>
                  )}
                  {userRole === 'creator' && (
                    <Button
                      onClick={() => deleteApprovedPhoto(photo.id)}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
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
