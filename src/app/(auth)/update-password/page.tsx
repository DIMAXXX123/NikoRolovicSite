'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Lock, CheckCircle2 } from 'lucide-react'

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
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Lozinka promijenjena!</h2>
          <p className="text-sm text-muted-foreground">Preusmjeravanje...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-2">
          <Lock className="w-7 h-7 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold gradient-text">Nova lozinka</h1>
        <p className="text-muted-foreground text-sm">Unesite novu lozinku za vaš nalog</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova lozinka</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Potvrdi lozinku</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>
          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
          <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800" disabled={loading}>
            {loading ? 'Čuvanje...' : 'Sačuvaj novu lozinku'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
