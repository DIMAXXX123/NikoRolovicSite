'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SuccessAnimation } from '@/components/success-animation'
import { ChevronDown } from 'lucide-react'

const selectClass =
  'flex h-[50px] w-full appearance-none rounded-2xl border-2 border-border bg-muted pl-4 pr-11 text-[15px] font-bold text-foreground outline-none transition-colors focus-visible:border-secondary focus-visible:bg-background'

const selectChevron =
  'pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-disabled'

const CLASS_LABELS = ['I', 'II', 'III', 'IV']

export default function CompleteProfilePage() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [classNumber, setClassNumber] = useState('1')
  const [sectionNumber, setSectionNumber] = useState('1')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setEmail(user.email || '')

      // Don't pre-fill name from Google — user must enter exactly as in school records

      // Check if profile is already complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, class_number, section_number')
        .eq('id', user.id)
        .single()

      if (profile?.first_name && profile?.last_name && profile?.class_number && profile?.section_number) {
        router.push('/gallery')
        return
      }

      setPageLoading(false)
    }
    getUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const classNum = parseInt(classNumber)
    const sectionNum = parseInt(sectionNumber)

    if (!trimmedFirst || !trimmedLast) {
      setError('Unesite ime i prezime')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju')
      setLoading(false)
      return
    }

    // The roster (verified_students) is service-role only, so the match and
    // the profile creation happen in the API route.
    const res = await fetch('/api/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: trimmedFirst,
        lastName: trimmedLast,
        classNumber: classNum,
        sectionNumber: sectionNum,
      }),
    }).catch(() => null)

    if (!res || !res.ok) {
      const { error: message } = (await res?.json().catch(() => null)) ?? {}
      setError(typeof message === 'string' && message
        ? message
        : 'Greška pri čuvanju profila. Pokušajte ponovo.')
      setLoading(false)
      return
    }

    // Set password so user can also login with email+password
    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      setError('Greška pri postavljanju lozinke. Pokušajte ponovo.')
      setLoading(false)
      return
    }

    setShowSuccess(true)
  }

  if (pageLoading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
        </CardContent>
      </Card>
    )
  }

  if (showSuccess) {
    return (
      <SuccessAnimation
        message="Profil je kompletiran!"
        onComplete={() => {
          router.push('/gallery')
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
        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">Dopuni profil</h1>
        <p className="text-[13px] font-bold text-muted-foreground">Unesite podatke da biste završili registraciju</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
            />
          </div>
          <div>
            <Label htmlFor="firstName">Ime</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Vaše ime"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Prezime</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Vaše prezime"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              type="password"
              placeholder="Najmanje 6 karaktera"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Potvrdi lozinku</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Ponovite lozinku"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="classNumber">Razred</Label>
              <div className="relative">
                <select
                  id="classNumber"
                  value={classNumber}
                  onChange={(e) => setClassNumber(e.target.value)}
                  className={selectClass}
                >
                  {CLASS_LABELS.map((label, i) => (
                    <option key={i + 1} value={i + 1}>{label}</option>
                  ))}
                </select>
                <ChevronDown className={selectChevron} strokeWidth={2.6} />
              </div>
            </div>
            <div>
              <Label htmlFor="sectionNumber">Odjeljenje</Label>
              <div className="relative">
                <select
                  id="sectionNumber"
                  value={sectionNumber}
                  onChange={(e) => setSectionNumber(e.target.value)}
                  className={selectClass}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <ChevronDown className={selectChevron} strokeWidth={2.6} />
              </div>
            </div>
          </div>
          {error && (
            <p className="text-destructive text-[13px] font-bold text-center">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Čuvanje...' : 'Završi registraciju'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
