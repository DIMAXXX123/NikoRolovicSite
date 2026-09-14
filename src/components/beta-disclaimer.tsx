import { TriangleAlert } from 'lucide-react'

export function BetaDisclaimer() {
  return (
    <div className="flex items-start gap-3 p-4 mb-4 rounded-2xl border-2 border-[#FFE28A] bg-[#FFF9E0] shadow-[0_2px_0_#FFE28A]">
      <TriangleAlert className="w-5 h-5 text-[#C79000] mt-px shrink-0" strokeWidth={2.4} />
      <p className="text-[13px] leading-[1.4] font-bold text-[#7A5A00]">
        Sajt je u fazi razvoja — informacije ne moraju uvijek biti tačne.
      </p>
    </div>
  )
}
