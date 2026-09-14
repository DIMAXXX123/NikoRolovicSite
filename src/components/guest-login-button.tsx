'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

/**
 * "Uđi bez registracije": signs the visitor in as a Supabase anonymous user.
 * A database trigger gives every anonymous user a "Gost" profile with a
 * random class/section, so likes, scores, uploads and class-scoped screens
 * behave exactly like for a registered student.
 */
export function GuestLoginButton({
  variant = 'outline',
  className = '',
  next = '/gallery',
}: {
  variant?: 'outline' | 'secondary' | 'ghost'
  className?: string
  next?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enterAsGuest() {
    if (loading) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInAnonymously({
      options: { data: { first_name: 'Gost', last_name: '' } },
    })
    if (error) {
      setLoading(false)
      setError(
        error.code === 'anonymous_provider_disabled'
          ? 'Gost pristup još nije uključen. Javi administratoru.'
          : 'Ulaz kao gost nije uspio. Pokušaj ponovo.'
      )
      return
    }
    router.push(next)
    router.refresh()
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button type="button" variant={variant} className="w-full" onClick={enterAsGuest} disabled={loading}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.6} /> : <UserRound className="w-5 h-5" strokeWidth={2.6} />}
        Uđi bez registracije
      </Button>
      {error && (
        <p role="alert" className="text-center text-[13px] leading-[1.4] font-bold text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
