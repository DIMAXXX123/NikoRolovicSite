const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg"
const url = "https://ydcbxqrnmnbceyzqgbui.supabase.co"

async function main() {
  // Create profile for Dima as admin
  const res = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      id: "241c9077-b700-4400-8f96-20e3a650eef4",
      first_name: "Dmitrij",
      last_name: "Ivascenko",
      email: "dmitrykokrok@gmail.com",
      class_number: 2,
      section_number: 1,
      role: "admin"
    })
  })
  
  const data = await res.text()
  console.log('Create profile:', res.status, data)

  // Verify
  const res2 = await fetch(`${url}/rest/v1/profiles?email=eq.dmitrykokrok@gmail.com`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    }
  })
  const profiles = await res2.json()
  console.log('Profile:', JSON.stringify(profiles, null, 2))

  // Now run seed - add test content with Dima as author
  const adminId = "241c9077-b700-4400-8f96-20e3a650eef4"
  
  // News
  const newsRes = await fetch(`${url}/rest/v1/news`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify([
      {
        title: "Dobrodošli na portal Gimnazije Niko Rolović!",
        content: "Dragi učenici, sa zadovoljstvom vam predstavljamo novi studentski portal naše gimnazije. Ovde ćete naći sve novosti, događaje, lekcije i fotografije iz života škole. Registrujte se i budite dio naše zajednice!",
        image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c8f1?w=800",
        author_id: adminId,
      },
      {
        title: "Početak drugog polugodišta",
        content: "Obavještavamo sve učenike da drugo polugodište počinje u ponedjeljak. Raspored časova ostaje nepromijenjen. Vidimo se!",
        image_url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800",
        author_id: adminId,
      },
      {
        title: "Rezultati takmičenja iz matematike",
        content: "Čestitamo svim učenicima koji su učestvovali na školskom takmičenju iz matematike. Posebne čestitke idu učenicima koji su se plasirali na opštinsko takmičenje!",
        author_id: adminId,
      },
    ])
  })
  console.log('News seed:', newsRes.status)

  // Events
  const eventsRes = await fetch(`${url}/rest/v1/events`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      { title: "Školska ekskurzija — Durmitor", description: "Dvodnevna ekskurzija na Durmitor za učenike 2. i 3. razreda. Cijena: 45€. Prijave kod razrednog starješine do petka.", event_date: "2026-04-05", event_time: "07:00", location: "Polazak ispred škole", author_id: adminId },
      { title: "Dan škole — proslava", description: "Svečana proslava Dana škole sa kulturno-umjetničkim programom, izložbom učeničkih radova i sportskim takmičenjima.", event_date: "2026-04-15", event_time: "10:00", location: "Sala za fizičko", author_id: adminId },
      { title: "Roditeljski sastanak", description: "Redovni roditeljski sastanak za sve razrede.", event_date: "2026-03-25", event_time: "18:00", location: "Učionice po razredima", author_id: adminId },
      { title: "Košarkaški turnir", description: "Međurazredno takmičenje u košarci. Prijave timova kod profesora fizičkog.", event_date: "2026-04-10", event_time: "12:00", location: "Školska sala", author_id: adminId },
    ])
  })
  console.log('Events seed:', eventsRes.status)

  // Lectures
  const lecturesRes = await fetch(`${url}/rest/v1/lectures`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      { title: "Pitagorina teorema — primena", subject: "Matematika", content: "U pravouglom trouglu, kvadrat nad hipotenuzom jednak je zbiru kvadrata nad katetama.\n\nFormula: a² + b² = c²\n\nGde je:\n- c — hipotenuza (najduža stranica)\n- a, b — katete\n\nPrimer: Ako su katete a=3 i b=4:\nc² = 9 + 16 = 25\nc = 5", class_number: 1, author_id: adminId },
      { title: "Hemijski elementi", subject: "Hemija", content: "Periodni sistem je organizovan po periodama (7) i grupama (18).\n\nVažni elementi:\nH - Vodonik (1)\nO - Kiseonik (8)\nC - Ugljenik (6)\nFe - Gvožđe (26)\n\nMetali provode struju, nemetali ne.", class_number: 1, author_id: adminId },
      { title: "Kvadratne jednačine", subject: "Matematika", content: "Opšti oblik: ax² + bx + c = 0\n\nDiskriminanta: D = b² - 4ac\nD > 0 → dva rješenja\nD = 0 → jedno rješenje\nD < 0 → nema realnih\n\nFormula: x = (-b ± √D) / 2a", class_number: 2, author_id: adminId },
      { title: "Drugi svetski rat — Jugoslavija", subject: "Istorija", content: "6. april 1941 — Napad na Jugoslaviju\n17. april 1941 — Kapitulacija\n\nPokreti otpora:\n- Partizani (Tito) - antifašistički\n- Četnici (Mihailović) - rojalistički\n\nKljučne bitke: Neretva, Sutjeska, Beograd\n\n1945 — Oslobođenje, formiranje FNRJ", class_number: 2, author_id: adminId },
      { title: "Integrali — osnove", subject: "Matematika", content: "Integral je inverzna operacija izvodu.\n\n∫xⁿ dx = xⁿ⁺¹/(n+1) + C\n∫1/x dx = ln|x| + C\n∫eˣ dx = eˣ + C\n∫sin(x) dx = -cos(x) + C\n∫cos(x) dx = sin(x) + C", class_number: 3, author_id: adminId },
      { title: "Elektromagnetna indukcija", subject: "Fizika", content: "Faradejov zakon: Promena magnetnog fluksa indukuje EMS.\nε = -dΦ/dt\n\nLencov zakon: Indukovana struja se suprotstavlja promeni.\n\nPrimene: generatori, transformatori, bežično punjenje", class_number: 3, author_id: adminId },
      { title: "Analitička geometrija u prostoru", subject: "Matematika", content: "Tačka: T(x, y, z)\nRastojanje: d = √[(x₂-x₁)² + (y₂-y₁)² + (z₂-z₁)²]\nRavan: ax + by + cz + d = 0\nPrava: (x-x₀)/a = (y-y₀)/b = (z-z₀)/c", class_number: 4, author_id: adminId },
    ])
  })
  console.log('Lectures seed:', lecturesRes.status)
  
  console.log('ALL DONE!')
}

main().catch(console.error)
