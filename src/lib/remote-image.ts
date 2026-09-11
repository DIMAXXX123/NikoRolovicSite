/**
 * next/image only optimizes hosts listed in `images.remotePatterns`
 * (next.config.ts allows `*.supabase.co`). Anything else has to be rendered
 * with `unoptimized`, otherwise next/image throws on an unconfigured host.
 */
export function isOptimizableImage(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' && hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}
