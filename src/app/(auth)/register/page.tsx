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
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [reqIme, setReqIme] = useState('')
  const [reqPrezime, setReqPrezime] = useState('')
  const [reqRazred, setReqRazred] = useState('1')
  const [reqOdjeljenje, setReqOdjeljenje] = useState('1')
  const router = useRouter()
  const supabase = createClient()

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
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'var(--theme-primary, #a78bfa)' }}>
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
          <Button type="submit" className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:shadow-[0_0_60px_rgba(139,92,246,0.7)] transition-all border border-purple-400/30 text-white tracking-wide" disabled={loading}>
            {loading ? 'Registracija...' : 'REGISTRUJ SE'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            Već imaš nalog? Prijavi se
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
