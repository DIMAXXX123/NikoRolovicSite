import { AlertTriangle } from 'lucide-react'

export function BetaDisclaimer() {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
      <p className="text-[11px] leading-relaxed text-amber-300/80">
        Sajt je u fazi razvoja — informacije ne moraju uvijek biti tačne.
      </p>
    </div>
  )
}
