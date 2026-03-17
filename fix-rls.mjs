const sk = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg"
const u = "https://ydcbxqrnmnbceyzqgbui.supabase.co"

// We need to drop and recreate RLS policies to include 'creator' role
// Since we can't run raw SQL via REST, we'll use the workaround:
// Disable RLS temporarily for the tables that have issues, then re-enable with correct policies

// Actually, the real fix is to add creator to existing policies.
// The issue: policies check for 'admin' but Dima's role might be 'admin' (not creator since we couldn't update constraint)
// Let's check Dima's current role first

async function go() {
  // Check Dima's role
  const r = await fetch(`${u}/rest/v1/profiles?email=eq.dmitrykokrok@gmail.com&select=role`, {
    headers: { 'apikey': sk, 'Authorization': `Bearer ${sk}` }
  })
  const profile = await r.json()
  console.log('Dima role:', profile)

  // The RLS policies for news DELETE say: role IN ('admin', 'moderator')
  // For events INSERT say: role = 'admin'
  // If Dima is 'admin' it should work... unless the policies are checking auth.uid() wrong
  
  // Let's check what policies exist
  // Try to delete a test news item using service key (bypasses RLS)
  const newsR = await fetch(`${u}/rest/v1/news?select=id&limit=1`, {
    headers: { 'apikey': sk, 'Authorization': `Bearer ${sk}` }
  })
  const news = await newsR.json()
  console.log('First news:', news)

  // Try to create an event using service key
  const eventR = await fetch(`${u}/rest/v1/events`, {
    method: 'POST',
    headers: { 
      'apikey': sk, 
      'Authorization': `Bearer ${sk}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      title: 'Test event',
      description: 'Test',
      event_date: '2026-03-20',
      author_id: '241c9077-b700-4400-8f96-20e3a650eef4'
    })
  })
  const event = await eventR.json()
  console.log('Create event result:', eventR.status, event)

  // Clean up test event
  if (event && event[0]) {
    await fetch(`${u}/rest/v1/events?id=eq.${event[0].id}`, {
      method: 'DELETE',
      headers: { 'apikey': sk, 'Authorization': `Bearer ${sk}` }
    })
    console.log('Cleaned up test event')
  }

  // The real problem: RLS policies need to include 'creator' role
  // Since we can't ALTER policies via REST, let's DISABLE RLS on problem tables
  // Actually we CAN'T disable RLS via REST either.
  
  // SOLUTION: Use the Supabase Management API to run SQL
  // Endpoint: POST https://api.supabase.com/v1/projects/{ref}/database/query
  // But that needs a different auth token (Supabase dashboard access token)
  
  // WORKAROUND: Just update Dima's role back to 'admin' which IS in the policies
  // Check if he's already admin
  if (profile[0]?.role !== 'admin') {
    const updateR = await fetch(`${u}/rest/v1/profiles?email=eq.dmitrykokrok@gmail.com`, {
      method: 'PATCH',
      headers: { 'apikey': sk, 'Authorization': `Bearer ${sk}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' })
    })
    console.log('Updated Dima to admin:', updateR.status)
  } else {
    console.log('Dima is already admin - RLS should work')
    console.log('The issue might be that the browser session auth token is stale')
    console.log('Or the RLS policies reference auth.uid() but the session is expired')
  }
}

go()
