const URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg';
const AUTHOR = '241c9077-b700-4400-8f96-20e3a650eef4';
const headers = { 'apikey': SK, 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

function formula(text) {
  return `<div style="background:#1e1b4b;border-left:3px solid #a78bfa;padding:12px 16px;border-radius:8px;margin:12px 0;font-family:monospace;font-size:15px;color:#e4e4e7;">${text}</div>`;
}
function important(text) {
  return `<div style="background:#18181b;border:1px solid #3f3f46;padding:12px 16px;border-radius:8px;margin:12px 0;"><strong style="color:#a78bfa;">💡 Važno:</strong> ${text}</div>`;
}
function hint(text) {
  return `<div style="background:#1a1a2e;border:1px solid #2d2d5e;padding:10px 14px;border-radius:8px;margin:10px 0;color:#a1a1aa;font-size:13px;">💭 ${text}</div>`;
}
function example(title, content) {
  return `<div style="background:#0f172a;border:1px solid #1e293b;padding:14px;border-radius:10px;margin:14px 0;"><p style="color:#38bdf8;font-weight:600;margin-bottom:8px;">📝 ${title}</p>${content}</div>`;
}
function backref(title) {
  return `<p style="color:#71717a;font-size:13px;margin-top:8px;">↩ Pogledaj lekciju: "${title}"</p>`;
}

const CURRENT_INDEX = 14; // 0-based, lecture 15 "Stepene funkcije 2"

const lectures = [
  {
    title: 'Stepeni cjelobrojnog izložioca I dio',
    video_url: 'https://www.youtube.com/watch?v=ifq1imEcZuk',
    content: `<h2 style="color:#a78bfa;font-size:20px;margin-bottom:12px;">Stepeni cjelobrojnog izložioca — I dio</h2>
<p>Stepenovanje je matematička operacija koja predstavlja skraćeni zapis uzastopnog množenja istog broja. Ako imamo broj <strong>a</strong> i prirodni broj <strong>n</strong>, tada je a<sup>n</sup> = a · a · a · ... · a (n puta).</p>
${formula('a<sup>n</sup> = a · a · a · ... · a &nbsp;&nbsp;(n faktora)')}
<p>Broj <strong>a</strong> zovemo <em>baza</em> ili <em>osnova</em>, a broj <strong>n</strong> zovemo <em>eksponent</em> ili <em>izložilac</em>.</p>
${important('Za svaki broj a ≠ 0 važi: a⁰ = 1. Nula na nultu je nedefinisana (0⁰ nije definisano).')}
<p>Kada je izložilac negativan cijeli broj, stepen definišemo kao recipročnu vrijednost:</p>
${formula('a<sup>-n</sup> = 1 / a<sup>n</sup> &nbsp;&nbsp;(za a ≠ 0)')}
${example('Primjer 1', '<p>2<sup>3</sup> = 2 · 2 · 2 = 8</p><p>5<sup>-2</sup> = 1/5² = 1/25 = 0.04</p><p>(-3)² = (-3)·(-3) = 9</p><p>(-3)³ = (-3)·(-3)·(-3) = -27</p>')}
${important('Paran stepen negativnog broja daje pozitivan rezultat. Neparan stepen negativnog broja daje negativan rezultat.')}
<p>U sljedećoj lekciji ćemo obraditi pravila za množenje i dijeljenje stepena.</p>`,
    quiz: [
      {q:"Koliko je 2⁴?",o:["8","16","32","4"],c:1},
      {q:"Koliko je 3⁰?",o:["0","3","1","nedefinisano"],c:2},
      {q:"Koliko je (-2)³?",o:["8","-8","6","-6"],c:1},
      {q:"Koliko je 5⁻¹?",o:["5","-5","1/5","-1/5"],c:2},
      {q:"Šta je baza u izrazu 7⁵?",o:["5","7","35","75"],c:1},
    ]
  },
  {
    title: 'Stepeni cjelobrojnog izložioca II dio',
    video_url: 'https://www.youtube.com/watch?v=ifq1imEcZuk',
    content: `<h2 style="color:#a78bfa;">Stepeni cjelobrojnog izložioca — II dio</h2>
<p>U ovoj lekciji obrađujemo osnovna pravila za računanje sa stepenima. Ova pravila su ključna za dalji rad sa funkcijama i jednačinama.</p>
${formula('a<sup>m</sup> · a<sup>n</sup> = a<sup>m+n</sup>')}
${formula('a<sup>m</sup> / a<sup>n</sup> = a<sup>m-n</sup> &nbsp;&nbsp;(a ≠ 0)')}
${formula('(a<sup>m</sup>)<sup>n</sup> = a<sup>m·n</sup>')}
${formula('(a · b)<sup>n</sup> = a<sup>n</sup> · b<sup>n</sup>')}
${formula('(a / b)<sup>n</sup> = a<sup>n</sup> / b<sup>n</sup> &nbsp;&nbsp;(b ≠ 0)')}
${backref('Stepeni cjelobrojnog izložioca I dio')}
${example('Primjer', '<p>2³ · 2⁴ = 2⁷ = 128</p><p>3⁵ / 3² = 3³ = 27</p><p>(2³)² = 2⁶ = 64</p><p>(2·3)² = 4·9 = 36</p>')}
${important('Ova pravila važe za sve cjelobrojne izložioce — pozitivne, negativne i nulu.')}`,
    quiz: [
      {q:"Koliko je 2³ · 2⁴?",o:["2⁷ = 128","2¹² = 4096","2⁷ = 64","6⁷"],c:0},
      {q:"Pojednostavi: a⁵ / a²",o:["a³","a⁷","a²·⁵","a¹⁰"],c:0},
      {q:"Koliko je (3²)³?",o:["3⁵ = 243","3⁶ = 729","3⁸","9⁶"],c:1},
      {q:"(2·5)³ = ?",o:["10³ = 1000","2³+5³","7³","15³"],c:0},
    ]
  },
  {
    title: 'Osobine funkcija I dio',
    video_url: 'https://www.youtube.com/watch?v=my7drMsfdhQ',
    content: `<h2 style="color:#a78bfa;">Osobine funkcija — I dio</h2>
<p>Funkcija je pravilo koje svakom elementu jednog skupa pridružuje tačno jedan element drugog skupa. Označavamo je sa f: A → B ili y = f(x).</p>
${formula('f: A → B, &nbsp; x ↦ f(x) = y')}
<p><strong>Domen</strong> (oblast definisanosti) je skup svih vrijednosti x za koje je funkcija definisana. <strong>Kodomen</strong> je skup svih mogućih vrijednosti y.</p>
${important('Svaka funkcija mora zadovoljiti uslov: svakom x iz domena odgovara TAČNO JEDAN y.')}
<p><strong>Nule funkcije</strong> su vrijednosti x za koje je f(x) = 0, tj. tačke u kojima grafik siječe x-osu.</p>
<p><strong>Znak funkcije</strong> — funkcija je pozitivna gdje je f(x) > 0, negativna gdje je f(x) < 0.</p>
${example('Primjer', '<p>f(x) = x² - 4</p><p>Nule: x² - 4 = 0 → x = ±2</p><p>f(x) > 0 za x ∈ (-∞,-2) ∪ (2,+∞)</p><p>f(x) < 0 za x ∈ (-2, 2)</p>')}`,
    quiz: [
      {q:"Šta je domen funkcije?",o:["Skup svih y vrijednosti","Skup svih x za koje je f definisana","Grafik funkcije","Nula funkcije"],c:1},
      {q:"Nula funkcije f(x) = 2x - 6 je:",o:["x = 6","x = -3","x = 3","x = -6"],c:2},
      {q:"Funkcija y = 1/x nije definisana za:",o:["x = 1","x = -1","x = 0","x = ∞"],c:2},
    ]
  },
  {
    title: 'Osobine funkcija II dio',
    video_url: 'https://www.youtube.com/watch?v=my7drMsfdhQ',
    content: `<h2 style="color:#a78bfa;">Osobine funkcija — II dio</h2>
<p>U ovom dijelu obrađujemo <strong>monotonost</strong>, <strong>parnost</strong> i <strong>ograničenost</strong> funkcija.</p>
<p><strong>Rastuća funkcija:</strong> za x₁ < x₂ važi f(x₁) < f(x₂) — grafik ide "naviše".</p>
<p><strong>Opadajuća funkcija:</strong> za x₁ < x₂ važi f(x₁) > f(x₂) — grafik ide "naniže".</p>
${formula('Parna funkcija: f(-x) = f(x) &nbsp;za sve x')}
${formula('Neparna funkcija: f(-x) = -f(x) &nbsp;za sve x')}
${important('Grafik parne funkcije je simetričan u odnosu na y-osu. Grafik neparne funkcije je simetričan u odnosu na koordinatni početak.')}
${example('Primjeri', '<p>f(x) = x² → parna (jer (-x)² = x²)</p><p>f(x) = x³ → neparna (jer (-x)³ = -x³)</p><p>f(x) = x² + x → ni parna ni neparna</p>')}
${backref('Osobine funkcija I dio')}`,
    quiz: [
      {q:"Funkcija f(x) = x⁴ je:",o:["Parna","Neparna","Ni parna ni neparna","Rastuća"],c:0},
      {q:"Ako f(-x) = -f(x), funkcija je:",o:["Parna","Neparna","Konstanta","Rastuća"],c:1},
      {q:"f(x) = 2x je:",o:["Rastuća","Opadajuća","Konstantna","Parna"],c:0},
    ]
  },
  {
    title: 'Stepene funkcije 1. dio',
    video_url: 'https://www.youtube.com/watch?v=eO0YoRG-ZKM',
    content: `<h2 style="color:#a78bfa;">Stepene funkcije — 1. dio</h2>
<p>Stepena funkcija je funkcija oblika y = xⁿ, gdje je n prirodan broj. Osobine ove funkcije zavise od toga da li je n paran ili neparan.</p>
${formula('y = x<sup>n</sup>, &nbsp; n ∈ ℕ')}
<p><strong>Za paran n</strong> (n = 2, 4, 6...): grafik je simetričan u odnosu na y-osu, funkcija je parna, domen je ℝ, kodomen je [0, +∞).</p>
<p><strong>Za neparan n</strong> (n = 1, 3, 5...): grafik prolazi kroz koordinatni početak, funkcija je neparna i rastuća na cijelom ℝ.</p>
${example('y = x²', '<p>Parabola okrenuta naviše. Tjeme u (0,0). Simetrična u odnosu na y-osu.</p>')}
${example('y = x³', '<p>Kubna funkcija. Prolazi kroz (0,0). Rastuća na cijelom ℝ. Neparna.</p>')}
${backref('Osobine funkcija II dio')}
${hint('Što je veći stepen n, grafik se više \"sljepljuje\" uz x-osu za |x| < 1 i brže raste za |x| > 1.')}`,
    quiz: [
      {q:"y = x⁴ je:",o:["Parna funkcija","Neparna funkcija","Linearna","Opadajuća"],c:0},
      {q:"Domen funkcije y = x³ je:",o:["[0, +∞)","(-∞, 0]","ℝ","ℝ \\ {0}"],c:2},
      {q:"Grafik y = x² je:",o:["Prava linija","Parabola","Hiperbola","Kružnica"],c:1},
    ]
  },
];

// Continue with lectures 6-30...
const lectures2 = [
  { title: 'Stepene funkcije 2. dio', video_url: 'https://www.youtube.com/watch?v=eO0YoRG-ZKM',
    content: `<h2 style="color:#a78bfa;">Stepene funkcije — 2. dio</h2>
<p>Proširujemo pojam stepene funkcije na oblik y = axⁿ + b, gdje a i b utiču na oblik i položaj grafika.</p>
${formula('y = a · x<sup>n</sup> + b')}
<p>Koeficijent <strong>a</strong> utiče na širinu/usmjerenost grafika. Ako je a > 0, grafik je usmjeren naviše (za paran n). Ako je a < 0, grafik je usmjeren naniže.</p>
<p>Koeficijent <strong>b</strong> pomjera grafik po y-osi za b jedinica.</p>
${important('|a| > 1 sužava grafik, 0 < |a| < 1 širi grafik. b > 0 pomjera naviše, b < 0 naniže.')}
${backref('Stepene funkcije 1. dio')}`,
    quiz: [{q:"Grafik y = -x² je:",o:["Parabola okrenuta naviše","Parabola okrenuta naniže","Linearna funkcija","Kubna funkcija"],c:1},{q:"y = x² + 3 je pomjerena za:",o:["3 ulijevo","3 naviše","3 udesno","3 naniže"],c:1}]
  },
  { title: 'Pojam n-tog korijena', video_url: 'https://www.youtube.com/watch?v=QJpwb82bwT4',
    content: `<h2 style="color:#a78bfa;">Pojam n-tog korijena</h2>
<p>N-ti korijen broja a je broj b takav da je bⁿ = a. Zapisujemo ⁿ√a = b.</p>
${formula('ⁿ√a = b &nbsp;⟺&nbsp; b<sup>n</sup> = a')}
${important('Za paran n: ⁿ√a postoji samo za a ≥ 0. Za neparan n: ⁿ√a postoji za sve a ∈ ℝ.')}
${example('Primjeri', '<p>²√16 = 4 (jer 4² = 16)</p><p>³√27 = 3 (jer 3³ = 27)</p><p>³√(-8) = -2 (jer (-2)³ = -8)</p><p>⁴√81 = 3 (jer 3⁴ = 81)</p>')}
${backref('Stepeni cjelobrojnog izložioca I dio')}`,
    quiz: [{q:"³√64 = ?",o:["4","8","16","2"],c:0},{q:"²√(-4) je:",o:["2","-2","2i","Ne postoji u ℝ"],c:3},{q:"⁴√16 = ?",o:["4","2","8","1"],c:1}]
  },
  { title: 'Stepeni racionalnog izložioca', video_url: null,
    content: `<h2 style="color:#a78bfa;">Stepeni racionalnog izložioca</h2>
<p>Stepenovanje možemo proširiti na racionalne izložioce koristeći korjenovanje:</p>
${formula('a<sup>m/n</sup> = ⁿ√(a<sup>m</sup>) = (ⁿ√a)<sup>m</sup>')}
${important('Sva pravila za stepenovanje važe i za racionalne izložioce: aᵐ · aⁿ = aᵐ⁺ⁿ, (aᵐ)ⁿ = aᵐⁿ, itd.')}
${example('Primjeri', '<p>8^(2/3) = ³√(8²) = ³√64 = 4</p><p>27^(1/3) = ³√27 = 3</p><p>4^(3/2) = (√4)³ = 2³ = 8</p>')}
${backref('Pojam n-tog korijena')}`,
    quiz: [{q:"8^(1/3) = ?",o:["2","3","4","8/3"],c:0},{q:"4^(1/2) = ?",o:["2","4","8","1/2"],c:0},{q:"27^(2/3) = ?",o:["9","18","3","6"],c:0}]
  },
  { title: 'Kompozicija funkcija', video_url: null,
    content: `<h2 style="color:#a78bfa;">Kompozicija funkcija</h2>
<p>Kompozicija funkcija f i g, označena (f ∘ g)(x), znači da prvo primijenimo g, pa onda f na rezultat:</p>
${formula('(f ∘ g)(x) = f(g(x))')}
${important('Kompozicija NIJE komutativna: f ∘ g ≠ g ∘ f u opštem slučaju!')}
${example('Primjer', '<p>f(x) = 2x + 1, g(x) = x²</p><p>(f ∘ g)(x) = f(g(x)) = f(x²) = 2x² + 1</p><p>(g ∘ f)(x) = g(f(x)) = g(2x+1) = (2x+1)²</p>')}`,
    quiz: [{q:"Ako f(x)=x+1, g(x)=2x, koliko je (f∘g)(3)?",o:["7","8","9","10"],c:0},{q:"f∘g i g∘f su uvijek jednaki?",o:["Da","Ne","Samo za linearne","Samo za parne"],c:1}]
  },
  { title: 'Inverzna funkcija', video_url: null,
    content: `<h2 style="color:#a78bfa;">Inverzna funkcija</h2>
<p>Inverzna funkcija f⁻¹ je funkcija koja \"poništava\" dejstvo funkcije f. Ako y = f(x), onda x = f⁻¹(y).</p>
${formula('f(f<sup>-1</sup>(x)) = x &nbsp; i &nbsp; f<sup>-1</sup>(f(x)) = x')}
${important('Funkcija ima inverznu samo ako je bijekcija (injektivna i surjektivna). Grafik inverzne funkcije je simetričan grafiku originalne u odnosu na pravu y = x.')}
${example('Primjer', '<p>f(x) = 2x + 3</p><p>y = 2x + 3 → x = (y-3)/2</p><p>f⁻¹(x) = (x-3)/2</p>')}
${backref('Kompozicija funkcija')}`,
    quiz: [{q:"Inverzna funkcija f(x)=3x je:",o:["f⁻¹(x)=x/3","f⁻¹(x)=3/x","f⁻¹(x)=-3x","f⁻¹(x)=x-3"],c:0},{q:"Grafik f⁻¹ je simetričan f u odnosu na:",o:["x-osu","y-osu","pravu y=x","koordinatni početak"],c:2}]
  },
  { title: 'Korijena funkcija', video_url: null,
    content: `<h2 style="color:#a78bfa;">Korijena funkcija</h2>
<p>Korijena funkcija je funkcija oblika y = ⁿ√x. To je inverzna funkcija stepene funkcije y = xⁿ.</p>
${formula('y = √x &nbsp;(kvadratni korijen, n=2)')}
${formula('y = ³√x &nbsp;(kubni korijen, n=3)')}
<p>Za y = √x: domen je [0, +∞), kodomen je [0, +∞), funkcija je rastuća.</p>
<p>Za y = ³√x: domen je ℝ, kodomen je ℝ, funkcija je rastuća i neparna.</p>
${backref('Pojam n-tog korijena')}
${backref('Inverzna funkcija')}`,
    quiz: [{q:"Domen funkcije y = √x je:",o:["ℝ","[0, +∞)","(-∞, 0]","ℝ \\ {0}"],c:1},{q:"y = ³√x je definisana za:",o:["Samo x ≥ 0","Samo x > 0","Sve x ∈ ℝ","x ≠ 0"],c:2}]
  },
  { title: 'Kompleksni brojevi', video_url: 'https://www.youtube.com/watch?v=YA3icOgaP-w',
    content: `<h2 style="color:#a78bfa;">Kompleksni brojevi</h2>
<p>Kompleksni brojevi proširuju skup realnih brojeva uvođenjem imaginarne jedinice <strong>i</strong>, za koju važi i² = -1.</p>
${formula('i² = -1, &nbsp; i = √(-1)')}
<p>Svaki kompleksni broj se zapisuje u obliku z = a + bi, gdje je a realni dio, b imaginarni dio.</p>
${formula('z = a + bi, &nbsp; a,b ∈ ℝ')}
${important('Realni brojevi su specijalni slučaj kompleksnih (b = 0). Imaginarni brojevi imaju a = 0.')}
${example('Operacije', '<p>(2+3i) + (1-i) = 3+2i</p><p>(2+3i)·(1-i) = 2-2i+3i-3i² = 2+i+3 = 5+i</p>')}
<p>Konjugovani broj z̄ = a - bi. Modul |z| = √(a²+b²).</p>`,
    quiz: [{q:"i² = ?",o:["1","-1","i","-i"],c:1},{q:"(3+2i)+(1-i) = ?",o:["4+i","4+3i","2+i","4-i"],c:0},{q:"Konjugovani od 2+3i je:",o:["2-3i","-2+3i","-2-3i","3+2i"],c:0}]
  },
  { title: 'Geometrijska interpretacija kompleksnih brojeva', video_url: null,
    content: `<h2 style="color:#a78bfa;">Geometrijska interpretacija kompleksnih brojeva</h2>
<p>Svaki kompleksni broj z = a + bi možemo prikazati kao tačku (a, b) u ravni. X-osa predstavlja realni dio, y-osa imaginarni dio. Ova ravan se zove <strong>Gausova ravan</strong> ili <strong>kompleksna ravan</strong>.</p>
${formula('z = a + bi &nbsp;↔&nbsp; tačka (a, b)')}
<p><strong>Modul</strong> |z| = √(a²+b²) predstavlja rastojanje od koordinatnog početka do tačke z.</p>
<p><strong>Argument</strong> φ = arg(z) je ugao koji vektor z zaklapa sa pozitivnim smjerom x-ose.</p>
${formula('Trigonometrijski oblik: z = |z|·(cos φ + i·sin φ)')}
${backref('Kompleksni brojevi')}
${example('Primjer', '<p>z = 1+i → |z| = √2, arg(z) = π/4 = 45°</p><p>z = √2·(cos 45° + i·sin 45°)</p>')}`,
    quiz: [{q:"Modul broja z = 3+4i je:",o:["5","7","25","1"],c:0},{q:"Kompleksni broj 2i se nalazi na:",o:["x-osi","y-osi","pravoj y=x","nema geometrijsku interpretaciju"],c:1}]
  },
  { title: 'Stepene funkcije 1', video_url: null,
    content: `<h2 style="color:#a78bfa;">Stepene funkcije — proširenje</h2>
<p>Ovdje proširujemo stepene funkcije na oblik y = x^r gdje je r bilo koji racionalan broj, uključujući i razlomke.</p>
${formula('y = x<sup>r</sup>, &nbsp; r ∈ ℚ')}
<p>Za r = 1/2: y = √x. Za r = -1: y = 1/x. Za r = -2: y = 1/x².</p>
${important('Za negativne eksponente, funkcija nije definisana u x = 0. Za razlomačke eksponente, domen zavisi od parnosti imenitelja.')}
${backref('Stepene funkcije 1. dio')}
${backref('Stepeni racionalnog izložioca')}`,
    quiz: [{q:"y = x^(-1) je isto što i:",o:["y = -x","y = 1/x","y = x-1","y = -1/x"],c:1},{q:"Domen y = x^(1/2) je:",o:["ℝ","[0,+∞)","(0,+∞)","ℝ\\{0}"],c:1}]
  },
  { title: 'Stepene funkcije 2', video_url: null,
    content: `<!-- CURRENT -->
<h2 style="color:#a78bfa;">Stepene funkcije 2 — sistematizacija</h2>
<div style="background:linear-gradient(90deg,#7c3aed22,#a78bfa22);border:1px solid #a78bfa;padding:12px 16px;border-radius:10px;margin:12px 0;"><strong style="color:#a78bfa;">📍 Trenutno učiš ovu lekciju!</strong></div>
<p>Sistematizacija svih tipova stepenih funkcija i njihovih grafika. Ovo je pregled svega što smo naučili o stepenim funkcijama.</p>
${formula('y = x<sup>n</sup> (n paran) → parna, U-oblik')}
${formula('y = x<sup>n</sup> (n neparan) → neparna, S-oblik')}
${formula('y = x<sup>-n</sup> → hiperbola, nema nulu')}
${formula('y = x<sup>1/n</sup> → korijena funkcija')}
${important('Svi grafici prolaze kroz tačku (1, 1). Za parne stepene grafik dodiruje x-osu u (0,0). Za neparne prolazi kroz nju.')}
${backref('Stepene funkcije 1')}
${backref('Korijena funkcija')}`,
    quiz: [{q:"Sve stepene funkcije y=xⁿ prolaze kroz tačku:",o:["(0,0)","(1,1)","(-1,1)","(0,1)"],c:1},{q:"y = x⁻² za x→0:",o:["→ 0","→ 1","→ +∞","→ -∞"],c:2}]
  },
];

const lectures3 = [
  { title: 'Kvadratna jednačina', video_url: 'https://www.youtube.com/watch?v=QJpwb82bwT4',
    content: `<h2 style="color:#a78bfa;">Kvadratna jednačina</h2>
<p>Kvadratna jednačina je jednačina oblika ax² + bx + c = 0, gdje je a ≠ 0. Rješava se pomoću <strong>diskriminante</strong> i formule:</p>
${formula('x = (-b ± √(b²-4ac)) / 2a')}
${formula('D = b² - 4ac &nbsp;(diskriminanta)')}
${important('D > 0: dva različita realna rješenja. D = 0: jedno dvostruko rješenje. D < 0: nema realnih rješenja (postoje kompleksna).')}
${example('Primjer: x² - 5x + 6 = 0', '<p>a=1, b=-5, c=6</p><p>D = 25 - 24 = 1 > 0</p><p>x₁ = (5+1)/2 = 3, x₂ = (5-1)/2 = 2</p>')}
${backref('Kompleksni brojevi')}`,
    quiz: [{q:"Diskriminanta jednačine x²-4x+4=0 je:",o:["0","4","8","-4"],c:0},{q:"Ako je D < 0, jednačina:",o:["Ima dva rješenja","Ima jedno rješenje","Nema realnih rješenja","Nije kvadratna"],c:2},{q:"Rješenja x²-x-6=0 su:",o:["3 i -2","2 i -3","-1 i 6","1 i -6"],c:0}]
  },
  { title: 'Priroda rješenja kvadratne jednačine', video_url: null,
    content: `<h2 style="color:#a78bfa;">Priroda rješenja kvadratne jednačine</h2>
<p>Diskriminanta D = b² - 4ac određuje prirodu rješenja bez potrebe da ih izračunamo:</p>
${formula('D > 0 → dva različita realna rješenja')}
${formula('D = 0 → jedno dvostruko realno rješenje (x₁ = x₂)')}
${formula('D < 0 → dva konjugovano kompleksna rješenja')}
${backref('Kvadratna jednačina')}
${backref('Kompleksni brojevi')}
${example('Primjer: 2x² + 3x + 5 = 0', '<p>D = 9 - 40 = -31 < 0</p><p>Nema realnih rješenja!</p><p>Kompleksna: x = (-3 ± i√31) / 4</p>')}`,
    quiz: [{q:"x² + 1 = 0 ima:",o:["Dva realna rješenja","Jedno rješenje","Dva kompleksna rješenja","Nema rješenja"],c:2},{q:"D = 0 znači:",o:["Nema rješenja","Dvostruko rješenje","Dva različita","Kompleksna rješenja"],c:1}]
  },
  { title: 'Vietove formule', video_url: null,
    content: `<h2 style="color:#a78bfa;">Vietove formule</h2>
<p>Vietove formule povezuju koeficijente kvadratne jednačine sa njenim rješenjima, BEZ potrebe za računanjem diskriminante:</p>
${formula('x₁ + x₂ = -b/a')}
${formula('x₁ · x₂ = c/a')}
${important('Ovo znači da možemo naći zbir i proizvod rješenja samo gledajući koeficijente!')}
${example('Primjer: x² - 7x + 12 = 0', '<p>x₁ + x₂ = 7 (= -(-7)/1)</p><p>x₁ · x₂ = 12 (= 12/1)</p><p>Rješenja: x₁ = 3, x₂ = 4 ✓</p>')}
${backref('Kvadratna jednačina')}`,
    quiz: [{q:"Za x²-5x+6=0, x₁+x₂=?",o:["5","6","-5","-6"],c:0},{q:"Za x²-5x+6=0, x₁·x₂=?",o:["5","6","-5","-6"],c:1}]
  },
  { title: 'Jednačine koje se svode na kvadratne jednačine', video_url: null,
    content: `<h2 style="color:#a78bfa;">Jednačine koje se svode na kvadratne</h2>
<p>Mnoge jednačine se mogu smjenom svesti na kvadratne. Najčešće su bikvadratne jednačine.</p>
${formula('ax⁴ + bx² + c = 0 &nbsp;→&nbsp; smjena t = x², dobijamo at² + bt + c = 0')}
${example('Primjer: x⁴ - 5x² + 4 = 0', '<p>Smjena t = x²: t² - 5t + 4 = 0</p><p>t₁ = 4, t₂ = 1</p><p>x² = 4 → x = ±2</p><p>x² = 1 → x = ±1</p><p>Rješenja: x ∈ {-2, -1, 1, 2}</p>')}
${backref('Kvadratna jednačina')}
${hint('Uvijek provjeri da li smjena daje dozvoljene vrijednosti! Npr. t = x² mora biti ≥ 0.')}`,
    quiz: [{q:"Bikvadratna jednačina x⁴-10x²+9=0 ima koliko rješenja?",o:["2","3","4","0"],c:2},{q:"Smjena za x⁶-x³-2=0 je:",o:["t=x³","t=x²","t=x⁶","t=x"],c:0}]
  },
  { title: 'Sistemi kvadratnih jednačina', video_url: null,
    content: `<h2 style="color:#a78bfa;">Sistemi kvadratnih jednačina</h2>
<p>Sistem koji sadrži barem jednu kvadratnu jednačinu. Rješavamo supstitucijom ili sabiranjem.</p>
${example('Primjer', '<p>x + y = 5 ... (1)</p><p>xy = 6 ... (2)</p><p>Iz (1): y = 5-x, uvrštavamo u (2):</p><p>x(5-x) = 6 → x² - 5x + 6 = 0</p><p>x₁=2, x₂=3 → (2,3) i (3,2)</p>')}
${backref('Vietove formule')}
${hint('Vietove formule mogu pomoći: ako znamo x+y i xy, odmah imamo rješenja!')}`,
    quiz: [{q:"Sistem x+y=7, xy=12 ima rješenja:",o:["(3,4) i (4,3)","(2,5) i (5,2)","(6,1) i (1,6)","(3,4)"],c:0}]
  },
];

const lectures4 = [
  { title: 'Grafik funkcije kvadratne funkcije (y=ax²+bx+c)', video_url: 'https://www.youtube.com/watch?v=iykStu5CLNs',
    content: `<h2 style="color:#a78bfa;">Grafik kvadratne funkcije</h2>
<p>Grafik funkcije y = ax² + bx + c je <strong>parabola</strong>. Ključni elementi:</p>
${formula('Tjeme: T(-b/2a, -(b²-4ac)/4a)')}
${formula('Osa simetrije: x = -b/2a')}
<p>Ako je a > 0, parabola je okrenuta naviše (ima minimum). Ako je a < 0, okrenuta naniže (ima maksimum).</p>
${important('Nule funkcije su rješenja jednačine ax²+bx+c=0. Grafik siječe y-osu u tačci (0, c).')}
${backref('Kvadratna jednačina')}`,
    quiz: [{q:"Parabola y=x²-4x+3 ima tjeme u:",o:["(2,-1)","(-2,1)","(4,3)","(2,3)"],c:0},{q:"Ako je a<0, parabola je okrenuta:",o:["Naviše","Naniže","Ulijevo","Udesno"],c:1}]
  },
  { title: 'Svojstva, osobine kvadratne funkcije', video_url: null,
    content: `<h2 style="color:#a78bfa;">Svojstva kvadratne funkcije</h2>
<p>Kompletna analiza kvadratne funkcije y = ax² + bx + c uključuje:</p>
<p>1. <strong>Domen:</strong> ℝ (uvijek)</p>
<p>2. <strong>Kodomen:</strong> [y_min, +∞) ako a > 0, ili (-∞, y_max] ako a < 0</p>
<p>3. <strong>Monotonost:</strong> rastuća na jednom intervalu, opadajuća na drugom</p>
<p>4. <strong>Parnost:</strong> parna samo ako je b = 0</p>
${backref('Osobine funkcija II dio')}
${backref('Grafik funkcije kvadratne funkcije (y=ax²+bx+c)')}`,
    quiz: [{q:"Domen SVAKE kvadratne funkcije je:",o:["[0,+∞)","(-∞,0]","ℝ","Zavisi od a"],c:2}]
  },
  { title: 'Crtanje grafika i ispitivanje svojstva kvadratne funkcije', video_url: 'https://www.youtube.com/watch?v=GTm6wzdtBY0',
    content: `<h2 style="color:#a78bfa;">Crtanje grafika — korak po korak</h2>
<p>Postupak ispitivanja i crtanja grafika kvadratne funkcije:</p>
<p>1. Odrediti nule (D, x₁, x₂)</p>
<p>2. Odrediti tjeme T(-b/2a, f(-b/2a))</p>
<p>3. Odrediti presijek sa y-osom: (0, c)</p>
<p>4. Odrediti znak funkcije (tabela znaka)</p>
<p>5. Skicirati grafik</p>
${example('y = x² - 2x - 3', '<p>Nule: x²-2x-3=0 → x₁=-1, x₂=3</p><p>Tjeme: x=1, y=1-2-3=-4 → T(1,-4)</p><p>y-presijek: (0,-3)</p>')}`,
    quiz: [{q:"Presijek y=-x²+4 sa y-osom je:",o:["(0,4)","(4,0)","(0,-4)","(-4,0)"],c:0}]
  },
  { title: 'Kvadratne nejednačine', video_url: null,
    content: `<h2 style="color:#a78bfa;">Kvadratne nejednačine</h2>
<p>Kvadratna nejednačina je nejednačina oblika ax² + bx + c > 0 (ili <, ≥, ≤).</p>
<p><strong>Postupak:</strong> 1) Riješiti jednačinu ax²+bx+c=0. 2) Skicirati parabolu. 3) Očitati rješenje sa grafika.</p>
${example('x² - 4 > 0', '<p>x² - 4 = 0 → x = ±2</p><p>Parabola naviše, pozitivna za x < -2 ili x > 2</p><p>Rješenje: x ∈ (-∞,-2) ∪ (2,+∞)</p>')}
${backref('Grafik funkcije kvadratne funkcije (y=ax²+bx+c)')}`,
    quiz: [{q:"Rješenje x²-1<0 je:",o:["x∈(-1,1)","x>1","x<-1","x∈(-∞,-1)∪(1,+∞)"],c:0}]
  },
  { title: 'Iracionalne jednačine', video_url: null,
    content: `<h2 style="color:#a78bfa;">Iracionalne jednačine</h2>
<p>Iracionalna jednačina je jednačina u kojoj se nepoznata nalazi pod korijenom.</p>
${formula('√(f(x)) = g(x)')}
<p><strong>Postupak:</strong> 1) Kvadriraj obje strane. 2) Riješi dobijenu jednačinu. 3) OBAVEZNO provjeri rješenja u originalnoj jednačini!</p>
${important('Kvadriranjem se mogu pojaviti lažna rješenja! Provjera je OBAVEZNA.')}
${example('√(x+3) = x+1', '<p>x+3 = (x+1)² = x²+2x+1</p><p>x²+x-2=0 → x₁=1, x₂=-2</p><p>Provjera: √4=2=1+1 ✓, √1=1≠-1 ✗</p><p>Rješenje: x=1</p>')}`,
    quiz: [{q:"Zašto je provjera obavezna kod iracionalnih jednačina?",o:["Jer je teško računati","Jer kvadriranje može dati lažna rješenja","Jer korijen ne postoji","Jer su dva rješenja"],c:1}]
  },
  { title: 'Eksponencijalna funkcija', video_url: null,
    content: `<h2 style="color:#a78bfa;">Eksponencijalna funkcija</h2>
<p>Eksponencijalna funkcija je funkcija oblika y = aˣ, gdje je a > 0 i a ≠ 1.</p>
${formula('y = a<sup>x</sup>, &nbsp; a > 0, a ≠ 1')}
<p><strong>Za a > 1:</strong> funkcija je rastuća (eksponencijalni rast)</p>
<p><strong>Za 0 < a < 1:</strong> funkcija je opadajuća (eksponencijalni pad)</p>
${important('Grafik UVIJEK prolazi kroz tačku (0, 1) jer a⁰ = 1. Funkcija je uvijek pozitivna: aˣ > 0 za sve x.')}
${backref('Stepeni cjelobrojnog izložioca I dio')}`,
    quiz: [{q:"2⁰ = ?",o:["0","1","2","nedefinisano"],c:1},{q:"Eksponencijalna funkcija y=3ˣ je:",o:["Rastuća","Opadajuća","Konstanta","Parna"],c:0}]
  },
  { title: 'Eksponencijalne jednačine', video_url: null,
    content: `<h2 style="color:#a78bfa;">Eksponencijalne jednačine</h2>
<p>Eksponencijalna jednačina je jednačina u kojoj se nepoznata nalazi u eksponentu.</p>
${formula('a<sup>f(x)</sup> = a<sup>g(x)</sup> &nbsp;→&nbsp; f(x) = g(x)')}
${important('Ključno pravilo: ako su baze jednake, eksponenti moraju biti jednaki!')}
${example('Primjer: 2^(x+1) = 8', '<p>8 = 2³, pa: 2^(x+1) = 2³</p><p>x+1 = 3 → x = 2</p>')}
${example('Primjer: 4ˣ = 2^(x+3)', '<p>4 = 2², pa: (2²)ˣ = 2^(x+3)</p><p>2^(2x) = 2^(x+3)</p><p>2x = x+3 → x = 3</p>')}
${backref('Eksponencijalna funkcija')}`,
    quiz: [{q:"Riješi: 3ˣ = 27",o:["x=3","x=9","x=27","x=1/3"],c:0},{q:"Riješi: 2^(2x)=16",o:["x=2","x=4","x=8","x=1"],c:0}]
  },
  { title: 'Logaritamska funkcija', video_url: null,
    content: `<h2 style="color:#a78bfa;">Logaritamska funkcija</h2>
<p>Logaritam je inverzna operacija stepenovanja. Ako je aˣ = b, onda je x = log_a(b).</p>
${formula('log<sub>a</sub>(b) = x &nbsp;⟺&nbsp; a<sup>x</sup> = b')}
${formula('Osobine: log(xy) = log(x) + log(y)')}
${formula('log(x/y) = log(x) - log(y)')}
${formula('log(x<sup>n</sup>) = n·log(x)')}
${important('Logaritam je definisan samo za pozitivne argumente: log_a(x), x > 0!')}
${example('Primjeri', '<p>log₂(8) = 3 (jer 2³=8)</p><p>log₁₀(100) = 2 (jer 10²=100)</p><p>ln(e) = 1 (prirodni logaritam)</p>')}
${backref('Eksponencijalna funkcija')}`,
    quiz: [{q:"log₂(16) = ?",o:["2","4","8","16"],c:1},{q:"log₁₀(1000) = ?",o:["3","100","10","30"],c:0},{q:"ln(1) = ?",o:["1","0","e","∞"],c:1}]
  },
  { title: 'Logaritamske jednačine', video_url: null,
    content: `<h2 style="color:#a78bfa;">Logaritamske jednačine</h2>
<p>Logaritamska jednačina je jednačina u kojoj se nepoznata nalazi unutar logaritma.</p>
${formula('log<sub>a</sub>(f(x)) = b &nbsp;→&nbsp; f(x) = a<sup>b</sup>')}
<p><strong>Postupak:</strong> 1) Primijeniti definiciju logaritma. 2) Riješiti jednačinu. 3) Provjeriti da argument bude pozitivan!</p>
${example('log₂(x-1) = 3', '<p>x-1 = 2³ = 8 → x = 9</p><p>Provjera: x-1 = 8 > 0 ✓</p>')}
${backref('Logaritamska funkcija')}`,
    quiz: [{q:"Riješi: log₃(x) = 2",o:["x=6","x=9","x=8","x=3"],c:1},{q:"log₂(x-3)=1, x=?",o:["4","5","3","1"],c:1}]
  },
  { title: 'Logaritamske jednačine – utvrđivanje', video_url: null,
    content: `<h2 style="color:#a78bfa;">Logaritamske jednačine — utvrđivanje</h2>
<p>Sistematizacija i složeniji primjeri logaritamskih jednačina.</p>
${example('log₂(x) + log₂(x-2) = 3', '<p>log₂(x(x-2)) = 3</p><p>x(x-2) = 8</p><p>x²-2x-8=0 → x=4 ili x=-2</p><p>Provjera: x=4: log₂(4)+log₂(2)=2+1=3 ✓</p><p>x=-2: log₂(-2) nije definisan ✗</p><p>Rješenje: x=4</p>')}
${example('log(x²) = 2·log(x)?', '<p>Ovo važi samo za x > 0!</p><p>Za x < 0: log(x²) = 2·log|x| ≠ 2·log(x)</p>')}
${important('UVIJEK provjeravaj rješenja — argument logaritma mora biti pozitivan!')}
${backref('Logaritamske jednačine')}
${backref('Kvadratna jednačina')}`,
    quiz: [{q:"log(x)+log(x+3)=1, rješenje je:",o:["x=2","x=-5","x=2 i x=-5","x=10"],c:0},{q:"log₃(x²) za x=-3 je:",o:["2","Nedefinisano","log₃(9)=2","-2"],c:2}]
  },
];

async function insert(lec, index) {
  const quizStr = `\n\nQUIZ_DATA:${JSON.stringify(lec.quiz.map(q => ({question:q.q,options:q.o,correct:q.c})))}:QUIZ_DATA`;
  const res = await fetch(`${URL}/rest/v1/lectures`, {
    method: 'POST', headers,
    body: JSON.stringify({
      title: lec.title,
      subject: 'Matematika',
      class_number: 2,
      content: lec.content + quizStr,
      author_id: AUTHOR,
      video_url: lec.video_url || null,
    })
  });
  console.log(`${res.ok ? '✅' : '❌'} ${index+1}. ${lec.title}`);
}

const all = [...lectures, ...lectures2, ...lectures3, ...lectures4];
console.log(`Inserting ${all.length} lectures...`);
for (let i = 0; i < all.length; i++) {
  await insert(all[i], i);
}
console.log('Done!');
