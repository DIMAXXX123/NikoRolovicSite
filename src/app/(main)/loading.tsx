/** Instant skeleton while a server-rendered screen loads — navigation feels immediate. */
export default function MainLoading() {
  return (
    <div className="space-y-4 pt-2 animate-fade-in" aria-busy="true" aria-label="Učitavanje">
      <div className="h-8 w-40 rounded-xl skeleton" />
      <div className="h-4 w-56 rounded-lg skeleton" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="h-32 rounded-2xl skeleton" />
        <div className="h-32 rounded-2xl skeleton" />
        <div className="h-32 rounded-2xl skeleton" />
        <div className="h-32 rounded-2xl skeleton" />
      </div>
      <div className="h-24 rounded-2xl skeleton" />
    </div>
  )
}
