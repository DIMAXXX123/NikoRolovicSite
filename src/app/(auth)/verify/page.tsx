'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VerifyPage() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl text-center">
      <CardHeader className="space-y-4 pb-2">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-700/20 flex items-center justify-center">
          <Mail className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Proveri email</h1>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Poslali smo ti link za potvrdu na tvoj email. Klikni na link da aktiviraš nalog.
        </p>
        <p className="text-sm text-muted-foreground">
          Proveri i spam folder ako ne vidiš email.
        </p>
        <Link href="/login">
          <Button variant="outline" className="mt-4">
            Nazad na prijavu
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
