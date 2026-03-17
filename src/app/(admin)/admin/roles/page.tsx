'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, ShieldAlert, Plus, X, Trash2 } from 'lucide-react'
import type { Profile, UserRole } from '@/lib/types'

const STANDARD_ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'student', label: 'Student', color: 'bg-slate-500/20 text-slate-300' },
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
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as UserRole } : u))
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
    return { label: role, color: 'bg-slate-500/20 text-slate-300', icon: '' }
  }

  const allRoleOptions = [
    ...STANDARD_ROLES.map(r => r.value),
    ...customRoles.map(r => r.name),
  ]

  const selectClass = "flex h-9 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors"

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Upravljanje ulogama</h1>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-slate-800 animate-pulse" />
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraži po imenu ili emailu..."
            className="pl-10 rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              roleFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-[#1e293b] text-slate-400 hover:text-white'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  roleFilter === r.value ? 'bg-blue-500 text-white' : 'bg-[#1e293b] text-slate-400 hover:text-white'
                }`}
              >
                {r.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Roles Section */}
      <div className="rounded-xl bg-[#1e293b] border border-slate-700/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Prilagođene uloge</h3>
          <button
            onClick={() => setShowCustomRoleForm(!showCustomRoleForm)}
            className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
          >
            {showCustomRoleForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {showCustomRoleForm ? 'Otkaži' : 'Nova uloga'}
          </button>
        </div>

        {showCustomRoleForm && (
          <div className="space-y-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs">Naziv uloge</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="npr. urednik"
                className="rounded-lg bg-slate-800 border-slate-600 text-white text-sm focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs">Emoji ikona</Label>
              <Input
                value={newRoleIcon}
                onChange={(e) => setNewRoleIcon(e.target.value)}
                placeholder="npr. ✏️"
                className="rounded-lg bg-slate-800 border-slate-600 text-white text-sm focus:border-blue-500"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs">Boja</Label>
              <div className="flex gap-2 flex-wrap">
                {ROLE_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewRoleColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${newRoleColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={addCustomRole}
              disabled={!newRoleName.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
            >
              Kreiraj ulogu
            </Button>
          </div>
        )}

        {customRoles.length === 0 ? (
          <p className="text-xs text-slate-500">Nema prilagođenih uloga</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {customRoles.map((role, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-600"
                style={{ backgroundColor: role.color + '20', color: role.color }}
              >
                {role.icon && <span>{role.icon}</span>}
                <span>{role.name}</span>
                <button onClick={() => deleteCustomRole(i)} className="ml-1 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users List */}
      <p className="text-sm text-slate-400">{filteredUsers.length} korisnika</p>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nema korisnika</p>
        </div>
      ) : (
        filteredUsers.map((user) => {
          const roleDisplay = getRoleDisplay(user.role)
          return (
            <div key={user.id} className="rounded-xl bg-[#1e293b] border border-slate-700/50 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-white truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500">{user.class_number}-{user.section_number}</span>
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
                    <option key={r} value={r}>{r}</option>
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
