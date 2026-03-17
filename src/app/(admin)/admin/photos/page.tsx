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
          <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-800 animate-pulse" />
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
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-blue-500 text-white'
              : 'bg-[#1e293b] text-slate-400 hover:text-white'
          }`}
        >
          Na čekanju ({pendingPhotos.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'approved'
              ? 'bg-blue-500 text-white'
              : 'bg-[#1e293b] text-slate-400 hover:text-white'
          }`}
        >
          Objavljene ({approvedPhotos.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <>
          {pendingPhotos.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nema fotografija na čekanju</p>
            </div>
          ) : (
            pendingPhotos.map((photo) => (
              <div key={photo.id} className="rounded-xl bg-[#1e293b] border border-slate-700/50 overflow-hidden animate-slide-up">
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
                <div className="p-4">
                  {photo.caption && (
                    <p className="text-sm text-slate-300 mb-3">{photo.caption}</p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => moderate(photo.id, 'approved')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Odobri
                    </Button>
                    <Button
                      onClick={() => moderate(photo.id, 'rejected')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
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
            <div className="text-center py-20 text-slate-500">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nema objavljenih fotografija</p>
            </div>
          ) : (
            approvedPhotos.map((photo) => (
              <div key={photo.id} className="rounded-xl bg-[#1e293b] border border-slate-700/50 overflow-hidden">
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
                  </div>
                </div>
                <div className="p-4">
                  {photo.caption && (
                    <p className="text-sm text-slate-300 mb-3">{photo.caption}</p>
                  )}
                  {userRole === 'creator' && (
                    <Button
                      onClick={() => deleteApprovedPhoto(photo.id)}
                      className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-xl"
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
