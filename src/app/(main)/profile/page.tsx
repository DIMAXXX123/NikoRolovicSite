'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Shield, Settings } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const roleLabel = {
    student: 'Učenik',
    moderator: 'Moderator',
    admin: 'Administrator',
  }

  const roleColor = {
    student: 'bg-muted text-muted-foreground',
    moderator: 'bg-blue-500/20 text-blue-400',
    admin: 'bg-purple-500/20 text-purple-400',
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold gradient-text">Profil</h1>

      <Card className="border-border/30 bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">
                {profile.first_name[0]}{profile.last_name[0]}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {profile.class_number}-{profile.section_number} razred
              </p>
              <Badge className={`mt-1 ${roleColor[profile.role]}`}>
                {roleLabel[profile.role]}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/30 bg-card/50 backdrop-blur">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{profile.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Razred</span>
            <span>{profile.class_number}. razred, {profile.section_number}. odjeljenje</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Član od</span>
            <span>{new Date(profile.created_at).toLocaleDateString('sr-Latn')}</span>
          </div>
        </CardContent>
      </Card>

      {(profile.role === 'admin' || profile.role === 'moderator') && (
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
