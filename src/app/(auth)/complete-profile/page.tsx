'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SuccessAnimation } from '@/components/success-animation'

const CLASS_LABELS = ['I', 'II', 'III', 'IV']

export default function CompleteProfilePage() {
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
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
      setUserId(user.id)

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

    // Normalize diacritics for comparison (Coso = Ćoso, Scekic = Šćekić)
    const normalize = (s: string) =>
      s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

    // Fetch all students in this class+section and match with normalization
    const { data: students, error: verifyError } = await supabase
      .from('verified_students')
      .select('id, first_name, last_name, used')
      .eq('class_number', classNum)
      .eq('section_number', sectionNum)

    const student = students?.find(
      (s: { id: string; first_name: string; last_name: string; used: boolean }) =>
        normalize(s.first_name) === normalize(trimmedFirst) &&
        normalize(s.last_name) === normalize(trimmedLast)
    )

    if (verifyError || !student) {
      setError('Niste na spisku učenika. Provjerite da li ste pravilno unijeli podatke.')
      setLoading(false)
      return
    }

    if (student.used) {
      setError('Ovaj učenik je već registrovan. Ako mislite da je greška, obratite se administratoru.')
      setLoading(false)
      return
    }

    // Update profile — use the name from verified_students (correct diacritics)
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        first_name: student.first_name,
        last_name: student.last_name,
        class_number: classNum,
        section_number: sectionNum,
      })

    if (updateError) {
      setError('Greška pri čuvanju profila. Pokušajte ponovo.')
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

    // Mark student as used
    await supabase
      .from('verified_students')
      .update({ used: true })
      .eq('id', student.id)

    setShowSuccess(true)
  }

  if (pageLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'var(--theme-primary, #7c5cfc)' }}>
          <span className="text-2xl font-bold text-white">NR</span>
        </div>
        <h1 className="text-2xl font-bold gradient-text">Dopuni profil</h1>
        <p className="text-muted-foreground text-sm">Unesite podatke da biste završili registraciju</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted/50 text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">Ime</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Vaše ime"
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
              type="text"
              placeholder="Vaše prezime"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              type="password"
              placeholder="Najmanje 6 karaktera"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potvrdi lozinku</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Ponovite lozinku"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classNumber">Razred</Label>
              <select
                id="classNumber"
                value={classNumber}
                onChange={(e) => setClassNumber(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CLASS_LABELS.map((label, i) => (
                  <option key={i + 1} value={i + 1}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionNumber">Odjeljenje</Label>
              <select
                id="sectionNumber"
                value={sectionNumber}
                onChange={(e) => setSectionNumber(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] hover:from-purple-700 hover:to-violet-800"
            disabled={loading}
          >
            {loading ? 'Čuvanje...' : 'Završi registraciju'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
