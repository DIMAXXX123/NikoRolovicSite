const URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg';
const headers = { 'apikey': SK, 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/json' };

// Get all Math 2
const res = await fetch(`${URL}/rest/v1/lectures?subject=eq.Matematika&class_number=eq.2&select=id,title,created_at&order=title,created_at`, { headers });
const all = await res.json();

// Group by title, keep the one with earliest created_at (the one we just fixed), delete rest
const groups = {};
for (const l of all) {
  if (!groups[l.title]) groups[l.title] = [];
  groups[l.title].push(l);
}

let deleted = 0;
for (const [title, items] of Object.entries(groups)) {
  if (items.length > 1) {
    // Sort by created_at, keep first (earliest = the one we set to Jan 2026)
    items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    for (let i = 1; i < items.length; i++) {
      const r = await fetch(`${URL}/rest/v1/lectures?id=eq.${items[i].id}`, {
        method: 'DELETE', headers
      });
      if (r.ok) deleted++;
    }
  }
}

// Also check all other subjects for dupes
const allLecs = await fetch(`${URL}/rest/v1/lectures?select=id,title,subject,class_number,created_at&order=title,created_at`, { headers }).then(r => r.json());
const allGroups = {};
for (const l of allLecs) {
  const key = `${l.subject}|${l.class_number}|${l.title}`;
  if (!allGroups[key]) allGroups[key] = [];
  allGroups[key].push(l);
}
for (const [key, items] of Object.entries(allGroups)) {
  if (items.length > 1) {
    items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    for (let i = 1; i < items.length; i++) {
      const r = await fetch(`${URL}/rest/v1/lectures?id=eq.${items[i].id}`, {
        method: 'DELETE', headers
      });
      if (r.ok) deleted++;
    }
  }
}

console.log(`Deleted ${deleted} duplicates`);
const remaining = await fetch(`${URL}/rest/v1/lectures?select=id`, { headers }).then(r => r.json());
console.log(`Remaining: ${remaining.length} lectures total`);
