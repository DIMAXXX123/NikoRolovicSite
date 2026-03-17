'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { UserPlus, Eye } from 'lucide-react'
import { SuccessAnimation } from '@/components/success-animation'
import { SiteTour } from '@/components/site-tour'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Pogrešan email ili lozinka')
      setLoading(false)
    } else {
      setShowSuccess(true)
    }
  }

  if (showTour) {
    return <SiteTour onClose={() => setShowTour(false)} />
  }

  if (showSuccess) {
    return (
      <SuccessAnimation
        message="Uspešna prijava!"
        onComplete={() => {
          router.push('/gallery')
          router.refresh()
        }}
      />
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'var(--theme-primary, #a78bfa)' }}>
          <span className="text-2xl font-bold text-white">NR</span>
        </div>
        <h1 className="text-2xl font-bold gradient-text">Gimnazija Niko Rolović</h1>
        <p className="text-muted-foreground text-sm">Prijavi se na studentski portal</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tvoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>
          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
          <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800" disabled={loading}>
            {loading ? 'Prijava...' : 'Prijavi se'}
          </Button>
        </form>
        <div className="mt-6 text-center space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">ili</span>
            </div>
          </div>
          <Link href="/register" className="block">
            <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:border-primary text-base py-5 font-semibold gap-2">
              <UserPlus className="w-5 h-5" />
              Nemaš nalog? Registruj se
            </Button>
          </Link>
          <button
            onClick={() => setShowTour(true)}
            className="w-full py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all hover:bg-muted/50"
          >
            <Eye className="w-4 h-4" />
            Pogledaj sajt
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
