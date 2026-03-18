const URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg';
const headers = { 'apikey': SK, 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

const photos = await fetch(`${URL}/rest/v1/photos?select=id&status=eq.approved`, { headers }).then(r => r.json());
const users = await fetch(`${URL}/rest/v1/profiles?select=id&limit=20`, { headers }).then(r => r.json());

console.log(`Photos: ${photos.length}, Users: ${users.length}`);

let added = 0;
for (const photo of photos) {
  const numLikes = Math.floor(Math.random() * 5) + 1; // 1-5
  const shuffled = users.sort(() => Math.random() - 0.5).slice(0, numLikes);
  for (const user of shuffled) {
    const res = await fetch(`${URL}/rest/v1/photo_likes`, {
      method: 'POST', headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ photo_id: photo.id, user_id: user.id })
    });
    if (res.ok) added++;
    else {
      const err = await res.text();
      if (!err.includes('duplicate')) console.error(`Error: ${err}`);
    }
  }
}

console.log(`Added ${added} likes`);

// Verify
const allLikes = await fetch(`${URL}/rest/v1/photo_likes?select=photo_id`, { headers }).then(r => r.json());
console.log(`Total likes in DB: ${allLikes.length}`);
