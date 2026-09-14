'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, ShieldAlert, Plus, X, Trash2 } from 'lucide-react'
import type { Profile, UserRole } from '@/lib/types'

const STANDARD_ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'student', label: 'Student', color: 'border-secondary-light-border bg-secondary-light text-secondary' },
  { value: 'moderator', label: 'Moderator', color: 'border-[#FFD199] bg-[#FFF0DC] text-[#C67300]' },
  { value: 'admin', label: 'Admin', color: 'border-[#FFB3B5] bg-[#FFDFE0] text-[#EA2B2B]' },
  { value: 'creator', label: 'Creator', color: 'border-[#E1BDFF] bg-[#F3E3FF] text-accent-dark' },
]

interface CustomRole {
  name: string
  color: string
  icon: string
}

const ROLE_COLORS = [
  '#FF4B4B', '#FF9600', '#FFC800', '#58CC02', '#1CB0F6',
  '#1899D6', '#CE82FF', '#FF86D0', '#EA2B2B', '#46A302',
]

export default function AdminRolesPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Custom roles
  const [showCustomRoleForm, setShowCustomRoleForm] = useState(false)
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleColor, setNewRoleColor] = useState(ROLE_COLORS[0])
  const [newRoleIcon, setNewRoleIcon] = useState('')

  const supabase = createClient()

  useEffect(() => {
    let filtered = users
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(u =>
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }
    setFilteredUsers(filtered)
  }, [search, roleFilter, users])

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('last_name', { ascending: true })
    if (data) {
      setUsers(data)
      setFilteredUsers(data)
    }
    setLoading(false)
  }

  function loadCustomRoles() {
    try {
      const stored = localStorage.getItem('custom_roles')
      if (stored) setCustomRoles(JSON.parse(stored))
    } catch {}
  }

  useEffect(() => {
    loadUsers()
    loadCustomRoles()
  }, [])

  function saveCustomRoles(roles: CustomRole[]) {
    setCustomRoles(roles)
    localStorage.setItem('custom_roles', JSON.stringify(roles))
  }

  async function changeRole(userId: string, newRole: string) {
    setUpdatingId(userId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole, adminEmail: user?.email }),
      })
      const result = await res.json()
      if (result.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as UserRole } : u))
      } else {
        alert('Greška: ' + (result.error || 'Nepoznata greška'))
      }
    } catch (err) {
      alert('Greška pri promjeni role')
    }
    setUpdatingId(null)
  }

  function addCustomRole() {
    if (!newRoleName.trim()) return
    const role: CustomRole = {
      name: newRoleName.trim().toLowerCase(),
      color: newRoleColor,
      icon: newRoleIcon || '',
    }
    saveCustomRoles([...customRoles, role])
    setNewRoleName(''); setNewRoleIcon(''); setShowCustomRoleForm(false)
  }

  function deleteCustomRole(index: number) {
    saveCustomRoles(customRoles.filter((_, i) => i !== index))
  }

  function getRoleDisplay(role: string) {
    const standard = STANDARD_ROLES.find(r => r.value === role)
    if (standard) return { label: standard.label, color: standard.color, icon: '' }
    const custom = customRoles.find(r => r.name === role)
    if (custom) return { label: custom.name, color: '', icon: custom.icon, customColor: custom.color }
    return { label: role, color: 'border-border bg-background text-muted-foreground', icon: '' }
  }

  const allRoleOptions = [
    ...STANDARD_ROLES.map(r => r.value),
    ...customRoles.map(r => r.name),
  ]

  const selectClass = "flex h-11 w-full rounded-xl border-2 border-border bg-muted px-2 py-1 text-[13px] font-extrabold text-foreground focus:border-secondary focus:bg-background focus:outline-none transition-colors disabled:text-disabled"

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">Upravljanje ulogama</h1>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-2xl skeleton" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">Upravljanje ulogama</h1>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-disabled" strokeWidth={2.4} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraži po imenu ili emailu..."
            className="pl-12"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setRoleFilter('all')}
            className={`h-10 px-3.5 rounded-xl border-2 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow,background-color,border-color,color] duration-[80ms] active:translate-y-[2px] active:shadow-none ${
              roleFilter === 'all'
                ? 'bg-secondary-light border-secondary-light-border text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]'
                : 'bg-background border-border text-muted-foreground shadow-[0_2px_0_var(--color-border)] hover:text-foreground'
            }`}
          >
            Svi ({users.length})
          </button>
          {STANDARD_ROLES.map(r => {
            const count = users.filter(u => u.role === r.value).length
            return (
              <button
                key={r.value}
                onClick={() => setRoleFilter(r.value)}
                className={`h-10 px-3.5 rounded-xl border-2 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow,background-color,border-color,color] duration-[80ms] active:translate-y-[2px] active:shadow-none ${
                  roleFilter === r.value
                    ? 'bg-secondary-light border-secondary-light-border text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]'
                    : 'bg-background border-border text-muted-foreground shadow-[0_2px_0_var(--color-border)] hover:text-foreground'
                }`}
              >
                {r.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Roles Section */}
      <div className="rounded-2xl bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] leading-[1.3] font-extrabold text-heading">Prilagođene uloge</h3>
          <Button
            variant="ghost"
            className="px-3"
            onClick={() => setShowCustomRoleForm(!showCustomRoleForm)}
          >
            {showCustomRoleForm ? <X strokeWidth={2.6} /> : <Plus strokeWidth={2.6} />}
            {showCustomRoleForm ? 'Otkaži' : 'Nova uloga'}
          </Button>
        </div>

        {showCustomRoleForm && (
          <div className="space-y-3 p-4 rounded-2xl bg-muted border-2 border-border">
            <div>
              <Label>Naziv uloge</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="npr. urednik"
                className="bg-background"
              />
            </div>
            <div>
              <Label>Emoji ikona</Label>
              <Input
                value={newRoleIcon}
                onChange={(e) => setNewRoleIcon(e.target.value)}
                placeholder="npr. ✏️"
                className="bg-background"
                maxLength={2}
              />
            </div>
            <div>
              <Label>Boja</Label>
              <div className="flex gap-2 flex-wrap">
                {ROLE_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewRoleColor(color)}
                    className={`w-11 h-11 rounded-full border-[3px] transition-transform ${newRoleColor === color ? 'border-foreground scale-110' : 'border-border hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={addCustomRole}
              disabled={!newRoleName.trim()}
              className="w-full"
            >
              Kreiraj ulogu
            </Button>
          </div>
        )}

        {customRoles.length === 0 ? (
          <p className="text-[13px] font-bold text-muted-foreground">Nema prilagođenih uloga</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {customRoles.map((role, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 pl-3 pr-1 h-10 rounded-full text-[12px] font-extrabold uppercase tracking-[0.04em] border-2"
                style={{ backgroundColor: role.color + '20', borderColor: role.color + '55', color: role.color }}
              >
                {role.icon && <span>{role.icon}</span>}
                <span>{role.name}</span>
                <button type="button" aria-label="Ukloni ulogu" onClick={() => deleteCustomRole(i)} className="w-8 h-8 rounded-full flex items-center justify-center hover:text-destructive transition-colors">
                  <X className="w-4 h-4" strokeWidth={2.6} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users List */}
      <p className="text-[13px] font-bold text-muted-foreground">{filteredUsers.length} korisnika</p>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-disabled" strokeWidth={2.4} />
          </div>
          <p className="text-[17px] font-extrabold text-foreground">Nema korisnika</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredUsers.map((user, index) => {
            const roleDisplay = getRoleDisplay(user.role)
            return (
              <div
                key={user.id}
                className="animate-stagger-item rounded-2xl bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] px-4 py-3 min-h-[64px] flex items-center justify-between gap-3"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-[1.3] font-extrabold text-heading truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-[13px] font-bold text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] font-extrabold text-muted-foreground">{user.class_number}-{user.section_number}</span>
                    <span
                      className={`inline-flex items-center h-6 px-2.5 rounded-full border-2 text-[11px] leading-none font-extrabold uppercase tracking-[0.06em] ${roleDisplay.color || ''}`}
                      style={roleDisplay.customColor ? { backgroundColor: roleDisplay.customColor + '20', borderColor: roleDisplay.customColor + '55', color: roleDisplay.customColor } : undefined}
                    >
                      {roleDisplay.icon && `${roleDisplay.icon} `}{roleDisplay.label}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 w-28">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    disabled={updatingId === user.id}
                    className={selectClass}
                  >
                    {allRoleOptions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
