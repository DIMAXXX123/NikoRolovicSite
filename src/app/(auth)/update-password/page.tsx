'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Lozinka mora imati minimum 6 karaktera'); return }
    if (password !== confirmPassword) { setError('Lozinke se ne poklapaju'); return }
    
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message || 'Greška pri promjeni lozinke')
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/news')
        router.refresh()
      }, 2000)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary-light border-2 border-primary-light-border flex items-center justify-center animate-pop-in">
            <CheckCircle2 className="w-8 h-8 text-primary-text" strokeWidth={2.4} />
          </div>
          <h2 className="text-[20px] font-extrabold leading-[1.25] text-heading">Lozinka promijenjena!</h2>
          <p className="text-[13px] font-bold text-muted-foreground">Preusmjeravanje...</p>
        </CardContent>
      </Card>
    )
  }

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
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Label htmlFor="password">Nova lozinka</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="confirm">Potvrdi lozinku</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
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
