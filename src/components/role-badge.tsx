'use client'

import { Badge, badgeVariants } from '@/components/ui/badge'
import { Shield, Star, Crown } from 'lucide-react'
import type { VariantProps } from 'class-variance-authority'

interface RoleBadgeProps {
  role: string
  size?: 'sm' | 'md'
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

// Role colours (§2): creator purple, admin red, moderator orange, student blue (no badge).
const roleConfig: Record<
  string,
  { label: string; icon: typeof Crown | null; variant: BadgeVariant; className: string }
> = {
  creator: { label: 'Creator', icon: Crown, variant: 'purple', className: '' },
  admin: { label: 'Admin', icon: Shield, variant: 'destructive', className: '' },
  moderator: {
    label: 'Mod',
    icon: Star,
    variant: 'outline',
    className: 'border-[#FFD1A3] bg-[#FFF0E0] text-orange',
  },
  student: { label: '', icon: null, variant: 'secondary', className: '' },
  teacher: { label: 'Nastavnik', icon: Star, variant: 'default', className: '' },
  razredni: { label: 'Razredni', icon: Star, variant: 'default', className: '' },
  pedagog: { label: 'Pedagog', icon: Star, variant: 'secondary', className: '' },
  direktor: { label: 'Direktor', icon: Crown, variant: 'gold', className: '' },
}

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const config = roleConfig[role as keyof typeof roleConfig]
  if (!config || role === 'student') return null

  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${size === 'sm' ? 'h-5 text-[10px] px-2' : 'h-6 text-[11px] px-2.5'} gap-1 inline-flex items-center`}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} strokeWidth={2.6} />}
      {config.label}
    </Badge>
  )
}
