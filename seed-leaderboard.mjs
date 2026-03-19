import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ydcbxqrnmnbceyzqgbui.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg'
)

async function seed() {
  // Get all profiles
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role')

  if (pErr) { console.error('Error fetching profiles:', pErr); return }
  
  // Filter out test accounts
  const testPatterns = ['test', 'admin@', 'pending_', 'temp@', 'placeholder']
  const realProfiles = profiles.filter(p => {
    const email = (p.email || '').toLowerCase()
    const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
    return !testPatterns.some(t => email.includes(t) || name.includes(t))
  })

  console.log(`Found ${realProfiles.length} real profiles (filtered ${profiles.length - realProfiles.length} test accounts)`)

  // Check existing scores
  const { data: existingScores } = await supabase.from('game_scores').select('user_id')
  const existingIds = new Set((existingScores || []).map(s => s.user_id))

  // Seed scores for users without one
  const toInsert = []
  for (const p of realProfiles) {
    if (!existingIds.has(p.id)) {
      const score = Math.floor(Math.random() * (15000 - 2000 + 1)) + 2000
      toInsert.push({ user_id: p.id, score })
      console.log(`  ${p.first_name} ${p.last_name} → ${score}`)
    } else {
      console.log(`  ${p.first_name} ${p.last_name} → already has score, skipping`)
    }
  }

  if (toInsert.length > 0) {
    // First ensure table exists, try insert
    const { error: insertErr } = await supabase.from('game_scores').upsert(toInsert, { onConflict: 'user_id' })
    if (insertErr) {
      console.error('Insert error:', insertErr)
      // Maybe table doesn't exist, create it
      if (insertErr.message?.includes('does not exist')) {
        console.log('Table game_scores does not exist, creating via SQL...')
        const { error: sqlErr } = await supabase.rpc('exec_sql', {
          query: `CREATE TABLE IF NOT EXISTS game_scores (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id),
            score INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT now()
          );`
        })
        if (sqlErr) {
          console.error('Cannot create table:', sqlErr)
          return
        }
        // Retry insert
        const { error: retryErr } = await supabase.from('game_scores').upsert(toInsert, { onConflict: 'user_id' })
        if (retryErr) console.error('Retry error:', retryErr)
        else console.log(`✅ Inserted ${toInsert.length} scores (after table creation)`)
      }
    } else {
      console.log(`✅ Inserted ${toInsert.length} scores`)
    }
  } else {
    console.log('All users already have scores')
  }

  // Show top 10
  const { data: top } = await supabase
    .from('game_scores')
    .select('score, user_id')
    .order('score', { ascending: false })
    .limit(15)
  
  if (top) {
    console.log('\n🏆 Top 15:')
    for (const s of top) {
      const p = realProfiles.find(pr => pr.id === s.user_id)
      const name = p ? `${p.first_name} ${p.last_name}` : s.user_id.slice(0, 8)
      console.log(`  ${name}: ${s.score}`)
    }
  }
}

seed()
