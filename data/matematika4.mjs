export const matematika4 = [
{title:"Pojam niza i osobine",subject:"Matematika",class_number:4,content:`Brojni niz je funkcija koja svakom prirodnom broju n pridružuje realan broj aₙ. Zapisuje se (aₙ)=a₁,a₂,a₃,... Može biti zadat eksplicitno (aₙ=1/n), rekurzivno (aₙ₊₁=2aₙ+1) ili opisno.

Niz je ograničen odozgo ako postoji M sa aₙ≤M, odozdo ako postoji m sa aₙ≥m. Ograničen niz je ograničen sa obje strane. Rastući: aₙ₊₁>aₙ, opadajući: aₙ₊₁<aₙ. Monoton niz je rastući ili opadajući.

Važni nizovi: aritmetički aₙ=a₁+(n−1)d, geometrijski aₙ=a₁·qⁿ⁻¹, harmonijski aₙ=1/n.

<!--QUIZ_DATA
[{"question":"Šta je brojni niz?","options":["Konačan skup brojeva","Funkcija sa prirodnih u realne brojeve","Jednačina sa n","Zbir prirodnih brojeva"],"correct":1},{"question":"Kada je niz ograničen?","options":["Kada raste","Kada konvergira","Kada je ograničen sa obje strane","Kada ima konačno članova"],"correct":2},{"question":"Opšti član aritmetičkog niza?","options":["aₙ=a₁·qⁿ⁻¹","aₙ=a₁+(n−1)d","aₙ=n²","aₙ=1/n"],"correct":1}]
QUIZ_DATA-->`},
{title:"Konvergencija brojnog niza",subject:"Matematika",class_number:4,content:`Niz (aₙ) konvergira ka L ako za svako ε>0 postoji N takvo da za n>N važi |aₙ−L|<ε. Pišemo lim aₙ=L. Članovi se proizvoljno približavaju L kad n raste.

Konvergentan niz je ograničen, ali obrnuto ne važi — niz (−1)ⁿ je ograničen ali divergentan. Primjeri: 1/n→0, (−1)ⁿ divergira, n→∞ divergira.

Pravila: lim(aₙ±bₙ)=lim aₙ±lim bₙ, lim(aₙ·bₙ)=lim aₙ·lim bₙ. Korisno: lim(1/nᵖ)=0 za p>0, lim(qⁿ)=0 za |q|<1.

<!--QUIZ_DATA
[{"question":"Šta znači da niz konvergira ka L?","options":["Svi članovi su L","Članovi se približavaju L za veliko n","Niz raste do L","L je max niza"],"correct":1},{"question":"Da li je svaki ograničen niz konvergentan?","options":["Da","Ne, npr. (−1)ⁿ","Da, ako je monoton","Nikada"],"correct":1},{"question":"lim 1/n=?","options":["1","∞","0","Ne postoji"],"correct":2}]
QUIZ_DATA-->`},
{title:"Svojstva konvergentnih nizova",subject:"Matematika",class_number:4,content:`Granična vrijednost konvergentnog niza je jedinstvena. Svaki konvergentan niz je ograničen. Konvergiraju i nizovi (aₙ±bₙ), (aₙ·bₙ), (aₙ/bₙ) ako lim bₙ≠0.

Teorema o sendviču: ako aₙ≤cₙ≤bₙ i lim aₙ=lim bₙ=L, tada lim cₙ=L. Primjer: −1/n≤sin n/n≤1/n, pa lim(sin n/n)=0.

Podniz konvergentnog niza konvergira ka istoj vrijednosti. Ako dva podniza imaju različite granice, polazni niz divergira.

<!--QUIZ_DATA
[{"question":"Može li konvergentan niz imati dvije granične vrijednosti?","options":["Da","Da, za oscilirajuće","Ne, granična vrijednost je jedinstvena","Da, za negativne"],"correct":2},{"question":"Teorema o sendviču kaže:","options":["Svaki niz između dva konvergentna konvergira","Ako aₙ≤cₙ≤bₙ i lim aₙ=lim bₙ=L, tada lim cₙ=L","Zbir konvergentnih konvergira","Svaki ograničen niz konvergira"],"correct":1},{"question":"Podniz konvergentnog niza:","options":["Može divergirati","Konvergira ka drugoj vrijednosti","Konvergira ka istoj graničnoj vrijednosti","Uvijek je monoton"],"correct":2}]
QUIZ_DATA-->`},
{title:"Monotoni nizovi - Vajerštrasova teorema",subject:"Matematika",class_number:4,content:`Vajerštrasova teorema: svaki monoton i ograničen niz je konvergentan. Rastući niz ograničen odozgo konvergira ka supremumu, opadajući ograničen odozdo ka infimumu.

Daje dovoljne uslove za konvergenciju bez poznavanja granične vrijednosti. Treba dokazati monotonost (npr. aₙ₊₁−aₙ>0) i ograničenost (naći M sa aₙ≤M).

Primjer: aₙ₊₁=√(2+aₙ), a₁=√2. Indukcijom: rastući i ograničen sa 2. Granična vrijednost iz L=√(2+L) daje L=2.

<!--QUIZ_DATA
[{"question":"Vajerštrasova teorema tvrdi:","options":["Svaki niz konvergira","Svaki monoton i ograničen niz konvergira","Svaki ograničen niz je monoton","Svaki konvergentan je monoton"],"correct":1},{"question":"Ka čemu konvergira rastući niz ograničen odozgo?","options":["Ka nuli","Ka infimumu","Ka supremumu","Ka beskonačnosti"],"correct":2},{"question":"Za primjenu Vajerštrasove teoreme treba dokazati:","options":["Monotonost i konvergenciju","Ograničenost i divergenciju","Monotonost i ograničenost","Samo monotonost"],"correct":2}]
QUIZ_DATA-->`},
{title:"Broj e",subject:"Matematika",class_number:4,content:`Ojlerov broj e je granična vrijednost niza eₙ=(1+1/n)ⁿ za n→∞. Niz je rastući i ograničen (sa 3), pa po Vajerštrasovoj teoremi konvergira. e≈2.71828... — iracionalan i transcendentan.

e je baza prirodnog logaritma. Funkcija eˣ je jednaka svom izvodu: (eˣ)'=eˣ. Alternativna definicija: e=Σ(1/n!) za n=0 do ∞.

Primjena u složenoj kamati: suma P uz kamatu r sa neprekidnim pripisivanjem nakon t godina: A=Peʳᵗ.

<!--QUIZ_DATA
[{"question":"Definicija broja e?","options":["e=π/2","e=lim(1+1/n)ⁿ","e=2.5","e=lim(n/(n+1))"],"correct":1},{"question":"Približna vrijednost e?","options":["3.14159","1.41421","2.71828","1.61803"],"correct":2},{"question":"Izvod eˣ?","options":["xeˣ⁻¹","eˣ","eˣ⁺¹","1/eˣ"],"correct":1}]
QUIZ_DATA-->`},
{title:"Osnovna svojstva funkcija",subject:"Matematika",class_number:4,content:`Funkcija f:A→B svakom elementu iz A pridružuje tačno jedan element iz B. Domen je A, kodomen B, slika (rang) je skup svih vrijednosti. Osobine: parnost, neparnost, periodičnost, monotonost, ograničenost.

Parna: f(−x)=f(x) (simetrija na y-osu). Neparna: f(−x)=−f(x) (centralna simetrija). Periodična: f(x+T)=f(x). Sin x je neparna i periodična sa T=2π.

Rastuća: x₁<x₂ ⟹ f(x₁)<f(x₂). Kompozicija: (f∘g)(x)=f(g(x)). Inverzna f⁻¹ postoji ako je f bijekcija.

<!--QUIZ_DATA
[{"question":"Kada je funkcija parna?","options":["f(−x)=−f(x)","f(−x)=f(x)","f(x+T)=f(x)","f(x)>0"],"correct":1},{"question":"Šta je period funkcije?","options":["Max vrijednost","Najmanji T za koji f(x+T)=f(x)","Dužina domena","Rastojanje između nula"],"correct":1},{"question":"Kada funkcija ima inverznu?","options":["Kada je parna","Kada je periodična","Kada je bijekcija","Uvijek"],"correct":2}]
QUIZ_DATA-->`},
{title:"Granična vrijednost funkcije",subject:"Matematika",class_number:4,content:`lim(x→a) f(x)=L ako za svako ε>0 postoji δ>0 takvo da |f(x)−L|<ε kad 0<|x−a|<δ. Granična vrijednost postoji ako su lijeva i desna jednake.

Pravila: lim(f±g)=lim f±lim g, lim(f·g)=lim f·lim g, lim(f/g)=lim f/lim g (lim g≠0).

Neodređeni oblici: 0/0, ∞/∞, 0·∞, ∞−∞, 1^∞ zahtijevaju posebne tehnike: faktorizacija, L'Hôpitalovo pravilo, smjena.

<!--QUIZ_DATA
[{"question":"Kada postoji granična vrijednost u tački?","options":["Uvijek","Kada je f definisana","Kada su lijeva i desna granična vrijednost jednake","Kada je f neprekidna"],"correct":2},{"question":"Šta je neodređeni oblik?","options":["Oblik bez rješenja","Izraz čija vrijednost se ne može direktno odrediti, npr. 0/0","Funkcija bez domena","Nedefinisan broj"],"correct":1},{"question":"lim(x→∞) f(x)=L znači:","options":["f(∞)=L","f(x) se približava L kad x raste","L je max funkcije","f je ograničena sa L"],"correct":1}]
QUIZ_DATA-->`},
{title:"Značajne granične vrijednosti funkcija",subject:"Matematika",class_number:4,content:`Prva značajna: lim(x→0) sin x/x=1. Fundamentalna za diferencijalni račun — iz nje slijedi (sin x)'=cos x. Dokazuje se geometrijski pomoću površina.

Druga značajna: lim(x→∞)(1+1/x)ˣ=e, ekvivalentno lim(x→0)(1+x)^(1/x)=e.

Izvedene: lim(x→0) tg x/x=1, lim(x→0) arcsin x/x=1, lim(x→0)(eˣ−1)/x=1, lim(x→0) ln(1+x)/x=1, lim(x→0)(aˣ−1)/x=ln a.

<!--QUIZ_DATA
[{"question":"lim(x→0) sin x/x=?","options":["0","∞","1","π"],"correct":2},{"question":"lim(x→∞)(1+1/x)ˣ=?","options":["1","∞","0","e"],"correct":3},{"question":"lim(x→0)(eˣ−1)/x=?","options":["0","e","1","∞"],"correct":2}]
QUIZ_DATA-->`},
{title:"Neprekidnost funkcije",subject:"Matematika",class_number:4,content:`Funkcija f je neprekidna u a ako: 1) f(a) definisano, 2) postoji lim f(x) za x→a, 3) lim f(x)=f(a). Grafik se može nacrtati bez podizanja olovke.

Prekidi I vrste: konačne jednostrane granice ali različite (skok) ili jednake ali ≠f(a) (otklonjivi). Prekidi II vrste: bar jedna granična vrijednost ne postoji ili je beskonačna.

Teorema o međuvrijednosti: neprekidna f na [a,b] prima svaku vrijednost između f(a) i f(b). Vajerštrasova: neprekidna f na [a,b] dostiže max i min.

<!--QUIZ_DATA
[{"question":"Uslovi neprekidnosti u tački a?","options":["Samo f(a) definisano","f(a) definisano, lim postoji i lim=f(a)","Samo granična vrijednost postoji","Funkcija rastuća"],"correct":1},{"question":"Šta je otklonjivi prekid?","options":["Granična vrijednost ne postoji","Beskonačna granična vrijednost","Granična vrijednost postoji ali ≠f(a)","Prekid sa skokom"],"correct":2},{"question":"Teorema o međuvrijednosti?","options":["Neprekidna dostiže max","Između f(a) i f(b) neprekidna prima svaku međuvrijednost","Svaka funkcija neprekidna","Grafik bez podizanja olovke"],"correct":1}]
QUIZ_DATA-->`},
{title:"Asimptote funkcije",subject:"Matematika",class_number:4,content:`Asimptote su prave kojima se grafik neograničeno približava. Vertikalna x=a: lim(x→a) f(x)=±∞. Horizontalna y=b: lim(x→±∞) f(x)=b. Kosa y=kx+n: k=lim f(x)/x, n=lim(f(x)−kx).

Primjer: f(x)=(2x+1)/(x−3) ima vertikalnu x=3 i horizontalnu y=2. Racionalna P(x)/Q(x) ima vertikalne asimptote u nulama Q(x), horizontalnu ako stepen P≤stepen Q, kosu ako stepen P=stepen Q+1.

Asimptote su ključne za skiciranje grafika jer opisuju ponašanje na krajevima domena i oko prekida.

<!--QUIZ_DATA
[{"question":"Kada ima vertikalnu asimptotu x=a?","options":["f(a)=0","lim(x→a) f(x)=±∞","f neprekidna u a","f(a) definisano"],"correct":1},{"question":"Horizontalna asimptota f(x)=(3x+1)/(x−1)?","options":["y=1","y=3","y=0","Nema"],"correct":1},{"question":"Kada racionalna funkcija ima kosu asimptotu?","options":["Stepen brojioca < imenioca","Stepen brojioca za 1 veći","Stepeni jednaki","Nikada"],"correct":1}]
QUIZ_DATA-->`},
{title:"Pojam izvoda",subject:"Matematika",class_number:4,content:`Izvod f u x₀ je f'(x₀)=lim(h→0)[f(x₀+h)−f(x₀)]/h. Geometrijski: koeficijent pravca tangente. Fizički: brzina (izvod puta po vremenu).

Diferencijabilna funkcija je neprekidna, ali obrnuto ne važi — |x| je neprekidna u 0 ali nije diferencijabilna (šiljak). Oznake: f'(x), df/dx, Df.

Osnovni izvodi: (c)'=0, (xⁿ)'=nxⁿ⁻¹, (sin x)'=cos x, (cos x)'=−sin x, (eˣ)'=eˣ, (ln x)'=1/x.

<!--QUIZ_DATA
[{"question":"Šta geometrijski predstavlja izvod?","options":["Površinu ispod grafika","Koeficijent pravca tangente","Vrijednost funkcije","Dužinu luka"],"correct":1},{"question":"Da li je svaka neprekidna funkcija diferencijabilna?","options":["Da","Ne, npr. |x| u 0","Da ako monotona","Da ako ograničena"],"correct":1},{"question":"Izvod eˣ?","options":["xeˣ⁻¹","eˣ","1/eˣ","eˣ⁺¹"],"correct":1}]
QUIZ_DATA-->`},
{title:"Pravila diferenciranja",subject:"Matematika",class_number:4,content:`Zbir: (f±g)'=f'±g'. Proizvod: (f·g)'=f'·g+f·g'. Količnik: (f/g)'=(f'g−fg')/g². Konstanta: (cf)'=c·f'.

Primjer: f(x)=x²sin x → f'=2x sin x+x² cos x. Za f(x)=(x²+1)/(x−3): f'=(2x(x−3)−(x²+1))/(x−3)²=(x²−6x−1)/(x−3)².

Česta greška: izvod proizvoda NIJE proizvod izvoda. Kod količnika paziti na redosljed u brojiocu.

<!--QUIZ_DATA
[{"question":"Pravilo za izvod proizvoda?","options":["(f·g)'=f'·g'","(f·g)'=f'·g+f·g'","(f·g)'=f'·g−f·g'","(f·g)'=f'+g'"],"correct":1},{"question":"Pravilo za izvod količnika?","options":["(f/g)'=f'/g'","(f/g)'=(f'g−fg')/g²","(f/g)'=(fg'−f'g)/g²","(f/g)'=f'g+fg'"],"correct":1},{"question":"Izvod f(x)=3x⁴?","options":["3x³","12x³","12x⁴","4x³"],"correct":1}]
QUIZ_DATA-->`},
{title:"Izvod složene funkcije",subject:"Matematika",class_number:4,content:`Pravilo lanca: [f(g(x))]'=f'(g(x))·g'(x). Izvod spoljašnje (u unutrašnjoj) puta izvod unutrašnje.

Primjeri: y=sin(x²) → y'=cos(x²)·2x. y=e^(3x+1) → y'=3e^(3x+1). y=ln(x²+1) → y'=2x/(x²+1).

Višestruka primjena: y=sin²(eˣ)=[sin(eˣ)]² → y'=2sin(eˣ)·cos(eˣ)·eˣ — tri sloja, svaki daje faktor.

<!--QUIZ_DATA
[{"question":"Pravilo lanca?","options":["[f(g(x))]'=f'(x)·g'(x)","[f(g(x))]'=f'(g(x))·g'(x)","[f(g(x))]'=f(g'(x))","[f(g(x))]'=f'(g(x))"],"correct":1},{"question":"Izvod y=e^(2x)?","options":["e^(2x)","2e^(2x)","2xe^(2x)","e^(2x)/2"],"correct":1},{"question":"Izvod y=ln(3x)?","options":["3/x","1/(3x)","1/x","3ln(3x)"],"correct":2}]
QUIZ_DATA-->`},
{title:"Diferencijal funkcije - tangenta i normala",subject:"Matematika",class_number:4,content:`Diferencijal: dy=f'(x)dx. Aproksimira priraštaj funkcije: f(x₀+Δx)≈f(x₀)+f'(x₀)Δx. Tangenta u (x₀,f(x₀)): y−f(x₀)=f'(x₀)(x−x₀).

Normala je okomita na tangentu: y−f(x₀)=−1/f'(x₀)·(x−x₀). Primjer za f(x)=x² u x₀=1: tangenta y=2x−1, normala y=−x/2+3/2.

Diferencijal za x=1, dx=0.01: dy=0.02, stvarni priraštaj Δy=1.01²−1=0.0201 — dobra aproksimacija.

<!--QUIZ_DATA
[{"question":"Diferencijal funkcije?","options":["dy=f(x)dx","dy=f'(x)dx","dy=f''(x)dx","dy=f(x)/dx"],"correct":1},{"question":"Jednačina tangente u (x₀,f(x₀))?","options":["y=f'(x₀)x","y−f(x₀)=f'(x₀)(x−x₀)","y=f(x₀)+x₀","y−x₀=f(x₀)(x−f'(x₀))"],"correct":1},{"question":"Odnos tangente i normale?","options":["Paralelne","Okomite","Poklapaju se","Pod 45°"],"correct":1}]
QUIZ_DATA-->`},
{title:"Monotonost funkcije",subject:"Matematika",class_number:4,content:`f'(x)>0 → funkcija rastuća, f'(x)<0 → opadajuća. Kritične tačke: f'(x)=0 ili f' ne postoji — kandidati za ekstremume.

Postupak: naći f', riješiti f'(x)=0, odrediti znak f' na intervalima. Promjena +→− je lokalni max, −→+ lokalni min (test prvog izvoda).

Test drugog izvoda: f'(x₀)=0 i f''(x₀)<0 → max, f''(x₀)>0 → min. Primjer: f(x)=x³−3x, f'=3(x−1)(x+1), kritične x=±1, max u −1, min u 1.

<!--QUIZ_DATA
[{"question":"Kada je funkcija rastuća?","options":["f'(x)=0","f'(x)<0","f'(x)>0","f''(x)>0"],"correct":2},{"question":"Šta su kritične tačke?","options":["Gdje f(x)=0","Gdje f'(x)=0 ili f' ne postoji","Gdje f neprekidna","Prevojne tačke"],"correct":1},{"question":"Znak f' se mijenja +→−:","options":["Lokalni min","Prevojna tačka","Lokalni max","Infleksija"],"correct":2}]
QUIZ_DATA-->`},
];
