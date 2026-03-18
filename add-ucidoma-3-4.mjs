// Main runner - imports all subject data and inserts into Supabase
import { matematika3 } from './data/matematika3.mjs';
import { matematika4 } from './data/matematika4.mjs';
import { fizika3 } from './data/fizika3.mjs';
import { fizika4 } from './data/fizika4.mjs';
import { hemija3 } from './data/hemija3.mjs';
import { hemija4 } from './data/hemija4.mjs';
import { biologija3 } from './data/biologija3.mjs';
import { biologija4 } from './data/biologija4.mjs';
import { geografija3 } from './data/geografija3.mjs';
import { geografija4 } from './data/geografija4.mjs';
import { istorija3 } from './data/istorija3.mjs';
import { istorija4 } from './data/istorija4.mjs';
import { engleski3 } from './data/engleski3.mjs';
import { engleski4 } from './data/engleski4.mjs';

const SUPABASE_URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg';
const AUTHOR_ID = '241c9077-b700-4400-8f96-20e3a650eef4';

const allLectures = [
  ...matematika3, ...matematika4,
  ...fizika3, ...fizika4,
  ...hemija3, ...hemija4,
  ...biologija3, ...biologija4,
  ...geografija3, ...geografija4,
  ...istorija3, ...istorija4,
  ...engleski3, ...engleski4,
];

console.log(`Total lectures to insert: ${allLectures.length}`);

// Insert in batches of 20
const BATCH = 20;
let inserted = 0;
let errors = 0;

for (let i = 0; i < allLectures.length; i += BATCH) {
  const batch = allLectures.slice(i, i + BATCH).map(l => ({
    title: l.title,
    subject: l.subject,
    class_number: l.class_number,
    content: l.content,
    author_id: AUTHOR_ID,
  }));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/lectures`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(batch),
  });

  if (res.ok) {
    inserted += batch.length;
    console.log(`✓ Batch ${Math.floor(i/BATCH)+1}: inserted ${batch.length} (${inserted}/${allLectures.length})`);
  } else {
    const err = await res.text();
    errors += batch.length;
    console.error(`✗ Batch ${Math.floor(i/BATCH)+1} FAILED: ${res.status} ${err}`);
  }
}

console.log(`\nDone! Inserted: ${inserted}, Errors: ${errors}`);
