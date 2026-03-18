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

    // Step 1: Verify student exists in verified_students (by name + class, email is optional)
    const { data: verified, error: verifyError } = await supabase
      .from('verified_students')
      .select('id, used')
      .eq('first_name', firstName.trim())
      .eq('last_name', lastName.trim())
      .eq('class_number', parseInt(classNumber))
      .eq('section_number', parseInt(sectionNumber))
      .single()

    if (verifyError || !verified) {
      setError('Nismo te pronašli u bazi učenika. Proveri podatke.')
      setLoading(false)
      return
    }

    if (verified.used) {
      setError('Ovaj učenik je već registrovan.')
      setLoading(false)
      return
    }

    // Step 2: Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          class_number: parseInt(classNumber),
          section_number: parseInt(sectionNumber),
        },
      },
    })

    if (signUpError) {
      if (signUpError.message.includes('rate limit') || signUpError.message.includes('limit exceed')) {
        setError('Previše zahtjeva. Pokušaj ponovo za par minuta.')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    // 2FA DISABLED FOR NOW — create profile immediately
    // TODO: Re-enable OTP verification before full launch
    if (authData.user) {
      // Mark student as used
      await supabase
        .from('verified_students')
        .update({ used: true })
        .eq('id', verified.id)

      // Create profile directly
      await supabase.from('profiles').insert({
        id: authData.user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        class_number: parseInt(classNumber),
        section_number: parseInt(sectionNumber),
        role: 'student',
      })
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
                  variant="outline"
                  className="w-full"
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
                    className="w-full"
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
          <Button type="submit" className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-shadow" disabled={loading}>
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
