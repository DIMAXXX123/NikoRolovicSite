'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, Plus, X, GripVertical } from 'lucide-react'
import {
  ALL_NAV_ITEMS,
  getNavConfig,
  saveNavConfig,
  getResolvedNavItems,
  MAX_NAV_ITEMS,
  ICON_MAP,
} from '@/lib/nav-config'
import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'

export function NavEditor({ onClose }: { onClose: () => void }) {
  const [activeIds, setActiveIds] = useState<string[]>([])

  useEffect(() => {
    setActiveIds(getNavConfig())
  }, [])

  const activeItems = getResolvedNavItems(activeIds)
  const availableItems = ALL_NAV_ITEMS.filter(item => !activeIds.includes(item.id))

  function save(ids: string[]) {
    setActiveIds(ids)
    saveNavConfig(ids)
    window.dispatchEvent(new CustomEvent('nav-config-changed'))
  }

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...activeIds]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    save(next)
  }

  function moveDown(index: number) {
    if (index === activeIds.length - 1) return
    const next = [...activeIds]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    save(next)
  }

  function remove(index: number) {
    if (activeIds.length <= 1) return
    const next = activeIds.filter((_, i) => i !== index)
    save(next)
  }

  function add(id: string) {
    if (activeIds.length >= MAX_NAV_ITEMS) return
    save([...activeIds, id])
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Uredi navigaciju</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Prilagodi stavke u donjoj navigaciji. Maksimalno {MAX_NAV_ITEMS} stavki.
      </p>

      {/* Active items */}
      <Card className="border-border/30 bg-card/50 backdrop-blur">
        <CardContent className="p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">Aktivne stavke ({activeIds.length}/{MAX_NAV_ITEMS})</p>
          {activeItems.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/20"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
              <item.IconComponent className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="p-1 rounded-lg hover:bg-muted disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === activeIds.length - 1}
                  className="p-1 rounded-lg hover:bg-muted disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(i)}
                  disabled={activeIds.length <= 1}
                  className="p-1 rounded-lg hover:bg-destructive/20 text-destructive disabled:opacity-20 transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Available items to add */}
      {availableItems.length > 0 && (
        <Card className="border-border/30 bg-card/50 backdrop-blur">
          <CardContent className="p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Dostupne stavke</p>
            {availableItems.map((item) => {
              const Icon: LucideIcon = ICON_MAP[item.icon] || MoreHorizontal
              const disabled = activeIds.length >= MAX_NAV_ITEMS
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-muted/10 border border-dashed border-border/20"
                >
                  <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground flex-1">{item.label}</span>
                  <button
                    onClick={() => add(item.id)}
                    disabled={disabled}
                    className="p-1 rounded-lg hover:bg-primary/20 text-primary disabled:opacity-20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Button onClick={onClose} className="w-full">
        Gotovo
      </Button>
    </div>
  )
}
