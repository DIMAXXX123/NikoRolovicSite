'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Shield, Settings, ChevronDown, ChevronUp, Zap, Crown, Newspaper } from 'lucide-react'
import { RoleBadge } from '@/components/role-badge'
import type { Profile } from '@/lib/types'

const roleGradient: Record<string, string> = {
  creator: 'from-yellow-400 via-amber-500 to-yellow-600',
  admin: 'from-purple-500 to-violet-700',
  moderator: 'from-blue-500 to-cyan-600',
  student: 'from-gray-400 to-gray-600',
}

const roleBorderGlow: Record<string, string> = {
  creator: 'shadow-[0_0_20px_rgba(255,215,0,0.4)]',
  admin: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]',
  moderator: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  student: '',
}

const roleLabel: Record<string, string> = {
  student: 'Učenik',
  moderator: 'Moderator',
  admin: 'Administrator',
  creator: 'Kreator',
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [perfMode, setPerfMode] = useState(false)
  const [postCount, setPostCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
    const saved = localStorage.getItem('perf_mode')
    if (saved === 'true') {
      setPerfMode(true)
      document.body.classList.add('perf-mode')
    }
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    let { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Auto-create profile from auth metadata if missing
    if (!data && user.user_metadata) {
      const meta = user.user_metadata
      const newProfile = {
        id: user.id,
        first_name: meta.first_name || '',
        last_name: meta.last_name || '',
        email: user.email || '',
        class_number: meta.class_number || 1,
        section_number: meta.section_number || 1,
        role: 'student' as const,
      }
      const { data: created } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select('*')
        .single()
      data = created
    }

    setProfile(data)

    // Fetch post count for admin/creator
    if (data && (data.role === 'admin' || data.role === 'creator')) {
      const { count } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', data.id)
      setPostCount(count || 0)
    }

    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function togglePerfMode() {
    const next = !perfMode
    setPerfMode(next)
    localStorage.setItem('perf_mode', String(next))
    if (next) {
      document.body.classList.add('perf-mode')
    } else {
      document.body.classList.remove('perf-mode')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (!profile) return null

  const gradient = roleGradient[profile.role] || roleGradient.student
  const glow = roleBorderGlow[profile.role] || ''
  const isCreator = profile.role === 'creator'

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className={`text-2xl font-bold ${isCreator ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent' : 'gradient-text'}`}>
        Profil
      </h1>

      {/* Main profile card */}
      <Card className={`border-border/30 bg-card/50 backdrop-blur overflow-hidden ${glow}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Avatar with role gradient border */}
            <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} p-[3px] flex-shrink-0`}>
              <div className="w-full h-full rounded-[13px] bg-card flex items-center justify-center">
                <span className={`text-2xl font-bold ${isCreator ? 'bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent' : 'text-foreground'}`}>
                  {profile.first_name[0]}{profile.last_name[0]}
                </span>
              </div>
              {isCreator && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-black" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className={`text-lg font-semibold ${isCreator ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent' : ''}`}>
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {profile.class_number}-{profile.section_number} razred
              </p>
              <div className="mt-1">
                <RoleBadge role={profile.role} size="md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-border/30 bg-card/50 backdrop-blur">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="truncate ml-4">{profile.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Razred</span>
            <span>{profile.class_number}. razred, {profile.section_number}. odjeljenje</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Uloga</span>
            <span>{roleLabel[profile.role] || profile.role}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Član od</span>
            <span>{new Date(profile.created_at).toLocaleDateString('sr-Latn')}</span>
          </div>

          {/* Expandable stats */}
          {showStats && (
            <div className="pt-2 border-t border-border/30 space-y-3 animate-fade-in">
              {(profile.role === 'admin' || profile.role === 'creator') && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Newspaper className="w-3.5 h-3.5" />
                    Objavljene novosti
                  </span>
                  <span className="font-medium">{postCount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs truncate ml-4 max-w-[180px]">{profile.id}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground pt-1 transition-colors"
          >
            {showStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showStats ? 'Sakrij' : 'Prikaži više'}
          </button>
        </CardContent>
      </Card>

      {/* Settings panel */}
      <Button
        onClick={() => setShowSettings(!showSettings)}
        variant="outline"
        className="w-full justify-start gap-2"
      >
        <Settings className="w-4 h-4" />
        Podešavanja
      </Button>

      {showSettings && (
        <Card className="border-border/30 bg-card/50 backdrop-blur animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium">Performance Mode</p>
                  <p className="text-xs text-muted-foreground">Isključi animacije</p>
                </div>
              </div>
              <button
                onClick={togglePerfMode}
                className={`relative w-11 h-6 rounded-full transition-colors ${perfMode ? 'bg-yellow-500' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${perfMode ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin panel button */}
      {(profile.role === 'admin' || profile.role === 'moderator' || profile.role === 'creator') && (
        <Button
          onClick={() => router.push('/admin')}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Shield className="w-4 h-4" />
          Admin panel
        </Button>
      )}

      <Button
        onClick={handleLogout}
        variant="destructive"
        className="w-full justify-start gap-2"
      >
        <LogOut className="w-4 h-4" />
        Odjavi se
      </Button>
    </div>
  )
}
