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

    setSuccess(true)
    localStorage.removeItem('verify_email')
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
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl text-center">
      <CardHeader className="space-y-4 pb-2">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-700/20 flex items-center justify-center">
          <Mail className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Unesi kod</h1>
        <p className="text-muted-foreground text-sm">
          Poslali smo 6-cifreni kod na <span className="text-foreground font-medium">{email}</span>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="bg-background/50 text-center text-2xl tracking-[0.5em] font-mono"
            maxLength={6}
            required
          />
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800"
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Provera...' : 'Potvrdi'}
          </Button>
        </form>
        <button
          onClick={handleResend}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Pošalji kod ponovo
        </button>
      </CardContent>
    </Card>
  )
}
