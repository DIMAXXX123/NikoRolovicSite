export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-background to-background" />
      <div className="relative w-full max-w-md animate-fade-in">
        {children}
      </div>
    </div>
  )
}
