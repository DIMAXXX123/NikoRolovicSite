'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
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

    // Email verified! Now create profile and mark student as used
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const meta = user.user_metadata || {}
      
      // Create profile
      await supabase.from('profiles').insert({
        id: user.id,
        first_name: meta.first_name || 'Unknown',
        last_name: meta.last_name || 'Unknown',
        email: user.email || email,
        class_number: meta.class_number || parseInt(localStorage.getItem('pending_class') || '1'),
        section_number: meta.section_number || parseInt(localStorage.getItem('pending_section') || '1'),
        role: 'student',
      })

      // Mark verified student as used
      const verifiedId = localStorage.getItem('pending_verified_id')
      if (verifiedId) {
        await supabase
          .from('verified_students')
          .update({ used: true })
          .eq('id', verifiedId)
      }
    }

    setSuccess(true)
    localStorage.removeItem('verify_email')
    localStorage.removeItem('pending_verified_id')
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
      <CardHeader className="space-y-4 pb-2">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary-light border-2 border-secondary-light-border flex items-center justify-center">
          <Mail className="w-7 h-7 text-secondary" strokeWidth={2.4} />
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
          onClick={handleResend}
          className="mt-4 inline-flex min-h-11 items-center text-[15px] font-extrabold text-secondary hover:underline"
        >
          Pošalji kod ponovo
        </button>
      </CardContent>
    </Card>
  )
}

