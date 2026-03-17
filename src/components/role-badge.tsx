'use client'

import { Badge } from '@/components/ui/badge'
import { Shield, Star } from 'lucide-react'

interface RoleBadgeProps {
  role: string
  size?: 'sm' | 'md'
}

const roleConfig = {
  admin: { label: 'Admin', icon: Shield, className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  moderator: { label: 'Mod', icon: Star, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  student: { label: '', icon: null, className: '' },
}

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const config = roleConfig[role as keyof typeof roleConfig]
  if (!config || role === 'student') return null

  const Icon = config.icon

  return (
    <Badge className={`${config.className} ${size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'} gap-1 inline-flex items-center`}>
      {Icon && <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
      {config.label}
    </Badge>
  )
}
