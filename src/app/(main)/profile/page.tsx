'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Shield, Settings, ChevronDown, ChevronUp, Zap, Crown, Newspaper, Calculator, Globe, Bell, Type, Trash2, Info, Navigation } from 'lucide-react'
import { RoleBadge } from '@/components/role-badge'
import { RoleAnimation } from '@/components/role-animation'
import { AVATARS, AvatarById } from '@/components/avatars'
import { GpaCalculator } from './calculator'
import { NavEditor } from './nav-editor'
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
  const [showRoleAnim, setShowRoleAnim] = useState(false)
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showNavEditor, setShowNavEditor] = useState(false)
  const [lang, setLang] = useState('sr')
  const [notifications, setNotifications] = useState(true)
  const [fontSize, setFontSize] = useState('normal')
  const [activeUsers, setActiveUsers] = useState<number | null>(null)
  const activeUsersInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function fetchActiveUsers() {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    if (count !== null) {
      const multiplier = 1 + Math.random() * 2
      setActiveUsers(Math.round(count * multiplier))
    }
  }

  useEffect(() => {
    loadProfile()
    fetchActiveUsers()
    activeUsersInterval.current = setInterval(fetchActiveUsers, 10000)
    const saved = localStorage.getItem('perf_mode')
    if (saved === 'true') {
      setPerfMode(true)
      document.body.classList.add('perf-mode')
    }
    const savedAvatar = localStorage.getItem('user_avatar')
    if (savedAvatar) setAvatarId(savedAvatar)
    const savedLang = localStorage.getItem('app_lang')
    if (savedLang) setLang(savedLang)
    const savedNotif = localStorage.getItem('app_notifications')
    if (savedNotif !== null) setNotifications(savedNotif === 'true')
    const savedFont = localStorage.getItem('app_font_size')
    if (savedFont) setFontSize(savedFont)
    applyFontSize(savedFont || 'normal')
    return () => {
      if (activeUsersInterval.current) clearInterval(activeUsersInterval.current)
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

  function cycleAvatar() {
    const currentIndex = avatarId ? AVATARS.findIndex(a => a.id === avatarId) : -1
    const nextIndex = (currentIndex + 1) % AVATARS.length
    const next = AVATARS[nextIndex].id
    setAvatarId(next)
    localStorage.setItem('user_avatar', next)
  }

  function selectAvatar(id: string) {
    setAvatarId(id)
    localStorage.setItem('user_avatar', id)
    setShowAvatarPicker(false)
  }

  function toggleLang() {
    const next = lang === 'sr' ? 'en' : 'sr'
    setLang(next)
    localStorage.setItem('app_lang', next)
  }

  function toggleNotifications() {
    const next = !notifications
    setNotifications(next)
    localStorage.setItem('app_notifications', String(next))
  }

  function applyFontSize(size: string) {
    document.documentElement.classList.remove('font-small', 'font-large')
    if (size === 'small') document.documentElement.classList.add('font-small')
    if (size === 'large') document.documentElement.classList.add('font-large')
  }

  function cycleFontSize() {
    const sizes = ['small', 'normal', 'large'] as const
    const labels: Record<string, string> = { small: 'Malo', normal: 'Normalno', large: 'Veliko' }
    const current = sizes.indexOf(fontSize as typeof sizes[number])
    const next = sizes[(current + 1) % sizes.length]
    setFontSize(next)
    localStorage.setItem('app_font_size', next)
    applyFontSize(next)
  }

  function clearCache() {
    const keys = ['gpa_grades', 'extra_subjects', 'lecture_likes', 'user_avatar', 'app_lang', 'app_notifications', 'app_font_size']
    keys.forEach(k => localStorage.removeItem(k))
    setAvatarId(null)
    setLang('sr')
    setNotifications(true)
    setFontSize('normal')
    applyFontSize('normal')
  }

  const handleRoleAnimDone = useCallback(() => setShowRoleAnim(false), [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (!profile) return null

  if (showCalculator) {
    return <GpaCalculator onBack={() => setShowCalculator(false)} />
  }

  if (showNavEditor) {
    return <NavEditor onClose={() => setShowNavEditor(false)} />
  }

  const gradient = roleGradient[profile.role] || roleGradient.student
  const glow = roleBorderGlow[profile.role] || ''
  const isCreator = profile.role === 'creator'
  const fontLabels: Record<string, string> = { small: 'Malo', normal: 'Normalno', large: 'Veliko' }

  return (
    <div className="space-y-4 animate-fade-in">
      {showRoleAnim && <RoleAnimation role={profile.role} onDone={handleRoleAnimDone} />}

      <h1 className={`text-2xl font-bold ${isCreator ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent' : 'gradient-text'}`}>
        Profil
      </h1>

      {/* Main profile card - tap for role animation */}
      <Card
        className={`border-border/30 bg-card/50 backdrop-blur overflow-hidden ${glow} cursor-pointer active:scale-[0.98] transition-transform`}
        onClick={() => setShowRoleAnim(true)}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} p-[3px] flex-shrink-0`}
              onClick={(e) => { e.stopPropagation(); setShowAvatarPicker(!showAvatarPicker) }}
            >
              <div className="w-full h-full rounded-[13px] bg-card flex items-center justify-center overflow-hidden">
                {avatarId ? (
                  <AvatarById id={avatarId} className="w-14 h-14" />
                ) : (
                  <span className={`text-2xl font-bold ${isCreator ? 'bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent' : 'text-foreground'}`}>
                    {profile.first_name[0]}{profile.last_name[0]}
                  </span>
                )}
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

      {/* Avatar picker */}
      {showAvatarPicker && (
        <Card className="border-border/30 bg-card/50 backdrop-blur animate-fade-in">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Izaberi avatar</p>
            <div className="grid grid-cols-5 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => selectAvatar(av.id)}
                  className={`p-1.5 rounded-xl transition-all active:scale-90 ${
                    avatarId === av.id ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                  }`}
                  title={av.label}
                >
                  <av.Component className="w-full h-auto" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* GPA Calculator button */}
      <Button
        onClick={() => setShowCalculator(true)}
        variant="outline"
        className="w-full justify-start gap-2"
      >
        <Calculator className="w-4 h-4" />
        Kalkulator proseka
      </Button>

      {/* Nav editor button */}
      <Button
        onClick={() => setShowNavEditor(true)}
        variant="outline"
        className="w-full justify-start gap-2"
      >
        <Navigation className="w-4 h-4" />
        Uredi navigaciju
      </Button>

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
          <CardContent className="p-4 space-y-4">
            {/* Performance mode */}
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

            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-sm font-medium">Jezik</p>
                  <p className="text-xs text-muted-foreground">Language preference</p>
                </div>
              </div>
              <button
                onClick={toggleLang}
                className="px-3 py-1 rounded-lg bg-muted text-xs font-medium transition-all active:scale-95"
              >
                {lang === 'sr' ? 'Srpski' : 'English'}
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-sm font-medium">Obavještenja</p>
                  <p className="text-xs text-muted-foreground">Push notifikacije</p>
                </div>
              </div>
              <button
                onClick={toggleNotifications}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? 'bg-green-500' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifications ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {/* Font size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-orange-400" />
                <div>
                  <p className="text-sm font-medium">Veličina fonta</p>
                  <p className="text-xs text-muted-foreground">Prilagodi tekst</p>
                </div>
              </div>
              <button
                onClick={cycleFontSize}
                className="px-3 py-1 rounded-lg bg-muted text-xs font-medium transition-all active:scale-95"
              >
                {fontLabels[fontSize]}
              </button>
            </div>

            {/* Clear cache */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-sm font-medium">Obriši keš</p>
                  <p className="text-xs text-muted-foreground">Resetuj lokalne podatke</p>
                </div>
              </div>
              <button
                onClick={clearCache}
                className="px-3 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-medium transition-all active:scale-95"
              >
                Obriši
              </button>
            </div>

            {/* About */}
            <div className="pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">O aplikaciji</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Niko Rolović Portal v1.0.0
              </p>
              <p className="text-xs text-muted-foreground">
                Gimnazija &quot;Niko Rolović&quot; · Bar, Crna Gora
              </p>
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

      {/* Active users counter */}
      {activeUsers !== null && (
        <div className="flex items-center justify-center gap-2 py-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-sm text-muted-foreground">
            Aktivnih korisnika: {activeUsers}
          </span>
        </div>
      )}

      {/* Creator credit */}
      <p className="text-center text-xs text-muted-foreground/50 pb-4">
        Napravio: Dmitrij Ivascenko II-1
      </p>
    </div>
  )
}
