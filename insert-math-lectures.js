// Simple script to insert 30 Math II lectures
const SUPABASE_URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg';
const AUTHOR_ID = '241c9077-b700-4400-8f96-20e3a650eef4';

// Simple array of 30 lectures without special formatting
const lectures = [
  {
    title: 'Stepeni cjelobrojnog izložioca I dio',
    video_url: 'https://www.youtube.com/watch?v=XZRQhkii0h0'
  },
  {
    title: 'Stepeni cjelobrojnog izložioca II dio', 
    video_url: 'https://www.youtube.com/watch?v=kITJ6qH7jS0'
  },
  {
    title: 'Osobine funkcija I dio',
    video_url: 'https://www.youtube.com/watch?v=kvGsIo1TmsM'
  },
  {
    title: 'Osobine funkcija II dio',
    video_url: 'https://www.youtube.com/watch?v=3eVFC_Pl6UU'
  },
  {
    title: 'Stepene funkcije 1. dio',
    video_url: 'https://www.youtube.com/watch?v=dEJwBojMXx8'
  },
  {
    title: 'Stepene funkcije 2. dio',
    video_url: 'https://www.youtube.com/watch?v=ruZqBWnaEBk'
  },
  {
    title: 'Pojam n-tog korijena',
    video_url: 'https://www.youtube.com/watch?v=B0pDyGGZOlA'
  },
  {
    title: 'Stepeni racionalnog izložioca',
    video_url: 'https://www.youtube.com/watch?v=lZfXc4nHooo'
  },
  {
    title: 'Kompozicija funkcija',
    video_url: 'https://www.youtube.com/watch?v=ZFPkQkURSxk'
  },
  {
    title: 'Inverzna funkcija',
    video_url: 'https://www.youtube.com/watch?v=TIWbVHmSsNM'
  },
  {
    title: 'Korijena funkcija',
    video_url: 'https://www.youtube.com/watch?v=wTlw7fNcO-0'
  },
  {
    title: 'Kompleksni brojevi',
    video_url: 'https://www.youtube.com/watch?v=SP-YJe7Vldo'
  },
  {
    title: 'Geometrijska interpretacija kompleksnih brojeva',
    video_url: 'https://www.youtube.com/watch?v=5PcpBw5Hbwo'
  },
  {
    title: 'Stepene funkcije 1',
    video_url: 'https://www.youtube.com/watch?v=UZ0MnVayiXA'
  },
  {
    title: 'Stepene funkcije 2',
    video_url: 'https://www.youtube.com/watch?v=dEJwBojMXx8'
  },
  {
    title: 'Kvadratna jednačina',
    video_url: 'https://www.youtube.com/watch?v=eF6zYNzlZKQ'
  },
  {
    title: 'Priroda rješenja kvadratne jednačine',
    video_url: 'https://www.youtube.com/watch?v=ZIznMI9R9TA'
  },
  {
    title: 'Vietove formule',
    video_url: 'https://www.youtube.com/watch?v=Pk4N5P6nfhY'
  },
  {
    title: 'Jednačine koje se svode na kvadratne jednačine',
    video_url: 'https://www.youtube.com/watch?v=3qF6y55v7vE'
  },
  {
    title: 'Sistemi kvadratnih jednačina',
    video_url: 'https://www.youtube.com/watch?v=HnoQyDcNmNU'
  },
  {
    title: 'Grafik funkcije kvadratne funkcije (y=ax²+bx+c)',
    video_url: 'https://www.youtube.com/watch?v=IH7Ywp0m3Qg'
  },
  {
    title: 'Svojstva, osobine kvadratne funkcije',
    video_url: 'https://www.youtube.com/watch?v=Hq2Up_1dTk0'
  },
  {
    title: 'Crtanje grafika i ispitivanje svojstva kvadratne funkcije',
    video_url: 'https://www.youtube.com/watch?v=kDhkLPS7tue'
  },
  {
    title: 'Kvadratne nejednačine',
    video_url: 'https://www.youtube.com/watch?v=f8GK-hOjPhw'
  },
  {
    title: 'Iracionalne jednačine',
    video_url: 'https://www.youtube.com/watch?v=SLqNPzVgGbs'
  },
  {
    title: 'Eksponencijalna funkcija',
    video_url: 'https://www.youtube.com/watch?v=aBt5l2kaMKI'
  },
  {
    title: 'Eksponencijalne jednačine',
    video_url: 'https://www.youtube.com/watch?v=R-G8KHLcj_Q'
  },
  {
    title: 'Logaritamska funkcija',
    video_url: 'https://www.youtube.com/watch?v=0G_wE5MyJL4'
  },
  {
    title: 'Logaritamske jednačine',
    video_url: 'https://www.youtube.com/watch?v=OLnfVyfXJL4'
  },
  {
    title: 'Logaritamske jednačine – utvrđivanje',
    video_url: 'https://www.youtube.com/watch?v=LL9-YBJ9UYs'
  }
];

// Generate content for each lecture
function generateContent(title, index) {
  const isCurrent = index === 14; // Lecture 15 is current
  let content = isCurrent ? '<!-- CURRENT -->' : '';
  
  content += `<h1>${title}</h1>
  
<p>Ova lekcija pokriva važnu temu iz matematike drugog razreda. Učićemo o konceptima koji su osnova za dalju gradnju matematičkog znanja.</p>

<div style="background:#1e1b4b;border-left:3px solid #a78bfa;padding:12px 16px;border-radius:8px;margin:12px 0;font-family:monospace;font-size:15px;color:#e2e8f0;">
  Formula će biti prikazana ovdje
</div>

<p>Važno je razumjeti sve koncepte korak po korak. Svaki novi pojam se gradi na prethodnom znanju.</p>

<div style="background:#18181b;border:1px solid #3f3f46;padding:12px 16px;border-radius:8px;margin:12px 0;">
  <strong style="color:#a78bfa;">💡 Važno:</strong> Obratite pažnju na detalje koji će biti potrebni na testovima.
</div>

<h2>Primjer</h2>

<div style="background:#0f172a;border:1px solid #1e293b;padding:16px;border-radius:10px;margin:16px 0;">
  <h3 style="color:#a78bfa;margin:0 0 8px 0;font-size:15px;">📝 Zadatak</h3>
  <p>Riješite sljedeći zadatak korak po korak...</p>
  <p><strong>Rješenje:</strong> Postupno ćemo doći do rezultata.</p>
</div>

<p>Ova tema je povezana sa svim prethodnim lekcijama koje smo radili. Posebno je važno razumjeti osnovne koncepte prije prelaska na složenije zadatke.</p>

<h2>Vježba</h2>

<p>Za potpuno savladavanje ove teme, potrebno je:</p>
<ul>
  <li>Pročitati teoriju više puta</li>
  <li>Riješiti sve primjere samostalno</li>
  <li>Vježbati dodatne zadatke</li>
  <li>Povezati sa prethodnim lekcijama</li>
</ul>

<p>Kada savladate ovu lekciju, bićete spremni za sljedeću temu koja se nadovezuje na ovo gradivo.</p>

QUIZ_DATA:[{"question":"Testno pitanje 1?","options":["Odgovor A","Odgovor B","Odgovor C","Odgovor D"],"correct":0},{"question":"Testno pitanje 2?","options":["Opcija 1","Opcija 2","Opcija 3","Opcija 4"],"correct":1},{"question":"Testno pitanje 3?","options":["Prvi","Drugi","Treći","Četvrti"],"correct":2},{"question":"Testno pitanje 4?","options":["Da","Ne","Možda","Zavisi"],"correct":0},{"question":"Testno pitanje 5?","options":["Tačno","Netačno","Nije definisano","Nedovoljno podataka"],"correct":0}]:QUIZ_DATA`;

  return content;
}

// Insert all lectures
async function insertLectures() {
  console.log('Starting to insert 30 Math II lectures...');
  
  for (let i = 0; i < lectures.length; i++) {
    const lecture = lectures[i];
    console.log(`Inserting lecture ${i + 1}/30: ${lecture.title}`);
    
    const body = {
      title: lecture.title,
      subject: 'Matematika',
      content: generateContent(lecture.title, i),
      class_number: 2,
      author_id: AUTHOR_ID,
      video_url: lecture.video_url || null
    };
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/lectures`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`Failed to insert lecture ${i + 1}: ${error}`);
      } else {
        const result = await response.json();
        console.log(`✓ Successfully inserted: ${lecture.title}`);
      }
    } catch (error) {
      console.error(`Error inserting lecture ${i + 1}:`, error.message);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✅ Finished inserting all 30 lectures!');
}

// Run the insertion
insertLectures().catch(console.error);