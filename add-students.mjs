const sk = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg"
const u = "https://ydcbxqrnmnbceyzqgbui.supabase.co"

const students = [
  // I2
  { first_name: "Majda", last_name: "Grbović", class_number: 1, section_number: 2 },
  { first_name: "Nađa", last_name: "Kurpejović", class_number: 1, section_number: 2 },
  { first_name: "Rodion", last_name: "Dmitriev", class_number: 1, section_number: 2 },
  { first_name: "Marko", last_name: "Vukotić", class_number: 1, section_number: 2 },
  { first_name: "Daris", last_name: "Brzać", class_number: 1, section_number: 2 },
  // I6
  { first_name: "Uroš", last_name: "Pješčić", class_number: 1, section_number: 6 },
  { first_name: "Matija", last_name: "Evtimov", class_number: 1, section_number: 6 },
  { first_name: "Aleksa", last_name: "Radović", class_number: 1, section_number: 6 },
  // II1
  { first_name: "Danilo", last_name: "Dabanović", class_number: 2, section_number: 1 },
  { first_name: "Vasilije", last_name: "Radulović", class_number: 2, section_number: 1 },
  { first_name: "Jovan", last_name: "Lukšić", class_number: 2, section_number: 1 },
  { first_name: "Nikola", last_name: "Dmitrović", class_number: 2, section_number: 1 },
  // II2
  { first_name: "Nikola", last_name: "Đurović", class_number: 2, section_number: 2 },
  { first_name: "Lazar", last_name: "Đoković", class_number: 2, section_number: 2 },
  { first_name: "Miloš", last_name: "Glavičić", class_number: 2, section_number: 2 },
  { first_name: "Jegor", last_name: "Sokolikov", class_number: 2, section_number: 2 },
  { first_name: "Daniel", last_name: "Walter", class_number: 2, section_number: 2 },
  // II6
  { first_name: "Timotej", last_name: "Borisenko", class_number: 2, section_number: 6 },
  // III5
  { first_name: "Bogdan", last_name: "Bošković", class_number: 3, section_number: 5 },
  { first_name: "Sergej", last_name: "Savić", class_number: 3, section_number: 5 },
  { first_name: "Andrej", last_name: "Iličković", class_number: 3, section_number: 5 },
  { first_name: "Matija", last_name: "Stojanović", class_number: 3, section_number: 5 },
  { first_name: "Amir", last_name: "Ćeman", class_number: 3, section_number: 5 },
  // III6
  { first_name: "Maša", last_name: "Lekić", class_number: 3, section_number: 6 },
  // I1
  { first_name: "Katarina", last_name: "Vujović", class_number: 1, section_number: 1 },
  { first_name: "Jana", last_name: "Zečević", class_number: 1, section_number: 1 },
  { first_name: "Milica", last_name: "Raković", class_number: 1, section_number: 1 },
  { first_name: "Mari", last_name: "Kazarjan", class_number: 1, section_number: 1 },
  { first_name: "Andrea", last_name: "Jelić", class_number: 1, section_number: 1 },
  // I3
  { first_name: "Tara", last_name: "Tomašević", class_number: 1, section_number: 3 },
  { first_name: "Mia", last_name: "Maljević", class_number: 1, section_number: 3 },
  { first_name: "Aida", last_name: "Đonbaljaj", class_number: 1, section_number: 3 },
  { first_name: "Luka", last_name: "Rajković", class_number: 1, section_number: 3 },
  { first_name: "Jovan", last_name: "Dobrković", class_number: 1, section_number: 3 },
  { first_name: "Iva", last_name: "Crnčević", class_number: 1, section_number: 3 },
  { first_name: "Uroš", last_name: "Dobrković", class_number: 1, section_number: 3 },
  // I4
  { first_name: "Daris", last_name: "Dacić", class_number: 1, section_number: 4 },
  { first_name: "Uroš", last_name: "Vukmanović", class_number: 1, section_number: 4 },
  { first_name: "Bogdana", last_name: "Đuranović", class_number: 1, section_number: 4 },
  // III1
  { first_name: "Alisa", last_name: "Okulova", class_number: 3, section_number: 1 },
  { first_name: "Jelisaveta", last_name: "Julkina", class_number: 3, section_number: 1 },
  { first_name: "Mikael", last_name: "Misevra", class_number: 3, section_number: 1 },
  { first_name: "Mirza", last_name: "Kordić", class_number: 3, section_number: 1 },
  { first_name: "Filip", last_name: "Smolović", class_number: 3, section_number: 1 },
  { first_name: "Artur", last_name: "Balagezian", class_number: 3, section_number: 1 },
  // III2
  { first_name: "Matea", last_name: "Šćekić", class_number: 3, section_number: 2 },
  // III3
  { first_name: "Filip", last_name: "Dabović", class_number: 3, section_number: 3 },
  { first_name: "Balša", last_name: "Đurišić", class_number: 3, section_number: 3 },
  // III4
  { first_name: "Haris", last_name: "Aljošević", class_number: 3, section_number: 4 },
  { first_name: "Leonard", last_name: "Kerndl", class_number: 3, section_number: 4 },
  // IV2
  { first_name: "Mina", last_name: "Vučetić", class_number: 4, section_number: 2 },
]

async function go() {
  let added = 0, skipped = 0
  for (const s of students) {
    // Check if already exists
    const check = await fetch(`${u}/rest/v1/verified_students?first_name=eq.${encodeURIComponent(s.first_name)}&last_name=eq.${encodeURIComponent(s.last_name)}&class_number=eq.${s.class_number}&section_number=eq.${s.section_number}`, {
      headers: { 'apikey': sk, 'Authorization': `Bearer ${sk}` }
    })
    const existing = await check.json()
    if (existing.length > 0) {
      skipped++
      continue
    }

    const r = await fetch(`${u}/rest/v1/verified_students`, {
      method: 'POST',
      headers: { 'apikey': sk, 'Authorization': `Bearer ${sk}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, email: `placeholder_${s.first_name.toLowerCase()}_${s.last_name.toLowerCase()}@temp.com` })
    })
    if (r.status === 201) added++
    else console.log(`FAIL: ${s.first_name} ${s.last_name}`, r.status)
  }
  console.log(`Done: ${added} added, ${skipped} already existed`)
  
  // Count total
  const total = await fetch(`${u}/rest/v1/verified_students?select=id`, { headers: { 'apikey': sk, 'Authorization': `Bearer ${sk}` } })
  const all = await total.json()
  console.log(`Total students in DB: ${all.length}`)
}

go()
