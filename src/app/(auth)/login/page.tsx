'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Pogrešan email ili lozinka')
      setLoading(false)
    } else {
      router.push('/news')
      router.refresh()
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center mb-2">
          <span className="text-2xl font-bold text-white">NR</span>
        </div>
        <h1 className="text-2xl font-bold gradient-text">Gimnazija Niko Rolović</h1>
        <p className="text-muted-foreground text-sm">Prijavi se na studentski portal</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>
          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
          <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800" disabled={loading}>
            {loading ? 'Prijava...' : 'Prijavi se'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/register" className="text-sm text-primary hover:underline">
            Nemaš nalog? Registruj se
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
