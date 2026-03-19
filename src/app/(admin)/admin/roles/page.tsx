'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, ShieldAlert, Plus, X, Trash2 } from 'lucide-react'
import type { Profile, UserRole } from '@/lib/types'

const STANDARD_ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'student', label: 'Student', color: 'bg-white/10 text-white/60' },
  { value: 'moderator', label: 'Moderator', color: 'bg-blue-500/20 text-blue-300' },
  { value: 'admin', label: 'Admin', color: 'bg-amber-500/20 text-amber-300' },
  { value: 'creator', label: 'Creator', color: 'bg-purple-500/20 text-purple-300' },
]

interface CustomRole {
  name: string
  color: string
  icon: string
}

const ROLE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6',
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
    loadUsers()
    loadCustomRoles()
  }, [])

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
    return { label: role, color: 'bg-white/10 text-white/50', icon: '' }
  }

  const allRoleOptions = [
    ...STANDARD_ROLES.map(r => r.value),
    ...customRoles.map(r => r.name),
  ]

  const selectClass = "flex h-9 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-white focus:border-purple-500 focus:outline-none transition-colors"

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Upravljanje ulogama</h1>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Upravljanje ulogama</h1>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraži po imenu ili emailu..."
            className="pl-10 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-purple-500 focus:ring-purple-500/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              roleFilter === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/[0.04] text-white/40 hover:text-white border border-white/[0.08] hover:border-purple-500/30'
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  roleFilter === r.value
                    ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/[0.04] text-white/40 hover:text-white border border-white/[0.08] hover:border-purple-500/30'
                }`}
              >
                {r.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Roles Section */}
      <div className="rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Prilagođene uloge</h3>
          <button
            onClick={() => setShowCustomRoleForm(!showCustomRoleForm)}
            className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1 transition-colors"
          >
            {showCustomRoleForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {showCustomRoleForm ? 'Otkaži' : 'Nova uloga'}
          </button>
        </div>

        {showCustomRoleForm && (
          <div className="space-y-3 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <div className="space-y-2">
              <Label className="text-white/50 text-xs">Naziv uloge</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="npr. urednik"
                className="rounded-xl bg-white/[0.04] border-white/[0.08] text-white text-sm focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/50 text-xs">Emoji ikona</Label>
              <Input
                value={newRoleIcon}
                onChange={(e) => setNewRoleIcon(e.target.value)}
                placeholder="npr. ✏️"
                className="rounded-xl bg-white/[0.04] border-white/[0.08] text-white text-sm focus:border-purple-500 focus:ring-purple-500/20"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/50 text-xs">Boja</Label>
              <div className="flex gap-2 flex-wrap">
                {ROLE_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewRoleColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${newRoleColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#0f1729]' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={addCustomRole}
              disabled={!newRoleName.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-xl text-sm shadow-lg shadow-purple-500/20"
            >
              Kreiraj ulogu
            </Button>
          </div>
        )}

        {customRoles.length === 0 ? (
          <p className="text-xs text-white/25">Nema prilagođenih uloga</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {customRoles.map((role, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/[0.08]"
                style={{ backgroundColor: role.color + '20', color: role.color }}
              >
                {role.icon && <span>{role.icon}</span>}
                <span>{role.name}</span>
                <button onClick={() => deleteCustomRole(i)} className="ml-1 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users List */}
      <p className="text-sm text-white/40">{filteredUsers.length} korisnika</p>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nema korisnika</p>
        </div>
      ) : (
        filteredUsers.map((user, index) => {
          const roleDisplay = getRoleDisplay(user.role)
          return (
            <div
              key={user.id}
              className="animate-stagger-item rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] p-3 flex items-center justify-between gap-3 hover:-translate-y-[2px] hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/20 transition-all duration-300 group"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-white truncate group-hover:text-purple-200 transition-colors">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-white/30 truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-white/20">{user.class_number}-{user.section_number}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleDisplay.color || ''}`}
                    style={roleDisplay.customColor ? { backgroundColor: roleDisplay.customColor + '20', color: roleDisplay.customColor } : undefined}
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
                    <option key={r} value={r} className="bg-[#1a1f35] text-white">{r}</option>
                  ))}
                </select>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
