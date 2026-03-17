const sk = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg"
const u = "https://ydcbxqrnmnbceyzqgbui.supabase.co"

async function go() {
  // Try multiple SQL endpoints
  const sqls = [
    "ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check",
    "ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'moderator', 'admin', 'creator'))",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'dogadjaj'",
    "ALTER TABLE lectures ADD COLUMN IF NOT EXISTS video_url TEXT",
    "ALTER TABLE photos ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT FALSE",
  ]

  // Try via Supabase Management API (requires service key)
  for (const sql of sqls) {
    // PostgREST doesn't support raw SQL, but we can try the pg endpoint
    const r = await fetch(`${u}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'apikey': sk,
        'Authorization': `Bearer ${sk}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: sql })
    })
    console.log(sql.slice(0, 60), '->', r.status)
  }

  // Since raw SQL won't work via REST, just update Dima's role 
  // First check current constraint
  console.log('\n--- Trying to update Dima to admin (safe) ---')
  const r = await fetch(`${u}/rest/v1/profiles?email=eq.dmitrykokrok@gmail.com`, {
    method: 'PATCH',
    headers: {
      'apikey': sk,
      'Authorization': `Bearer ${sk}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ role: 'admin' })
  })
  console.log('Update result:', r.status, await r.text())
}

go()
