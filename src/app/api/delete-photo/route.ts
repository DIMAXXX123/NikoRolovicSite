import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceKey) {
    return NextResponse.json({ error: 'No service key configured' }, { status: 500 })
  }

  const { photoId } = await request.json()

  if (!photoId) {
    return NextResponse.json({ error: 'Missing photoId' }, { status: 400 })
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
  // URL format: .../storage/v1/object/public/photos/filename.ext
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
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
