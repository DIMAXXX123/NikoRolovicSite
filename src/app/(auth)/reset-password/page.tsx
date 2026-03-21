'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, CheckCircle2, Lock, KeyRound, Eye, EyeOff } from 'lucide-react'

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
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl animate-fade-in">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center animate-pop-in">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Lozinka promijenjena!</h2>
          <p className="text-sm text-muted-foreground">
            Sada se možeš prijaviti sa novom lozinkom.
          </p>
          <Link href="/login">
            <Button className="mt-4 gap-2 bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9]">
              <ArrowLeft className="w-4 h-4" /> Prijavi se
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // ── Step: New Password ────────────────────────────────────────
  if (step === 'newPassword') {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl animate-fade-in">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-2">
            <Lock className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Nova lozinka</h1>
          <p className="text-muted-foreground text-sm">Unesite novu lozinku za vaš nalog</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
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
                  className="bg-background/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Potvrdi lozinku</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Ponovi lozinku"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            {/* Password strength indicator */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    password.length >= level * 3
                      ? password.length >= 12
                        ? 'bg-green-500'
                        : password.length >= 8
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
            <Button type="submit" className="w-full bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] hover:from-purple-700 hover:to-violet-800" disabled={loading}>
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
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl animate-fade-in">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-2">
            <KeyRound className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Unesi kod</h1>
          <p className="text-muted-foreground text-sm">
            Poslali smo 6-cifreni kod na{' '}
            <span className="text-white font-medium">{email}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyCode} className="space-y-5">
            {/* 6-digit code input */}
            <div className="flex justify-center gap-2.5">
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
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background/50 outline-none transition-all ${
                    digit
                      ? 'border-[#7c5cfc] text-white shadow-[0_0_12px_rgba(124,92,252,0.2)]'
                      : 'border-border/50 text-muted-foreground'
                  } focus:border-[#7c5cfc] focus:shadow-[0_0_16px_rgba(124,92,252,0.3)]`}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] hover:from-purple-700 hover:to-violet-800" disabled={loading || code.some(c => !c)}>
              {loading ? 'Provjera...' : 'Potvrdi kod'}
            </Button>

            {/* Resend */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className={`text-sm transition-colors ${
                  resendCooldown > 0
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'text-[#7c5cfc] hover:text-purple-300 cursor-pointer'
                }`}
              >
                {resendCooldown > 0
                  ? `Ponovo pošalji za ${resendCooldown}s`
                  : 'Pošalji kod ponovo'}
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Provjeri inbox i spam folder
            </p>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setStep('email'); setError(''); setCode(['', '', '', '', '', '']) }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Promijeni email
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Step: Enter Email ─────────────────────────────────────────
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-2">
          <Mail className="w-7 h-7 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold gradient-text">Resetuj lozinku</h1>
        <p className="text-muted-foreground text-sm">Unesite email i poslaćemo vam kod za resetovanje</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendCode} className="space-y-4">
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
          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
          <Button type="submit" className="w-full bg-gradient-to-r from-[#7c5cfc] to-[#5b3fd9] hover:from-purple-700 hover:to-violet-800" disabled={loading}>
            {loading ? 'Slanje...' : 'Pošalji kod'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Nazad na prijavu
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
