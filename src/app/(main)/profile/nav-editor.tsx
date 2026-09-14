'use client'

import { useState, useEffect } from 'react'
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

// §4.10 list row — each nav item is its own card.
const ROW_CLASS =
  'min-h-16 px-3 py-2 flex items-center gap-2 rounded-2xl border-2 border-border bg-card shadow-[0_2px_0_var(--color-border)]'
const ROW_BTN_CLASS =
  'w-11 h-11 flex items-center justify-center rounded-xl outline-none transition-[transform,background-color,color] duration-[80ms] hover:bg-muted active:scale-90 disabled:pointer-events-none disabled:text-disabled focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

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
        <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">Uredi navigaciju</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
          <X className="w-5 h-5" strokeWidth={2.6} />
        </Button>
      </div>

      <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground">
        Prilagodi stavke u donjoj navigaciji. Maksimalno {MAX_NAV_ITEMS} stavki.
      </p>

      {/* Active items */}
      <div className="space-y-2.5">
        <p className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground px-1">Aktivne stavke ({activeIds.length}/{MAX_NAV_ITEMS})</p>
        {activeItems.map((item, i) => (
          <div
            key={item.id}
            className={ROW_CLASS}
            style={{ animationFillMode: 'both' }}
          >
            <GripVertical className="w-5 h-5 text-disabled flex-shrink-0" strokeWidth={2.4} />
            <div className="w-11 h-11 rounded-full bg-primary-light text-primary-text flex items-center justify-center flex-shrink-0">
              <item.IconComponent className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <span className="text-[17px] leading-[1.3] font-extrabold text-heading flex-1 min-w-0 truncate">{item.label}</span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className={`${ROW_BTN_CLASS} text-secondary`}
              >
                <ChevronUp className="w-5 h-5" strokeWidth={2.6} />
              </button>
              <button
                onClick={() => moveDown(i)}
                disabled={i === activeIds.length - 1}
                className={`${ROW_BTN_CLASS} text-secondary`}
              >
                <ChevronDown className="w-5 h-5" strokeWidth={2.6} />
              </button>
              <button
                onClick={() => remove(i)}
                disabled={activeIds.length <= 1}
                className={`${ROW_BTN_CLASS} text-destructive hover:bg-[#FFDFE0]`}
              >
                <X className="w-5 h-5" strokeWidth={2.6} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Available items to add */}
      {availableItems.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground px-1">Dostupne stavke</p>
          {availableItems.map((item) => {
            const Icon: LucideIcon = ICON_MAP[item.icon] || MoreHorizontal
            const disabled = activeIds.length >= MAX_NAV_ITEMS
            return (
              <div
                key={item.id}
                className={`${ROW_CLASS} border-dashed shadow-none bg-muted`}
              >
                <div className="w-11 h-11 rounded-full bg-background border-2 border-border text-muted-foreground flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={2.4} />
                </div>
                <span className="text-[17px] leading-[1.3] font-extrabold text-muted-foreground flex-1 min-w-0 truncate">{item.label}</span>
                <button
                  onClick={() => add(item.id)}
                  disabled={disabled}
                  className={`${ROW_BTN_CLASS} text-primary-text hover:bg-primary-light`}
                >
                  <Plus className="w-5 h-5" strokeWidth={2.6} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Button onClick={onClose} className="w-full">
        Gotovo
      </Button>
    </div>
  )
}
