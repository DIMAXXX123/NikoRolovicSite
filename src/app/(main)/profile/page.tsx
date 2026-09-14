'use client'

import { useEffect, useState, useCallback, useRef, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Shield, Settings, ChevronDown, ChevronUp, Zap, Crown, Newspaper, Calculator, Globe, Bell, Type, Trash2, Info, Navigation, Clock, GraduationCap, School, ChevronRight, Users, UserRound } from 'lucide-react'
import { RoleBadge } from '@/components/role-badge'
import { RoleAnimation } from '@/components/role-animation'
import { AVATARS, AvatarById } from '@/components/avatars'
import { GpaCalculator } from './calculator'
import { NavEditor } from './nav-editor'
import { getNavConfig } from '@/lib/nav-config'
import type { Profile } from '@/lib/types'
import Link from 'next/link'

// Role colours (§2): student blue, moderator orange, admin red, creator purple.
const roleColor: Record<string, string> = {
  creator: '#CE82FF',
  admin: '#FF4B4B',
  moderator: '#FF9600',
  student: '#1CB0F6',
}

const roleLabel: Record<string, string> = {
  student: 'Učenik',
  moderator: 'Moderator',
  admin: 'Administrator',
  creator: 'Kreator',
}

// 18% tint of a palette colour over white (§2) — used for leading circles.
function tint(hex: string): CSSProperties {
  return { background: `color-mix(in srgb, ${hex} 18%, white)`, color: hex }
}

// §4.10 list row (rows are separate cards, not hairline-divided).
const ROW_CLASS =
  'w-full min-h-16 px-4 py-3 flex items-center gap-3 rounded-2xl border-2 border-border bg-card text-left shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none'
const ROW_ICON_CLASS = 'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0'
const ROW_TITLE_CLASS = 'flex-1 min-w-0 text-[17px] leading-[1.3] font-extrabold text-heading'
const ROW_SUB_CLASS = 'text-[13px] leading-[1.4] font-bold text-muted-foreground'

const QUICK_ACCESS_PAGES = [
  { id: 'about', href: '/about', label: 'O školi', icon: School, color: '#58CC02' },
  { id: 'schedule', href: '/schedule', label: 'Raspored', icon: Clock, color: '#1CB0F6' },
  { id: 'teachers', href: '/teachers', label: 'Status profesora', icon: Users, color: '#1CB0F6' },
  { id: 'grades', href: '/grades', label: 'Moje ocjene', icon: GraduationCap, color: '#CE82FF' },
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
      <p className="text-[12px] leading-none text-muted-foreground font-extrabold uppercase tracking-[0.04em] px-1">Brzi pristup</p>
      <div className="grid grid-cols-1 gap-2.5">
        {hiddenPages.map((page) => (
          <Link key={page.id} href={page.href} className="block">
            <div className={`${ROW_CLASS} cursor-pointer`}>
              <div className={ROW_ICON_CLASS} style={tint(page.color)}>
                <page.icon className="w-5 h-5" strokeWidth={2.4} />
              </div>
              <span className={ROW_TITLE_CLASS}>{page.label}</span>
              <ChevronRight className="w-5 h-5 text-disabled flex-shrink-0" strokeWidth={2.6} />
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
        <div className="h-44 rounded-2xl skeleton" />
        <div className="h-28 rounded-2xl skeleton" />
        <div className="h-12 rounded-2xl skeleton" />
      </div>
    )
  }

  if (!profile) {
    // §4.11 empty state — no session, nothing to show.
    return (
      <div className="animate-fade-in flex flex-col items-center text-center py-24">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <UserRound className="w-8 h-8 text-disabled" strokeWidth={2.4} />
        </div>
        <p className="text-[17px] leading-[1.3] font-extrabold text-foreground">Nisi prijavljen</p>
        <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground mt-1">Prijavi se da vidiš svoj profil.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/login" />} className="mt-5">
          Prijavi se
        </Button>
      </div>
    )
  }

  if (showCalculator) {
    return <GpaCalculator onBack={() => setShowCalculator(false)} />
  }

  if (showNavEditor) {
    return <NavEditor onClose={() => setShowNavEditor(false)} />
  }

  const roleHex = roleColor[profile.role] || roleColor.student
  const isCreator = profile.role === 'creator'
  const fontLabels: Record<string, string> = { small: 'Malo', normal: 'Normalno', large: 'Veliko' }

  const switchClass = 'h-11 px-1 flex items-center justify-center flex-shrink-0 rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
  const switchTrack = (on: boolean) =>
    `relative block w-12 h-7 rounded-full border-2 transition-colors duration-200 ${on ? 'bg-primary border-primary' : 'bg-border border-border'}`
  const switchKnob = (on: boolean) =>
    `absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-background shadow-[0_1px_0_var(--color-border-strong)] transition-transform duration-200 ${on ? 'translate-x-5' : ''}`

  return (
    <div className="space-y-4 animate-fade-in pb-6">
      {showRoleAnim && <RoleAnimation role={profile.role} onDone={handleRoleAnimDone} />}

      <h1 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] text-heading pt-1" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '0ms', opacity: 0 }}>
        Profil
      </h1>

      {/* Hero profile card */}
      <Card
        className="cursor-pointer active:translate-y-[2px] active:shadow-none transition-[transform,box-shadow] duration-[80ms] p-5"
        onClick={() => setShowRoleAnim(true)}
        style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '60ms', opacity: 0 }}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="relative w-20 h-20 rounded-full flex-shrink-0 border-2 bg-muted flex items-center justify-center overflow-visible"
            style={{ borderColor: roleHex }}
            onClick={(e) => { e.stopPropagation(); setShowAvatarPicker(!showAvatarPicker) }}
          >
            <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden" style={avatarId ? undefined : tint(roleHex)}>
              {avatarId ? (
                <AvatarById id={avatarId} className="w-14 h-14" />
              ) : (
                <span className="text-[24px] font-extrabold" style={{ color: roleHex }}>
                  {profile.first_name[0]}{profile.last_name[0]}
                </span>
              )}
            </div>
            {isCreator && (
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gold border-2 border-background flex items-center justify-center animate-pop-in">
                <Crown className="w-4 h-4 text-[#4B4B4B]" strokeWidth={2.6} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading truncate">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">
              {profile.class_number}-{profile.section_number} razred
            </p>
            <div className="mt-1.5">
              <RoleBadge role={profile.role} size="md" />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <Card style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '120ms', opacity: 0 }}>
        <div className="grid grid-cols-3 divide-x-2 divide-border">
          <div className="flex flex-col items-center gap-1.5 px-2">
            <span className="text-[20px] leading-none font-black tabular-nums text-heading">{profile.class_number}-{profile.section_number}</span>
            <span className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Razred</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2 text-center">
            <span className="text-[15px] leading-none font-black text-heading truncate max-w-full">{roleLabel[profile.role] || profile.role}</span>
            <span className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Uloga</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2 text-center">
            <span className="text-[20px] leading-none font-black tabular-nums text-heading">{new Date(profile.created_at).toLocaleDateString('sr-Latn', { month: 'short', year: 'numeric' })}</span>
            <span className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground">Član od</span>
          </div>
        </div>
      </Card>

      {/* Avatar picker */}
      {showAvatarPicker && (
        <Card className="animate-fade-in gap-3" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '180ms', opacity: 0 }}>
          <p className="text-[17px] leading-[1.3] font-extrabold text-heading">Izaberi avatar</p>
          <div className="grid grid-cols-5 gap-2">
            {AVATARS.map((av) => (
              <button
                key={av.id}
                onClick={() => selectAvatar(av.id)}
                className={`min-h-11 p-2 rounded-xl border-2 transition-[transform,background-color,border-color] duration-[80ms] active:scale-95 ${
                  avatarId === av.id
                    ? 'bg-secondary-light border-secondary-light-border'
                    : 'bg-background border-transparent hover:bg-muted'
                }`}
                title={av.label}
              >
                <av.Component className="w-full h-auto" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Info card */}
      <Card className="gap-3.5" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '240ms', opacity: 0 }}>
        <div className="flex justify-between text-[15px] font-bold">
          <span className="text-muted-foreground">Email</span>
          <span className="truncate ml-4 text-foreground">{profile.email}</span>
        </div>
        <div className="flex justify-between text-[15px] font-bold">
          <span className="text-muted-foreground">Razred</span>
          <span className="text-foreground">{profile.class_number}. razred, {profile.section_number}. odjeljenje</span>
        </div>
        <div className="flex justify-between text-[15px] font-bold">
          <span className="text-muted-foreground">Uloga</span>
          <span className="text-foreground">{roleLabel[profile.role] || profile.role}</span>
        </div>
        <div className="flex justify-between text-[15px] font-bold">
          <span className="text-muted-foreground">Član od</span>
          <span className="text-foreground">{new Date(profile.created_at).toLocaleDateString('sr-Latn')}</span>
        </div>

        {/* Expandable stats */}
        {showStats && (
          <div className="pt-3 border-t-2 border-border space-y-3 animate-expand">
            {(profile.role === 'admin' || profile.role === 'creator') && (
              <div className="flex justify-between text-[15px] font-bold">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4" strokeWidth={2.4} />
                  Objavljene novosti
                </span>
                <span className="font-extrabold text-heading tabular-nums">{postCount}</span>
              </div>
            )}
            <div className="flex justify-between text-[15px] font-bold">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono text-[13px] truncate ml-4 max-w-[180px] text-muted-foreground">{profile.id}</span>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={() => setShowStats(!showStats)}
          className="w-full h-11 text-[13px] text-muted-foreground hover:text-foreground"
        >
          {showStats ? <ChevronUp className="w-4 h-4" strokeWidth={2.6} /> : <ChevronDown className="w-4 h-4" strokeWidth={2.6} />}
          {showStats ? 'Sakrij' : 'Prikaži više'}
        </Button>
      </Card>

      {/* Action buttons */}
      <div className="space-y-2.5" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '300ms', opacity: 0 }}>
        <button
          onClick={() => setShowCalculator(true)}
          className={ROW_CLASS}
        >
          <div className={ROW_ICON_CLASS} style={tint('#1CB0F6')}>
            <Calculator className="w-5 h-5" strokeWidth={2.4} />
          </div>
          <span className={ROW_TITLE_CLASS}>Kalkulator proseka</span>
          <ChevronRight className="w-5 h-5 text-disabled flex-shrink-0" strokeWidth={2.6} />
        </button>


      </div>

      {/* Quick-access cards for pages not in nav */}
      <QuickAccessCards />

      {/* Settings */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={ROW_CLASS}
        style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '360ms', opacity: 0 }}
      >
        <div className={`${ROW_ICON_CLASS} bg-muted text-muted-foreground`}>
          <Settings className="w-5 h-5" strokeWidth={2.4} />
        </div>
        <span className={ROW_TITLE_CLASS}>Podešavanja</span>
        <ChevronDown className={`w-5 h-5 text-disabled flex-shrink-0 transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`} strokeWidth={2.6} />
      </button>

      {showSettings && (
        <div className="animate-expand space-y-2.5">
          {/* Performance mode */}
          <div className={ROW_CLASS}>
            <div className={ROW_ICON_CLASS} style={tint('#FFC800')}>
              <Zap className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={ROW_TITLE_CLASS}>Performance Mode</p>
              <p className={ROW_SUB_CLASS}>Isključi animacije</p>
            </div>
            <button
              onClick={togglePerfMode}
              className={switchClass}
              aria-pressed={perfMode}
            >
              <span className={switchTrack(perfMode)}>
                <span className={switchKnob(perfMode)} />
              </span>
            </button>
          </div>

          {/* Language */}
          <div className={ROW_CLASS}>
            <div className={ROW_ICON_CLASS} style={tint('#1CB0F6')}>
              <Globe className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={ROW_TITLE_CLASS}>Jezik</p>
              <p className={ROW_SUB_CLASS}>Language preference</p>
            </div>
            <Button
              variant="outline"
              onClick={toggleLang}
              className="h-11 px-4 text-[12px] shadow-[0_2px_0_var(--color-border)] active:translate-y-[2px]"
            >
              {lang === 'sr' ? 'Srpski' : 'English'}
            </Button>
          </div>

          {/* Notifications */}
          <div className={ROW_CLASS}>
            <div className={ROW_ICON_CLASS} style={tint('#58CC02')}>
              <Bell className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={ROW_TITLE_CLASS}>Obavještenja</p>
              <p className={ROW_SUB_CLASS}>Push notifikacije</p>
            </div>
            <button
              onClick={toggleNotifications}
              className={switchClass}
              aria-pressed={notifications}
            >
              <span className={switchTrack(notifications)}>
                <span className={switchKnob(notifications)} />
              </span>
            </button>
          </div>

          {/* Font size */}
          <div className={ROW_CLASS}>
            <div className={ROW_ICON_CLASS} style={tint('#FF9600')}>
              <Type className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={ROW_TITLE_CLASS}>Veličina fonta</p>
              <p className={ROW_SUB_CLASS}>Prilagodi tekst</p>
            </div>
            <Button
              variant="outline"
              onClick={cycleFontSize}
              className="h-11 px-4 text-[12px] shadow-[0_2px_0_var(--color-border)] active:translate-y-[2px]"
            >
              {fontLabels[fontSize]}
            </Button>
          </div>

          {/* Navigation editor */}
          <div className={ROW_CLASS}>
            <div className={ROW_ICON_CLASS} style={tint('#CE82FF')}>
              <Navigation className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={ROW_TITLE_CLASS}>Navigacija</p>
              <p className={ROW_SUB_CLASS}>Uredi donji meni</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowNavEditor(true)}
              className="h-11 px-4 text-[12px] shadow-[0_2px_0_var(--color-border)] active:translate-y-[2px]"
            >
              Uredi
            </Button>
          </div>

          {/* Clear cache */}
          <div className={ROW_CLASS}>
            <div className={ROW_ICON_CLASS} style={tint('#FF4B4B')}>
              <Trash2 className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={ROW_TITLE_CLASS}>Obriši keš</p>
              <p className={ROW_SUB_CLASS}>Resetuj lokalne podatke</p>
            </div>
            <Button
              variant="outline"
              onClick={clearCache}
              className="h-11 px-4 text-[12px] text-destructive shadow-[0_2px_0_var(--color-border)] active:translate-y-[2px]"
            >
              Obriši
            </Button>
          </div>

          {/* About */}
          <Card className="gap-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Info className="w-4 h-4 text-muted-foreground" strokeWidth={2.4} />
              <p className="text-[17px] leading-[1.3] font-extrabold text-heading">O aplikaciji</p>
            </div>
            <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">
              Niko Rolović Portal v1.0.0
            </p>
            <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">
              Gimnazija &quot;Niko Rolović&quot; · Bar, Crna Gora
            </p>
          </Card>
        </div>
      )}

      {/* Admin panel button */}
      {(profile.role === 'admin' || profile.role === 'moderator' || profile.role === 'creator') && (
        <button
          onClick={() => router.push('/admin')}
          className={ROW_CLASS}
          style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '420ms', opacity: 0 }}
        >
          <div className={ROW_ICON_CLASS} style={tint('#FF4B4B')}>
            <Shield className="w-5 h-5" strokeWidth={2.4} />
          </div>
          <span className={ROW_TITLE_CLASS}>Admin panel</span>
          <ChevronRight className="w-5 h-5 text-disabled flex-shrink-0" strokeWidth={2.6} />
        </button>
      )}

      <Button
        onClick={handleLogout}
        variant="destructive"
        className="w-full"
      >
        <LogOut className="w-5 h-5" strokeWidth={2.4} />
        Odjavi se
      </Button>

      {/* Active users counter */}
      {activeUsers !== null && (
        <div className="flex items-center justify-center py-3">
          <div className="flex items-center gap-2.5 px-5 h-11 rounded-2xl bg-primary-light border-2 border-primary-light-border">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span className="text-[13px] text-primary-text font-bold">
              Registrovanih učenika:{' '}
              <span className="inline-flex overflow-hidden h-5 align-middle" key={animKey}>
                <span className="inline-block animate-count-up font-extrabold tabular-nums">
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
          className="flex items-center gap-2 px-5 h-11 rounded-xl bg-secondary-light border-2 border-secondary-light-border text-secondary text-[12px] font-extrabold uppercase tracking-[0.04em] shadow-[0_2px_0_var(--color-secondary-light-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          Predlozi
        </a>
        <a href="viber://chat?number=%2B38268499621"
          className="flex items-center gap-2 px-5 h-11 rounded-xl bg-[#F3E3FF] border-2 border-[#E1BDFF] text-accent-dark text-[12px] font-extrabold uppercase tracking-[0.04em] shadow-[0_2px_0_#E1BDFF] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.177.474 6.753.345 9.98.217 13.208.074 19.174 5.58 20.77l.01.006.006.004c.068.039.14.085.22.137v2.87s-.044.858.533 1.031c.637.188.953-.385 1.529-.997l1.252-1.418c3.34.288 5.882-.346 6.166-.445.655-.228 4.366-.687 4.973-5.623.623-5.076-.304-8.283-2.91-10.467C15.645.456 13.167-.022 11.398.002zm.286 1.727c1.524-.03 3.647.36 5.26 1.7 2.177 1.82 2.985 4.593 2.442 8.918-.488 3.906-3.272 4.265-3.81 4.453-.236.082-2.394.613-5.201.441 0 0-2.06 2.479-2.7 3.129-.105.107-.225.148-.306.128-.114-.028-.146-.161-.144-.354.002-.134.01-3.455.01-3.455C3.2 15.643 2.157 13.204 2.267 10.047c.095-2.731.726-4.89 2.176-6.34 1.836-1.767 5.282-2.02 7.24-1.978z"/></svg>
          Viber
        </a>
      </div>

      {/* Creator credit */}
      <p className="text-center text-[13px] font-bold text-muted-foreground pb-4">
        Napravio: Dmitrij Ivascenko II-1
      </p>
    </div>
  )
}
