// Insert 30 Math II lectures into Supabase
const SUPABASE_URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg';
const AUTHOR_ID = '241c9077-b700-4400-8f96-20e3a650eef4';

const formula = (text) => `<div style="background:#1e1b4b;border-left:3px solid #a78bfa;padding:12px 16px;border-radius:8px;margin:12px 0;font-family:monospace;font-size:15px;color:#e2e8f0;">${text}</div>`;
const important = (text) => `<div style="background:#18181b;border:1px solid #3f3f46;padding:12px 16px;border-radius:8px;margin:12px 0;"><strong style="color:#a78bfa;">💡 Važno:</strong> ${text}</div>`;
const hint = (text) => `<div style="background:#1a1a2e;border:1px solid #2d2d5e;padding:12px 16px;border-radius:8px;margin:12px 0;"><strong style="color:#fbbf24;">💡 Hint:</strong> ${text}</div>`;
const example = (title, content) => `<div style="background:#0f172a;border:1px solid #1e293b;padding:16px;border-radius:10px;margin:16px 0;"><h3 style="color:#a78bfa;margin:0 0 8px 0;font-size:15px;">📝 ${title}</h3>${content}</div>`;
const backRef = (title) => `<p style="color:#71717a;font-size:13px;">↩ Pogledaj lekciju: "${title}"</p>`;

const lectures = [
  {
    title: 'Stepeni cjelobrojnog izložioca I dio',
    video_url: 'https://www.youtube.com/watch?v=XZRQhkii0h0',
    content: `<h1>Stepeni cjelobrojnog izložioca — I dio</h1>

<p>Stepenovanje je matematička operacija koja predstavlja skraćeni zapis uzastopnog množenja istog broja. Umjesto da pišemo 2 × 2 × 2 × 2 × 2, možemo napisati 2⁵. Broj koji se množi naziva se <strong>osnova</strong> (baza), a broj koji pokazuje koliko puta se osnova množi naziva se <strong>izložilac</strong> (eksponent).</p>

${formula('a<sup>n</sup> = a · a · a · ... · a &nbsp;&nbsp;(n puta)')}

<p>Kada je izložilac prirodan broj (n ∈ ℕ), stepenovanje je jednostavno — množimo osnovu samu sa sobom n puta. Ali šta se dešava kada je izložilac nula ili negativan broj? Tu počinje prava priča o stepenima cjelobrojnog izložioca.</p>

<h2>Stepen sa izložiocem 0</h2>

<p>Svaki broj (osim nule) stepenovana na nulu daje 1. Ovo možemo razumjeti kroz pravilo dijeljenja stepena sa istom osnovom:</p>

${formula('a⁰ = 1 &nbsp;&nbsp;(a ≠ 0)')}
${formula('Dokaz: a<sup>n</sup> ÷ a<sup>n</sup> = a<sup>n−n</sup> = a⁰ = 1')}

${important('Izraz 0⁰ nije definisan! To je jedan od nedefinisanih izraza u matematici.')}

<h2>Stepen sa negativnim izložiocem</h2>

<p>Negativan izložilac znači da umjesto množenja, vršimo dijeljenje. Stepen sa negativnim izložiocem se pretvara u razlomak:</p>

${formula('a<sup>−n</sup> = 1 / a<sup>n</sup> &nbsp;&nbsp;(a ≠ 0)')}

${example('Primjer 1: Izračunaj', `
<p>a) 3⁰ = <strong>1</strong></p>
<p>b) 5<sup>−2</sup> = 1/5² = 1/25 = <strong>0.04</strong></p>
<p>c) 2<sup>−3</sup> = 1/2³ = <strong>1/8</strong></p>
<p>d) (−4)⁰ = <strong>1</strong></p>
`)}

${example('Primjer 2: Zapiši sa pozitivnim izložiocem', `
<p>a) 7<sup>−1</sup> = 1/7</p>
<p>b) (2/3)<sup>−2</sup> = (3/2)² = 9/4</p>
`)}

${hint('Kada se razlomak stepenuje negativnim izložiocem, zamijeni brojilac i imenilac pa stepenuj pozitivnim izložiocem.')}

<p>U sljedećoj lekciji ćemo naučiti pravila (osobine) za rad sa stepenima — množenje, dijeljenje i stepenovanje stepena.</p>

QUIZ_DATA:[{"question":"Koliko je 5⁰?","options":["0","1","5","Nije definisano"],"correct":1},{"question":"Koliko je 2⁻³?","options":["1/8","−8","8","−1/8"],"correct":0},{"question":"Koliko je (−3)⁰?","options":["−3","0","1","−1"],"correct":2},{"question":"Koji izraz NIJE definisan?","options":["0¹","1⁰","0⁰","(−1)⁰"],"correct":2},{"question":"Koliko je (1/2)⁻²?","options":["1/4","4","−4","2"],"correct":1},{"question":"Zapiši 10⁻¹ kao decimalni broj:","options":["0.1","0.01","10","−10"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Stepeni cjelobrojnog izložioca II dio',
    video_url: 'https://www.youtube.com/watch?v=kITJ6qH7jS0',
    content: `<h1>Stepeni cjelobrojnog izložioca — II dio</h1>

${backRef('Stepeni cjelobrojnog izložioca I dio')}

<p>U prvom dijelu naučili smo šta su stepeni i kako se ponašaju sa izložiocem 0 i negativnim izložiocem. Sada ćemo naučiti <strong>pravila za računanje sa stepenima</strong> — ova pravila su ključna za cijelu matematiku!</p>

<h2>Pravila za rad sa stepenima</h2>

<h3>1. Množenje stepena sa istom osnovom</h3>
<p>Kada množimo stepene koji imaju istu osnovu, sabiramo izložioce:</p>
${formula('a<sup>m</sup> · a<sup>n</sup> = a<sup>m+n</sup>')}

<h3>2. Dijeljenje stepena sa istom osnovom</h3>
<p>Kada dijelimo stepene sa istom osnovom, oduzimamo izložioce:</p>
${formula('a<sup>m</sup> ÷ a<sup>n</sup> = a<sup>m−n</sup> &nbsp;&nbsp;(a ≠ 0)')}

<h3>3. Stepenovanje stepena</h3>
<p>Kada stepenujemo stepen, množimo izložioce:</p>
${formula('(a<sup>m</sup>)<sup>n</sup> = a<sup>m·n</sup>')}

<h3>4. Stepen proizvoda</h3>
${formula('(a · b)<sup>n</sup> = a<sup>n</sup> · b<sup>n</sup>')}

<h3>5. Stepen količnika</h3>
${formula('(a / b)<sup>n</sup> = a<sup>n</sup> / b<sup>n</sup> &nbsp;&nbsp;(b ≠ 0)')}

${important('Ova pravila važe za SVAKI cjelobrojni izložilac — pozitivan, negativan ili nulu!')}

${example('Primjer 1: Pojednostavi', `
<p>a) 2³ · 2⁵ = 2<sup>3+5</sup> = 2⁸ = <strong>256</strong></p>
<p>b) 5⁷ ÷ 5⁴ = 5<sup>7−4</sup> = 5³ = <strong>125</strong></p>
<p>c) (3²)⁴ = 3<sup>2·4</sup> = 3⁸ = <strong>6561</strong></p>
`)}

${example('Primjer 2: Pojednostavi izraze', `
<p>a) (2³ · 2⁻¹)² = (2<sup>3+(−1)</sup>)² = (2²)² = 2⁴ = <strong>16</strong></p>
<p>b) 3⁵ · 3⁻² / 3⁴ = 3<sup>5+(−2)−4</sup> = 3<sup>−1</sup> = <strong>1/3</strong></p>
`)}

${hint('Greška koju svi prave: a² · b³ ≠ (ab)⁵! Množenje izložilaca radi SAMO kada su osnove iste.')}

<p>Ova pravila koristićemo konstantno u narednim lekcijama — naročito kod funkcija i jednačina. Uvježbaj ih dok ne postanu automatski!</p>

QUIZ_DATA:[{"question":"Koliko je 2³ · 2⁴?","options":["2⁷ = 128","2¹² = 4096","2⁷ = 64","2³ = 8"],"correct":0},{"question":"Pojednostavi: 5⁸ ÷ 5⁵","options":["5³ = 125","5³ = 15","5¹³","1"],"correct":0},{"question":"Koliko je (2³)²?","options":["2⁵ = 32","2⁶ = 64","2⁹ = 512","2⁶ = 36"],"correct":1},{"question":"Pojednostavi: (3·2)⁴","options":["6⁴ = 1296","5⁴ = 625","3⁴ + 2⁴","24⁴"],"correct":0},{"question":"Koliko je 4⁻¹ · 4³?","options":["4² = 16","4⁻³","4⁴ = 256","4⁻² = 1/16"],"correct":0},{"question":"Koja formula je TAČNA?","options":["a² · a³ = a⁶","(a²)³ = a⁵","a⁵ ÷ a² = a³","a⁰ = 0"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: 'Osobine funkcija I dio',
    video_url: 'https://www.youtube.com/watch?v=kvGsIo1TmsM',
    content: `<h1>Osobine funkcija — I dio</h1>

<p>Funkcija je jedno od najvažnijih pojmova u matematici. To je pravilo koje svakom elementu iz jednog skupa (domena) pridružuje <strong>tačno jedan</strong> element iz drugog skupa (kodomena). Funkciju obično označavamo sa f, g, h itd.</p>

${formula('f: A → B, &nbsp;&nbsp;f(x) = y')}

<p>Gdje je x <strong>nezavisna promjenljiva</strong> (argument), a y = f(x) je <strong>zavisna promjenljiva</strong> (vrijednost funkcije).</p>

<h2>Domen i kodomen</h2>

<p><strong>Domen (oblast definisanosti)</strong> je skup svih vrijednosti x za koje je funkcija definisana. <strong>Kodomen (skup vrijednosti)</strong> je skup svih mogućih vrijednosti y koje funkcija može dati.</p>

${formula('D(f) = { x ∈ ℝ : f(x) je definisano }')}

${example('Primjer: Odredi domen', `
<p>a) f(x) = √(x − 3) → Domen: x − 3 ≥ 0, dakle <strong>x ≥ 3</strong>, D = [3, +∞)</p>
<p>b) f(x) = 1/(x − 2) → Domen: x ≠ 2, dakle <strong>D = ℝ \\ {2}</strong></p>
<p>c) f(x) = x² + 1 → Domen: <strong>D = ℝ</strong> (nema ograničenja)</p>
`)}

<h2>Grafik funkcije</h2>

<p>Grafik funkcije f je skup svih tačaka (x, y) u koordinatnom sistemu za koje važi y = f(x). Grafik nam vizuelno prikazuje ponašanje funkcije.</p>

${important('Svaka vertikalna prava može sjeći grafik funkcije u NAJVIŠE jednoj tački. Ako siječe u dvije ili više tačaka, to NIJE funkcija! (Test vertikalne prave)')}

<h2>Nultačke funkcije</h2>

<p>Nultačke su vrijednosti x za koje je f(x) = 0. To su tačke u kojima grafik funkcije presijeca x-osu.</p>

${formula('f(x₀) = 0 &nbsp;&nbsp;→ x₀ je nultačka')}

${example('Primjer: Nađi nultačke', `
<p>f(x) = x² − 4</p>
<p>x² − 4 = 0</p>
<p>x² = 4</p>
<p>x = ±2</p>
<p>Nultačke: <strong>x₁ = −2, x₂ = 2</strong></p>
`)}

<p>U sljedećoj lekciji naučićemo o parnosti, monotonosti i periodičnosti funkcija.</p>

QUIZ_DATA:[{"question":"Šta je domen funkcije f(x) = 1/x?","options":["ℝ \\\\ {0}","ℝ","[0, +∞)","(0, +∞)"],"correct":0},{"question":"Koliko nultačaka ima f(x) = x² − 9?","options":["2","1","0","3"],"correct":0},{"question":"Domen funkcije f(x) = √(x) je:","options":["[0, +∞)","ℝ","(0, +∞)","(−∞, 0]"],"correct":0},{"question":"Šta prikazuje grafik funkcije?","options":["Skup svih tačaka (x, f(x))","Samo nultačke","Domen funkcije","Samo pozitivne vrijednosti"],"correct":0},{"question":"Koja od ovih NIJE funkcija?","options":["x² + y² = 1 (krug)","y = 2x + 1","y = x²","y = |x|"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Osobine funkcija II dio',
    video_url: 'https://www.youtube.com/watch?v=3eVFC_Pl6UU',
    content: `<h1>Osobine funkcija — II dio</h1>

${backRef('Osobine funkcija I dio')}

<p>U prvom dijelu smo naučili osnovne pojmove — domen, kodomen, nultačke. Sada ćemo proučiti ključne osobine koje opisuju ponašanje funkcija: <strong>parnost, monotonost i ograničenost</strong>.</p>

<h2>Parna i neparna funkcija</h2>

<p>Funkcija je <strong>parna</strong> ako važi f(−x) = f(x) za sve x iz domena. Grafik parne funkcije je simetričan u odnosu na y-osu.</p>

${formula('Parna: f(−x) = f(x) &nbsp;&nbsp;→ simetrija oko y-ose')}

<p>Funkcija je <strong>neparna</strong> ako važi f(−x) = −f(x). Grafik neparne funkcije je simetričan u odnosu na koordinatni početak.</p>

${formula('Neparna: f(−x) = −f(x) &nbsp;&nbsp;→ simetrija oko O(0,0)')}

${example('Primjer: Ispitaj parnost', `
<p>a) f(x) = x² → f(−x) = (−x)² = x² = f(x) → <strong>PARNA</strong> ✓</p>
<p>b) f(x) = x³ → f(−x) = (−x)³ = −x³ = −f(x) → <strong>NEPARNA</strong> ✓</p>
<p>c) f(x) = x² + x → f(−x) = x² − x ≠ f(x) i ≠ −f(x) → <strong>Ni parna ni neparna</strong></p>
`)}

<h2>Monotonost</h2>

<p>Funkcija je <strong>rastuća</strong> na intervalu ako za x₁ < x₂ važi f(x₁) < f(x₂). Funkcija je <strong>opadajuća</strong> ako za x₁ < x₂ važi f(x₁) > f(x₂).</p>

${formula('Rastuća: x₁ < x₂ ⟹ f(x₁) < f(x₂)')}
${formula('Opadajuća: x₁ < x₂ ⟹ f(x₁) > f(x₂)')}

${important('Funkcija može biti rastuća na jednom dijelu i opadajuća na drugom! Na primjer, f(x) = x² opada za x < 0 i raste za x > 0.')}

<h2>Ograničenost</h2>

<p>Funkcija je <strong>ograničena odozgo</strong> ako postoji broj M takav da f(x) ≤ M za sve x. Slično, <strong>ograničena odozdo</strong> ako postoji m takvo da f(x) ≥ m.</p>

${example('Primjer', `
<p>f(x) = sin(x) je ograničena: −1 ≤ sin(x) ≤ 1</p>
<p>f(x) = x² je ograničena odozdo (f(x) ≥ 0), ali nije ograničena odozgo</p>
`)}

QUIZ_DATA:[{"question":"Koja funkcija je parna?","options":["f(x) = x²","f(x) = x³","f(x) = x² + x","f(x) = 2x"],"correct":0},{"question":"Funkcija f(x) = x³ je:","options":["Neparna","Parna","Ni parna ni neparna","I parna i neparna"],"correct":0},{"question":"Funkcija f(x) = x² je rastuća na:","options":["(0, +∞)","(−∞, 0)","ℝ","Nigdje"],"correct":0},{"question":"Šta znači da je funkcija ograničena?","options":["Postoje m i M tako da m ≤ f(x) ≤ M","Ima konačan domen","Ima samo jednu nultačku","Nije definisana za sve x"],"correct":0},{"question":"Grafik parne funkcije ima simetriju u odnosu na:","options":["y-osu","x-osu","Koordinatni početak","Pravu y = x"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Stepene funkcije 1. dio',
    video_url: 'https://www.youtube.com/watch?v=dEJwBojMXx8',
    content: `<h1>Stepene funkcije — 1. dio</h1>

${backRef('Stepeni cjelobrojnog izložioca II dio')}

<p>Stepena funkcija je funkcija oblika f(x) = xⁿ, gdje je n realan broj. U ovoj lekciji ćemo razmatrati slučaj kada je <strong>n prirodan broj</strong>. Grafici ovih funkcija imaju karakteristične oblike koji zavise od toga da li je n paran ili neparan.</p>

<h2>Stepena funkcija sa parnim izložiocem</h2>

${formula('f(x) = x<sup>2n</sup>, &nbsp;&nbsp;n ∈ ℕ')}

<p>Za paran izložilac (x², x⁴, x⁶...) grafik ima oblik <strong>parabole</strong> — simetričan je oko y-ose, prolazi kroz tačke (0,0) i (1,1), i uvijek je iznad ili na x-osi.</p>

${important('Sve stepene funkcije sa parnim izložiocem su PARNE funkcije: f(−x) = f(x). One opadaju na (−∞, 0) i rastu na (0, +∞).')}

<h2>Stepena funkcija sa neparnim izložiocem</h2>

${formula('f(x) = x<sup>2n+1</sup>, &nbsp;&nbsp;n ∈ ℕ')}

<p>Za neparan izložilac (x¹, x³, x⁵...) grafik prolazi kroz koordinatni početak i ima centralnu simetriju. Funkcija je rastuća na cijelom ℝ.</p>

${important('Sve stepene funkcije sa neparnim izložiocem su NEPARNE funkcije: f(−x) = −f(x). One su strogo rastuće na cijelom domenu.')}

${example('Poređenje grafika', `
<p>Za x = 2:</p>
<p>• x² = 4, x⁴ = 16, x⁶ = 64 → Za |x| > 1, veći izložilac = veća vrijednost</p>
<p>• Za x = 0.5: x² = 0.25, x⁴ = 0.0625 → Za |x| < 1, veći izložilac = manja vrijednost</p>
`)}

${example('Primjer: Skiciraj grafik f(x) = x⁴', `
<p>Tačke: (−2, 16), (−1, 1), (0, 0), (1, 1), (2, 16)</p>
<p>Osobine: Parna funkcija, D = ℝ, minimum u x = 0</p>
<p>Grafik je sličan paraboli y = x², ali "ravniji" oko nule i strmiji za |x| > 1</p>
`)}

<p>U sljedećem dijelu ćemo proučiti transformacije stepenih funkcija — pomjeranje, istezanje i refleksiju grafika.</p>

QUIZ_DATA:[{"question":"Funkcija f(x) = x⁴ je:","options":["Parna","Neparna","Ni parna ni neparna","Periodična"],"correct":0},{"question":"Grafik funkcije f(x) = x³ prolazi kroz:","options":["Koordinatni početak (0,0)","Tačku (0,1)","Tačku (1,0)","Ne prolazi kroz ose"],"correct":0},{"question":"Za x = 0.5, koja vrijednost je VEĆA?","options":["(0.5)² = 0.25","(0.5)⁴ = 0.0625","(0.5)⁶","Sve su jednake"],"correct":0},{"question":"Funkcija f(x) = x⁵ je:","options":["Rastuća na cijelom ℝ","Opadajuća na cijelom ℝ","Rastuća pa opadajuća","Konstantna"],"correct":0},{"question":"Domen funkcije f(x) = x⁶ je:","options":["ℝ","[0, +∞)","(0, +∞)","ℝ \\\\ {0}"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Stepene funkcije 2. dio',
    video_url: 'https://www.youtube.com/watch?v=ruZqBWnaEBk',
    content: `<h1>Stepene funkcije — 2. dio</h1>

${backRef('Stepene funkcije 1. dio')}

<p>U prethodnoj lekciji smo proučili osnovne stepene funkcije f(x) = xⁿ. Sada ćemo naučiti kako <strong>transformišemo grafike</strong> ovih funkcija — pomjeranje, istezanje i refleksija.</p>

<h2>Vertikalno pomjeranje</h2>
${formula('g(x) = x<sup>n</sup> + c &nbsp;&nbsp;→ pomjeranje gore (c > 0) ili dolje (c < 0)')}

<h2>Horizontalno pomjeranje</h2>
${formula('g(x) = (x − a)<sup>n</sup> &nbsp;&nbsp;→ pomjeranje desno (a > 0) ili lijevo (a < 0)')}

<h2>Vertikalno istezanje/sabijanje</h2>
${formula('g(x) = k · x<sup>n</sup> &nbsp;&nbsp;→ istezanje (|k| > 1) ili sabijanje (|k| < 1)')}

<h2>Refleksija</h2>
${formula('g(x) = −x<sup>n</sup> &nbsp;&nbsp;→ refleksija u odnosu na x-osu')}
${formula('g(x) = (−x)<sup>n</sup> &nbsp;&nbsp;→ refleksija u odnosu na y-osu')}

${important('Horizontalno pomjeranje radi OBRNUTO od očekivanog: (x − 3)² se pomjera DESNO za 3, ne lijevo!')}

${example('Primjer: Skiciraj f(x) = (x − 2)³ + 1', `
<p>Polazimo od grafika y = x³</p>
<p>1. Pomjeramo desno za 2 → y = (x−2)³</p>
<p>2. Pomjeramo gore za 1 → y = (x−2)³ + 1</p>
<p>Tjeme (tačka infleksije) je u (2, 1)</p>
`)}

${example('Primjer: Skiciraj f(x) = −2x⁴', `
<p>Polazimo od y = x⁴</p>
<p>1. Istezanje za faktor 2 → y = 2x⁴</p>
<p>2. Refleksija oko x-ose → y = −2x⁴</p>
<p>Grafik je "naopaka" parabola, strmija od y = x⁴</p>
`)}

<h2>Opšti oblik</h2>
${formula('f(x) = a(x − h)<sup>n</sup> + k')}
<p>Gdje je (h, k) tjeme/centar, a je koeficijent istezanja, n je stepen.</p>

QUIZ_DATA:[{"question":"Grafik y = (x+3)² je pomjeren:","options":["Lijevo za 3","Desno za 3","Gore za 3","Dolje za 3"],"correct":0},{"question":"Grafik y = x² − 5 je pomjeren:","options":["Dolje za 5","Gore za 5","Lijevo za 5","Desno za 5"],"correct":0},{"question":"Grafik y = −x⁴ je reflektovan u odnosu na:","options":["x-osu","y-osu","Koordinatni početak","Pravu y = x"],"correct":0},{"question":"Funkcija f(x) = 3x² u poređenju sa g(x) = x² je:","options":["Uža (strmija)","Šira","Ista","Pomjerena gore"],"correct":0},{"question":"Tjeme funkcije f(x) = (x−1)² + 4 je u tački:","options":["(1, 4)","(−1, 4)","(1, −4)","(4, 1)"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Pojam n-tog korijena',
    video_url: 'https://www.youtube.com/watch?v=B0pDyGGZOlA',
    content: `<h1>Pojam n-tog korijena</h1>

${backRef('Stepeni cjelobrojnog izložioca II dio')}

<p>N-ti korijen broja a je inverzna operacija stepenovanja. Ako je bⁿ = a, onda je b n-ti korijen iz a. Označavamo ga sa ⁿ√a.</p>

${formula('ⁿ√a = b &nbsp;&nbsp;⟺&nbsp;&nbsp; b<sup>n</sup> = a')}

<h2>Kvadratni korijen (n = 2)</h2>
<p>Najčešći korijen je kvadratni korijen, koji označavamo sa √a. On daje pozitivan broj čiji je kvadrat jednak a.</p>

${formula('√a = b &nbsp;&nbsp;⟺&nbsp;&nbsp; b² = a, &nbsp;b ≥ 0')}

${important('Kvadratni korijen je definisan samo za a ≥ 0 (u skupu realnih brojeva). Korijen negativnog broja ne postoji u ℝ!')}

<h2>Kubni korijen (n = 3)</h2>
<p>Kubni korijen ³√a je definisan za SVE realne brojeve, uključujući negativne.</p>

${formula('³√8 = 2 &nbsp;&nbsp;(jer 2³ = 8)')}
${formula('³√(−27) = −3 &nbsp;&nbsp;(jer (−3)³ = −27)')}

<h2>Osobine n-tog korijena</h2>

${formula('ⁿ√(a · b) = ⁿ√a · ⁿ√b')}
${formula('ⁿ√(a / b) = ⁿ√a / ⁿ√b &nbsp;&nbsp;(b ≠ 0)')}
${formula('ⁿ√(a<sup>m</sup>) = (ⁿ√a)<sup>m</sup> = a<sup>m/n</sup>')}

${example('Primjeri', `
<p>a) √50 = √(25·2) = √25 · √2 = 5√2</p>
<p>b) ³√(8/27) = ³√8 / ³√27 = 2/3</p>
<p>c) ⁴√81 = ⁴√(3⁴) = 3</p>
`)}

${hint('Racionalizacija: Za uklanjanje korijena iz imenioca, pomnoži i brojilac i imenilac sa korijenom. Na primjer: 1/√2 = √2/2')}

QUIZ_DATA:[{"question":"Koliko je √144?","options":["12","14","11","13"],"correct":0},{"question":"Koliko je ³√(−8)?","options":["−2","2","Nije definisano","−4"],"correct":0},{"question":"Pojednostavi: √(18)","options":["3√2","2√3","6","√18"],"correct":0},{"question":"Koliko je ⁴√16?","options":["2","4","8","±2"],"correct":0},{"question":"√50 + √2 =","options":["6√2","√52","5√2 + √2 = 6√2","26"],"correct":2},{"question":"Za koji n je ⁿ√(−1) definisan u ℝ?","options":["Neparan n","Paran n","Svaki n","Nijedan n"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Stepeni racionalnog izložioca',
    video_url: 'https://www.youtube.com/watch?v=lZfXc4nHooo',
    content: `<h1>Stepeni racionalnog izložioca</h1>

${backRef('Pojam n-tog korijena')}

<p>Sada ćemo spojiti pojam stepena i korijena u jednu moćnu ideju — <strong>stepen sa racionalnim izložiocem</strong>. Ovo nam omogućava da koristimo razlomke kao izložioce!</p>

<h2>Definicija</h2>

${formula('a<sup>m/n</sup> = ⁿ√(a<sup>m</sup>) = (ⁿ√a)<sup>m</sup> &nbsp;&nbsp;(a > 0)')}

<p>Dakle, izložilac m/n znači: uzmi n-ti korijen iz a stepenovanog na m, ili stepenuj n-ti korijen iz a na m. Rezultat je isti!</p>

${example('Primjer: Izračunaj', `
<p>a) 8<sup>2/3</sup> = ³√(8²) = ³√64 = <strong>4</strong></p>
<p>&nbsp;&nbsp;&nbsp;ili: (³√8)² = 2² = <strong>4</strong> ✓</p>
<p>b) 27<sup>1/3</sup> = ³√27 = <strong>3</strong></p>
<p>c) 16<sup>3/4</sup> = (⁴√16)³ = 2³ = <strong>8</strong></p>
<p>d) 4<sup>−1/2</sup> = 1/4<sup>1/2</sup> = 1/√4 = <strong>1/2</strong></p>
`)}

<h2>Sva pravila za stepene i dalje važe!</h2>

${formula('a<sup>p</sup> · a<sup>q</sup> = a<sup>p+q</sup>')}
${formula('a<sup>p</sup> ÷ a<sup>q</sup> = a<sup>p−q</sup>')}
${formula('(a<sup>p</sup>)<sup>q</sup> = a<sup>p·q</sup>')}

${important('Sva pravila koja smo naučili za cjelobrojne izložioce važe i za racionalne izložioce! Osnova mora biti pozitivna (a > 0).')}

${example('Primjer: Pojednostavi', `
<p>a) 2<sup>1/2</sup> · 2<sup>3/2</sup> = 2<sup>1/2+3/2</sup> = 2<sup>4/2</sup> = 2² = <strong>4</strong></p>
<p>b) (x<sup>1/3</sup>)⁶ = x<sup>6/3</sup> = x² </p>
<p>c) x<sup>2/3</sup> · x<sup>1/3</sup> = x<sup>2/3+1/3</sup> = x¹ = <strong>x</strong></p>
`)}

QUIZ_DATA:[{"question":"Koliko je 8^(1/3)?","options":["2","3","4","8"],"correct":0},{"question":"Koliko je 16^(3/4)?","options":["8","12","4","64"],"correct":0},{"question":"Koliko je 9^(−1/2)?","options":["1/3","−3","3","−1/3"],"correct":0},{"question":"Pojednostavi: x^(1/2) · x^(1/2)","options":["x","x^(1/4)","√x","x²"],"correct":0},{"question":"Koliko je 27^(2/3)?","options":["9","6","18","3"],"correct":0},{"question":"4^(1/2) je isto što i:","options":["√4 = 2","4/2 = 2","2⁴ = 16","4² = 16"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Kompozicija funkcija',
    video_url: 'https://www.youtube.com/watch?v=ZFPkQkURSxk',
    content: `<h1>Kompozicija funkcija</h1>

${backRef('Osobine funkcija II dio')}

<p>Kompozicija funkcija je operacija u kojoj <strong>rezultat jedne funkcije postaje ulaz za drugu</strong>. To je kao lanac — izlaz iz prve funkcije "ulazi" u drugu funkciju.</p>

<h2>Definicija</h2>

${formula('(f ∘ g)(x) = f(g(x))')}

<p>Čita se "f od g od x" ili "f krug g od x". Prvo izračunamo g(x), pa taj rezultat uvrstimo u f.</p>

${important('Kompozicija NIJE komutativna! Generalno f ∘ g ≠ g ∘ f. Redoslijed je bitan!')}

${example('Primjer 1', `
<p>Neka je f(x) = 2x + 1 i g(x) = x²</p>
<p><strong>(f ∘ g)(x)</strong> = f(g(x)) = f(x²) = 2x² + 1</p>
<p><strong>(g ∘ f)(x)</strong> = g(f(x)) = g(2x+1) = (2x+1)² = 4x² + 4x + 1</p>
<p>Vidimo da f ∘ g ≠ g ∘ f !</p>
`)}

${example('Primjer 2: Izračunaj (f ∘ g)(3)', `
<p>f(x) = x + 5, g(x) = 3x</p>
<p>Korak 1: g(3) = 3·3 = 9</p>
<p>Korak 2: f(9) = 9 + 5 = <strong>14</strong></p>
`)}

<h2>Domen kompozicije</h2>

<p>Domen kompozicije f ∘ g je skup svih x iz domena g za koje je g(x) u domenu f.</p>

${formula('D(f ∘ g) = { x ∈ D(g) : g(x) ∈ D(f) }')}

${example('Primjer 3: Domen', `
<p>f(x) = √x, g(x) = x − 3</p>
<p>(f ∘ g)(x) = √(x − 3)</p>
<p>Uslov: x − 3 ≥ 0, dakle x ≥ 3</p>
<p>D(f ∘ g) = [3, +∞)</p>
`)}

${hint('Za kompoziciju: radi IZNUTRA ka SPOLJA. Prvo unutrašnja funkcija, pa vanjska.')}

QUIZ_DATA:[{"question":"Ako f(x)=2x i g(x)=x+3, koliko je (f∘g)(1)?","options":["8","5","6","7"],"correct":0},{"question":"Ako f(x)=x² i g(x)=x+1, šta je (f∘g)(x)?","options":["(x+1)²","x²+1","x² + x + 1","2x+1"],"correct":0},{"question":"Da li je kompozicija komutativna?","options":["Ne, generalno f∘g ≠ g∘f","Da, uvijek f∘g = g∘f","Samo za linearne funkcije","Samo za parne funkcije"],"correct":0},{"question":"Ako f(x)=√x i g(x)=x−5, domen f∘g je:","options":["[5, +∞)","ℝ","(5, +∞)","[0, +∞)"],"correct":0},{"question":"Ako f(x)=3x−1 i g(x)=x/3+1/3, šta je (f∘g)(x)?","options":["x","3x","x−1","3x+1"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Inverzna funkcija',
    video_url: 'https://www.youtube.com/watch?v=TIWbVHmSsNM',
    content: `<h1>Inverzna funkcija</h1>

${backRef('Kompozicija funkcija')}

<p>Inverzna funkcija "poništava" dejstvo originalne funkcije. Ako f pretvara x u y, onda inverzna funkcija f⁻¹ pretvara y nazad u x.</p>

<h2>Definicija</h2>

${formula('f⁻¹(f(x)) = x &nbsp;&nbsp;i&nbsp;&nbsp; f(f⁻¹(x)) = x')}

<p>Kompozicija funkcije i njene inverzne daje identičku funkciju (x). To je ključni test — ako f ∘ f⁻¹ = id i f⁻¹ ∘ f = id, onda je f⁻¹ zaista inverzna od f.</p>

${important('Funkcija ima inverznu SAMO ako je bijektivna (1-1 i "na"). U praksi, provjeravamo da li je funkcija strogo monotona — ako jeste, ima inverznu!')}

<h2>Kako naći inverznu funkciju</h2>

<p>Postupak u 3 koraka:</p>
<ol>
<li>Zapiši y = f(x)</li>
<li>Zamijeni x i y: x = f(y)</li>
<li>Izrazi y iz te jednačine → to je f⁻¹(x)</li>
</ol>

${example('Primjer 1: Nađi inverznu za f(x) = 2x + 3', `
<p>1. y = 2x + 3</p>
<p>2. x = 2y + 3</p>
<p>3. 2y = x − 3 → y = (x − 3)/2</p>
<p><strong>f⁻¹(x) = (x − 3)/2</strong></p>
<p>Provjera: f(f⁻¹(x)) = 2·(x−3)/2 + 3 = x − 3 + 3 = x ✓</p>
`)}

${example('Primjer 2: Nađi inverznu za f(x) = x³', `
<p>1. y = x³</p>
<p>2. x = y³</p>
<p>3. y = ³√x</p>
<p><strong>f⁻¹(x) = ³√x</strong></p>
`)}

<h2>Grafik inverzne funkcije</h2>

<p>Grafik inverzne funkcije je <strong>simetrija grafika originalne funkcije u odnosu na pravu y = x</strong>. Tačka (a, b) na grafiku f odgovara tački (b, a) na grafiku f⁻¹.</p>

${hint('f(x) = x² nema inverznu na cijelom ℝ jer nije 1-1. Ali ako ograničimo domen na [0,+∞), inverzna je f⁻¹(x) = √x.')}

QUIZ_DATA:[{"question":"Inverzna funkcija za f(x) = 3x je:","options":["f⁻¹(x) = x/3","f⁻¹(x) = 3/x","f⁻¹(x) = −3x","f⁻¹(x) = x−3"],"correct":0},{"question":"Grafik inverzne je simetričan u odnosu na:","options":["Pravu y = x","x-osu","y-osu","Koordinatni početak"],"correct":0},{"question":"Inverzna za f(x) = x + 5 je:","options":["f⁻¹(x) = x − 5","f⁻¹(x) = x + 5","f⁻¹(x) = −x − 5","f⁻¹(x) = 5 − x"],"correct":0},{"question":"Funkcija f(x) = x² na ℝ:","options":["Nema inverznu","Ima inverznu √x","Ima inverznu x²","Ima inverznu ±√x"],"correct":0},{"question":"Šta je f(f⁻¹(x))?","options":["x","0","1","f(x)"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Korijena funkcija',
    video_url: 'https://www.youtube.com/watch?v=wTlw7fNcO-0',
    content: `<h1>Korijene funkcije</h1>

${backRef('Inverzna funkcija')}
${backRef('Pojam n-tog korijena')}

<p>Korijene funkcije su funkcije oblika f(x) = ⁿ√x = x^(1/n). One su <strong>inverzne funkcije stepenih funkcija</strong>. Najvažnije su kvadratna korijenska funkcija f(x) = √x i kubna f(x) = ³√x.</p>

<h2>Kvadratna korijenska funkcija</h2>

${formula('f(x) = √x = x<sup>1/2</sup>')}

<p>Osobine:</p>
<ul>
<li>Domen: D = [0, +∞)</li>
<li>Kodomen: [0, +∞)</li>
<li>Strogo rastuća</li>
<li>Grafik počinje u (0, 0) i raste sve sporije</li>
<li>Inverzna od f(x) = x² za x ≥ 0</li>
</ul>

<h2>Kubna korijenska funkcija</h2>

${formula('f(x) = ³√x = x<sup>1/3</sup>')}

<p>Osobine:</p>
<ul>
<li>Domen: D = ℝ (definisana za sve realne brojeve)</li>
<li>Kodomen: ℝ</li>
<li>Strogo rastuća, neparna funkcija</li>
<li>Prolazi kroz (0,0), simetrična u odnosu na koordinatni početak</li>
</ul>

${important('Kvadratna korijenska funkcija raste sporije od linearne! √100 = 10, √10000 = 100. Treba 100× veći argument za 10× veću vrijednost.')}

<h2>Transformacije</h2>

${formula('g(x) = a · √(x − h) + k')}

${example('Primjer: f(x) = √(x − 4) + 2', `
<p>Polazimo od y = √x</p>
<p>1. Pomjeramo desno za 4 → √(x−4)</p>
<p>2. Pomjeramo gore za 2 → √(x−4) + 2</p>
<p>Domen: x ≥ 4, tj. D = [4, +∞)</p>
<p>Početna tačka: (4, 2)</p>
`)}

${example('Primjer: Nađi domen i nultačku f(x) = √(2x − 6)', `
<p>Domen: 2x − 6 ≥ 0 → x ≥ 3 → D = [3, +∞)</p>
<p>Nultačka: √(2x − 6) = 0 → 2x − 6 = 0 → x = 3</p>
`)}

QUIZ_DATA:[{"question":"Domen funkcije f(x) = √(x − 5) je:","options":["[5, +∞)","ℝ","(5, +∞)","[0, 5]"],"correct":0},{"question":"Funkcija f(x) = ³√x je:","options":["Neparna","Parna","Ni parna ni neparna","Periodična"],"correct":0},{"question":"√x je inverzna funkcija od:","options":["x² (za x ≥ 0)","x²","2x","x/2"],"correct":0},{"question":"Koliko je √(49)?","options":["7","±7","49","14"],"correct":0},{"question":"Grafik f(x) = √x + 3 je pomjeren:","options":["Gore za 3","Desno za 3","Lijevo za 3","Dolje za 3"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Kompleksni brojevi',
    video_url: 'https://www.youtube.com/watch?v=SP-YJe7Vldo',
    content: `<h1>Kompleksni brojevi</h1>

<p>Do sada smo radili samo sa realnim brojevima. Ali šta je √(−1)? U skupu realnih brojeva ovaj korijen ne postoji. Zato uvodimo novi skup — <strong>skup kompleksnih brojeva ℂ</strong>.</p>

<h2>Imaginarna jedinica</h2>

${formula('i = √(−1) &nbsp;&nbsp;→&nbsp;&nbsp; i² = −1')}

${important('Imaginarna jedinica i nije "zamišljena" ili "nepostojeća" — ona je jednako realna kao i broj √2. Samo što ne leži na brojevnoj pravoj!')}

<h2>Oblik kompleksnog broja</h2>

${formula('z = a + bi')}

<p>Gdje je:</p>
<ul>
<li><strong>a</strong> = realni dio (Re(z))</li>
<li><strong>b</strong> = imaginarni dio (Im(z))</li>
<li><strong>i</strong> = imaginarna jedinica</li>
</ul>

<h2>Operacije sa kompleksnim brojevima</h2>

<h3>Sabiranje i oduzimanje</h3>
${formula('(a + bi) + (c + di) = (a+c) + (b+d)i')}

<h3>Množenje</h3>
${formula('(a + bi)(c + di) = (ac − bd) + (ad + bc)i')}

${example('Primjer: Izračunaj', `
<p>z₁ = 3 + 2i, z₂ = 1 − 4i</p>
<p><strong>z₁ + z₂</strong> = (3+1) + (2+(−4))i = <strong>4 − 2i</strong></p>
<p><strong>z₁ · z₂</strong> = (3·1 − 2·(−4)) + (3·(−4) + 2·1)i = (3+8) + (−12+2)i = <strong>11 − 10i</strong></p>
`)}

<h2>Konjugovani kompleksni broj</h2>

${formula('z̄ = a − bi &nbsp;&nbsp;(mijenjamo predznak imaginarnog dijela)')}
${formula('z · z̄ = a² + b² &nbsp;&nbsp;(uvijek realan pozitivan broj!)')}

<h2>Stepeni od i</h2>

${formula('i⁰ = 1, &nbsp;i¹ = i, &nbsp;i² = −1, &nbsp;i³ = −i, &nbsp;i⁴ = 1, &nbsp;i⁵ = i, ...')}

${hint('Stepeni od i se ponavljaju sa periodom 4. Za iⁿ, nađi ostatak pri dijeljenju n sa 4.')}

QUIZ_DATA:[{"question":"Koliko je i²?","options":["−1","1","i","−i"],"correct":0},{"question":"Izračunaj: (2 + 3i) + (4 − i)","options":["6 + 2i","6 + 4i","2 + 2i","8 + 3i"],"correct":0},{"question":"Konjugovani broj od 3 − 5i je:","options":["3 + 5i","−3 + 5i","−3 − 5i","5 − 3i"],"correct":0},{"question":"Koliko je i⁴?","options":["1","−1","i","−i"],"correct":0},{"question":"Koliko je (1+i)(1−i)?","options":["2","0","2i","1+i²"],"correct":0},{"question":"Realni dio broja 7 − 3i je:","options":["7","−3","3","7i"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Geometrijska interpretacija kompleksnih brojeva',
    video_url: 'https://www.youtube.com/watch?v=5PcpBw5Hbwo',
    content: `<h1>Geometrijska interpretacija kompleksnih brojeva</h1>

${backRef('Kompleksni brojevi')}

<p>Kompleksne brojeve možemo prikazati kao <strong>tačke u ravni</strong>! Realni dio je na horizontalnoj osi (x-osa), a imaginarni dio na vertikalnoj osi (y-osa). Ova ravan se naziva <strong>Gaussova (kompleksna) ravan</strong>.</p>

<h2>Kompleksna ravan</h2>

${formula('z = a + bi &nbsp;&nbsp;↔&nbsp;&nbsp; tačka (a, b) u ravni')}

<p>Horizontalna osa = <strong>realna osa</strong>, vertikalna = <strong>imaginarna osa</strong></p>

${example('Primjer', `
<p>z₁ = 3 + 2i → tačka (3, 2)</p>
<p>z₂ = −1 + 4i → tačka (−1, 4)</p>
<p>z₃ = 2i → tačka (0, 2) (na imaginarnoj osi)</p>
<p>z₄ = −3 → tačka (−3, 0) (na realnoj osi)</p>
`)}

<h2>Modul (apsolutna vrijednost)</h2>

<p>Modul kompleksnog broja je rastojanje od koordinatnog početka do tačke z u ravni:</p>

${formula('|z| = |a + bi| = √(a² + b²)')}

${example('Primjer: Modul', `
<p>|3 + 4i| = √(3² + 4²) = √(9 + 16) = √25 = <strong>5</strong></p>
<p>|1 − i| = √(1² + (−1)²) = √2 ≈ <strong>1.414</strong></p>
`)}

<h2>Argument</h2>

<p>Argument (ugao) je ugao koji vektor z zaklapa sa pozitivnim dijelom realne ose:</p>

${formula('arg(z) = arctan(b/a) &nbsp;&nbsp;(+ korekcija za kvadrant)')}

<h2>Trigonometrijski oblik</h2>

${formula('z = |z| · (cos φ + i · sin φ) = r · cis(φ)')}

<p>Gdje je r = |z| (modul) i φ = arg(z) (argument).</p>

${important('Trigonometrijski oblik je posebno koristan za množenje i stepenovanje kompleksnih brojeva!')}

${formula('z₁ · z₂ = r₁r₂ · cis(φ₁ + φ₂)')}
${formula('z<sup>n</sup> = r<sup>n</sup> · cis(nφ) &nbsp;&nbsp;(De Moivreova formula)')}

QUIZ_DATA:[{"question":"Modul broja 3 + 4i je:","options":["5","7","25","√7"],"correct":0},{"question":"Kompleksni broj 2i odgovara tački:","options":["(0, 2)","(2, 0)","(2, 2)","(0, −2)"],"correct":0},{"question":"Modul broja −5 je:","options":["5","−5","25","0"],"correct":0},{"question":"Koji je trigonometrijski oblik od 1 + i?","options":["√2 · cis(π/4)","cis(π/4)","2 · cis(π/4)","√2 · cis(π/2)"],"correct":0},{"question":"Rastojanje od 0 do z = 6 + 8i je:","options":["10","14","100","√14"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Stepene funkcije 1',
    video_url: 'https://www.youtube.com/watch?v=UZ0MnVayiXA',
    content: `<h1>Stepene funkcije — napredno (1. dio)</h1>

${backRef('Stepene funkcije 2. dio')}
${backRef('Stepeni racionalnog izložioca')}

<p>U ranijim lekcijama smo upoznali stepene funkcije f(x) = xⁿ za prirodne n. Sada ćemo proširiti pojam na <strong>stepene funkcije sa racionalnim i negativnim izložiocima</strong>, kao i proučiti njihove grafike detaljnije.</p>

<h2>Stepena funkcija sa negativnim izložiocem</h2>

${formula('f(x) = x<sup>−n</sup> = 1/x<sup>n</sup>')}

<p>Najpoznatiji primjer je <strong>hiperbola</strong> f(x) = 1/x = x⁻¹. Njene osobine:</p>
<ul>
<li>Domen: D = ℝ \\ {0}</li>
<li>Neparna funkcija (simetrija oko O)</li>
<li>Ima vertikalnu asimptotu x = 0 i horizontalnu y = 0</li>
<li>Strogo opadajuća na (−∞, 0) i na (0, +∞)</li>
</ul>

<h2>Funkcija f(x) = x⁻²</h2>

${formula('f(x) = 1/x²')}

<p>Ova funkcija je parna, uvijek pozitivna (osim u x = 0 gdje nije definisana), i ima oblik "dvostruke hiperbole".</p>

${important('Za negativne izložioce: funkcija NIKAD ne prolazi kroz x = 0 (dijeljenje nulom!). X-osa i y-osa su asimptote.')}

<h2>Stepena funkcija sa racionalnim izložiocem</h2>

${formula('f(x) = x<sup>p/q</sup> = (ⁿ√x)<sup>p</sup>')}

${example('Primjer: f(x) = x^(2/3)', `
<p>f(x) = (³√x)² — definisana za sve x ∈ ℝ</p>
<p>f(−8) = (³√(−8))² = (−2)² = 4</p>
<p>f(8) = (³√8)² = 2² = 4</p>
<p>Osobina: Parna funkcija! Grafik izgleda kao "zaravnjena" parabola.</p>
`)}

${example('Primjer: Uporedi grafike', `
<p>Za x = 4:</p>
<p>• x^(1/2) = √4 = 2</p>
<p>• x^(1/3) = ³√4 ≈ 1.587</p>
<p>• x^(2/3) = (³√4)² ≈ 2.52</p>
<p>Za x = 1: sve daju 1 (tačka (1,1) je zajednička svim stepenim funkcijama sa poz. izložiocem)</p>
`)}

QUIZ_DATA:[{"question":"Domen funkcije f(x) = 1/x je:","options":["ℝ \\\\ {0}","ℝ","(0, +∞)","[0, +∞)"],"correct":0},{"question":"Funkcija f(x) = x⁻² je:","options":["Parna","Neparna","Ni parna ni neparna","Linearna"],"correct":0},{"question":"Koliko je f(4) za f(x) = x^(1/2)?","options":["2","4","16","1/2"],"correct":0},{"question":"Asimptota funkcije f(x) = 1/x je:","options":["x = 0 i y = 0","x = 1","y = 1","Nema asimptota"],"correct":0},{"question":"f(x) = 1/x je:","options":["Neparna (centralna simetrija)","Parna (osna simetrija)","Periodična","Rastuća"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Stepene funkcije 2',
    video_url: 'https://www.youtube.com/watch?v=dEJwBojMXx8',
    content: `<!-- CURRENT --><h1>Stepene funkcije — napredno (2. dio)</h1>

${backRef('Stepene funkcije 1')}

<p>U ovom dijelu ćemo se fokusirati na <strong>primjenu stepenih funkcija u zadacima</strong> — crtanje grafika sa transformacijama, određivanje osobina, i rješavanje jednačina koje uključuju stepene funkcije.</p>

<h2>Sistematsko ispitivanje stepene funkcije</h2>

<p>Za bilo koju stepenu funkciju treba odrediti:</p>
<ol>
<li>Domen i kodomen</li>
<li>Parnost/neparnost</li>
<li>Nultačke</li>
<li>Monotonost (intervali rasta/padanja)</li>
<li>Ograničenost</li>
<li>Asimptote (ako postoje)</li>
</ol>

${example('Primjer: Ispitaj f(x) = −2x³ + 1', `
<p>1. <strong>Domen:</strong> D = ℝ</p>
<p>2. <strong>Parnost:</strong> f(−x) = −2(−x)³ + 1 = 2x³ + 1 ≠ f(x) i ≠ −f(x) → ni parna ni neparna</p>
<p>3. <strong>Nultačka:</strong> −2x³ + 1 = 0 → x³ = 1/2 → x = ³√(1/2) ≈ 0.794</p>
<p>4. <strong>Monotonost:</strong> Strogo opadajuća na cijelom ℝ (jer je koeficijent −2 negativan)</p>
<p>5. <strong>Ograničenost:</strong> Nije ograničena</p>
<p>6. <strong>Asimptote:</strong> Nema</p>
`)}

<h2>Rješavanje jednačina sa stepenima</h2>

${formula('x<sup>n</sup> = a')}

<p>Rješenje zavisi od parnosti n:</p>
<ul>
<li>n paran, a > 0: x = ±ⁿ√a (dva rješenja)</li>
<li>n paran, a = 0: x = 0 (jedno rješenje)</li>
<li>n paran, a < 0: nema rješenja u ℝ</li>
<li>n neparan: x = ⁿ√a (uvijek jedno rješenje)</li>
</ul>

${example('Primjer: Riješi jednačine', `
<p>a) x⁴ = 16 → x = ±⁴√16 = ±2 → <strong>x₁ = −2, x₂ = 2</strong></p>
<p>b) x³ = −27 → x = ³√(−27) = <strong>−3</strong></p>
<p>c) x⁶ = −1 → <strong>Nema rješenja</strong> (paran stepen ne može biti negativan)</p>
`)}

${important('Ovo je lekcija na kojoj se trenutno nalaziš! Provjeri da si savladao/la sve prethodne teme prije nego nastaviš dalje.')}

${hint('Za pripremu za sljedeću lekciju (Kvadratna jednačina), ponovi formulu za razliku kvadrata: a² − b² = (a−b)(a+b)')}

QUIZ_DATA:[{"question":"Koliko rješenja ima x⁴ = 81?","options":["2 (±3)","1 (3)","4","0"],"correct":0},{"question":"Riješi: x³ = −64","options":["x = −4","x = 4","Nema rješenja","x = ±4"],"correct":0},{"question":"Funkcija f(x) = −x⁴ je:","options":["Parna","Neparna","Ni parna ni neparna","Rastuća"],"correct":0},{"question":"Nultačka f(x) = x³ − 8 je:","options":["x = 2","x = 8","x = −2","x = 4"],"correct":0},{"question":"Jednačina x² = −4 u ℝ ima:","options":["0 rješenja","2 rješenja","1 rješenje","4 rješenja"],"correct":0},{"question":"Grafik f(x) = x⁴ − 1 presijeca y-osu u:","options":["(0, −1)","(0, 1)","(1, 0)","(−1, 0)"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Kvadratna jednačina',
    video_url: 'https://www.youtube.com/watch?v=eF6zYNzlZKQ',
    content: `<h1>Kvadratna jednačina</h1>

<p>Kvadratna jednačina je jednačina oblika ax² + bx + c = 0, gdje je a ≠ 0. Ovo je jedna od najvažnijih jednačina u matematici — srećemo je svuda, od fizike do ekonomije!</p>

<h2>Opšti oblik</h2>

${formula('ax² + bx + c = 0, &nbsp;&nbsp;a ≠ 0')}

<h2>Rješavanje pomoću formule (diskriminanta)</h2>

<p>Koraci za rješavanje:</p>
<ol>
<li>Identificiraj koeficijente a, b, c</li>
<li>Izračunaj diskriminantu D = b² − 4ac</li>
<li>Primijeni formulu za rješenja</li>
</ol>

${formula('D = b² − 4ac')}
${formula('x₁,₂ = (−b ± √D) / (2a)')}

${example('Primjer 1: Riješi x² − 5x + 6 = 0', `
<p>a = 1, b = −5, c = 6</p>
<p>D = (−5)² − 4·1·6 = 25 − 24 = <strong>1</strong></p>
<p>x₁ = (5 + 1)/2 = <strong>3</strong></p>
<p>x₂ = (5 − 1)/2 = <strong>2</strong></p>
<p>Provjera: 3² − 5·3 + 6 = 9 − 15 + 6 = 0 ✓</p>
`)}

${example('Primjer 2: Riješi 2x² + 3x − 2 = 0', `
<p>a = 2, b = 3, c = −2</p>
<p>D = 9 − 4·2·(−2) = 9 + 16 = <strong>25</strong></p>
<p>x₁ = (−3 + 5)/4 = <strong>1/2</strong></p>
<p>x₂ = (−3 − 5)/4 = <strong>−2</strong></p>
`)}

${important('Diskriminanta D određuje BROJ rješenja: D > 0 → dva realna rješenja, D = 0 → jedno (dvostruko) rješenje, D < 0 → nema realnih rješenja (ali postoje kompleksna!).')}

${hint('Brži način: Ako je jednačina oblika x² + bx + c = 0 (a=1), traži dva broja čiji je zbir −b i proizvod c.')}

QUIZ_DATA:[{"question":"Diskriminanta jednačine x² − 4x + 4 = 0 je:","options":["D = 0","D = 4","D = 16","D = −4"],"correct":0},{"question":"Koliko realnih rješenja ima x² + 1 = 0?","options":["0","1","2","∞"],"correct":0},{"question":"Rješenja x² − 9 = 0 su:","options":["x = ±3","x = 3","x = 9","x = ±9"],"correct":0},{"question":"Ako D > 0, jednačina ima:","options":["Dva različita realna rješenja","Jedno rješenje","Nema rješenja","Beskonačno rješenja"],"correct":0},{"question":"Formula za rješenja je x = :","options":["(−b ± √D) / 2a","(b ± √D) / 2a","(−b ± D) / 2a","b² − 4ac"],"correct":0},{"question":"Riješi: x² − 1 = 0","options":["x = ±1","x = 1","x = 0","x = −1"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Priroda rješenja kvadratne jednačine',
    video_url: 'https://www.youtube.com/watch?v=ZIznMI9R9TA',
    content: `<h1>Priroda rješenja kvadratne jednačine</h1>

${backRef('Kvadratna jednačina')}

<p>U prethodnoj lekciji naučili smo kako rješavati kvadratnu jednačinu. Sada ćemo detaljnije proučiti <strong>diskriminantu</strong> i kako ona određuje prirodu (vrstu) rješenja.</p>

<h2>Diskriminanta i broj rješenja</h2>

${formula('D = b² − 4ac')}

<h3>Slučaj 1: D > 0 — dva različita realna rješenja</h3>
<p>Grafik parabole presijeca x-osu u dvije tačke.</p>

<h3>Slučaj 2: D = 0 — jedno dvostruko rješenje</h3>
<p>Grafik parabole dodiruje x-osu u jednoj tački (tjeme na x-osi).</p>
${formula('x₁ = x₂ = −b / (2a)')}

<h3>Slučaj 3: D < 0 — nema realnih rješenja</h3>
<p>Grafik parabole ne presijeca x-osu. Ali postoje dva <strong>konjugovana kompleksna rješenja</strong>!</p>
${formula('x₁,₂ = (−b ± i·√|D|) / (2a)')}

${example('Primjer za svaki slučaj', `
<p><strong>D > 0:</strong> x² − 5x + 4 = 0 → D = 25−16 = 9 → x₁ = 4, x₂ = 1</p>
<p><strong>D = 0:</strong> x² − 6x + 9 = 0 → D = 36−36 = 0 → x = 3 (dvostruko)</p>
<p><strong>D < 0:</strong> x² + 2x + 5 = 0 → D = 4−20 = −16 → x₁,₂ = −1 ± 2i</p>
`)}

${important('Ako su koeficijenti a, b, c racionalni i D je potpun kvadrat, onda su rješenja racionalna. Ako D > 0 ali nije potpun kvadrat, rješenja su iracionalna.')}

<h2>Odnos koeficijenata i rješenja</h2>

<p>Bez rješavanja jednačine, samo pomoću diskriminante i znaka koeficijenata možemo zaključiti mnogo o rješenjima:</p>

${example('Primjer: Bez rješavanja, odredi prirodu rješenja', `
<p>3x² − 2x + 5 = 0</p>
<p>D = 4 − 60 = −56 < 0</p>
<p>Zaključak: <strong>Dva konjugovana kompleksna rješenja</strong></p>
`)}

QUIZ_DATA:[{"question":"Ako D = 0, jednačina ima:","options":["Jedno dvostruko realno rješenje","Dva različita rješenja","Nema rješenja","Dva kompleksna rješenja"],"correct":0},{"question":"Jednačina x² + 4 = 0 ima:","options":["Dva kompleksna rješenja","Jedno rješenje","Dva realna rješenja","Nema rješenja uopšte"],"correct":0},{"question":"D = b² − 4ac za x² − 2x + 1 = 0 je:","options":["0","4","−4","2"],"correct":0},{"question":"Ako D = 49, rješenja su:","options":["Racionalna","Iracionalna","Kompleksna","Ne postoje"],"correct":0},{"question":"Kompleksna rješenja dolaze u parovima koji su:","options":["Konjugovani","Jednaki","Recipročni","Suprotni"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Vietove formule',
    video_url: 'https://www.youtube.com/watch?v=Pk4N5P6nfhY',
    content: `<h1>Vietove formule</h1>

${backRef('Kvadratna jednačina')}
${backRef('Priroda rješenja kvadratne jednačine')}

<p>Vietove formule (François Viète, 16. vijek) daju vezu između <strong>rješenja i koeficijenata</strong> kvadratne jednačine, bez potrebe da zapravo izračunamo rješenja!</p>

<h2>Formule</h2>

<p>Za jednačinu ax² + bx + c = 0 sa rješenjima x₁ i x₂:</p>

${formula('x₁ + x₂ = −b/a &nbsp;&nbsp;(zbir rješenja)')}
${formula('x₁ · x₂ = c/a &nbsp;&nbsp;(proizvod rješenja)')}

${important('Vietove formule važe i kada su rješenja kompleksna! Zbir i proizvod su uvijek realni (ako su a, b, c realni).')}

${example('Primjer 1: Provjeri Vietove formule', `
<p>x² − 5x + 6 = 0 ima rješenja x₁ = 2, x₂ = 3</p>
<p>Zbir: 2 + 3 = 5 = −(−5)/1 ✓</p>
<p>Proizvod: 2 · 3 = 6 = 6/1 ✓</p>
`)}

<h2>Primjena Vietovih formula</h2>

<h3>1. Konstruisanje jednačine iz rješenja</h3>
<p>Ako znamo rješenja x₁ i x₂, jednačina je:</p>
${formula('x² − (x₁ + x₂)x + x₁ · x₂ = 0')}

${example('Primjer 2: Napiši jednačinu sa rješenjima 4 i −3', `
<p>Zbir: 4 + (−3) = 1</p>
<p>Proizvod: 4 · (−3) = −12</p>
<p>Jednačina: <strong>x² − x − 12 = 0</strong></p>
`)}

<h3>2. Nalaženje izraza koji uključuju rješenja</h3>

${example('Primjer 3', `
<p>Neka x₁ + x₂ = 7 i x₁·x₂ = 10</p>
<p>Nađi x₁² + x₂² = (x₁+x₂)² − 2x₁x₂ = 49 − 20 = <strong>29</strong></p>
<p>Nađi 1/x₁ + 1/x₂ = (x₁+x₂)/(x₁·x₂) = 7/10 = <strong>0.7</strong></p>
`)}

${hint('Vietove formule su super prečica na testovima! Umjesto da rješavaš, možeš direktno provjeriti odgovor.')}

QUIZ_DATA:[{"question":"Za x²−7x+12=0, zbir rješenja je:","options":["7","−7","12","−12"],"correct":0},{"question":"Za x²−7x+12=0, proizvod rješenja je:","options":["12","−12","7","−7"],"correct":0},{"question":"Napiši jednačinu sa rješenjima 5 i −2:","options":["x²−3x−10=0","x²+3x−10=0","x²−3x+10=0","x²+7x+10=0"],"correct":0},{"question":"Ako x₁+x₂=4 i x₁·x₂=3, koliko je x₁²+x₂²?","options":["10","16","7","13"],"correct":0},{"question":"Vietove formule za ax²+bx+c=0: x₁·x₂ =","options":["c/a","−c/a","b/a","−b/a"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Jednačine koje se svode na kvadratne jednačine',
    video_url: 'https://www.youtube.com/watch?v=3qF6y55v7vE',
    content: `<h1>Jednačine koje se svode na kvadratne</h1>

${backRef('Kvadratna jednačina')}

<p>Mnoge jednačine koje na prvi pogled nisu kvadratne mogu se <strong>supstitucijom (zamjenom)</strong> pretvoriti u kvadratne. Ovo je moćna tehnika za rješavanje složenijih jednačina!</p>

<h2>Bikvadratna jednačina</h2>

${formula('ax⁴ + bx² + c = 0')}

<p>Zamjenom t = x² dobijamo kvadratnu jednačinu po t:</p>
${formula('at² + bt + c = 0')}

${example('Primjer 1: Riješi x⁴ − 5x² + 4 = 0', `
<p>Zamjena: t = x²</p>
<p>t² − 5t + 4 = 0</p>
<p>t₁ = 4, t₂ = 1</p>
<p>Povrat: x² = 4 → x = ±2; x² = 1 → x = ±1</p>
<p>Rješenja: <strong>x ∈ {−2, −1, 1, 2}</strong></p>
`)}

${important('Poslije supstitucije, ne zaboravi se VRATITI na originalu promjenljivu! Rješenja za t treba konvertovati u rješenja za x.')}

<h2>Jednačine sa razlomcima</h2>

${example('Primjer 2: Riješi x + 3/x = 4', `
<p>Množimo sa x (x ≠ 0):</p>
<p>x² + 3 = 4x</p>
<p>x² − 4x + 3 = 0</p>
<p>D = 16 − 12 = 4</p>
<p>x₁ = 3, x₂ = 1</p>
<p>Provjera: 3 + 3/3 = 4 ✓; 1 + 3/1 = 4 ✓</p>
`)}

<h2>Jednačine sa korijenima</h2>

${example('Primjer 3: Riješi √x + x = 6', `
<p>Zamjena: t = √x (t ≥ 0), pa x = t²</p>
<p>t + t² = 6</p>
<p>t² + t − 6 = 0</p>
<p>t₁ = 2, t₂ = −3 (odbacujemo jer t ≥ 0)</p>
<p>x = t² = 2² = <strong>4</strong></p>
<p>Provjera: √4 + 4 = 2 + 4 = 6 ✓</p>
`)}

${hint('Uvijek provjeri rješenja u ORIGINALNOJ jednačini — supstitucija ponekad uvodi lažna rješenja!')}

QUIZ_DATA:[{"question":"Bikvadratna jednačina x⁴−10x²+9=0 ima koliko rješenja?","options":["4","2","1","0"],"correct":0},{"question":"Zamjena za x⁴+3x²−4=0 je:","options":["t = x²","t = x⁴","t = x","t = √x"],"correct":0},{"question":"Riješi: x⁴ = 16","options":["x = ±2","x = 2","x = 4","x = ±4"],"correct":0},{"question":"Kod jednačina sa korijenima, obavezno:","options":["Provjeri rješenja","Dodaj ±","Pomnoži sa −1","Zanemari negativna"],"correct":0},{"question":"t = √x, x = 9. Koliko je t?","options":["3","9","81","±3"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Sistemi kvadratnih jednačina',
    video_url: 'https://www.youtube.com/watch?v=HnoQyDcNmNU',
    content: `<h1>Sistemi kvadratnih jednačina</h1>

${backRef('Kvadratna jednačina')}
${backRef('Vietove formule')}

<p>Sistem kvadratnih jednačina sadrži barem jednu jednačinu drugog stepena. Najčešće metode rješavanja su <strong>supstitucija</strong> i <strong>metoda jednačenja</strong>.</p>

<h2>Metoda supstitucije</h2>

<p>Iz jedne jednačine izrazimo jednu nepoznatu i uvrstimo u drugu.</p>

${example('Primjer 1', `
<p>y = x + 1</p>
<p>x² + y² = 5</p>
<p>Uvrsti y = x+1 u drugu:</p>
<p>x² + (x+1)² = 5</p>
<p>x² + x² + 2x + 1 = 5</p>
<p>2x² + 2x − 4 = 0</p>
<p>x² + x − 2 = 0</p>
<p>(x+2)(x−1) = 0</p>
<p>x₁ = −2 → y₁ = −1; x₂ = 1 → y₂ = 2</p>
<p>Rješenja: <strong>(−2, −1) i (1, 2)</strong></p>
`)}

<h2>Simetrični sistemi</h2>

<p>Kada su jednačine simetrične po x i y, koristimo <strong>Vietove formule</strong>: uvodimo s = x+y i p = x·y.</p>

${formula('s = x + y, &nbsp;&nbsp;p = x · y')}

${example('Primjer 2: Simetrični sistem', `
<p>x + y = 5</p>
<p>x · y = 6</p>
<p>Po Vietu, x i y su rješenja t² − 5t + 6 = 0</p>
<p>t₁ = 2, t₂ = 3</p>
<p>Rješenja: <strong>(2,3) i (3,2)</strong></p>
`)}

${example('Primjer 3', `
<p>x + y = 7</p>
<p>x² + y² = 25</p>
<p>Znamo: x² + y² = (x+y)² − 2xy</p>
<p>25 = 49 − 2xy → xy = 12</p>
<p>Sad rješavamo: t² − 7t + 12 = 0 → t₁ = 3, t₂ = 4</p>
<p>Rješenja: <strong>(3,4) i (4,3)</strong></p>
`)}

${important('Geometrijski, sistem linearne i kvadratne jednačine predstavlja presek prave i parabole (ili kružnice). Može imati 0, 1, ili 2 rješenja.')}

QUIZ_DATA:[{"question":"Sistem y=x, x²+y²=8 ima rješenja:","options":["(2,2) i (−2,−2)","(2,2)","(4,4)","Nema rješenja"],"correct":0},{"question":"Ako x+y=6 i xy=8, rješenja su:","options":["(2,4) i (4,2)","(3,3)","(1,8) i (8,1)","(6,8)"],"correct":0},{"question":"Koliko rješenja može imati sistem prave i parabole?","options":["0, 1 ili 2","Uvijek 2","Uvijek 1","Beskonačno"],"correct":0},{"question":"Za simetrične sisteme koristimo:","options":["Vietove formule","Crammerovo pravilo","Matrični metod","Grafički metod"],"correct":0},{"question":"x²+y²=(x+y)²−...","options":["2xy","xy","x²y²","(xy)²"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Logaritamska funkcija',
    video_url: 'https://www.youtube.com/watch?v=0G_wE5MyJL4',
    content: `<h1>Logaritamska funkcija</h1>

${backRef('Eksponencijalna funkcija')}
${backRef('Inverzna funkcija')}

<p>Logaritamska funkcija je <strong>inverzna funkcija eksponencijalne funkcije</strong>. Ona odgovara na pitanje: "Na koji stepen treba podići osnovu a da bismo dobili x?"</p>

<h2>Definicija logaritma</h2>

${formula('log<sub>a</sub>(x) = y &nbsp;&nbsp;⟺&nbsp;&nbsp; a<sup>y</sup> = x')}

<p>Čita se: "logaritam od x po osnovi a je y"</p>

${important('Uslovi: a > 0, a ≠ 1 (osnova), x > 0 (argument logaritma mora biti pozitivan!)')}

<h2>Osobine logaritamske funkcije</h2>

<ul>
<li><strong>Domen:</strong> D = (0, +∞)</li>
<li><strong>Kodomen:</strong> ℝ</li>
<li><strong>Prolazi kroz (1, 0)</strong> jer log<sub>a</sub>(1) = 0</li>
<li><strong>Ima jednu nultačku</strong> x = 1</li>
<li>y-osa (x = 0) je <strong>vertikalna asimptota</strong></li>
</ul>

<h2>Pravila za logaritme</h2>

${formula('log<sub>a</sub>(xy) = log<sub>a</sub>(x) + log<sub>a</sub>(y)')}
${formula('log<sub>a</sub>(x/y) = log<sub>a</sub>(x) − log<sub>a</sub>(y)')}
${formula('log<sub>a</sub>(x<sup>n</sup>) = n · log<sub>a</sub>(x)')}
${formula('log<sub>a</sub>(a) = 1, &nbsp;&nbsp;log<sub>a</sub>(1) = 0')}

${example('Primjer 1: Izračunaj', `
<p>a) log₂(8) = ? → 2ʸ = 8 → y = <strong>3</strong></p>
<p>b) log₃(1/9) = ? → 3ʸ = 1/9 = 3⁻² → y = <strong>−2</strong></p>
<p>c) log₅(25) = log₅(5²) = 2·log₅(5) = 2·1 = <strong>2</strong></p>
`)}

${example('Primjer 2: Pojednostavi log₂(16) − log₂(2)', `
<p>= log₂(16/2) = log₂(8) = log₂(2³) = 3</p>
`)}

<h2>Specijalni logaritmi</h2>

${formula('lg(x) = log₁₀(x) &nbsp;&nbsp;(dekadski logaritam)')}
${formula('ln(x) = log<sub>e</sub>(x) &nbsp;&nbsp;(prirodni logaritam, e ≈ 2.718)')}

QUIZ_DATA:[{"question":"log₂(32) = ?","options":["5","2","32","10"],"correct":0},{"question":"log₃(1) = ?","options":["0","1","3","Nije definisan"],"correct":0},{"question":"Domen logaritamske funkcije je:","options":["(0, +∞)","ℝ","[0, +∞)","(1, +∞)"],"correct":0},{"question":"log(x·y) = ?","options":["log(x) + log(y)","log(x) · log(y)","x·log(y)","log(x) − log(y)"],"correct":0},{"question":"Vertikalna asimptota log₂(x) je:","options":["x = 0","y = 0","x = 1","y = 1"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Logaritamske jednačine',
    video_url: 'https://www.youtube.com/watch?v=OLnfVyfXJL4',
    content: `<h1>Logaritamske jednačine</h1>

${backRef('Logaritamska funkcija')}

<p>Logaritamska jednačina je jednačina u kojoj se nepoznata nalazi u <strong>argumentu logaritma</strong>. Ključ rješavanja: koristiti pravila logaritama i svojstvo injektivnosti.</p>

<h2>Osnovno pravilo</h2>

${formula('log<sub>a</sub>(f(x)) = log<sub>a</sub>(g(x)) &nbsp;&nbsp;⟹&nbsp;&nbsp; f(x) = g(x)')}

${important('PAŽNJA na domen! Uvijek: f(x) > 0 i g(x) > 0. Svako rješenje mora zadovoljiti ove uslove.')}

${example('Primjer 1: Riješi log₃(x) = 2', `
<p>Po definiciji: 3² = x</p>
<p>x = <strong>9</strong></p>
<p>Provjera: log₃(9) = log₃(3²) = 2 ✓</p>
`)}

${example('Primjer 2: Riješi log₂(x+3) = 3', `
<p>2³ = x + 3</p>
<p>8 = x + 3</p>
<p>x = <strong>5</strong></p>
<p>Provjera domena: x+3 = 8 > 0 ✓</p>
`)}

<h2>Jednačine sa više logaritama</h2>

${example('Primjer 3: log₂(x) + log₂(x−2) = 3', `
<p>Uslov domena: x > 0 i x−2 > 0 → x > 2</p>
<p>log₂(x·(x−2)) = 3</p>
<p>x(x−2) = 2³ = 8</p>
<p>x² − 2x − 8 = 0</p>
<p>(x−4)(x+2) = 0</p>
<p>x = 4 ili x = −2</p>
<p>Ali x > 2, pa samo <strong>x = 4</strong></p>
`)}

<h2>Promjena baze</h2>

${formula('log<sub>a</sub>(x) = log<sub>b</sub>(x) / log<sub>b</sub>(a)')}

${example('Primjer 4: log₄(x) = 1/2', `
<p>4^(1/2) = x</p>
<p>√4 = x</p>
<p>x = <strong>2</strong></p>
`)}

${hint('Kada su osnove različite, pretvori sve na istu osnovu ili koristi formulu za promjenu baze.')}

QUIZ_DATA:[{"question":"Riješi: log₂(x) = 4","options":["x = 16","x = 8","x = 4","x = 2"],"correct":0},{"question":"log₃(x−1) = 2 → x = ?","options":["10","9","8","3"],"correct":0},{"question":"Uslov za log(x) je:","options":["x > 0","x ≥ 0","x ≠ 0","x ∈ ℝ"],"correct":0},{"question":"log₂(8) + log₂(2) = ?","options":["4","3","5","6"],"correct":0},{"question":"Ako log₅(x) = 0, onda x = ?","options":["1","0","5","−1"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Logaritamske jednačine – utvrđivanje',
    video_url: 'https://www.youtube.com/watch?v=LL9-YBJ9UYs',
    content: `<h1>Logaritamske jednačine — utvrđivanje i napredne tehnike</h1>

${backRef('Logaritamske jednačine')}
${backRef('Eksponencijalne jednačine')}

<p>U ovoj završnoj lekciji ćemo <strong>spojiti sve naučeno</strong> o logaritmima i eksponentima. Riješićemo složenije jednačine koje kombinuju eksponencijalne i logaritamske funkcije.</p>

<h2>Veza eksponenta i logaritma</h2>

${formula('a<sup>log<sub>a</sub>(x)</sup> = x &nbsp;&nbsp;(osnovna veza)')}
${formula('log<sub>a</sub>(a<sup>x</sup>) = x')}

${example('Primjer 1: Riješi 2^(log₂(x²−1)) = 8', `
<p>Lijeva strana: 2^(log₂(x²−1)) = x² − 1</p>
<p>x² − 1 = 8</p>
<p>x² = 9</p>
<p>x = ±3</p>
<p>Provjera domena: x²−1 > 0 → |x| > 1</p>
<p>Oba rješenja zadovoljavaju: <strong>x = −3 ili x = 3</strong></p>
`)}

<h2>Eksponencijalne jednačine sa logaritmima</h2>

${example('Primjer 2: Riješi 3ˣ = 7', `
<p>Logaritmujemo obje strane (npr. sa log₁₀):</p>
<p>log(3ˣ) = log(7)</p>
<p>x·log(3) = log(7)</p>
<p>x = log(7)/log(3) = <strong>≈1.77</strong></p>
`)}

<h2>Sistemi sa logaritmima</h2>

${example('Primjer 3: Sistem', `
<p>log₂(x) + log₂(y) = 3</p>
<p>x − y = 4</p>
<p>Prva: log₂(xy) = 3 → xy = 8</p>
<p>Iz druge: x = y + 4</p>
<p>Uvrsti: (y+4)·y = 8</p>
<p>y² + 4y − 8 = 0</p>
<p>y = −2 ± 2√3</p>
<p>Samo y = −2 + 2√3 > 0 valja</p>
<p>x = 2 + 2√3</p>
`)}

<h2>Nejednačine sa logaritmima</h2>

${important('Za a > 1: log<sub>a</sub>(x) > log<sub>a</sub>(y) ⟹ x > y (isti smjer). Za 0 < a < 1: log<sub>a</sub>(x) > log<sub>a</sub>(y) ⟹ x < y (obrnut smjer)!')}

${example('Primjer 4: Riješi log₂(x−1) > 2', `
<p>log₂(x−1) > log₂(2²) = log₂(4)</p>
<p>Osnova 2 > 1, pa:</p>
<p>x − 1 > 4</p>
<p>x > 5</p>
<p>Uslov: x − 1 > 0 → x > 1 ✓</p>
<p>Rješenje: <strong>x ∈ (5, +∞)</strong></p>
`)}

${hint('Završna poruka: Stepeni, korijeni, eksponenti i logaritmi su osnova za diferencijalnu i integralnu analizu. Sve što si naučio/la ovdje koristićeš u višoj matematici!')}

QUIZ_DATA:[{"question":"2^(log₂(5)) = ?","options":["5","2","10","25"],"correct":0},{"question":"Riješi: 5ˣ = 3 (koristi logaritme)","options":["x = log(3)/log(5)","x = 3/5","x = log(5)/log(3)","x = 5/3"],"correct":0},{"question":"log₃(x) < 2 znači:","options":["0 < x < 9","x < 9","x > 9","1 < x < 9"],"correct":0},{"question":"log₀.₅(x) > log₀.₅(3) znači:","options":["x < 3 (za x > 0)","x > 3","x = 3","x < 0"],"correct":0},{"question":"Sistem log(x)+log(y)=2, x+y=11 ima xy=?","options":["100","10","110","11"],"correct":0},{"question":"Čestitamo! Završio/la si svih 30 lekcija! Šta dalje?","options":["Vježbaj zadatke i pripremi se za test!","Ponovi sve od početka","Preskoči matematiku","Odustani"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Grafik funkcije kvadratne funkcije (y=ax²+bx+c)',
    video_url: 'https://www.youtube.com/watch?v=IH7Ywp0m3Qg',
    content: `<h1>Grafik kvadratne funkcije y = ax² + bx + c</h1>

${backRef('Kvadratna jednačina')}

<p>Grafik kvadratne funkcije je <strong>parabola</strong>. Razumijevanje parabole je ključno za cijelu matematiku i fiziku — od putanje lopte do oblika satelitskih antena!</p>

<h2>Opšti oblik i tjeme</h2>

${formula('y = ax² + bx + c')}
${formula('Tjeme: T = (−b/(2a), −D/(4a)) &nbsp;&nbsp;gdje D = b²−4ac')}

<p>Tjeme je najniža tačka (ako a > 0) ili najviša tačka (ako a < 0) parabole.</p>

<h2>Smjer otvaranja</h2>

${important('a > 0 → parabola se otvara NAVIŠE (∪ oblik) → ima MINIMUM. a < 0 → parabola se otvara NANIŽE (∩ oblik) → ima MAKSIMUM.')}

<h2>Kanonski oblik</h2>

${formula('y = a(x − p)² + q &nbsp;&nbsp;gdje T(p, q) je tjeme')}

${example('Primjer: Pretvori u kanonski oblik y = 2x² − 8x + 5', `
<p>p = −b/(2a) = 8/4 = 2</p>
<p>q = f(2) = 2·4 − 16 + 5 = −3</p>
<p>Kanonski: <strong>y = 2(x − 2)² − 3</strong></p>
<p>Tjeme: T(2, −3)</p>
`)}

<h2>Osa simetrije</h2>

${formula('x = −b/(2a) &nbsp;&nbsp;(vertikalna prava kroz tjeme)')}

<h2>Presječne tačke sa osama</h2>

<p>Sa y-osom: x = 0 → y = c (uvijek postoji)</p>
<p>Sa x-osom: y = 0 → ax² + bx + c = 0 (zavisi od D)</p>

${example('Primjer: Skiciraj y = x² − 4x + 3', `
<p>a = 1 > 0 → otvara se naviše</p>
<p>Tjeme: p = 2, q = 4 − 8 + 3 = −1 → T(2, −1)</p>
<p>Nultačke: x² − 4x + 3 = 0 → x₁ = 1, x₂ = 3</p>
<p>y-presjek: c = 3 → tačka (0, 3)</p>
<p>Osa simetrije: x = 2</p>
`)}

QUIZ_DATA:[{"question":"Tjeme parabole y = x² − 6x + 5 je:","options":["(3, −4)","(−3, 4)","(3, 5)","(6, 5)"],"correct":0},{"question":"Parabola y = −x² se otvara:","options":["Naniže","Naviše","Desno","Lijevo"],"correct":0},{"question":"Osa simetrije y = 2x² − 4x + 1 je:","options":["x = 1","x = 2","x = −1","x = 4"],"correct":0},{"question":"Presječna tačka sa y-osom za y = 3x²+2x−7 je:","options":["(0, −7)","(0, 7)","(−7, 0)","(0, 3)"],"correct":0},{"question":"Ako a > 0, parabola ima:","options":["Minimum","Maksimum","Ni min ni max","I min i max"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Svojstva, osobine kvadratne funkcije',
    video_url: 'https://www.youtube.com/watch?v=Hq2Up_1dTk0',
    content: `<h1>Svojstva i osobine kvadratne funkcije</h1>

${backRef('Grafik funkcije kvadratne funkcije (y=ax²+bx+c)')}

<p>Sada ćemo sistematski proučiti sve osobine kvadratne funkcije — domen, kodomen, monotonost, ograničenost, i ostalo. Ovo je obrazac koji ćemo koristiti za ispitivanje SVAKE funkcije!</p>

<h2>Domen i kodomen</h2>

${formula('Domen: D = ℝ &nbsp;&nbsp;(uvijek)')}
${formula('Kodomen: ako a > 0 → [q, +∞); &nbsp;ako a < 0 → (−∞, q]')}

<p>Gdje je q = −D/(4a), y-koordinata tjemena.</p>

<h2>Monotonost</h2>

<p>Za a > 0:</p>
<ul>
<li>Opadajuća na (−∞, p)</li>
<li>Rastuća na (p, +∞)</li>
</ul>

<p>Za a < 0:</p>
<ul>
<li>Rastuća na (−∞, p)</li>
<li>Opadajuća na (p, +∞)</li>
</ul>

${important('Tačka promjene monotonosti je uvijek TJEME parabole x = p = −b/(2a)!')}

<h2>Ekstremna vrijednost</h2>

${formula('Minimum (a > 0): f<sub>min</sub> = q = −D/(4a)')}
${formula('Maksimum (a < 0): f<sub>max</sub> = q = −D/(4a)')}

${example('Primjer: Ispitaj f(x) = −x² + 4x − 1', `
<p><strong>Domen:</strong> ℝ</p>
<p><strong>a = −1 < 0</strong> → otvara se naniže → ima MAKSIMUM</p>
<p><strong>Tjeme:</strong> p = −4/(−2) = 2, q = f(2) = −4 + 8 − 1 = 3 → T(2, 3)</p>
<p><strong>Kodomen:</strong> (−∞, 3]</p>
<p><strong>Monotonost:</strong> ↑ na (−∞, 2), ↓ na (2, +∞)</p>
<p><strong>Maksimum:</strong> f<sub>max</sub> = 3</p>
<p><strong>Nultačke:</strong> D = 16 − 4 = 12 → x = (−4 ± 2√3)/(−2) = 2 ± √3</p>
<p><strong>Parnost:</strong> f(−x) = −x² − 4x − 1 ≠ f(x) → Nije parna</p>
`)}

<h2>Znak funkcije</h2>

<p>Gdje je f(x) > 0 i gdje je f(x) < 0? Ovo zavisi od nultačaka i smjera otvaranja parabole.</p>

${hint('Za a > 0: f(x) > 0 svuda OSIM između nultačaka. Za a < 0: f(x) > 0 SAMO između nultačaka.')}

QUIZ_DATA:[{"question":"Domen kvadratne funkcije je:","options":["ℝ","[0, +∞)","Zavisi od a","Zavisi od D"],"correct":0},{"question":"Ako a > 0, kvadratna funkcija ima:","options":["Minimum","Maksimum","Ni min ni max","I min i max"],"correct":0},{"question":"Kodomen f(x) = x² − 1 je:","options":["[−1, +∞)","ℝ","(−∞, −1]","[0, +∞)"],"correct":0},{"question":"f(x)=−2x²+8x−3 ima max u x=:","options":["2","−2","4","8"],"correct":0},{"question":"Funkcija f(x)=x²−4x+3 opada na:","options":["(−∞, 2)","(2, +∞)","(−∞, 0)","ℝ"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Crtanje grafika i ispitivanje svojstva kvadratne funkcije',
    video_url: 'https://www.youtube.com/watch?v=kDhkLPS7tue',
    content: `<h1>Crtanje grafika i ispitivanje svojstava kvadratne funkcije</h1>

${backRef('Svojstva, osobine kvadratne funkcije')}

<p>U ovoj lekciji ćemo spojiti sve naučeno u <strong>kompletnu proceduru za ispitivanje i crtanje</strong> grafika kvadratne funkcije. Ovo je standardni postupak koji se traži na svim testovima!</p>

<h2>Postupak ispitivanja (koraci)</h2>

<ol>
<li><strong>Odredi koeficijente</strong> a, b, c</li>
<li><strong>Smjer otvaranja</strong> (znak od a)</li>
<li><strong>Diskriminanta</strong> D = b² − 4ac</li>
<li><strong>Nultačke</strong> (ako D ≥ 0)</li>
<li><strong>Tjeme</strong> T(p, q)</li>
<li><strong>Osa simetrije</strong> x = p</li>
<li><strong>Presječna tačka sa y-osom</strong> (0, c)</li>
<li><strong>Tabela vrijednosti</strong> (izaberi 5-7 tačaka)</li>
<li><strong>Nacrtaj grafik</strong></li>
<li><strong>Zapiši osobine</strong> (domen, kodomen, monotonost, ekstremi, znak)</li>
</ol>

${example('Kompletni primjer: f(x) = x² − 2x − 3', `
<p>1. a=1, b=−2, c=−3</p>
<p>2. a=1 > 0 → otvara se naviše</p>
<p>3. D = 4 + 12 = 16 > 0</p>
<p>4. x₁ = (2−4)/2 = −1, x₂ = (2+4)/2 = 3</p>
<p>5. p = 1, q = 1−2−3 = −4 → T(1, −4)</p>
<p>6. Osa: x = 1</p>
<p>7. y-presjek: (0, −3)</p>
<p>8. Tačke: (−2, 5), (−1, 0), (0, −3), (1, −4), (2, −3), (3, 0), (4, 5)</p>
<p>9. [Nacrtaj parabolu kroz tačke]</p>
<p>10. D=ℝ, Kd=[−4,+∞), ↓ na (−∞,1), ↑ na (1,+∞), min=−4, f>0 za x∈(−∞,−1)∪(3,+∞)</p>
`)}

${important('Na testu: UVIJEK nacrtaj tabelu sa barem 5 tačaka, uključujući tjeme, nultačke i y-presjek!')}

${hint('Trik za brzo crtanje: nacrtaj tjeme i nultačke prvo, pa iskoristi simetriju da nađeš ostale tačke.')}

QUIZ_DATA:[{"question":"Prvi korak pri crtanju grafika je:","options":["Odredi koeficijente a, b, c","Nacrtaj parabolu","Nađi nultačke","Izračunaj D"],"correct":0},{"question":"Za f(x)=x²−6x+8, tjeme je:","options":["(3, −1)","(−3, 1)","(3, 8)","(6, 8)"],"correct":0},{"question":"Koliko tačaka minimum treba za tabelu?","options":["5−7","2","3","10"],"correct":0},{"question":"Osa simetrije prolazi kroz:","options":["Tjeme","Nultačke","y-presjek","Koordinatni početak"],"correct":0},{"question":"y-presjek je uvijek tačka:","options":["(0, c)","(c, 0)","(p, q)","(0, 0)"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Kvadratne nejednačine',
    video_url: 'https://www.youtube.com/watch?v=f8GK-hOjPhw',
    content: `<h1>Kvadratne nejednačine</h1>

${backRef('Grafik funkcije kvadratne funkcije (y=ax²+bx+c)')}

<p>Kvadratna nejednačina je nejednačina oblika ax² + bx + c > 0 (ili <, ≥, ≤). Rješavanje se svodi na <strong>analizu znaka kvadratne funkcije</strong> pomoću grafika.</p>

<h2>Postupak rješavanja</h2>

<ol>
<li>Prebaci sve na jednu stranu: ax² + bx + c ⋛ 0</li>
<li>Nađi nultačke (D i formula)</li>
<li>Nacrtaj skicu parabole</li>
<li>Očitaj rješenje sa grafika</li>
</ol>

<h2>Tri slučaja (za a > 0)</h2>

<h3>D > 0 (dvije nultačke x₁ < x₂):</h3>
${formula('ax² + bx + c > 0 &nbsp;⟹&nbsp; x ∈ (−∞, x₁) ∪ (x₂, +∞)')}
${formula('ax² + bx + c < 0 &nbsp;⟹&nbsp; x ∈ (x₁, x₂)')}

<h3>D = 0 (jedna nultačka x₀):</h3>
${formula('ax² + bx + c > 0 &nbsp;⟹&nbsp; x ∈ ℝ \\\\ {x₀}')}
${formula('ax² + bx + c < 0 &nbsp;⟹&nbsp; x ∈ ∅ (prazno)')}

<h3>D < 0 (nema nultačaka):</h3>
${formula('ax² + bx + c > 0 &nbsp;⟹&nbsp; x ∈ ℝ (za a > 0)')}
${formula('ax² + bx + c < 0 &nbsp;⟹&nbsp; x ∈ ∅')}

${example('Primjer 1: Riješi x² − 5x + 6 < 0', `
<p>Nultačke: x₁ = 2, x₂ = 3</p>
<p>a = 1 > 0 → parabola otvara naviše</p>
<p>Negativne vrijednosti su IZMEĐU nultačaka</p>
<p>Rješenje: <strong>x ∈ (2, 3)</strong></p>
`)}

${example('Primjer 2: Riješi −x² + 4x − 3 ≥ 0', `
<p>Množimo sa −1 (OBRNEMO ZNAK!): x² − 4x + 3 ≤ 0</p>
<p>Nultačke: x₁ = 1, x₂ = 3</p>
<p>Rješenje: <strong>x ∈ [1, 3]</strong></p>
`)}

${important('Kada množiš nejednačinu sa negativnim brojem, OBRNI ZNAK nejednačine! Ovo je najčešća greška.')}

QUIZ_DATA:[{"question":"Rješenje x²−4 > 0 je:","options":["x∈(−∞,−2)∪(2,+∞)","x∈(−2,2)","x∈(−∞,2)","x∈(2,+∞)"],"correct":0},{"question":"Rješenje x²−4 < 0 je:","options":["x ∈ (−2, 2)","x ∈ (−∞,−2)∪(2,+∞)","x ∈ ℝ","x ∈ ∅"],"correct":0},{"question":"Ako D < 0 i a > 0, onda ax²+bx+c > 0 za:","options":["Sve x ∈ ℝ","Nijedan x","x > 0","x < 0"],"correct":0},{"question":"Pri množenju nejednačine sa −1:","options":["Obrćemo znak nejednačine","Ništa se ne mijenja","Dodajemo 1","Kvadriramo"],"correct":0},{"question":"x² ≥ 9 daje:","options":["x ≤ −3 ili x ≥ 3","−3 ≤ x ≤ 3","x ≥ 3","x ≥ 9"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Iracionalne jednačine',
    video_url: 'https://www.youtube.com/watch?v=SLqNPzVgGbs',
    content: `<h1>Iracionalne jednačine</h1>

${backRef('Pojam n-tog korijena')}

<p>Iracionalna jednačina je jednačina u kojoj se nepoznata nalazi <strong>pod znakom korijena</strong>. Osnovna metoda rješavanja je <strong>kvadriranje</strong> (ili stepenovanje) obje strane jednačine.</p>

<h2>Osnovna metoda</h2>

${formula('√(f(x)) = g(x) &nbsp;&nbsp;⟹&nbsp;&nbsp; f(x) = [g(x)]²')}

${important('OBAVEZNA PROVJERA! Kvadriranjem možemo dobiti lažna (parazitna) rješenja. Svako rješenje MORA zadovoljiti originalnu jednačinu.')}

<h2>Uslovi</h2>
<p>Za √(f(x)) = g(x), moraju biti ispunjeni:</p>
<ul>
<li>f(x) ≥ 0 (podkorjena veličina nenegativna)</li>
<li>g(x) ≥ 0 (korijen je nenegativan)</li>
</ul>

${example('Primjer 1: Riješi √(x + 3) = x + 1', `
<p>Uslov: x + 3 ≥ 0 → x ≥ −3 i x + 1 ≥ 0 → x ≥ −1</p>
<p>Kvadriramo: x + 3 = (x+1)² = x² + 2x + 1</p>
<p>x² + x − 2 = 0</p>
<p>(x+2)(x−1) = 0 → x₁ = −2, x₂ = 1</p>
<p>Provjera x = −2: √1 = −1? → 1 ≠ −1 ❌ (lažno!)</p>
<p>Provjera x = 1: √4 = 2? → 2 = 2 ✓</p>
<p>Rješenje: <strong>x = 1</strong></p>
`)}

${example('Primjer 2: √(2x − 1) = 3', `
<p>Kvadriramo: 2x − 1 = 9</p>
<p>2x = 10 → x = 5</p>
<p>Provjera: √(10−1) = √9 = 3 ✓</p>
<p>Rješenje: <strong>x = 5</strong></p>
`)}

<h2>Jednačine sa dva korijena</h2>

${example('Primjer 3: √(x+5) − √x = 1', `
<p>Izoluj jedan korijen: √(x+5) = 1 + √x</p>
<p>Kvadriraj: x + 5 = 1 + 2√x + x</p>
<p>4 = 2√x → √x = 2 → x = 4</p>
<p>Provjera: √9 − √4 = 3 − 2 = 1 ✓</p>
`)}

${hint('Strategija za dva korijena: izoluj jedan korijen na jednoj strani, pa kvadriraj. Ponekad treba kvadrirati dva puta!')}

QUIZ_DATA:[{"question":"Riješi: √(x) = 4","options":["x = 16","x = 4","x = 2","x = 8"],"correct":0},{"question":"Zašto je provjera obavezna?","options":["Kvadriranje može uvesti lažna rješenja","Korijen nije definisan","Uvijek ima beskonačno rješenja","Nije obavezna"],"correct":0},{"question":"√(x−1) = −2 ima:","options":["Nema rješenja","x = 5","x = 3","x = −3"],"correct":0},{"question":"Riješi: √(3x+1) = 4","options":["x = 5","x = 3","x = 15","x = 4"],"correct":0},{"question":"Pri rješavanju √f(x) = g(x), uslov je:","options":["f(x) ≥ 0 i g(x) ≥ 0","f(x) > 0","g(x) > 0","Nema uslova"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Eksponencijalna funkcija',
    video_url: 'https://www.youtube.com/watch?v=aBt5l2kaMKI',
    content: `<h1>Eksponencijalna funkcija</h1>

${backRef('Stepeni cjelobrojnog izložioca II dio')}
${backRef('Stepeni racionalnog izložioca')}

<p>Eksponencijalna funkcija je funkcija oblika f(x) = aˣ, gdje je osnova a pozitivan broj različit od 1. Ovo je jedna od najvažnijih funkcija — opisuje rast populacije, radioaktivni raspad, kamatu, i mnogo više!</p>

<h2>Definicija</h2>

${formula('f(x) = a<sup>x</sup>, &nbsp;&nbsp;a > 0, &nbsp;a ≠ 1')}

<h2>Osobine</h2>

<ul>
<li><strong>Domen:</strong> D = ℝ</li>
<li><strong>Kodomen:</strong> (0, +∞) — uvijek pozitivna!</li>
<li><strong>Prolazi kroz (0, 1)</strong> jer a⁰ = 1</li>
<li><strong>Nema nultačaka</strong> — aˣ nikad nije 0</li>
<li>x-osa (y = 0) je <strong>horizontalna asimptota</strong></li>
</ul>

<h2>Dva slučaja</h2>

<h3>a > 1 (npr. 2ˣ, 3ˣ, eˣ)</h3>
<p>Funkcija je <strong>strogo rastuća</strong>. Za velike x, raste veoma brzo (eksponencijalni rast).</p>

<h3>0 < a < 1 (npr. (1/2)ˣ, (0.5)ˣ)</h3>
<p>Funkcija je <strong>strogo opadajuća</strong>. Za velike x, teži ka nuli (eksponencijalno opadanje).</p>

${important('Eksponencijalna funkcija raste BRŽE od bilo koje stepene funkcije! 2ˣ na kraju uvijek nadmaši x², x³, x¹⁰⁰⁰...')}

${example('Primjer: Tabela za f(x) = 2ˣ', `
<p>f(−3) = 1/8 = 0.125</p>
<p>f(−1) = 1/2 = 0.5</p>
<p>f(0) = 1</p>
<p>f(1) = 2</p>
<p>f(3) = 8</p>
<p>f(10) = 1024</p>
`)}

${example('Primjer: Skiciraj f(x) = 3·2ˣ − 1', `
<p>Polazna: y = 2ˣ</p>
<p>1. Vertikalno istezanje ×3: y = 3·2ˣ</p>
<p>2. Pomjeranje dolje za 1: y = 3·2ˣ − 1</p>
<p>Asimptota: y = −1 (umjesto y = 0)</p>
<p>y-presjek: f(0) = 3·1 − 1 = 2</p>
`)}

QUIZ_DATA:[{"question":"Koliko je 2⁰?","options":["1","0","2","Nije definisano"],"correct":0},{"question":"Eksponencijalna funkcija f(x)=3ˣ je:","options":["Strogo rastuća","Strogo opadajuća","Konstantna","Periodična"],"correct":0},{"question":"Kodomen funkcije aˣ (a>0, a≠1) je:","options":["(0, +∞)","ℝ","[0, +∞)","[1, +∞)"],"correct":0},{"question":"Horizontalna asimptota f(x)=5ˣ je:","options":["y = 0","y = 1","y = 5","Nema asimptotu"],"correct":0},{"question":"Za 0<a<1, funkcija aˣ je:","options":["Opadajuća","Rastuća","Konstantna","Periodična"],"correct":0},{"question":"Koliko nultačaka ima f(x) = 2ˣ?","options":["0","1","2","Beskonačno"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: 'Eksponencijalne jednačine',
    video_url: 'https://www.youtube.com/watch?v=R-G8KHLcj_Q',
    content: `<h1>Eksponencijalne jednačine</h1>

${backRef('Eksponencijalna funkcija')}

<p>Eksponencijalna jednačina je jednačina u kojoj se nepoznata nalazi u <strong>izložiocu (eksponentu)</strong>. Osnovna metoda rješavanja: svedemo obje strane na istu osnovu.</p>

<h2>Osnovno pravilo</h2>

${formula('a<sup>f(x)</sup> = a<sup>g(x)</sup> &nbsp;&nbsp;⟹&nbsp;&nbsp; f(x) = g(x) &nbsp;&nbsp;(jer je a<sup>x</sup> 1-1)')}

${important('Ovo radi jer je eksponencijalna funkcija injektivna (1-1). Ako su osnove jednake, izložioci moraju biti jednaki!')}

${example('Primjer 1: Riješi 2ˣ = 8', `
<p>8 = 2³</p>
<p>2ˣ = 2³</p>
<p>x = 3</p>
`)}

${example('Primjer 2: Riješi 3²ˣ⁻¹ = 27', `
<p>27 = 3³</p>
<p>3²ˣ⁻¹ = 3³</p>
<p>2x − 1 = 3</p>
<p>2x = 4 → <strong>x = 2</strong></p>
`)}

<h2>Svođenje na istu osnovu</h2>

${example('Primjer 3: Riješi 4ˣ = 8', `
<p>4 = 2², pa 4ˣ = (2²)ˣ = 2²ˣ</p>
<p>8 = 2³</p>
<p>2²ˣ = 2³ → 2x = 3 → <strong>x = 3/2</strong></p>
`)}

<h2>Metoda supstitucije</h2>

${example('Primjer 4: Riješi 4ˣ + 2ˣ − 6 = 0', `
<p>4ˣ = (2²)ˣ = (2ˣ)²</p>
<p>Zamjena: t = 2ˣ (t > 0)</p>
<p>t² + t − 6 = 0</p>
<p>(t+3)(t−2) = 0</p>
<p>t = −3 (odbaci, jer t > 0) ili t = 2</p>
<p>2ˣ = 2 → <strong>x = 1</strong></p>
`)}

${hint('Za složenije jednačine bez očigledne osnove, koristi logaritme (sljedeća lekcija)!')}

QUIZ_DATA:[{"question":"Riješi: 3ˣ = 27","options":["x = 3","x = 9","x = 27","x = 1/3"],"correct":0},{"question":"Riješi: 2ˣ = 1","options":["x = 0","x = 1","x = 2","Nema rješenja"],"correct":0},{"question":"5²ˣ = 125 → x = ?","options":["3/2","3","2","5"],"correct":0},{"question":"Osnovno pravilo: aᶠ⁽ˣ⁾ = aᵍ⁽ˣ⁾ ⟹","options":["f(x) = g(x)","f(x) = −g(x)","a = 1","x = 0"],"correct":0},{"question":"Za 4ˣ = 32, x =","options":["5/2","2","4","5"],"correct":0}]:QUIZ_DATA`