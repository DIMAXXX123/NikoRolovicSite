import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// SECURITY NOTES:
// - Protected by secret query parameter. In production, consider using
//   a stronger secret or env variable (process.env.SEED_SECRET).
// - Rate limiting: This is a one-time setup endpoint. Consider disabling
//   in production or adding IP-based rate limiting.
// - Uses service role key to bypass RLS for seeding data.
// - Supabase handles all password hashing (bcrypt) server-side.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== 'niko2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Make Dima admin
  await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', 'dmitrykokrok@gmail.com')

  // Seed news
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'dmitrykokrok@gmail.com')
    .single()

  const adminId = adminProfile?.id

  if (adminId) {
    // News
    await supabase.from('news').upsert([
      {
        title: 'Dobrodošli na portal Gimnazije Niko Rolović!',
        content: 'Dragi učenici, sa zadovoljstvom vam predstavljamo novi studentski portal naše gimnazije. Ovde ćete naći sve novosti, događaje, lekcije i fotografije iz života škole. Registrujte se i budite dio naše zajednice!',
        image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c8f1?w=800',
        author_id: adminId,
      },
      {
        title: 'Početak drugog polugodišta',
        content: 'Obavještavamo sve učenike da drugo polugodište počinje u ponedjeljak. Raspored časova ostaje nepromijenjen. Vidimo se!',
        image_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800',
        author_id: adminId,
      },
      {
        title: 'Rezultati takmičenja iz matematike',
        content: 'Čestitamo svim učenicima koji su učestvovali na školskom takmičenju iz matematike. Posebne čestitke idu učenicima koji su se plasirali na opštinsko takmičenje!',
        author_id: adminId,
      },
    ], { onConflict: 'id' })

    // Events
    await supabase.from('events').upsert([
      {
        title: 'Školska ekskurzija — Durmitor',
        description: 'Dvodnevna ekskurzija na Durmitor za učenike 2. i 3. razreda. Cijena: 45€. Prijave kod razrednog starješine do petka.',
        event_date: '2026-04-05',
        event_time: '07:00',
        location: 'Polazak ispred škole',
        author_id: adminId,
      },
      {
        title: 'Dan škole — proslava',
        description: 'Svečana proslava Dana škole sa kulturno-umjetničkim programom, izložbom učeničkih radova i sportskim takmičenjima.',
        event_date: '2026-04-15',
        event_time: '10:00',
        location: 'Sala za fizičko',
        author_id: adminId,
      },
      {
        title: 'Roditeljski sastanak',
        description: 'Redovni roditeljski sastanak za sve razrede. Obavezno prisustvo roditelja/staratelja.',
        event_date: '2026-03-25',
        event_time: '18:00',
        location: 'Učionice po razredima',
        author_id: adminId,
      },
      {
        title: 'Košarkaški turnir',
        description: 'Međurazredno takmičenje u košarci. Prijave timova (5 igrača + 2 rezerve) kod profesora fizičkog.',
        event_date: '2026-04-10',
        event_time: '12:00',
        location: 'Školska sala',
        author_id: adminId,
      },
    ], { onConflict: 'id' })

    // Lectures
    await supabase.from('lectures').upsert([
      {
        title: 'Pitagorina teorema — primena',
        subject: 'Matematika',
        content: '# Pitagorina teorema\n\nU pravouglom trouglu, kvadrat nad hipotenuzom jednak je zbiru kvadrata nad katetama.\n\n**Formula:** a² + b² = c²\n\nGde je:\n- c — hipotenuza (najduža stranica)\n- a, b — katete\n\n## Primeri\n\n**Primer 1:** Ako su katete a=3 i b=4, kolika je hipotenuza?\nc² = 3² + 4² = 9 + 16 = 25\nc = 5\n\n**Primer 2:** Ako je hipotenuza c=13 i kateta a=5, kolika je druga kateta?\nb² = 13² - 5² = 169 - 25 = 144\nb = 12\n\n## Zadaci za vežbanje\n1. a=6, b=8, c=?\n2. a=5, c=13, b=?\n3. b=15, c=17, a=?',
        class_number: 1,
        author_id: adminId,
      },
      {
        title: 'Hemijski elementi i periodni sistem',
        subject: 'Hemija',
        content: '# Periodni sistem elemenata\n\nPeriodni sistem je organizovan po:\n- **Periodama** (redovi) — 7 perioda\n- **Grupama** (kolone) — 18 grupa\n\n## Važni elementi\n\n| Simbol | Naziv | Atomski broj |\n|--------|-------|-------------|\n| H | Vodonik | 1 |\n| O | Kiseonik | 8 |\n| C | Ugljenik | 6 |\n| N | Azot | 7 |\n| Fe | Gvožđe | 26 |\n\n## Metali vs Nemetali\n\n**Metali:** provode struju, sjajni, kovni\n**Nemetali:** ne provode struju, krti\n\n## Zapamti\n- Atomski broj = broj protona\n- Maseni broj = protoni + neutroni\n- Elektroni = protoni (u neutralnom atomu)',
        class_number: 1,
        author_id: adminId,
      },
      {
        title: 'Kvadratne jednačine',
        subject: 'Matematika',
        content: '# Kvadratne jednačine\n\nOpšti oblik: **ax² + bx + c = 0** (a ≠ 0)\n\n## Diskriminanta\nD = b² - 4ac\n\n- D > 0 → dva realna rješenja\n- D = 0 → jedno (dvostruko) rješenje\n- D < 0 → nema realnih rješenja\n\n## Formula\nx₁,₂ = (-b ± √D) / 2a\n\n## Primer\n2x² + 5x - 3 = 0\n\na=2, b=5, c=-3\nD = 25 - 4(2)(-3) = 25 + 24 = 49\nx₁ = (-5 + 7) / 4 = 0.5\nx₂ = (-5 - 7) / 4 = -3\n\n## Vijetove formule\nx₁ + x₂ = -b/a\nx₁ · x₂ = c/a',
        class_number: 2,
        author_id: adminId,
      },
      {
        title: 'Drugi svetski rat — Jugoslavija',
        subject: 'Istorija',
        content: '# Jugoslavija u Drugom svetskom ratu\n\n## Hronologija\n\n- **6. april 1941** — Napad na Jugoslaviju\n- **17. april 1941** — Kapitulacija\n- **1941-1945** — Okupacija i otpor\n- **1945** — Oslobođenje\n\n## Pokreti otpora\n\n**Partizani** (NOVJ)\n- Vođa: Josip Broz Tito\n- Antifašistički pokret\n- Podržani od Saveznika od 1943.\n\n**Četnici**\n- Vođa: Draža Mihailović\n- Rojalistički pokret\n\n## Ključne bitke\n1. Bitka na Neretvi (1943)\n2. Bitka na Sutjesci (1943)\n3. Beogradska operacija (1944)\n\n## Posledice\n- Oko 1 milion žrtava\n- Formiranje FNRJ (1945)',
        class_number: 2,
        author_id: adminId,
      },
      {
        title: 'Integrali — osnove',
        subject: 'Matematika',
        content: '# Neodređeni integral\n\nIntegral je inverzna operacija izvodu.\n\n∫f(x)dx = F(x) + C\n\ngdje je F\'(x) = f(x)\n\n## Osnovne formule\n\n- ∫xⁿ dx = xⁿ⁺¹/(n+1) + C\n- ∫1/x dx = ln|x| + C\n- ∫eˣ dx = eˣ + C\n- ∫sin(x) dx = -cos(x) + C\n- ∫cos(x) dx = sin(x) + C\n\n## Primeri\n\n∫3x² dx = x³ + C\n∫(2x + 1) dx = x² + x + C\n∫5 dx = 5x + C\n\n## Pravila\n1. ∫[f(x) + g(x)]dx = ∫f(x)dx + ∫g(x)dx\n2. ∫k·f(x)dx = k·∫f(x)dx',
        class_number: 3,
        author_id: adminId,
      },
      {
        title: 'Elektromagnetna indukcija',
        subject: 'Fizika',
        content: '# Elektromagnetna indukcija\n\n## Faradejov zakon\nPromena magnetnog fluksa kroz provodnik indukuje elektromotornu silu (EMS).\n\n**Formula:** ε = -dΦ/dt\n\n## Lencov zakon\nIndukovana struja uvek teži da se suprotstavi promeni koja je izazvala.\n\n## Primene\n- Generatori električne energije\n- Transformatori\n- Indukcione peći\n- Bežično punjenje telefona\n\n## Samoindukcija\nε = -L · dI/dt\n\ngde je L — induktivnost (mjeri se u Henri, H)\n\n## Zadaci\n1. Kalem ima 100 namotaja. Magnetni fluks se promijeni za 0.5 Wb za 0.1s. Kolika je indukovana EMS?\n\nε = -N · ΔΦ/Δt = -100 · 0.5/0.1 = -500V',
        class_number: 3,
        author_id: adminId,
      },
      {
        title: 'Analitička geometrija u prostoru',
        subject: 'Matematika',
        content: '# Analitička geometrija u prostoru\n\n## Tačka u prostoru\nT(x, y, z) — tri koordinate\n\n## Rastojanje između tačaka\nd = √[(x₂-x₁)² + (y₂-y₁)² + (z₂-z₁)²]\n\n## Jednačina ravni\nax + by + cz + d = 0\n\ngde je (a, b, c) — normalni vektor ravni\n\n## Jednačina prave\n(x-x₀)/a = (y-y₀)/b = (z-z₀)/c\n\ngde je (a, b, c) — vektor pravca\n\n## Ugao između pravih\ncos α = |a₁a₂ + b₁b₂ + c₁c₂| / (|v₁| · |v₂|)\n\n## Rastojanje tačke od ravni\nd = |ax₀ + by₀ + cz₀ + d| / √(a² + b² + c²)',
        class_number: 4,
        author_id: adminId,
      },
    ], { onConflict: 'id' })
  }

  return NextResponse.json({ ok: true, message: 'Seed complete!' })
}
