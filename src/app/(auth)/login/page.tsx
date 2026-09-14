'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { consumeLoginNext } from '@/components/login-prompt'
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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError('Greška pri Google prijavi. Pokušaj ponovo.')
      setGoogleLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        // Check if email exists in profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email.trim().toLowerCase())
          .single()
        
        if (!profile) {
          setError('Nalog sa ovom email adresom ne postoji')
        } else {
          setError('Pogrešna lozinka')
        }
      } else if (error.message.includes('Email not confirmed')) {
        setError('Email nije potvrđen. Provjeri inbox.')
      } else {
        setError('Greška pri prijavi. Pokušaj ponovo.')
      }
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
          router.push(consumeLoginNext() ?? '/gallery')
          router.refresh()
        }}
      />
    )
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-[0_4px_0_var(--color-primary-dark)]">
          <span className="text-2xl font-black text-primary-foreground">NR</span>
        </div>
        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">Gimnazija Niko Rolović</h1>
        <p className="text-[13px] font-bold text-muted-foreground">Prijavi se na studentski portal</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tvoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex min-h-11 items-center gap-2 text-[13px] font-bold cursor-pointer group">
              <div className="relative w-9 h-5 rounded-full bg-primary transition-colors">
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white translate-x-4 transition-transform" />
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">Zapamti me</span>
            </label>
            <Link href="/reset-password" className="inline-flex min-h-11 items-center text-[13px] font-extrabold text-secondary hover:underline">
              Zaboravio lozinku?
            </Link>
          </div>
          {error && (
            <p className="text-destructive text-[13px] font-bold text-center">{error}</p>
          )}
          <Button type="submit" className="animate-press w-full" disabled={loading}>
            {loading ? 'Prijava...' : 'Prijavi se'}
          </Button>
        </form>
        <div className="mt-6 text-center space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground">ili</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="animate-press w-full gap-2"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Prijava...' : 'Prijavi se sa Google'}
          </Button>
          <Link href="/register" className="block">
            <Button variant="outline" className="animate-press w-full gap-2">
              <UserPlus className="w-5 h-5" strokeWidth={2.4} />
              Nemaš nalog? Registruj se
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            className="w-full gap-2"
            onClick={() => setShowTour(true)}
          >
            <Eye className="w-5 h-5" strokeWidth={2.4} />
            Pogledaj sajt
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
