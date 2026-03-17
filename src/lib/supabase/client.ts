'use client'

import { createBrowserClient } from '@supabase/ssr'

let cachedClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (cachedClient) return cachedClient

  // These will be embedded at build time from NEXT_PUBLIC_ env vars
  // If they're missing (during prerender), use dummy values that won't crash
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (!url || !key) {
    // Return a no-op client for prerendering
    return createBrowserClient(
      'https://placeholder.supabase.co',
      // Minimal valid JWT so the client constructor doesn't throw
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjA1MDAwMDAwMH0.dGVzdC1wbGFjZWhvbGRlci1rZXktZm9yLWJ1aWxk'
    )
  }

  cachedClient = createBrowserClient(url, key)
  return cachedClient
}
