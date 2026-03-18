const URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg';
const headers = { 'apikey': SK, 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/json' };

// Correct order for Math II
const correctOrder = [
  'Stepeni cjelobrojnog izložioca I dio',
  'Stepeni cjelobrojnog izložioca II dio',
  'Osobine funkcija I dio',
  'Osobine funkcija II dio',
  'Stepene funkcije 1. dio',
  'Stepene funkcije 2. dio',
  'Pojam n-tog korijena',
  'Stepeni racionalnog izložioca',
  'Kompozicija funkcija',
  'Inverzna funkcija',
  'Korijena funkcija',
  'Kompleksni brojevi',
  'Geometrijska interpretacija kompleksnih brojeva',
  'Stepene funkcije 1',
  'Stepene funkcije 2',
  'Kvadratna jednačina',
  'Priroda rješenja kvadratne jednačine',
  'Vietove formule',
  'Jednačine koje se svode na kvadratne jednačine',
  'Sistemi kvadratnih jednačina',
  'Grafik funkcije kvadratne funkcije (y=ax²+bx+c)',
  'Svojstva, osobine kvadratne funkcije',
  'Crtanje grafika i ispitivanje svojstva kvadratne funkcije',
  'Kvadratne nejednačine',
  'Iracionalne jednačine',
  'Eksponencijalna funkcija',
  'Eksponencijalne jednačine',
  'Logaritamska funkcija',
  'Logaritamske jednačine',
  'Logaritamske jednačine – utvrđivanje',
];

// Get all Math 2 lectures
const res = await fetch(`${URL}/rest/v1/lectures?subject=eq.Matematika&class_number=eq.2&select=id,title`, { headers });
const lectures = await res.json();
console.log(`Found ${lectures.length} Math 2 lectures`);

// Update created_at for each in correct order
const baseDate = new Date('2026-01-01T00:00:00Z');
let updated = 0;
for (let i = 0; i < correctOrder.length; i++) {
  const lecture = lectures.find(l => l.title === correctOrder[i]);
  if (!lecture) { console.log(`NOT FOUND: ${correctOrder[i]}`); continue; }
  
  const newDate = new Date(baseDate.getTime() + i * 3600000).toISOString(); // 1 hour apart
  const r = await fetch(`${URL}/rest/v1/lectures?id=eq.${lecture.id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ created_at: newDate })
  });
  if (r.ok) updated++;
  else console.log(`FAIL: ${correctOrder[i]}`);
}
console.log(`Updated ${updated}/${correctOrder.length} lectures`);
