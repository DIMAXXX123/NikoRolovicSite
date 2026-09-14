'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SuccessAnimation } from '@/components/success-animation'

export default function VerifyPage() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const savedEmail = localStorage.getItem('verify_email')
    if (savedEmail) setEmail(savedEmail)
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })

    if (verifyError) {
      setError('Pogrešan kod. Proveri i pokušaj ponovo.')
      setLoading(false)
      return
    }

    // Email verified! Create the profile and claim the roster entry on the
    // server — verified_students is service-role only.
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const meta = user.user_metadata || {}
      await fetch('/api/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: meta.first_name || '',
          lastName: meta.last_name || '',
          classNumber: meta.class_number || parseInt(localStorage.getItem('pending_class') || '1'),
          sectionNumber: meta.section_number || parseInt(localStorage.getItem('pending_section') || '1'),
        }),
      }).catch(() => null)
    }

    setSuccess(true)
    localStorage.removeItem('verify_email')
    localStorage.removeItem('pending_class')
    localStorage.removeItem('pending_section')
  }

  const handleResend = async () => {
    if (!email) return

    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      setError('Greška pri slanju. Pokušaj ponovo za minut.')
    } else {
      setError('')
      alert('Novi kod je poslat na ' + email)
    }
  }

  if (success) {
    return (
      <SuccessAnimation
        message="Nalog verifikovan!"
        onComplete={() => {
          router.push('/news')
          router.refresh()
        }}
      />
    )
  }

  return (
    <Card className="animate-fade-in text-center">
      <CardHeader className="space-y-2 pb-2">
        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-[0_4px_0_var(--color-primary-dark)]">
          <span className="text-2xl font-black text-primary-foreground">NR</span>
        </div>
        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">Unesi kod</h1>
        <p className="text-[13px] font-bold text-muted-foreground">
          Poslali smo 8-cifreni kod na <span className="text-foreground font-extrabold">{email}</span>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="00000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            className="text-center text-2xl font-extrabold tracking-[0.5em]"
            maxLength={8}
            required
          />
          {error && (
            <p className="text-destructive text-[13px] font-bold">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || code.length < 6}
          >
            {loading ? 'Provera...' : 'Potvrdi'}
          </Button>
        </form>
        <button
          type="button"
          onClick={handleResend}
          className="mt-4 inline-flex min-h-11 items-center text-[15px] font-extrabold text-secondary hover:underline"
        >
          Pošalji kod ponovo
        </button>
      </CardContent>
    </Card>
  )
}

