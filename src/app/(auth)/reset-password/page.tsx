'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react'

type Step = 'email' | 'code' | 'newPassword' | 'done'

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const codeRefs = useRef<(HTMLInputElement | null)[]>([])
  const supabase = createClient()

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // ── Step 1: Send OTP ──────────────────────────────────────────
  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email.trim()) { setError('Unesite email adresu'); return }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())

    if (error) {
      setError('Greška pri slanju koda. Pokušaj ponovo.')
    } else {
      setStep('code')
      setResendCooldown(60)
    }
    setLoading(false)
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────
  const handleVerifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const otp = code.join('')
    if (otp.length !== 6) { setError('Unesite kompletan kod od 6 cifara'); return }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type: 'recovery',
    })

    if (error) {
      setError('Pogrešan ili istekao kod. Pokušaj ponovo.')
    } else {
      setStep('newPassword')
    }
    setLoading(false)
  }

  // ── Step 3: Set new password ──────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Lozinka mora imati minimum 6 karaktera'); return }
    if (password !== confirmPassword) { setError('Lozinke se ne poklapaju'); return }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message || 'Greška pri promjeni lozinke')
    } else {
      setStep('done')
    }
    setLoading(false)
  }

  // ── Code input handling ───────────────────────────────────────
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newCode = [...code]
      digits.forEach((d, i) => {
        if (index + i < 6) newCode[index + i] = d
      })
      setCode(newCode)
      const nextIdx = Math.min(index + digits.length, 5)
      codeRefs.current[nextIdx]?.focus()
      // Auto-submit if all 6 filled
      if (newCode.every(c => c !== '')) {
        setTimeout(() => {
          const otp = newCode.join('')
          if (otp.length === 6) handleVerifyCodeDirect(otp)
        }, 100)
      }
      return
    }
    const digit = value.replace(/\D/g, '')
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)
    if (digit && index < 5) {
      codeRefs.current[index + 1]?.focus()
    }
    // Auto-submit
    if (digit && newCode.every(c => c !== '')) {
      setTimeout(() => {
        const otp = newCode.join('')
        if (otp.length === 6) handleVerifyCodeDirect(otp)
      }, 100)
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyCodeDirect = async (otp: string) => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type: 'recovery',
    })
    if (error) {
      setError('Pogrešan ili istekao kod. Pokušaj ponovo.')
    } else {
      setStep('newPassword')
    }
    setLoading(false)
  }

  const handleResend = () => {
    if (resendCooldown > 0) return
    setCode(['', '', '', '', '', ''])
    setError('')
    handleSendCode()
  }

  // ── Step: Done ────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <Card className="animate-fade-in">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary-light border-2 border-primary-light-border flex items-center justify-center animate-pop-in">
            <CheckCircle2 className="w-8 h-8 text-primary-text" strokeWidth={2.4} />
          </div>
          <h2 className="text-[20px] font-extrabold leading-[1.25] text-heading">Lozinka promijenjena!</h2>
          <p className="text-[13px] font-bold text-muted-foreground">
            Sada se možeš prijaviti sa novom lozinkom.
          </p>
          <Link href="/login" className="block">
            <Button className="mt-4 w-full gap-2">
              <ArrowLeft className="w-5 h-5" strokeWidth={2.6} /> Prijavi se
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // ── Step: New Password ────────────────────────────────────────
  if (step === 'newPassword') {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-[0_4px_0_var(--color-primary-dark)]">
            <span className="text-2xl font-black text-primary-foreground">NR</span>
          </div>
          <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">Nova lozinka</h1>
          <p className="text-[13px] font-bold text-muted-foreground">Unesite novu lozinku za vaš nalog</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <Label htmlFor="password">Nova lozinka</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 karaktera"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2.4} /> : <Eye className="w-5 h-5" strokeWidth={2.4} />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm">Potvrdi lozinku</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Ponovi lozinku"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {/* Password strength indicator */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    password.length >= level * 3
                      ? password.length >= 12
                        ? 'bg-primary'
                        : password.length >= 8
                          ? 'bg-gold'
                          : 'bg-destructive'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>
            {error && (
              <p className="text-destructive text-[13px] font-bold text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Čuvanje...' : 'Sačuvaj novu lozinku'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  // ── Step: Enter Code ──────────────────────────────────────────
  if (step === 'code') {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-[0_4px_0_var(--color-primary-dark)]">
            <span className="text-2xl font-black text-primary-foreground">NR</span>
          </div>
          <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">Unesi kod</h1>
          <p className="text-[13px] font-bold text-muted-foreground">
            Poslali smo 6-cifreni kod na{' '}
            <span className="text-foreground font-extrabold">{email}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyCode} className="space-y-5">
            {/* 6-digit code input */}
            <div className="flex justify-center gap-2">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  className={`h-14 w-full min-w-0 max-w-12 flex-1 text-center text-xl font-extrabold rounded-2xl border-2 outline-none transition-colors ${
                    digit
                      ? 'border-secondary bg-background text-foreground'
                      : 'border-border bg-muted text-muted-foreground'
                  } focus:border-secondary focus:bg-background`}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && (
              <p className="text-destructive text-[13px] font-bold text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading || code.some(c => !c)}>
              {loading ? 'Provjera...' : 'Potvrdi kod'}
            </Button>

            {/* Resend */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className={`inline-flex min-h-11 items-center text-[15px] font-extrabold transition-colors ${
                  resendCooldown > 0
                    ? 'text-disabled cursor-not-allowed'
                    : 'text-secondary hover:underline cursor-pointer'
                }`}
              >
                {resendCooldown > 0
                  ? `Ponovo pošalji za ${resendCooldown}s`
                  : 'Pošalji kod ponovo'}
              </button>
            </div>

            <p className="text-[13px] font-bold text-muted-foreground text-center">
              Provjeri inbox i spam folder
            </p>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setStep('email'); setError(''); setCode(['', '', '', '', '', '']) }}
              className="inline-flex min-h-11 items-center justify-center gap-1 mx-auto text-[15px] font-extrabold text-secondary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2.6} /> Promijeni email
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Step: Enter Email ─────────────────────────────────────────
  return (
    <Card className="animate-fade-in">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-[0_4px_0_var(--color-primary-dark)]">
          <span className="text-2xl font-black text-primary-foreground">NR</span>
        </div>
        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">Resetuj lozinku</h1>
        <p className="text-[13px] font-bold text-muted-foreground">Unesite email i poslaćemo vam kod za resetovanje</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendCode} className="space-y-4">
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
          {error && (
            <p className="text-destructive text-[13px] font-bold text-center">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Slanje...' : 'Pošalji kod'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="inline-flex min-h-11 items-center justify-center gap-1 text-[15px] font-extrabold text-secondary hover:underline">
            <ArrowLeft className="w-4 h-4" strokeWidth={2.6} /> Nazad na prijavu
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
