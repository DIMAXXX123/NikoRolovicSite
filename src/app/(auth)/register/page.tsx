'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [classNumber, setClassNumber] = useState('1')
  const [sectionNumber, setSectionNumber] = useState('1')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [reqIme, setReqIme] = useState('')
  const [reqPrezime, setReqPrezime] = useState('')
  const [reqRazred, setReqRazred] = useState('1')
  const [reqOdjeljenje, setReqOdjeljenje] = useState('1')
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleRegister = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError('Greška pri Google registraciji. Pokušajte ponovo.')
      setGoogleLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju')
      return
    }
    setLoading(true)
    setError('')

    // Register via server API (admin SDK, email auto-confirmed)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        classNumber: parseInt(classNumber),
        sectionNumber: parseInt(sectionNumber),
        email: email.trim().toLowerCase(),
        password,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Greška pri registraciji')
      setLoading(false)
      return
    }

    // Sign in immediately (user already confirmed via admin)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Go straight to main page
    router.push('/gallery')
    router.refresh()
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'var(--theme-primary, #7c5cfc)' }}>
          <span className="text-2xl font-bold text-white">NR</span>
        </div>
        <h1 className="text-2xl font-bold gradient-text">Registracija</h1>
        <p className="text-muted-foreground text-sm">Unesi svoje podatke za verifikaciju</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">Ime</Label>
              <Input
                id="firstName"
                placeholder="Marko"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Prezime</Label>
              <Input
                id="lastName"
                placeholder="Petrović"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="class">Razred</Label>
              <select
                id="class"
                value={classNumber}
                onChange={(e) => setClassNumber(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n}. razred</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Odjeljenje</Label>
              <select
                id="section"
                value={sectionNumber}
                onChange={(e) => setSectionNumber(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}. odjeljenje</option>
                ))}
              </select>
            </div>
          </div>
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
              placeholder="Minimum 6 karaktera"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potvrdi lozinku</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Ponovi lozinku"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="bg-background/50"
            />
          </div>
          {error && (
            <div className="space-y-3">
              <p className="text-destructive text-sm text-center">{error}</p>
              {error.includes('Nismo te pronašli') && !showRequestForm && (
                <Button
                  type="button"
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:shadow-[0_0_50px_rgba(245,158,11,0.7)] transition-all animate-pulse border border-amber-400/40"
                  onClick={() => {
                    setShowRequestForm(true)
                    setReqIme(firstName)
                    setReqPrezime(lastName)
                    setReqRazred(classNumber)
                    setReqOdjeljenje(sectionNumber)
                  }}
                >
                  Pošalji zahtjev za dodavanje
                </Button>
              )}
              {showRequestForm && (
                <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-background/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="reqIme">Ime</Label>
                      <Input id="reqIme" value={reqIme} onChange={(e) => setReqIme(e.target.value)} className="bg-background/50" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reqPrezime">Prezime</Label>
                      <Input id="reqPrezime" value={reqPrezime} onChange={(e) => setReqPrezime(e.target.value)} className="bg-background/50" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="reqRazred">Razred</Label>
                      <select id="reqRazred" value={reqRazred} onChange={(e) => setReqRazred(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {[1, 2, 3, 4].map((n) => (<option key={n} value={n}>{n}. razred</option>))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reqOdjeljenje">Odjeljenje</Label>
                      <select id="reqOdjeljenje" value={reqOdjeljenje} onChange={(e) => setReqOdjeljenje(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {[1, 2, 3, 4, 5, 6].map((n) => (<option key={n} value={n}>{n}. odjeljenje</option>))}
                      </select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)] transition-all border border-amber-400/40"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/request-join', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            firstName: reqIme.trim(),
                            lastName: reqPrezime.trim(),
                            classNumber: parseInt(reqRazred),
                            sectionNumber: parseInt(reqOdjeljenje),
                            fingerprint: navigator.userAgent,
                          }),
                        })
                        const data = await res.json()
                        if (data.ok) {
                          setError('')
                          setShowRequestForm(false)
                          alert('Zahtjev poslat! Administrator će ga pregledati.')
                        } else {
                          alert(data.error || 'Greška')
                        }
                      } catch {
                        alert('Greška pri slanju zahtjeva')
                      }
                    }}
                    disabled={!reqIme.trim() || !reqPrezime.trim()}
                  >
                    Pošalji zahtjev
                  </Button>
                  <p className="text-muted-foreground text-xs text-center">Zahtjev se šalje administratoru. Maksimalno 2 pokušaja.</p>
                </div>
              )}
            </div>
          )}
          <Button type="submit" className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] hover:from-purple-400 hover:to-violet-500 shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:shadow-[0_0_60px_rgba(139,92,246,0.7)] transition-all border border-purple-400/30 text-white tracking-wide" disabled={loading}>
            {loading ? 'Registracija...' : 'REGISTRUJ SE'}
          </Button>
        </form>
        <div className="mt-4 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">ili</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full py-5 text-base font-semibold gap-3 border-border/50 hover:bg-muted/50"
            onClick={handleGoogleRegister}
            disabled={googleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Registracija...' : 'Registruj se sa Google'}
          </Button>
          <div className="text-center">
            <Link href="/login" className="text-sm text-primary hover:underline">
              Već imaš nalog? Prijavi se
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
