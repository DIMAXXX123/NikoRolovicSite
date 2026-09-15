'use client'

import { useEffect, useState, useCallback, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Shield, ChevronDown, ChevronUp, Crown, Newspaper, Calculator, Info, Clock, GraduationCap, School, ChevronRight, Users, UserRound, Gamepad2, Trophy, ClipboardList, BarChart3, BookOpenCheck } from 'lucide-react'
import { RoleBadge } from '@/components/role-badge'
import { GuestLoginButton } from '@/components/guest-login-button'
import { RoleSwitcher } from '@/components/role-switcher'
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
  teacher: 'Profesor',
  razredni: 'Razredni starješina',
  pedagog: 'Pedagog',
  direktor: 'Direktor',
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
  { id: 'game', href: '/game', label: 'Block Blast', icon: Gamepad2, color: '#FF9600' },
  { id: 'tournament', href: '/tournament', label: 'Turnir u košarci', icon: Trophy, color: '#FFC800' },
  { id: 'ednevnik', href: '/ednevnik', label: 'eDnevnik', icon: ClipboardList, color: '#CE82FF' },
]

const SKOLA_PANEL_ROLES = ['direktor', 'pedagog', 'razredni', 'admin', 'creator']
const APLIKACIJA_PANEL_ROLES = ['direktor', 'admin', 'creator']
const NASTAVNIK_PANEL_ROLES = ['teacher', 'razredni', 'pedagog', 'direktor', 'admin', 'creator']

/** Prominent entry points to the Škola / Aplikacija / Profesor panels, gated by role. */
function PanelRows({ role }: { role: string }) {
  const showSkola = SKOLA_PANEL_ROLES.includes(role)
  const showApp = APLIKACIJA_PANEL_ROLES.includes(role)
  const showNastavnik = NASTAVNIK_PANEL_ROLES.includes(role)
  if (!showSkola && !showApp && !showNastavnik) return null
  return (
    <div className="space-y-2.5" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '240ms', opacity: 0 }}>
      {showSkola && (
        <Link href="/skola" className={`${ROW_CLASS} border-[#B8F28B] bg-[#F1FBE8] shadow-[0_2px_0_#B8F28B]`}>
          <div className={ROW_ICON_CLASS} style={tint('#58CC02')}>
            <School className="w-5 h-5" strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={ROW_TITLE_CLASS}>Škola</p>
            <p className={ROW_SUB_CLASS}>Ocjene, izostanci, odjeljenja, ponašanje</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#58A700] flex-shrink-0" strokeWidth={2.6} />
        </Link>
      )}
      {showApp && (
        <Link href="/aplikacija" className={`${ROW_CLASS} border-[#84D8FF] bg-[#EEF9FF] shadow-[0_2px_0_#84D8FF]`}>
          <div className={ROW_ICON_CLASS} style={tint('#1CB0F6')}>
            <BarChart3 className="w-5 h-5" strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={ROW_TITLE_CLASS}>Aplikacija</p>
            <p className={ROW_SUB_CLASS}>Ko i kako koristi aplikaciju</p>
          </div>
          <ChevronRight className="w-5 h-5 text-secondary flex-shrink-0" strokeWidth={2.6} />
        </Link>
      )}
      {showNastavnik && (
        <Link href="/nastavnik" className={`${ROW_CLASS} border-[#E1BDFF] bg-[#F9F3FF] shadow-[0_2px_0_#E1BDFF]`}>
          <div className={ROW_ICON_CLASS} style={tint('#CE82FF')}>
            <BookOpenCheck className="w-5 h-5" strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={ROW_TITLE_CLASS}>Panel profesora</p>
            <p className={ROW_SUB_CLASS}>Moje lekcije, razredi, domaći</p>
          </div>
          <ChevronRight className="w-5 h-5 text-accent-dark flex-shrink-0" strokeWidth={2.6} />
        </Link>
      )}
    </div>
  )
}

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
  const [postCount, setPostCount] = useState(0)
  const [showRoleAnim, setShowRoleAnim] = useState(false)
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showNavEditor, setShowNavEditor] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

  function selectAvatar(id: string) {
    setAvatarId(id)
    localStorage.setItem('user_avatar', id)
    setShowAvatarPicker(false)
  }

  function applyFontSize(size: string) {
    document.documentElement.classList.remove('font-small', 'font-large')
    if (size === 'small') document.documentElement.classList.add('font-small')
    if (size === 'large') document.documentElement.classList.add('font-large')
  }

  useEffect(() => {
    loadProfile()
    // Preferences saved earlier (perf mode, font size) still apply; the toggles moved out of Još.
    if (localStorage.getItem('perf_mode') === 'true') document.body.classList.add('perf-mode')
    const savedAvatar = localStorage.getItem('user_avatar')
    if (savedAvatar) setAvatarId(savedAvatar)
    applyFontSize(localStorage.getItem('app_font_size') || 'normal')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  if (showCalculator) {
    return <GpaCalculator onBack={() => setShowCalculator(false)} />
  }

  if (showNavEditor) {
    return <NavEditor onClose={() => setShowNavEditor(false)} />
  }

  if (!profile) {
    return (
      <div className="space-y-4 animate-fade-in pb-6">
        <RoleSwitcher />

        {/* Guest hero */}
        <Card className="p-5 flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-full bg-muted border-2 border-border flex items-center justify-center text-disabled">
            <UserRound className="w-9 h-9" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-[20px] leading-[1.25] font-extrabold text-heading">Gost</h1>
            <p className="mt-1 text-[13px] leading-[1.4] font-bold text-muted-foreground">Prijavi se da vidiš svoj profil, ocjene i podešavanja.</p>
          </div>
          <div className="w-full flex flex-col gap-3 pt-1">
            <Button className="w-full" onClick={() => router.push('/login')}>Prijavi se</Button>
            <GuestLoginButton variant="secondary" next="/profile" />
            <Button variant="outline" className="w-full" onClick={() => router.push('/register')}>Registruj se</Button>
          </div>
        </Card>

        {/* Works without a session */}
        <div className="space-y-2.5">
          <button onClick={() => setShowCalculator(true)} className={ROW_CLASS}>
            <div className={ROW_ICON_CLASS} style={tint('#1CB0F6')}>
              <Calculator className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <span className={ROW_TITLE_CLASS}>Kalkulator proseka</span>
            <ChevronRight className="w-5 h-5 text-disabled flex-shrink-0" strokeWidth={2.6} />
          </button>
        </div>

        <QuickAccessCards />


        <div className="flex flex-wrap items-center justify-center gap-3 py-2">
          <Link href="/about" className="flex items-center gap-2 px-5 h-11 rounded-xl bg-card border-2 border-border text-secondary text-[12px] font-extrabold uppercase tracking-[0.04em] shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
            <Info className="w-4 h-4" strokeWidth={2.6} />
            O aplikaciji
          </Link>
          <Link href="/privacy" className="flex items-center gap-2 px-5 h-11 rounded-xl bg-card border-2 border-border text-secondary text-[12px] font-extrabold uppercase tracking-[0.04em] shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none">
            <Shield className="w-4 h-4" strokeWidth={2.6} />
            Privatnost
          </Link>
        </div>

      </div>
    )
  }

  const roleHex = roleColor[profile.role] || roleColor.student
  const isCreator = profile.role === 'creator'


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
        {!profile.email.endsWith('@gost.local') && (
          <div className="flex justify-between text-[15px] font-bold">
            <span className="text-muted-foreground">Email</span>
            <span className="truncate ml-4 text-foreground">{profile.email}</span>
          </div>
        )}
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

      <RoleSwitcher />

      <PanelRows role={profile.role} />

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

    </div>
  )
}
