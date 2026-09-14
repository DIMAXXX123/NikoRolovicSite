import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ADMIN_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { parseBody, uuidSchema } from '@/lib/api-validation'

const DeletePhotoSchema = z.object({ photoId: uuidSchema })

export async function POST(request: Request) {
  try {
    const caller = await getCallerProfile()
    if (!hasRole(caller, ADMIN_ROLES)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const rate = await checkRateLimit(`delete-photo:${clientIp(request)}`, 30, 60_000)
    if (rate.limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const parsed = await parseBody(request, DeletePhotoSchema)
    if (!parsed.ok) return parsed.response

    const { photoId } = parsed.data
    const supabase = createServiceClient()

    // Get the photo to find storage path
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('image_url')
      .eq('id', photoId)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Extract storage path from public URL
    const url = photo.image_url as string
    const marker = '/storage/v1/object/public/photos/'
    const idx = url.indexOf(marker)
    if (idx !== -1) {
      const storagePath = url.slice(idx + marker.length)
      await supabase.storage.from('photos').remove([storagePath])
    }

    // Delete from photos table
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
