import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCallerProfile, isValidUUID } from '@/lib/api-auth'

// Rate limiting: Consider adding middleware-level rate limiting (e.g., 10 req/min per user)

export async function POST(request: Request) {
  try {
    const caller = await getCallerProfile()
    if (!caller || !['admin', 'creator'].includes(caller.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const { photoId } = body

    if (!photoId || typeof photoId !== 'string' || !isValidUUID(photoId)) {
      return NextResponse.json({ error: 'Invalid photoId' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

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
