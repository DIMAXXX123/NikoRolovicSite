export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Učitavanje"
      className="min-h-dvh flex items-center justify-center"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
