'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Shield, Settings, ChevronDown, ChevronUp, Zap, Crown, Newspaper, Calculator, Globe, Bell, Type, Trash2, Info, Navigation, Clock, GraduationCap, School, ChevronRight, Users } from 'lucide-react'
import { RoleBadge } from '@/components/role-badge'
import { RoleAnimation } from '@/components/role-animation'
import { AVATARS, AvatarById } from '@/components/avatars'
import { GpaCalculator } from './calculator'
import { NavEditor } from './nav-editor'
import { getNavConfig } from '@/lib/nav-config'
import type { Profile } from '@/lib/types'
import Link from 'next/link'

const roleGradient: Record<string, string> = {
  creator: 'from-yellow-400 via-amber-500 to-yellow-600',
  admin: 'from-[#7c5cfc] to-[#5b3fd9]',
  moderator: 'from-blue-500 to-cyan-600',
  student: 'from-gray-400 to-gray-600',
}

const roleBorderGlow: Record<string, string> = {
  creator: 'shadow-[0_0_24px_rgba(255,215,0,0.3)]',
  admin: 'shadow-[0_0_24px_rgba(139,92,246,0.2)]',
  moderator: 'shadow-[0_0_24px_rgba(59,130,246,0.2)]',
  student: '',
}

const roleLabel: Record<string, string> = {
  student: 'Učenik',
  moderator: 'Moderator',
  admin: 'Administrator',
  creator: 'Kreator',
}

const QUICK_ACCESS_PAGES = [
  { id: 'about', href: '/about', label: 'O školi', icon: School, color: 'from-emerald-500 to-teal-600' },
  { id: 'schedule', href: '/schedule', label: 'Raspored', icon: Clock, color: 'from-blue-500 to-cyan-600' },
  { id: 'teachers', href: '/teachers', label: 'Status profesora', icon: Users, color: 'from-teal-500 to-cyan-600' },
  { id: 'grades', href: '/grades', label: 'Moje ocjene', icon: GraduationCap, color: 'from-[#7c5cfc] to-[#5b3fd9]' },
]

function QuickAccessCards() {
  const [navIds, setNavIds] = useState<string[]>([])

  useEffect(() => {
    setNavIds(getNavConfig())
  }, [])

  const hiddenPages = QUICK_ACCESS_PAGES.filter(p => !navIds.includes(p.id))

  if (hiddenPages.length === 0) return null

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest px-1">Brzi pristup</p>
      <div className="grid grid-cols-1 gap-2">
        {hiddenPages.map((page) => (
          <Link key={page.id} href={page.href}>
            <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] cursor-pointer hover:bg-white/[0.04] transition-all active:scale-[0.98] p-3.5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${page.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <page.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold flex-1">{page.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
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
  const [prevActiveUsers, setPrevActiveUsers] = useState<number | null>(null)
  const [animKey, setAnimKey] = useState(0)
  const baseCountRef = useRef<number | null>(null)
  const activeUsersInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function updateDisplayCount() {
    if (baseCountRef.current === null) return
    const newCount = baseCountRef.current
    setActiveUsers(prev => {
      if (prev !== null && prev !== newCount) {
        setPrevActiveUsers(prev)
        setAnimKey(k => k + 1)
      }
      return newCount
    })
  }

  async function fetchActiveUsers() {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    if (count !== null) {
      baseCountRef.current = count
      updateDisplayCount()
    }
  }

  useEffect(() => {
    loadProfile()
    fetchActiveUsers()
    activeUsersInterval.current = setInterval(updateDisplayCount, 1000)
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
    const keys = ['gpa_grades', 'extra_subjects', 'lecture_likes', 'user_avatar', 'app_lang', 'app_notifications', 'app_font_size', 'my_grades_data']
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
      <div className="space-y-4 pt-2">
        <div className="h-44 rounded-3xl skeleton" />
        <div className="h-28 rounded-2xl skeleton" />
        <div className="h-12 rounded-2xl skeleton" />
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
    <div className="space-y-4 animate-fade-in pb-6">
      {showRoleAnim && <RoleAnimation role={profile.role} onDone={handleRoleAnimDone} />}

      <h1 className={`text-2xl font-bold pt-1 ${isCreator ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent' : 'gradient-text'}`} style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '0ms', opacity: 0 }}>
        Profil
      </h1>

      {/* Hero profile card */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-[1px] ${glow} cursor-pointer active:scale-[0.98] transition-transform`}
        onClick={() => setShowRoleAnim(true)}
        style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '60ms', opacity: 0 }}
      >
        <div className="rounded-[calc(1.5rem-1px)] bg-card/95 backdrop-blur-xl p-6">
          {/* Decorative gradient blob */}
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl`} />

          <div className="relative flex items-center gap-4">
            {/* Avatar */}
            <div
              className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} p-[2px] flex-shrink-0`}
              onClick={(e) => { e.stopPropagation(); setShowAvatarPicker(!showAvatarPicker) }}
            >
              <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center overflow-hidden">
                {avatarId ? (
                  <AvatarById id={avatarId} className="w-14 h-14" />
                ) : (
                  <span className={`text-2xl font-bold ${isCreator ? 'bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent' : 'text-foreground'}`}>
                    {profile.first_name[0]}{profile.last_name[0]}
                  </span>
                )}
              </div>
              {isCreator && (
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 animate-pop-in">
                  <Crown className="w-4 h-4 text-black" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className={`text-lg font-bold ${isCreator ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent' : ''}`}>
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {profile.class_number}-{profile.section_number} razred
              </p>
              <div className="mt-1.5">
                <RoleBadge role={profile.role} size="md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] p-4" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '120ms', opacity: 0 }}>
        <div className="grid grid-cols-3 divide-x divide-[#1a1a2e]">
          <div className="flex flex-col items-center gap-1 px-2">
            <span className="text-xs text-muted-foreground">Razred</span>
            <span className="text-base font-bold">{profile.class_number}-{profile.section_number}</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-2">
            <span className="text-xs text-muted-foreground">Uloga</span>
            <span className="text-base font-bold">{roleLabel[profile.role] || profile.role}</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-2">
            <span className="text-xs text-muted-foreground">Član od</span>
            <span className="text-base font-bold">{new Date(profile.created_at).toLocaleDateString('sr-Latn', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Avatar picker */}
      {showAvatarPicker && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] animate-fade-in p-4" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '180ms', opacity: 0 }}>
          <p className="text-sm font-bold mb-3">Izaberi avatar</p>
          <div className="grid grid-cols-5 gap-2">
            {AVATARS.map((av) => (
              <button
                key={av.id}
                onClick={() => selectAvatar(av.id)}
                className={`p-2 rounded-xl transition-all active:scale-90 ${
                  avatarId === av.id ? 'bg-[#7c5cfc]/15 ring-2 ring-[#7c5cfc] shadow-lg shadow-[#7c5cfc]/10' : 'hover:bg-white/[0.04]'
                }`}
                title={av.label}
              >
                <av.Component className="w-full h-auto" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] p-5 space-y-3.5" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '240ms', opacity: 0 }}>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Email</span>
          <span className="truncate ml-4 font-medium">{profile.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Razred</span>
          <span className="font-medium">{profile.class_number}. razred, {profile.section_number}. odjeljenje</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Uloga</span>
          <span className="font-medium">{roleLabel[profile.role] || profile.role}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Član od</span>
          <span className="font-medium">{new Date(profile.created_at).toLocaleDateString('sr-Latn')}</span>
        </div>

        {/* Expandable stats */}
        {showStats && (
          <div className="pt-3 border-t border-[#1a1a2e] space-y-3 animate-fade-in">
            {(profile.role === 'admin' || profile.role === 'creator') && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5" />
                  Objavljene novosti
                </span>
                <span className="font-bold">{postCount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono text-xs truncate ml-4 max-w-[180px] text-muted-foreground">{profile.id}</span>
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
      </div>

      {/* Action buttons */}
      <div className="space-y-2" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '300ms', opacity: 0 }}>
        <button
          onClick={() => setShowCalculator(true)}
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] text-sm font-semibold hover:bg-white/[0.04] transition-all active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/15">
            <Calculator className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="flex-1 text-left">Kalkulator proseka</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        </button>


      </div>

      {/* Quick-access cards for pages not in nav */}
      <QuickAccessCards />

      {/* Settings */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] text-sm font-semibold hover:bg-white/[0.04] transition-all active:scale-[0.98]"
        style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '360ms', opacity: 0 }}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-500 to-zinc-700 flex items-center justify-center">
          <Settings className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="flex-1 text-left">Podešavanja</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground/50 transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`} />
      </button>

      {showSettings && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] animate-fade-in p-5 space-y-5">
          {/* Performance mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Performance Mode</p>
                <p className="text-xs text-muted-foreground">Isključi animacije</p>
              </div>
            </div>
            <button
              onClick={togglePerfMode}
              className={`relative w-12 h-7 rounded-full transition-all duration-300 ${perfMode ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-white/[0.08]'}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${perfMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Jezik</p>
                <p className="text-xs text-muted-foreground">Language preference</p>
              </div>
            </div>
            <button
              onClick={toggleLang}
              className="px-4 py-1.5 rounded-xl bg-white/[0.06] text-xs font-semibold transition-all active:scale-95 hover:bg-white/[0.1]"
            >
              {lang === 'sr' ? 'Srpski' : 'English'}
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Obavještenja</p>
                <p className="text-xs text-muted-foreground">Push notifikacije</p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              className={`relative w-12 h-7 rounded-full transition-all duration-300 ${notifications ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-white/[0.08]'}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${notifications ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Font size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Type className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Veličina fonta</p>
                <p className="text-xs text-muted-foreground">Prilagodi tekst</p>
              </div>
            </div>
            <button
              onClick={cycleFontSize}
              className="px-4 py-1.5 rounded-xl bg-white/[0.06] text-xs font-semibold transition-all active:scale-95 hover:bg-white/[0.1]"
            >
              {fontLabels[fontSize]}
            </button>
          </div>

          {/* Navigation editor */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#7c5cfc]/10 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-[#7c5cfc]" />
              </div>
              <div>
                <p className="text-sm font-semibold">Navigacija</p>
                <p className="text-xs text-muted-foreground">Uredi donji meni</p>
              </div>
            </div>
            <button
              onClick={() => setShowNavEditor(true)}
              className="px-4 py-1.5 rounded-xl bg-[#7c5cfc]/10 text-[#7c5cfc] text-xs font-semibold transition-all active:scale-95 hover:bg-[#7c5cfc]/15"
            >
              Uredi
            </button>
          </div>

          {/* Clear cache */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Obriši keš</p>
                <p className="text-xs text-muted-foreground">Resetuj lokalne podatke</p>
              </div>
            </div>
            <button
              onClick={clearCache}
              className="px-4 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold transition-all active:scale-95 hover:bg-red-500/15"
            >
              Obriši
            </button>
          </div>

          {/* About */}
          <div className="pt-4 border-t border-[#1a1a2e]">
            <div className="flex items-center gap-2 mb-1.5">
              <Info className="w-4 h-4 text-muted-foreground/50" />
              <p className="text-sm font-semibold">O aplikaciji</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Niko Rolović Portal v1.0.0
            </p>
            <p className="text-xs text-muted-foreground">
              Gimnazija &quot;Niko Rolović&quot; · Bar, Crna Gora
            </p>
          </div>
        </div>
      )}

      {/* Admin panel button */}
      {(profile.role === 'admin' || profile.role === 'moderator' || profile.role === 'creator') && (
        <button
          onClick={() => router.push('/admin')}
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] text-sm font-semibold hover:bg-white/[0.04] transition-all active:scale-[0.98]"
          style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '420ms', opacity: 0 }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/15">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="flex-1 text-left">Admin panel</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        </button>
      )}

      <Button
        onClick={handleLogout}
        variant="destructive"
        className="w-full h-12 rounded-2xl justify-center gap-2 text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
      >
        <LogOut className="w-4 h-4" />
        Odjavi se
      </Button>

      {/* Active users counter */}
      {activeUsers !== null && (
        <div className="flex items-center justify-center py-3">
          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-green-500/8 border border-green-500/15 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-sm text-green-400 font-medium">
              Registrovanih učenika:{' '}
              <span className="inline-flex overflow-hidden h-5 align-middle" key={animKey}>
                <span className="inline-block animate-count-up font-bold">
                  {activeUsers}
                </span>
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Contact & suggestions */}
      <div className="flex items-center justify-center gap-3 py-2">
        <a href="https://t.me/Dima_ivasch" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-500/8 border border-blue-500/15 text-blue-400 text-sm font-medium hover:bg-blue-500/15 transition-all">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          Predlozi
        </a>
        <a href="viber://chat?number=%2B38268499621"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-500/8 border border-purple-500/15 text-purple-400 text-sm font-medium hover:bg-purple-500/15 transition-all">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.177.474 6.753.345 9.98.217 13.208.074 19.174 5.58 20.77l.01.006.006.004c.068.039.14.085.22.137v2.87s-.044.858.533 1.031c.637.188.953-.385 1.529-.997l1.252-1.418c3.34.288 5.882-.346 6.166-.445.655-.228 4.366-.687 4.973-5.623.623-5.076-.304-8.283-2.91-10.467C15.645.456 13.167-.022 11.398.002zm.286 1.727c1.524-.03 3.647.36 5.26 1.7 2.177 1.82 2.985 4.593 2.442 8.918-.488 3.906-3.272 4.265-3.81 4.453-.236.082-2.394.613-5.201.441 0 0-2.06 2.479-2.7 3.129-.105.107-.225.148-.306.128-.114-.028-.146-.161-.144-.354.002-.134.01-3.455.01-3.455C3.2 15.643 2.157 13.204 2.267 10.047c.095-2.731.726-4.89 2.176-6.34 1.836-1.767 5.282-2.02 7.24-1.978z"/></svg>
          Viber
        </a>
      </div>

      {/* Creator credit */}
      <p className="text-center text-xs text-muted-foreground/40 pb-4">
        Napravio: Dmitrij Ivascenko II-1
      </p>
    </div>
  )
}
