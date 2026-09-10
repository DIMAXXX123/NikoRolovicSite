import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="text-5xl font-black tracking-tight text-primary">404</p>
        <h1 className="mt-4 text-xl font-bold text-foreground">Stranica ne postoji</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Link je možda zastario ili je stranica premještena.
        </p>
        <Link
          href="/news"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Nazad na početnu
        </Link>
      </div>
    </div>
  )
}
