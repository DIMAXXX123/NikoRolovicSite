// add-missing.mjs — Bulk-add missing lectures to Supabase
const SUPABASE_URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg';
const AUTHOR_ID = '241c9077-b700-4400-8f96-20e3a650eef4';

const allLectures = [
  // ======================== MATEMATIKA I (class 1) ========================
  {
    title: "Iskazi i operacije sa iskazima",
    subject: "Matematika",
    class_number: 1,
    content: `Iskaz je rečenica koja može biti tačna ili netačna, ali ne oboje istovremeno. Primjeri iskaza su: "Broj 5 je prost" (tačan iskaz) ili "3 > 7" (netačan iskaz). Pitanja, uzvici i naredbe nisu iskazi jer im se ne može dodijeliti istinitosna vrijednost.

Osnovne logičke operacije sa iskazima su: konjunkcija (∧, "i"), disjunkcija (∨, "ili"), negacija (¬, "ne"), implikacija (⇒, "ako... onda") i ekvivalencija (⇔, "ako i samo ako"). Konjunkcija dva iskaza je tačna samo ako su oba iskaza tačna, dok je disjunkcija tačna ako je bar jedan iskaz tačan.

Implikacija p ⇒ q je netačna samo kada je p tačno a q netačno. Ekvivalencija p ⇔ q je tačna kada oba iskaza imaju istu istinitosnu vrijednost. Ove operacije su temelj matematičke logike i koriste se u dokazivanju teorema.

QUIZ_DATA:[{"question":"Koji od sljedećih izraza je iskaz?","options":["Koliko imaš godina?","Broj 7 je paran","Zatvori vrata!","x + 3 = 5"],"correct":1},{"question":"Konjunkcija dva iskaza je tačna kada:","options":["Bar jedan iskaz je tačan","Oba iskaza su tačna","Oba iskaza su netačna","Nijedan iskaz nije tačan"],"correct":1},{"question":"Implikacija p ⇒ q je netačna samo kada:","options":["p je tačno i q je tačno","p je netačno i q je tačno","p je tačno i q je netačno","p je netačno i q je netačno"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Iskazne formule i tautologija",
    subject: "Matematika",
    class_number: 1,
    content: `Iskazna formula je izraz sastavljen od iskaznih promjenljivih (p, q, r...) i logičkih veznika (¬, ∧, ∨, ⇒, ⇔). Istinitosna tablica se koristi za određivanje istinitosne vrijednosti formule za sve moguće kombinacije vrijednosti promjenljivih. Za n promjenljivih, tablica ima 2ⁿ redova.

Tautologija je iskazna formula koja je tačna za sve moguće vrijednosti iskaznih promjenljivih. Primjer tautologije je p ∨ ¬p (zakon isključenja trećeg). Kontradikcija je formula koja je uvijek netačna, npr. p ∧ ¬p. Formula koja nije ni tautologija ni kontradikcija naziva se iskazna forma.

Neke važne tautologije su: De Morganovi zakoni ¬(p ∧ q) ⇔ (¬p ∨ ¬q) i ¬(p ∨ q) ⇔ (¬p ∧ ¬q), zakon dvojne negacije ¬(¬p) ⇔ p, i zakon kontrapozicije (p ⇒ q) ⇔ (¬q ⇒ ¬p). Ovi zakoni su ključni za logičko zaključivanje.

QUIZ_DATA:[{"question":"Šta je tautologija?","options":["Formula koja je uvijek netačna","Formula koja je uvijek tačna","Formula koja zavisi od vrijednosti promjenljivih","Formula bez promjenljivih"],"correct":1},{"question":"De Morganov zakon glasi:","options":["¬(p ∧ q) ⇔ (¬p ∧ ¬q)","¬(p ∧ q) ⇔ (¬p ∨ ¬q)","¬(p ∨ q) ⇔ (¬p ∨ ¬q)","(p ∧ q) ⇔ (p ∨ q)"],"correct":1},{"question":"Koliko redova ima istinitosna tablica za formulu sa 3 promjenljive?","options":["3","6","8","9"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Kvantori",
    subject: "Matematika",
    class_number: 1,
    content: `Kvantori su logički simboli koji izražavaju količinu objekata koji zadovoljavaju neko svojstvo. Univerzalni kvantor ∀ (za svako) tvrdi da neko svojstvo važi za sve elemente datog skupa. Na primjer, ∀x ∈ ℕ: x + 0 = x znači da sabiranje nule ne mijenja nijedan prirodan broj.

Egzistencijalni kvantor ∃ (postoji) tvrdi da postoji bar jedan element koji zadovoljava dato svojstvo. Na primjer, ∃x ∈ ℤ: x² = 4 znači da postoji cijeli broj čiji je kvadrat 4. Negacija kvantora je važna operacija: negacija ∀x: P(x) je ∃x: ¬P(x), a negacija ∃x: P(x) je ∀x: ¬P(x).

Kvantori se mogu kombinovati u složene izraze. Redoslijed kvantora je bitan — ∀x ∃y: x + y = 0 (za svaki x postoji y tako da je zbir nula) je tačna izjava u skupu cijelih brojeva, dok ∃y ∀x: x + y = 0 (postoji y koji sabran sa svakim x daje nulu) nije tačna.

QUIZ_DATA:[{"question":"Univerzalni kvantor ∀ znači:","options":["Postoji bar jedan","Za svako","Ne postoji","Za tačno jedan"],"correct":1},{"question":"Negacija iskaza ∀x: P(x) je:","options":["∀x: ¬P(x)","∃x: P(x)","∃x: ¬P(x)","¬∀x: ¬P(x)"],"correct":2},{"question":"Iskaz ∃x ∈ ℕ: x + 1 = 1 je:","options":["Tačan, jer x = 0","Netačan, jer nula nije prirodan broj","Tačan, jer x = 1","Nema smisla"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: "Operacije sa skupovima",
    subject: "Matematika",
    class_number: 1,
    content: `Skup je dobro definisana kolekcija objekata koje zovemo elementi skupa. Skupovi se označavaju velikim slovima (A, B, C), a elementi malim (a, b, c). Prazan skup ∅ je skup koji nema nijedan element. Skup A je podskup skupa B (A ⊆ B) ako svaki element skupa A pripada i skupu B.

Osnovne operacije sa skupovima su: unija A ∪ B (svi elementi koji pripadaju A ili B ili oboma), presjek A ∩ B (elementi koji pripadaju i A i B), razlika A \\ B (elementi koji pripadaju A ali ne B) i komplement Aᶜ (svi elementi univerzalnog skupa koji ne pripadaju A).

Za operacije sa skupovima važe zakoni slični logičkim zakonima: komutativnost (A ∪ B = B ∪ A), asocijativnost (A ∪ (B ∪ C) = (A ∪ B) ∪ C), distributivnost (A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C)) i De Morganovi zakoni ((A ∪ B)ᶜ = Aᶜ ∩ Bᶜ). Venovi dijagrami se koriste za grafičko prikazivanje odnosa među skupovima.

QUIZ_DATA:[{"question":"Presjek skupova A = {1,2,3} i B = {2,3,4} je:","options":["{1,2,3,4}","{2,3}","{1,4}","{1}"],"correct":1},{"question":"De Morganov zakon za skupove glasi:","options":["(A ∪ B)ᶜ = Aᶜ ∪ Bᶜ","(A ∪ B)ᶜ = Aᶜ ∩ Bᶜ","(A ∩ B)ᶜ = Aᶜ ∩ Bᶜ","(A ∪ B) = Aᶜ ∩ Bᶜ"],"correct":1},{"question":"Ako je A ⊆ B, tada A ∩ B jednako:","options":["B","A","∅","A ∪ B"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Prirodni i cijeli brojevi",
    subject: "Matematika",
    class_number: 1,
    content: `Prirodni brojevi ℕ = {1, 2, 3, ...} su najstariji poznati brojevi koji se koriste za brojanje. Zajedno sa nulom formiraju skup ℕ₀ = {0, 1, 2, 3, ...}. Prirodni brojevi su zatvoreni za sabiranje i množenje, što znači da zbir i proizvod dva prirodna broja uvijek daju prirodan broj.

Cijeli brojevi ℤ = {..., -2, -1, 0, 1, 2, ...} nastaju proširenjem prirodnih brojeva negativnim brojevima. Za razliku od prirodnih brojeva, cijeli brojevi su zatvoreni i za oduzimanje. Apsolutna vrijednost cijelog broja |a| predstavlja rastojanje broja a od nule na brojevnoj pravoj.

Osobine operacija sa cijelim brojevima: sabiranje i množenje su komutativni (a + b = b + a, a·b = b·a) i asocijativni. Neutralni element za sabiranje je 0, a za množenje 1. Svaki cijeli broj a ima suprotan broj -a tako da je a + (-a) = 0. Distributivni zakon a·(b + c) = a·b + a·c povezuje množenje i sabiranje.

QUIZ_DATA:[{"question":"Koji skup je zatvoren za oduzimanje?","options":["Prirodni brojevi","Cijeli brojevi","Samo pozitivni brojevi","Nijedan od navedenih"],"correct":1},{"question":"Apsolutna vrijednost broja -7 je:","options":["-7","7","0","1/7"],"correct":1},{"question":"Neutralni element za množenje cijelih brojeva je:","options":["0","1","-1","Ne postoji"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Djeljivost cijelih brojeva",
    subject: "Matematika",
    class_number: 1,
    content: `Kažemo da cijeli broj a dijeli cijeli broj b (zapisujemo a|b) ako postoji cijeli broj k takav da je b = a·k. Na primjer, 3|12 jer je 12 = 3·4. Broj koji je djeljiv sa 2 je paran, a koji nije — neparan. Svaki cijeli broj se može zapisati kao b = a·q + r, gdje je q količnik a r ostatak pri dijeljenju (0 ≤ r < |a|).

Prost broj je prirodan broj veći od 1 koji je djeljiv samo sa 1 i samim sobom. Prvih nekoliko prostih brojeva su: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29. Broj 2 je jedini paran prost broj. Složen broj je prirodan broj veći od 1 koji nije prost. Osnovna teorema aritmetike kaže da se svaki prirodan broj veći od 1 može na jedinstven način zapisati kao proizvod prostih brojeva.

Kriterijumi djeljivosti olakšavaju provjeru: broj je djeljiv sa 2 ako mu je posljednja cifra parna, sa 3 ako je zbir cifara djeljiv sa 3, sa 5 ako se završava na 0 ili 5, sa 9 ako je zbir cifara djeljiv sa 9, i sa 10 ako se završava na 0.

QUIZ_DATA:[{"question":"Koji od sljedećih brojeva je prost?","options":["15","21","23","27"],"correct":2},{"question":"Broj 144 pri dijeljenju sa 7 daje ostatak:","options":["2","4","5","6"],"correct":3},{"question":"Kriterijum djeljivosti sa 3 glasi:","options":["Posljednja cifra je djeljiva sa 3","Zbir cifara je djeljiv sa 3","Broj se završava na 3","Broj je neparan"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "NZD NZS i Euklidov algoritam",
    subject: "Matematika",
    class_number: 1,
    content: `Najveći zajednički djelilac (NZD) dva ili više brojeva je najveći broj koji dijeli sve date brojeve. Na primjer, NZD(12, 18) = 6 jer je 6 najveći broj koji dijeli i 12 i 18. Najmanji zajednički sadržalac (NZS) je najmanji pozitivan broj koji je djeljiv sa svim datim brojevima. NZS(12, 18) = 36.

Euklidov algoritam je efikasan metod za nalaženje NZD. Zasniva se na principu da NZD(a, b) = NZD(b, a mod b). Postupak se ponavlja dok ostatak ne postane 0, a posljednji nenulti ostatak je NZD. Na primjer: NZD(48, 18): 48 = 2·18 + 12, zatim 18 = 1·12 + 6, pa 12 = 2·6 + 0, dakle NZD(48, 18) = 6.

Veza između NZD i NZS dva broja glasi: NZD(a, b) · NZS(a, b) = |a · b|. Ova formula omogućava da se NZS izračuna ako znamo NZD. Dva broja su uzajamno prosta ako je njihov NZD jednak 1, npr. NZD(8, 15) = 1.

QUIZ_DATA:[{"question":"NZD(24, 36) iznosi:","options":["6","8","12","24"],"correct":2},{"question":"Koristeći Euklidov algoritam, NZD(56, 21) je:","options":["3","7","14","21"],"correct":1},{"question":"Ako je NZD(a, b) = 1, brojevi a i b su:","options":["Prosti","Parni","Uzajamno prosti","Složeni"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Racionalni brojevi",
    subject: "Matematika",
    class_number: 1,
    content: `Racionalan broj je svaki broj koji se može zapisati u obliku razlomka p/q, gdje su p i q cijeli brojevi i q ≠ 0. Skup racionalnih brojeva označavamo sa ℚ. Svaki cijeli broj je i racionalan (npr. 5 = 5/1). Dva razlomka a/b i c/d su jednaka ako je a·d = b·c.

Operacije sa racionalnim brojevima: sabiranje a/b + c/d = (ad + bc)/bd, oduzimanje a/b - c/d = (ad - bc)/bd, množenje a/b · c/d = ac/bd, dijeljenje a/b ÷ c/d = a/b · d/c = ad/bc. Razlomak se skraćuje dijeljenjem brojioca i imenioca njihovim NZD.

Svaki racionalan broj se može predstaviti kao konačan ili periodičan decimalan broj. Na primjer, 1/4 = 0.25 (konačan), a 1/3 = 0.333... (periodičan). Obrnuto, svaki konačan ili periodičan decimalan broj je racionalan. Racionalni brojevi su gusti na brojevnoj pravoj — između bilo koja dva racionalna broja uvijek postoji još jedan.

QUIZ_DATA:[{"question":"Koji od sljedećih brojeva NIJE racionalan?","options":["0.75","√2","1/3","-5"],"correct":1},{"question":"Rezultat dijeljenja 2/3 ÷ 4/5 je:","options":["8/15","5/6","10/12","6/20"],"correct":1},{"question":"Decimalni zapis broja 5/6 je:","options":["0.833...","0.666...","0.8","0.85"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: "Realni brojevi",
    subject: "Matematika",
    class_number: 1,
    content: `Realni brojevi ℝ obuhvataju sve racionalne i iracionalne brojeve. Iracionalni brojevi su oni koji se ne mogu zapisati kao razlomak dva cijela broja — njihov decimalni zapis je beskonačan i neperiodičan. Poznati primjeri su √2, π i e. Pitagora je dokazao da √2 nije racionalan broj.

Skup realnih brojeva se može prikazati brojevnom pravom — svakom realnom broju odgovara tačno jedna tačka na pravoj i obrnuto. Realni brojevi zadovoljavaju aksiom potpunosti: svaki neprazan ograničen podskup realnih brojeva ima supremum. Ovo svojstvo razlikuje realne od racionalnih brojeva.

Intervali su podskupovi realnih brojeva: otvoreni (a, b), zatvoreni [a, b], poluotvoreni [a, b) ili (a, b]. Apsolutna vrijednost |x| realnog broja x predstavlja rastojanje od nule. Važe nejednakosti: |a + b| ≤ |a| + |b| (nejednakost trougla) i |a · b| = |a| · |b|.

QUIZ_DATA:[{"question":"Koji od sljedećih brojeva je iracionalan?","options":["3/7","0.25","√3","0.121212..."],"correct":2},{"question":"Interval (2, 5] sadrži:","options":["Broj 2","Broj 5","Oba broja","Nijedan"],"correct":1},{"question":"Nejednakost trougla za apsolutne vrijednosti glasi:","options":["|a + b| ≥ |a| + |b|","|a + b| ≤ |a| + |b|","|a + b| = |a| + |b|","|a · b| ≤ |a| · |b|"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Procenat i proporcija",
    subject: "Matematika",
    class_number: 1,
    content: `Procenat (%) je način izražavanja dijela cjeline kao stotog dijela. Ako kažemo 25%, to znači 25 od 100, ili razlomak 25/100 = 1/4. Osnovne formule: p% od broja a je a·p/100, procenat broja b u odnosu na a je (b/a)·100%, a osnovica je a = b·100/p.

Proporcija je jednakost dva odnosa: a/b = c/d, čita se "a prema b jednako c prema d". Osnovno svojstvo proporcije je da je proizvod krajnjih članova jednak proizvodu srednjih: a·d = b·c. Direktna proporcionalnost znači da kad jedna veličina raste, druga raste u istom odnosu (y = kx). Obrnuta proporcionalnost znači da kad jedna raste, druga opada (y = k/x).

Procentni račun ima široku primjenu: popusti, porezi, kamate, statistika. Procentualno povećanje se računa kao (nova - stara)/stara · 100%. Složeni procenat: ako se iznos P uvećava za r% godišnje, nakon n godina iznosi P·(1 + r/100)ⁿ.

QUIZ_DATA:[{"question":"Koliko je 15% od 200?","options":["15","20","30","35"],"correct":2},{"question":"Ako proporcija glasi 3/x = 9/12, vrijednost x je:","options":["2","3","4","6"],"correct":2},{"question":"Cijena artikla je porasla sa 80€ na 100€. Procentualno povećanje je:","options":["20%","25%","80%","100%"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Operacije sa polinomima",
    subject: "Matematika",
    class_number: 1,
    content: `Polinom je algebarski izraz oblika aₙxⁿ + aₙ₋₁xⁿ⁻¹ + ... + a₁x + a₀, gdje su aᵢ koeficijenti, a n stepen polinoma. Monomi su polinomi sa jednim članom, binomi sa dva, a trinomi sa tri. Stepen polinoma je najveći eksponent promjenljive sa nenultim koeficijentom.

Sabiranje i oduzimanje polinoma vrši se sabiranjem/oduzimanjem sličnih monoma — članova sa istim eksponentima. Na primjer: (3x² + 2x - 1) + (x² - 4x + 5) = 4x² - 2x + 4. Množenje polinoma se vrši množenjem svakog člana jednog polinoma sa svakim članom drugog i zatim sabiranjem sličnih članova.

Množenje polinoma koristi distributivni zakon. Na primjer: (2x + 3)(x - 1) = 2x·x + 2x·(-1) + 3·x + 3·(-1) = 2x² - 2x + 3x - 3 = 2x² + x - 3. Stepen proizvoda polinoma jednak je zbiru stepena činilaca.

QUIZ_DATA:[{"question":"Stepen polinoma 3x⁴ - 2x² + x - 7 je:","options":["2","3","4","7"],"correct":2},{"question":"Rezultat sabiranja (2x² - 3x + 1) + (x² + 5x - 4) je:","options":["3x² + 2x - 3","3x² - 2x + 3","x² + 2x - 3","3x² + 8x - 3"],"correct":0},{"question":"Proizvod (x + 2)(x - 3) je:","options":["x² - x - 6","x² + x - 6","x² - x + 6","x² - 5x - 6"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: "Formule za skraćeno množenje",
    subject: "Matematika",
    class_number: 1,
    content: `Formule za skraćeno množenje su algebarski identiteti koji olakšavaju množenje i faktorizaciju polinoma. Tri osnovne formule su: kvadrat zbira (a + b)² = a² + 2ab + b², kvadrat razlike (a - b)² = a² - 2ab + b², i razlika kvadrata a² - b² = (a + b)(a - b).

Za kubove važe formule: kub zbira (a + b)³ = a³ + 3a²b + 3ab² + b³, kub razlike (a - b)³ = a³ - 3a²b + 3ab² - b³, zbir kubova a³ + b³ = (a + b)(a² - ab + b²), i razlika kubova a³ - b³ = (a - b)(a² + ab + b²).

Ove formule se primjenjuju u oba smjera: za brzo množenje (npr. 101² = (100 + 1)² = 10000 + 200 + 1 = 10201) i za faktorizaciju (npr. x² - 9 = (x + 3)(x - 3)). Prepoznavanje ovih obrazaca je ključna vještina u algebri.

QUIZ_DATA:[{"question":"Koliko je (x + 5)²?","options":["x² + 25","x² + 5x + 25","x² + 10x + 25","x² + 10x + 5"],"correct":2},{"question":"Faktorizacija x² - 16 je:","options":["(x - 4)²","(x + 4)²","(x + 4)(x - 4)","(x - 8)(x + 2)"],"correct":2},{"question":"Zbir kubova a³ + b³ se faktorizuje kao:","options":["(a + b)³","(a + b)(a² - ab + b²)","(a + b)(a² + ab + b²)","(a - b)(a² + ab + b²)"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Dijeljenje polinoma",
    subject: "Matematika",
    class_number: 1,
    content: `Dijeljenje polinoma se vrši slično dijeljenju brojeva — metodom dugog dijeljenja. Ako polinom P(x) dijelimo polinomom D(x), dobijamo količnik Q(x) i ostatak R(x) tako da P(x) = D(x)·Q(x) + R(x), pri čemu je stepen ostatka manji od stepena djelioca.

Postupak dijeljenja: 1) Podijeliti vodeći član dividenda vodećim članom djelioca, 2) Pomnožiti djelilac dobijenim količnikom, 3) Oduzeti od dividenda, 4) Ponoviti sa ostatkom. Na primjer, (x³ + 2x² - x - 2) ÷ (x + 1): vodeći član x³ ÷ x = x², pa x²·(x+1) = x³+x², oduzimamo i nastavljamo.

Hornerova shema je brži metod dijeljenja polinoma linearnim izrazom (x - c). Koeficijenti polinoma se zapisuju u red, a postupak se izvodi uzastopnim množenjem i sabiranjem. Hornerova shema je posebno korisna za izračunavanje vrijednosti polinoma u datoj tački.

QUIZ_DATA:[{"question":"Pri dijeljenju P(x) sa D(x), stepen ostatka je:","options":["Jednak stepenu djelioca","Veći od stepena djelioca","Manji od stepena djelioca","Jednak stepenu količnika"],"correct":2},{"question":"Količnik (x² - 4) ÷ (x - 2) je:","options":["x - 2","x + 2","x² - 2","x"],"correct":1},{"question":"Hornerova shema se koristi za dijeljenje polinoma sa:","options":["Bilo kojim polinomom","Samo kvadratnim polinomom","Linearnim izrazom (x - c)","Samo konstantom"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Bezuova teorema",
    subject: "Matematika",
    class_number: 1,
    content: `Bezuova teorema (teorema o ostatku) kaže: ostatak pri dijeljenju polinoma P(x) linearnim izrazom (x - a) jednak je P(a), tj. vrijednosti polinoma za x = a. Ovo znači da za nalaženje ostatka nije potrebno izvršiti cijelo dijeljenje — dovoljno je izračunati P(a).

Posljedica Bezuove teoreme je faktorska teorema: ako je P(a) = 0, tada je (x - a) faktor polinoma P(x), tj. P(x) je djeljiv sa (x - a) bez ostatka. Obrnuto, ako je (x - a) faktor od P(x), onda je P(a) = 0. Broj a se tada naziva nula ili korijen polinoma.

Ova teorema ima praktičnu primjenu u faktorizaciji polinoma. Prvo se pronađu nule polinoma (probanjem cijelih djelilaca slobodnog člana), zatim se polinom dijeli sa (x - a) i postupak ponavlja. Na primjer, za P(x) = x³ - 6x² + 11x - 6, provjerimo P(1) = 0, pa je (x-1) faktor.

QUIZ_DATA:[{"question":"Prema Bezuovoj teoremi, ostatak dijeljenja P(x) = x³ + 1 sa (x - 1) je:","options":["0","1","2","-1"],"correct":2},{"question":"Ako je P(3) = 0, tada je faktor polinoma P(x):","options":["(x + 3)","(x - 3)","(x · 3)","3x"],"correct":1},{"question":"Nula polinoma P(x) je broj a za koji važi:","options":["P(a) = 1","P(a) = a","P(a) = 0","P(0) = a"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "NZS i NZD polinoma",
    subject: "Matematika",
    class_number: 1,
    content: `Najveći zajednički djelilac (NZD) dva polinoma je polinom najvećeg stepena koji dijeli oba data polinoma. Za nalaženje NZD, polinome prvo faktorišemo na proste faktore, a zatim uzmemo proizvod zajedničkih faktora sa najmanjim eksponentima.

Najmanji zajednički sadržalac (NZS) dva polinoma je polinom najmanjeg stepena koji je djeljiv sa oba data polinoma. NZS se dobija tako što uzmemo proizvod svih faktora sa najvećim eksponentima. Važi veza: NZD(P,Q) · NZS(P,Q) = P · Q (do na konstantu).

Primjer: za P(x) = x²-1 = (x-1)(x+1) i Q(x) = x²-2x+1 = (x-1)², NZD = (x-1) jer je to zajednički faktor sa manjim eksponentom, a NZS = (x-1)²(x+1) jer uzimamo sve faktore sa većim eksponentima. Ovo je ključno za rad sa algebarskim razlomcima.

QUIZ_DATA:[{"question":"NZD polinoma (x-1)²(x+2) i (x-1)(x+2)³ je:","options":["(x-1)(x+2)","(x-1)²(x+2)³","(x-1)²(x+2)","(x+2)"],"correct":0},{"question":"NZS polinoma x(x+1) i x²(x-1) je:","options":["x(x+1)(x-1)","x²(x+1)(x-1)","x²","x(x-1)"],"correct":1},{"question":"Za nalaženje NZD polinoma, prvo treba:","options":["Podijeliti polinome","Faktorisati polinome","Sabrati polinome","Naći stepene"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Algebarski razlomci - proširivanje i skraćivanje",
    subject: "Matematika",
    class_number: 1,
    content: `Algebarski razlomak je izraz oblika P(x)/Q(x), gdje su P(x) i Q(x) polinomi i Q(x) ≠ 0. Domen algebarskog razlomka čine sve vrijednosti promjenljive za koje imenilac nije jednak nuli. Na primjer, za razlomak (x+1)/(x²-4), domen su svi realni brojevi osim x = 2 i x = -2.

Skraćivanje algebarskog razlomka se vrši dijeljenjem brojioca i imenioca njihovim zajedničkim faktorom. Na primjer: (x²-1)/(x²+x) = (x-1)(x+1)/(x(x+1)) = (x-1)/x. Prije skraćivanja, obavezno je faktorisati i brojilac i imenilac.

Proširivanje je obrnuta operacija od skraćivanja — množimo brojilac i imenilac istim izrazom. Ovo se koristi pri svođenju razlomaka na zajednički imenilac. Na primjer, da proširimo 1/x izrazom (x+1), dobijamo (x+1)/(x(x+1)). Proširivanje ne mijenja vrijednost razlomka.

QUIZ_DATA:[{"question":"Domen razlomka 5/(x-3) su svi realni brojevi osim:","options":["x = 0","x = 5","x = 3","x = -3"],"correct":2},{"question":"Skraćeni oblik razlomka (x²-9)/(x+3) je:","options":["x - 3","x + 3","x² - 3","(x-3)/(x+3)"],"correct":0},{"question":"Proširivanje razlomka znači:","options":["Dijeljenje brojioca i imenioca","Množenje brojioca i imenioca istim izrazom","Sabiranje dva razlomka","Nalaženje domene"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Sabiranje i oduzimanje algebarskih razlomaka",
    subject: "Matematika",
    class_number: 1,
    content: `Sabiranje i oduzimanje algebarskih razlomaka sa istim imeniocem je jednostavno — sabiremo/oduzimamo samo brojioce, a imenilac ostaje isti: A/C ± B/C = (A ± B)/C. Rezultat treba uvijek skratiti ako je moguće.

Kada razlomci imaju različite imenioce, potrebno ih je svesti na zajednički imenilac. Najmanji zajednički imenilac (NZI) je NZS imenilaca. Postupak: 1) Faktorisati imenioce, 2) Naći NZS, 3) Proširiti svaki razlomak tako da mu imenilac bude NZI, 4) Sabrati/oduzeti brojioce.

Primjer: 1/(x-1) + 2/(x+1). NZI = (x-1)(x+1). Proširujemo: (x+1)/((x-1)(x+1)) + 2(x-1)/((x-1)(x+1)) = (x+1+2x-2)/((x-1)(x+1)) = (3x-1)/(x²-1). Uvijek provjeriti da li se rezultat može dodatno skratiti.

QUIZ_DATA:[{"question":"Rezultat 3/x + 5/x je:","options":["8/x²","8/2x","8/x","15/x"],"correct":2},{"question":"NZI razlomaka 1/(x+2) i 1/(x-2) je:","options":["x","(x+2)(x-2)","(x+2)+(x-2)","x²"],"correct":1},{"question":"Rezultat 1/x - 1/(x+1) je:","options":["1/(x(x+1))","0","x/(x+1)","2/(2x+1)"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: "Množenje i dijeljenje algebarskih razlomaka",
    subject: "Matematika",
    class_number: 1,
    content: `Množenje algebarskih razlomaka se vrši množenjem brojioca sa brojiocem i imenioca sa imeniocem: (A/B) · (C/D) = AC/BD. Prije množenja, preporučljivo je skratiti unakrsno — brojilac jednog sa imeniocem drugog razlomka — što pojednostavljuje račun.

Dijeljenje algebarskih razlomaka se svodi na množenje prvog razlomka recipročnom vrijednošću drugog: (A/B) ÷ (C/D) = (A/B) · (D/C) = AD/BC. Uslov je da C ≠ 0 i D ≠ 0. Na primjer: (x²-4)/(x+1) ÷ (x-2)/3 = (x²-4)/(x+1) · 3/(x-2) = 3(x+2)/(x+1).

Složeni algebarski razlomci (razlomak u razlomku) se pojednostavljuju tako što se i brojilac i imenilac spoljašnjeg razlomka pomnože NZI svih unutrašnjih razlomaka. Na primjer: (1/x + 1/y) / (1/x - 1/y) = pomnožimo sa xy: (y + x)/(y - x).

QUIZ_DATA:[{"question":"Rezultat (x/3) · (9/x²) je:","options":["3/x","3x","9/3x","x/3"],"correct":0},{"question":"Rezultat (x+1)/2 ÷ (x+1)/6 je:","options":["3","1/3","(x+1)²/12","6/2"],"correct":0},{"question":"Recipročna vrijednost razlomka (a+b)/c je:","options":["c/(a+b)","(a+b)/c","-c/(a+b)","1/(a+b)"],"correct":0}]:QUIZ_DATA`
  },

  // ======================== MATEMATIKA II (class 2) ========================
  {
    title: "Stepeni cjelobrojnog izložioca",
    subject: "Matematika",
    class_number: 2,
    content: `Stepen sa cjelobrojnim izložiocem se definiše kao: aⁿ = a·a·...·a (n puta) za n > 0, a⁰ = 1 za a ≠ 0, i a⁻ⁿ = 1/aⁿ za a ≠ 0. Pravila za stepene su osnov algebarskog računa i važe za sve cjelobrojne izložioce.

Osnovna pravila stepenovanja su: aᵐ · aⁿ = aᵐ⁺ⁿ, aᵐ ÷ aⁿ = aᵐ⁻ⁿ, (aᵐ)ⁿ = aᵐⁿ, (ab)ⁿ = aⁿbⁿ, (a/b)ⁿ = aⁿ/bⁿ. Ova pravila omogućavaju pojednostavljivanje složenih izraza sa stepenima.

Primjene stepenovanja su brojne: naučna notacija (3.2 × 10⁵ = 320000), eksponencijalni rast i opadanje, kompjuterska memorija (2¹⁰ = 1024 ≈ 1KB). Negativni izložioci se koriste za male brojeve: 10⁻³ = 0.001.

QUIZ_DATA:[{"question":"Koliko je 2⁻³?","options":["8","-8","1/8","-1/8"],"correct":2},{"question":"Pojednostavite: x⁵ · x⁻² =","options":["x³","x⁷","x¹⁰","1/x³"],"correct":0},{"question":"Koliko je (3²)³?","options":["729","27","81","243"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: "Osobine funkcija",
    subject: "Matematika",
    class_number: 2,
    content: `Funkcija f: A → B je pravilo koje svakom elementu skupa A (domen) pridružuje tačno jedan element skupa B (kodomen). Skup svih vrijednosti koje funkcija zaista prima naziva se slika ili rang funkcije. Grafik funkcije je skup svih tačaka (x, f(x)) u koordinatnoj ravni.

Osnovne osobine funkcija: parnost (f(-x) = f(x), grafik simetričan y-osi), neparnost (f(-x) = -f(x), grafik simetričan u odnosu na koordinatni početak), monotonost (rastuća ako x₁ < x₂ ⇒ f(x₁) < f(x₂), opadajuća ako x₁ < x₂ ⇒ f(x₁) > f(x₂)).

Ograničenost funkcije: f je ograničena odozgo ako postoji M tako da f(x) ≤ M za sve x iz domena, ograničena odozdo ako postoji m tako da f(x) ≥ m. Periodičnost: f je periodična sa periodom T ako f(x + T) = f(x) za sve x. Nule funkcije su vrijednosti x za koje je f(x) = 0.

QUIZ_DATA:[{"question":"Funkcija f(x) = x² je:","options":["Parna","Neparna","Ni parna ni neparna","Periodična"],"correct":0},{"question":"Funkcija je rastuća na intervalu ako:","options":["f(x₁) > f(x₂) za x₁ < x₂","f(x₁) < f(x₂) za x₁ < x₂","f(x₁) = f(x₂) za sve x","f(x) > 0 za sve x"],"correct":1},{"question":"Nula funkcije f(x) = 2x - 6 je:","options":["x = -3","x = 0","x = 3","x = 6"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Stepene funkcije",
    subject: "Matematika",
    class_number: 2,
    content: `Stepena funkcija je funkcija oblika f(x) = xⁿ, gdje je n prirodan broj. Za parne eksponente (n = 2, 4, 6...) grafik je simetričan u odnosu na y-osu (parna funkcija), opada na (-∞, 0] i raste na [0, +∞). Za neparne eksponente (n = 1, 3, 5...) grafik prolazi kroz koordinatni početak i simetričan je u odnosu na njega (neparna funkcija).

Funkcija f(x) = x² je parabola sa tjemenom u koordinatnom početku, otvorena naviše. Funkcija f(x) = x³ je kubna parabola koja raste na cijelom domenu. Sa povećanjem eksponenta, grafik postaje "strmiji" daleko od nule i "ravniji" blizu nule.

Opšti oblik stepene funkcije f(x) = axⁿ uključuje koeficijent a koji utiče na oblik: ako je |a| > 1, grafik je vertikalno razvučen; ako je 0 < |a| < 1, grafik je vertikalno sabijen; ako je a < 0, grafik je reflektovan u odnosu na x-osu.

QUIZ_DATA:[{"question":"Grafik funkcije f(x) = x⁴ je simetričan u odnosu na:","options":["x-osu","y-osu","Koordinatni početak","Pravu y = x"],"correct":1},{"question":"Funkcija f(x) = x³ je:","options":["Parna","Neparna","Ni parna ni neparna","Periodična"],"correct":1},{"question":"Ako je f(x) = -2x², grafik je parabola otvorena:","options":["Naviše","Naniže","Udesno","Ulijevo"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Pojam n-tog korijena",
    subject: "Matematika",
    class_number: 2,
    content: `N-ti korijen broja a (ⁿ√a) je broj b takav da bⁿ = a. Drugi korijen se naziva kvadratni korijen (√a), treći — kubni korijen (³√a). Za parne n, korijen postoji samo za a ≥ 0 (u skupu realnih brojeva), dok za neparne n, korijen postoji za svako realno a.

Osobine n-tog korijena: ⁿ√(a·b) = ⁿ√a · ⁿ√b, ⁿ√(a/b) = ⁿ√a / ⁿ√b, ⁿ√(aᵐ) = (ⁿ√a)ᵐ, ᵐ√(ⁿ√a) = ᵐⁿ√a. Ove osobine važe pod uslovom da su svi korijenovi definisani. Korijen iz negativnog broja za paran stepen nije realan broj.

Racionalizacija imenioca je postupak uklanjanja korijena iz imenioca razlomka. Za jednočlani imenilac √a, množimo sa √a/√a. Za binomni imenilac a + √b, množimo sa konjugovanim izrazom a - √b. Na primjer: 1/√3 = √3/3.

QUIZ_DATA:[{"question":"³√(-27) je jednako:","options":["3","-3","Nije definisano","9"],"correct":1},{"question":"√50 u pojednostavljenom obliku je:","options":["5√2","2√5","25√2","10√5"],"correct":0},{"question":"Racionalizovani oblik 1/√5 je:","options":["√5","√5/5","5/√5","1/5"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Stepeni racionalnog izložioca",
    subject: "Matematika",
    class_number: 2,
    content: `Stepen sa racionalnim izložiocem definiše se kao a^(m/n) = ⁿ√(aᵐ), gdje je m/n racionalan broj, n ∈ ℕ, n ≥ 2, a > 0. Ova definicija povezuje stepenovanje sa korjenovanjem i proširuje pojam stepena izvan cjelobrojnih izložilaca.

Sva pravila stepenovanja važe i za racionalne izložioce: a^(p/q) · a^(r/s) = a^(p/q + r/s), (a^(p/q))^(r/s) = a^(pr/qs), itd. Na primjer: 8^(2/3) = ³√(8²) = ³√64 = 4, ili ekvivalentno (³√8)² = 2² = 4.

Stepeni sa racionalnim izložiocima omogućavaju pisanje korijena u obliku stepena: √a = a^(1/2), ³√a = a^(1/3), ⁿ√a = a^(1/n). Ovo je korisno pri pojednostavljivanju izraza jer se tada mogu primjenjivati pravila stepenovanja umjesto pravila za korijene.

QUIZ_DATA:[{"question":"Koliko je 27^(1/3)?","options":["3","9","27","1/3"],"correct":0},{"question":"Izraz √x zapisan kao stepen je:","options":["x²","x^(1/2)","x^(-1/2)","x^(2/1)"],"correct":1},{"question":"Koliko je 16^(3/4)?","options":["4","8","12","64"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Kompozicija funkcija",
    subject: "Matematika",
    class_number: 2,
    content: `Kompozicija funkcija f i g, zapisana kao (f ∘ g)(x) = f(g(x)), znači da se prvo primijeni funkcija g, a zatim na rezultat primijeni funkcija f. Domen kompozicije f ∘ g čine svi x iz domena od g za koje g(x) pripada domenu od f.

Kompozicija funkcija općenito NIJE komutativna: f ∘ g ≠ g ∘ f. Na primjer, ako je f(x) = x² i g(x) = x + 1, tada (f ∘ g)(x) = (x+1)² = x²+2x+1, ali (g ∘ f)(x) = x²+1. Kompozicija je asocijativna: f ∘ (g ∘ h) = (f ∘ g) ∘ h.

Identička funkcija id(x) = x je neutralni element za kompoziciju: f ∘ id = id ∘ f = f. Kompozicija se koristi za rastavljanje složenih funkcija na jednostavnije komponente, što je važno u analizi i diferencijalnom računu (pravilo lanca).

QUIZ_DATA:[{"question":"Ako je f(x) = 2x i g(x) = x + 3, koliko je (f ∘ g)(1)?","options":["5","8","7","4"],"correct":1},{"question":"Kompozicija funkcija je:","options":["Uvijek komutativna","Nikad komutativna","Općenito nije komutativna","Komutativna samo za linearne funkcije"],"correct":2},{"question":"Ako je (f ∘ g)(x) = √(x²+1), šta može biti g(x)?","options":["√x","x²+1","x+1","x²"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Inverzna funkcija",
    subject: "Matematika",
    class_number: 2,
    content: `Inverzna funkcija f⁻¹ postoji ako je funkcija f bijektivna (i injektivna i surjektivna). Funkcija f je injektivna (1-1) ako različitim argumentima odgovaraju različite vrijednosti: x₁ ≠ x₂ ⇒ f(x₁) ≠ f(x₂). Inverzna funkcija "poništava" dejstvo originalne: f⁻¹(f(x)) = x i f(f⁻¹(y)) = y.

Za nalaženje inverzne funkcije: 1) Zapisati y = f(x), 2) Zamijeniti x i y, 3) Izraziti y kao funkciju od x. Na primjer, za f(x) = 2x + 3: y = 2x+3, zamjena: x = 2y+3, rješavamo: y = (x-3)/2, dakle f⁻¹(x) = (x-3)/2.

Grafik inverzne funkcije je simetričan grafiku originalne funkcije u odnosu na pravu y = x. Ovo je zato što se pri inverziji zamjenjuju koordinate (a, b) → (b, a), što je upravo refleksija u odnosu na y = x. Domen inverzne je kodomen originalne i obrnuto.

QUIZ_DATA:[{"question":"Inverzna funkcija od f(x) = 3x - 1 je:","options":["f⁻¹(x) = (x+1)/3","f⁻¹(x) = (x-1)/3","f⁻¹(x) = 3x + 1","f⁻¹(x) = 1/(3x-1)"],"correct":0},{"question":"Grafik inverzne funkcije je simetričan grafiku originalne u odnosu na:","options":["x-osu","y-osu","Pravu y = x","Koordinatni početak"],"correct":2},{"question":"Funkcija f(x) = x² na R nema inverznu jer:","options":["Nije definisana za x < 0","Nije injektivna","Nije surjektivna","Nije kontinualna"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Korijenna funkcija",
    subject: "Matematika",
    class_number: 2,
    content: `Korijenna funkcija f(x) = ⁿ√x = x^(1/n) je inverzna funkcija stepene funkcije g(x) = xⁿ. Za parne n, domen je [0, +∞) i kodomen [0, +∞), dok za neparne n, domen i kodomen su cijeli ℝ. Grafik korijenne funkcije se dobija refleksijom grafika stepene funkcije u odnosu na pravu y = x.

Funkcija f(x) = √x (kvadratni korijen) ima grafik koji počinje u koordinatnom početku i raste sve sporije — za velike x, grafik se približava horizontali ali nikad ne postaje potpuno ravan. Funkcija je rastuća na cijelom domenu [0, +∞).

Transformacije korijenne funkcije: f(x) = a√(x - h) + k, gdje h pomjera grafik horizontalno, k vertikalno, a a razvlači/sabija i eventualno reflektuje grafik. Na primjer, f(x) = √(x - 2) + 1 pomjera grafik 2 udesno i 1 naviše.

QUIZ_DATA:[{"question":"Domen funkcije f(x) = √(x - 4) je:","options":["x ≥ 0","x ≥ 4","x > 4","Svi realni brojevi"],"correct":1},{"question":"Funkcija f(x) = ³√x je definisana za:","options":["x ≥ 0","x > 0","Sve realne brojeve","x ≠ 0"],"correct":2},{"question":"Grafik funkcije f(x) = √x je:","options":["Opadajuća kriva","Rastuća kriva koja počinje u (0,0)","Parabola","Prava linija"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Kompleksni brojevi",
    subject: "Matematika",
    class_number: 2,
    content: `Kompleksni brojevi nastaju proširenjem skupa realnih brojeva uvođenjem imaginarne jedinice i, za koju važi i² = -1. Svaki kompleksan broj se zapisuje u obliku z = a + bi, gdje je a realni dio (Re(z)) i b imaginarni dio (Im(z)). Skup kompleksnih brojeva označavamo sa ℂ.

Operacije sa kompleksnim brojevima: sabiranje (a+bi) + (c+di) = (a+c) + (b+d)i, oduzimanje (a+bi) - (c+di) = (a-c) + (b-d)i, množenje (a+bi)(c+di) = (ac-bd) + (ad+bc)i. Konjugovani kompleksan broj od z = a+bi je z̄ = a-bi.

Dijeljenje kompleksnih brojeva se vrši množenjem brojioca i imenioca konjugovanim imeniocem: (a+bi)/(c+di) = (a+bi)(c-di)/((c+di)(c-di)) = (a+bi)(c-di)/(c²+d²). Modul kompleksnog broja |z| = √(a²+b²) predstavlja rastojanje od koordinatnog početka.

QUIZ_DATA:[{"question":"Ako je z = 3 + 4i, koliko je |z|?","options":["5","7","25","√7"],"correct":0},{"question":"Rezultat množenja (2+i)(1-i) je:","options":["3-i","1-i","3+i","1+3i"],"correct":0},{"question":"Konjugovani broj od 5 - 3i je:","options":["5 + 3i","-5 + 3i","-5 - 3i","3 - 5i"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: "Geometrijska interpretacija kompleksnih brojeva",
    subject: "Matematika",
    class_number: 2,
    content: `Kompleksni broj z = a + bi se predstavlja tačkom (a, b) u kompleksnoj ravni (Gausovoj ravni), gdje horizontalna osa predstavlja realni dio, a vertikalna imaginarni dio. Ova interpretacija omogućava geometrijsko razumijevanje operacija sa kompleksnim brojevima.

Trigonometrijski oblik kompleksnog broja je z = r(cosθ + i·sinθ), gdje je r = |z| modul (rastojanje od koordinatnog početka), a θ = arg(z) argument (ugao sa pozitivnim smjerom realne ose). Prelaz iz algebarskog u trigonometrijski oblik: r = √(a²+b²), tgθ = b/a.

Množenje u trigonometrijskom obliku: z₁·z₂ = r₁r₂(cos(θ₁+θ₂) + i·sin(θ₁+θ₂)). Moduli se množe, argumenti se sabiraju. De Moavrov obrazac: zⁿ = rⁿ(cos(nθ) + i·sin(nθ)). Ovo omogućava lako stepenovanje kompleksnih brojeva.

QUIZ_DATA:[{"question":"Kompleksan broj 1 + i u Gausovoj ravni se nalazi u:","options":["Prvom kvadrantu","Drugom kvadrantu","Trećem kvadrantu","Četvrtom kvadrantu"],"correct":0},{"question":"Modul kompleksnog broja -3 + 4i je:","options":["7","5","1","25"],"correct":1},{"question":"Pri množenju kompleksnih brojeva u trigonometrijskom obliku, argumenti se:","options":["Množe","Sabiraju","Oduzimaju","Dijele"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Kvadratna jednačina",
    subject: "Matematika",
    class_number: 2,
    content: `Kvadratna jednačina je jednačina oblika ax² + bx + c = 0, gdje je a ≠ 0. Rješava se pomoću formule x₁,₂ = (-b ± √(b²-4ac)) / (2a). Izraz D = b² - 4ac naziva se diskriminanta i određuje prirodu rješenja.

Ako je D > 0, jednačina ima dva različita realna rješenja. Ako je D = 0, jednačina ima jedno dvostruko realno rješenje x = -b/(2a). Ako je D < 0, jednačina nema realnih rješenja, ali ima dva konjugovano kompleksna rješenja.

Nepotpune kvadratne jednačine su posebni slučajevi: ax² + bx = 0 se rješava izlučivanjem x(ax + b) = 0, ax² + c = 0 se rješava direktno x² = -c/a, a ax² = 0 ima jedino rješenje x = 0. Ove jednačine se rješavaju brže bez korištenja opšte formule.

QUIZ_DATA:[{"question":"Diskriminanta jednačine x² - 5x + 6 = 0 je:","options":["1","25","-1","11"],"correct":0},{"question":"Koliko realnih rješenja ima jednačina x² + 1 = 0?","options":["Dva","Jedno","Nula","Beskonačno"],"correct":2},{"question":"Rješenja jednačine x² - 4 = 0 su:","options":["x = 2","x = ±2","x = 4","x = ±4"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Priroda rješenja kvadratne jednačine",
    subject: "Matematika",
    class_number: 2,
    content: `Diskriminanta D = b² - 4ac potpuno određuje prirodu rješenja kvadratne jednačine ax² + bx + c = 0. Analiza diskriminante omogućava da bez rješavanja jednačine utvrdimo broj i tip rješenja.

Za D > 0: dva različita realna rješenja. Ako su a, b, c racionalni i D je potpun kvadrat, rješenja su racionalna. Ako D nije potpun kvadrat, rješenja su iracionalna oblika p ± q√D. Za D = 0: jedno dvostruko rješenje x = -b/(2a). Za D < 0: dva konjugovano kompleksna rješenja x₁,₂ = (-b ± i√|D|) / (2a).

Grafička interpretacija: za a > 0, parabola y = ax² + bx + c je otvorena naviše. D > 0 znači da parabola sječe x-osu u dvije tačke, D = 0 da dodiruje x-osu, D < 0 da ne sječe x-osu. Za a < 0, parabola je otvorena naniže sa analognim zaključcima.

QUIZ_DATA:[{"question":"Ako je D = 0, kvadratna jednačina ima:","options":["Dva realna rješenja","Jedno dvostruko rješenje","Dva kompleksna rješenja","Nema rješenja"],"correct":1},{"question":"Jednačina x² + 2x + 5 = 0 ima D = 4 - 20 = -16. Rješenja su:","options":["x = -1 ± 2i","x = 1 ± 2i","x = -1 ± 4i","Nema rješenja"],"correct":0},{"question":"Ako parabola y = x² + bx + c ne sječe x-osu, tada:","options":["D > 0","D = 0","D < 0","a < 0"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Vietove formule",
    subject: "Matematika",
    class_number: 2,
    content: `Vietove formule povezuju koeficijente kvadratne jednačine ax² + bx + c = 0 sa njenim rješenjima x₁ i x₂: zbir rješenja x₁ + x₂ = -b/a, proizvod rješenja x₁ · x₂ = c/a. Ove formule važe bez obzira na to da li su rješenja realna ili kompleksna.

Vietove formule imaju brojne primjene: formiranje kvadratne jednačine sa datim rješenjima (x² - Sx + P = 0, gdje je S = x₁+x₂ i P = x₁·x₂), izračunavanje simetričnih funkcija rješenja bez njihovog eksplicitnog nalaženja, i provjera tačnosti nađenih rješenja.

Na primjer, za jednačinu 2x² - 7x + 3 = 0: x₁ + x₂ = 7/2 i x₁ · x₂ = 3/2. Možemo izračunati x₁² + x₂² = (x₁+x₂)² - 2x₁x₂ = 49/4 - 3 = 37/4, bez rješavanja jednačine. Ovo je moćna tehnika za složenije zadatke.

QUIZ_DATA:[{"question":"Za jednačinu x² - 5x + 6 = 0, zbir rješenja je:","options":["6","5","-5","-6"],"correct":1},{"question":"Ako su rješenja jednačine 3 i -2, jednačina je:","options":["x² - x - 6 = 0","x² + x - 6 = 0","x² - x + 6 = 0","x² + x + 6 = 0"],"correct":0},{"question":"Za jednačinu x² + px + q = 0, proizvod rješenja je:","options":["p","q","-p","-q"],"correct":1}]:QUIZ_DATA`
  },

  // ======================== FIZIKA I (class 1) ========================
  {
    title: "Fizičke veličine",
    subject: "Fizika",
    class_number: 1,
    content: `Fizička veličina je svojstvo tijela ili pojave koje se može mjeriti i izraziti brojem i mjernom jedinicom. Osnovne fizičke veličine u SI sistemu su: dužina (metar, m), masa (kilogram, kg), vrijeme (sekunda, s), temperatura (kelvin, K), jačina električne struje (amper, A), količina supstance (mol, mol) i jačina svjetlosti (kandela, cd).

Izvedene fizičke veličine se dobijaju kombinovanjem osnovnih. Na primjer, brzina = dužina/vrijeme (m/s), sila = masa × ubrzanje (kg·m/s² = N), energija = sila × dužina (N·m = J). Dimenziona analiza je metod provjere ispravnosti formula pomoću dimenzija fizičkih veličina.

Prefiksi SI sistema olakšavaju izražavanje veoma velikih ili malih veličina: kilo (10³), mega (10⁶), giga (10⁹), mili (10⁻³), mikro (10⁻⁶), nano (10⁻⁹). Na primjer, 1 km = 1000 m, 1 mg = 0.001 g.

QUIZ_DATA:[{"question":"Koja od sljedećih NIJE osnovna SI veličina?","options":["Masa","Vrijeme","Brzina","Temperatura"],"correct":2},{"question":"Jedinica za silu u SI sistemu je:","options":["Džul (J)","Njutn (N)","Vat (W)","Paskal (Pa)"],"correct":1},{"question":"Prefiks 'mega' označava:","options":["10³","10⁶","10⁹","10¹²"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Mjerenje i greške",
    subject: "Fizika",
    class_number: 1,
    content: `Mjerenje je postupak poređenja fizičke veličine sa odgovarajućom mjernom jedinicom. Svako mjerenje je praćeno greškom — razlikom između izmjerene i prave vrijednosti. Razlikujemo sistematske greške (ponovljive, mogu se korigovati) i slučajne greške (nepredvidive, smanjuju se povećanjem broja mjerenja).

Apsolutna greška Δx je razlika između izmjerene i prave vrijednosti. Relativna greška δ = Δx/x izražava se u procentima i pokazuje kvalitet mjerenja. Na primjer, ako mjerimo dužinu 50 cm sa greškom 0.5 cm, relativna greška je 1%. Rezultat se zapisuje kao x = x₀ ± Δx.

Pri računu sa mjerenim veličinama, greške se prenose: pri sabiranju/oduzimanju apsolutne greške se sabiraju, pri množenju/dijeljenju relativne greške se sabiraju. Značajne cifre u rezultatu odražavaju tačnost mjerenja — rezultat ne može biti tačniji od najmanje tačnog podatka.

QUIZ_DATA:[{"question":"Sistematska greška se:","options":["Ne može korigovati","Ponavlja u svakom mjerenju","Smanjuje sa brojem mjerenja","Je uvijek veća od slučajne"],"correct":1},{"question":"Ako je x = 20.0 cm i Δx = 0.2 cm, relativna greška je:","options":["0.2%","1%","2%","10%"],"correct":1},{"question":"Pri množenju mjerenih veličina, sabiraju se:","options":["Apsolutne greške","Relativne greške","Sistemske greške","Greške se ne sabiraju"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Kretanje",
    subject: "Fizika",
    class_number: 1,
    content: `Kretanje je promjena položaja tijela u odnosu na referentni sistem tokom vremena. Materijalna tačka je idealizovano tijelo čije dimenzije zanemarujemo. Putanja je linija po kojoj se tijelo kreće — može biti pravolinijska ili krivolinijska. Put (s) je dužina putanje, a pomjeraj (Δr) je vektor od početnog do krajnjeg položaja.

Referentni sistem je tijelo u odnosu na koje posmatramo kretanje. Kretanje je relativno — isto tijelo može mirovati u jednom i kretati se u drugom referentnom sistemu. Na primjer, putnik u vozu miruje u odnosu na voz, ali kreće se u odnosu na zemlju.

Jednačina kretanja x = x(t) opisuje položaj tijela u funkciji vremena. Za ravnomjerno pravolinijsko kretanje: x = x₀ + vt, gdje je x₀ početni položaj, v brzina, a t vrijeme. Grafik položaj-vrijeme za ravnomjerno kretanje je prava linija čiji nagib predstavlja brzinu.

QUIZ_DATA:[{"question":"Put i pomjeraj su jednaki kada je kretanje:","options":["Kružno","Pravolinijsko u jednom smjeru","Svako kretanje","Nikada nisu jednaki"],"correct":1},{"question":"Kretanje je relativno jer:","options":["Zavisi od mase tijela","Zavisi od referentnog sistema","Zavisi od temperature","Uvijek je konstantno"],"correct":1},{"question":"Na grafiku x(t) za ravnomjerno kretanje, nagib prave predstavlja:","options":["Ubrzanje","Put","Brzinu","Silu"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Brzina",
    subject: "Fizika",
    class_number: 1,
    content: `Srednja brzina je odnos pređenog puta i utrošenog vremena: v_sr = s/t. Srednja brzina ne daje informaciju o tome kako se tijelo kretalo tokom tog intervala. Trenutna brzina je brzina u datom trenutku, definisana kao granična vrijednost srednje brzine za beskonačno mali vremenski interval: v = lim(Δs/Δt).

Jedinica za brzinu u SI sistemu je metar u sekundi (m/s). Čest je i kilometar na sat (km/h): 1 m/s = 3.6 km/h. Brzina je vektorska veličina — ima intenzitet (numeričku vrijednost), pravac i smjer. Intenzitet brzine naziva se brzina kretanja.

Ravnomjerno kretanje je kretanje konstantnom brzinom, gdje tijelo u jednakim vremenskim intervalima prelazi jednake puteve. Grafik v(t) je horizontalna linija, a površina ispod grafika brzina-vrijeme predstavlja pređeni put.

QUIZ_DATA:[{"question":"Konverzija 72 km/h u m/s daje:","options":["7.2 m/s","20 m/s","72 m/s","36 m/s"],"correct":1},{"question":"Površina ispod grafika v(t) predstavlja:","options":["Brzinu","Ubrzanje","Put","Silu"],"correct":2},{"question":"Ako auto pređe 150 km za 2 sata, srednja brzina je:","options":["75 km/h","150 km/h","300 km/h","37.5 km/h"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: "Ubrzanje",
    subject: "Fizika",
    class_number: 1,
    content: `Ubrzanje je mjera promjene brzine u vremenu: a = Δv/Δt = (v - v₀)/t. Jedinica ubrzanja je m/s². Ako je ubrzanje u smjeru kretanja, tijelo ubrzava; ako je suprotno, tijelo usporava (negativno ubrzanje ili deceleracija).

Trenutno ubrzanje je granična vrijednost srednjeg ubrzanja za infinitezimalno mali vremenski interval: a = lim(Δv/Δt) = dv/dt. Na grafiku v(t), ubrzanje je nagib tangente na krivu. Konstantno ubrzanje znači da se brzina mijenja linearno sa vremenom.

Ubrzanje je vektorska veličina i može mijenjati intenzitet brzine (tangencijalno ubrzanje) ili njen pravac (centripetalno ubrzanje). U svakodnevnom životu, ubrzanje se mjeri pomoću akcelerometra — uređaja koji je prisutan u svakom pametnom telefonu.

QUIZ_DATA:[{"question":"Auto ubrzava od 0 do 100 km/h za 10 s. Ubrzanje je:","options":["10 m/s²","2.78 m/s²","100 m/s²","27.8 m/s²"],"correct":1},{"question":"Na grafiku v(t), ubrzanje se čita kao:","options":["Površina ispod krive","Nagib tangente","Presijek sa y-osom","Presijek sa x-osom"],"correct":1},{"question":"Negativno ubrzanje znači da tijelo:","options":["Miruje","Kreće se unazad","Usporava","Pada"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Ravnomjerno promjenjivo kretanje",
    subject: "Fizika",
    class_number: 1,
    content: `Ravnomjerno promjenjivo kretanje je kretanje sa konstantnim ubrzanjem a = const. Jednačine kretanja su: v = v₀ + at (brzina raste linearno), s = v₀t + at²/2 (put zavisi kvadratno od vremena), v² = v₀² + 2as (veza brzine i puta bez vremena).

Na grafiku v(t), kretanje se prikazuje pravom linijom čiji nagib je ubrzanje. Površina ispod te prave do vremenske ose jednaka je pređenom putu. Ako je a > 0, tijelo ubrzava (ravnomjerno ubrzano kretanje); ako je a < 0, tijelo usporava (ravnomjerno usporeno kretanje).

Primjer: auto kreće iz mirovanja (v₀ = 0) sa ubrzanjem a = 2 m/s². Nakon 5 sekundi: v = 0 + 2·5 = 10 m/s, s = 0 + 2·25/2 = 25 m. Ove jednačine su temelj kinematike i koriste se u bezbroj praktičnih situacija.

QUIZ_DATA:[{"question":"Formula za put ravnomjerno ubrzanog kretanja je:","options":["s = vt","s = v₀t + at²/2","s = at","s = v₀/t"],"correct":1},{"question":"Auto kreće iz mirovanja sa a = 3 m/s². Put za 4 s je:","options":["12 m","24 m","48 m","6 m"],"correct":1},{"question":"Na grafiku v(t) za ravnomjerno ubrzano kretanje, brzina je:","options":["Konstantna","Linearna funkcija vremena","Kvadratna funkcija vremena","Eksponencijalna"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Slobodan pad",
    subject: "Fizika",
    class_number: 1,
    content: `Slobodan pad je kretanje tijela pod dejstvom gravitacione sile bez otpora vazduha. Ubrzanje slobodnog pada g ≈ 9.81 m/s² je isto za sva tijela, bez obzira na masu. Ovo je dokazao Galilej eksperimentima sa Krivog tornja u Pizi (legenda) i kosim ravnima.

Jednačine slobodnog pada (iz mirovanja): v = gt, h = gt²/2, v² = 2gh. Tijelo u slobodnom padu prelazi sve veće puteve u jednakim vremenskim intervalima. Za prvu sekundu pada h₁ ≈ 4.9 m, za drugu h₂ ≈ 14.7 m, za treću h₃ ≈ 24.5 m.

U vakuumu, pero i čekić padaju istom brzinom — ovo je demonstrirano na Mjesecu tokom misije Apollo 15. U atmosferi, otpor vazduha usporava lakša tijela više, pa pero pada sporije. Slobodan pad je specijalan slučaj ravnomjerno ubrzanog kretanja.

QUIZ_DATA:[{"question":"Ubrzanje slobodnog pada na Zemlji iznosi približno:","options":["6.67 m/s²","9.81 m/s²","3.14 m/s²","1.62 m/s²"],"correct":1},{"question":"Tijelo pada sa visine 20 m. Brzina pri udaru je:","options":["≈ 14 m/s","≈ 20 m/s","≈ 10 m/s","≈ 40 m/s"],"correct":1},{"question":"U vakuumu, pero i kamen padaju:","options":["Pero brže","Kamen brže","Istom brzinom","Pero ne pada"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Vertikalni hitac",
    subject: "Fizika",
    class_number: 1,
    content: `Vertikalni hitac naviše je kretanje tijela bačenog vertikalno naviše početnom brzinom v₀. Gravitacija djeluje suprotno od smjera kretanja, pa tijelo usporava sa ubrzanjem g ≈ 9.81 m/s². Jednačine: v = v₀ - gt, h = v₀t - gt²/2.

Tijelo se penje dok brzina ne postane nula (v = 0), što se dešava u trenutku t_max = v₀/g. Maksimalna visina je h_max = v₀²/(2g). Nakon toga tijelo pada nazad — kretanje je simetrično, tj. brzina pri povratku na početni nivo jednaka je početnoj brzini v₀.

Ukupno vrijeme leta je t_uk = 2v₀/g (dvostruko vrijeme uspona). Na primjer, lopta bačena naviše brzinom 20 m/s dostiže h_max = 400/19.6 ≈ 20.4 m i vraća se za t_uk = 40/9.81 ≈ 4.08 s.

QUIZ_DATA:[{"question":"Maksimalna visina vertikalnog hica zavisi od:","options":["Mase tijela","Početne brzine","Oblika tijela","Boje tijela"],"correct":1},{"question":"Na vrhu putanje vertikalnog hica, brzina je:","options":["Maksimalna","Jednaka v₀","Nula","Jednaka g"],"correct":2},{"question":"Ako je v₀ = 10 m/s, maksimalna visina je približno:","options":["5 m","10 m","20 m","50 m"],"correct":0}]:QUIZ_DATA`
  },
  {
    title: "Horizontalni hitac",
    subject: "Fizika",
    class_number: 1,
    content: `Horizontalni hitac je kretanje tijela bačenog horizontalno sa neke visine. Ovo kretanje je kombinacija dva nezavisna kretanja: ravnomjerno kretanje po horizontali (x = v₀t) i slobodan pad po vertikali (y = gt²/2). Putanja tijela je parabola.

Vrijeme pada zavisi samo od visine, ne od horizontalne brzine: t = √(2h/g). Domet (horizontalno rastojanje) je D = v₀ · √(2h/g). Brzina u bilo kom trenutku ima horizontalnu komponentu vₓ = v₀ = const i vertikalnu komponentu vᵧ = gt.

Ukupna brzina pri udaru je v = √(vₓ² + vᵧ²) = √(v₀² + 2gh). Ugao pod kojim tijelo udara u tlo: tgα = vᵧ/vₓ = gt/v₀. Horizontalni hitac ima praktičnu primjenu u balistici, sportu i inženjerstvu.

QUIZ_DATA:[{"question":"Putanja horizontalnog hica je:","options":["Prava linija","Kružnica","Parabola","Elipsa"],"correct":2},{"question":"Vrijeme pada kod horizontalnog hica zavisi od:","options":["Početne brzine","Mase tijela","Visine sa koje je bačeno","Oblika tijela"],"correct":2},{"question":"Horizontalna komponenta brzine tokom horizontalnog hica:","options":["Raste","Opada","Ostaje konstantna","Osciluje"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Kružno kretanje",
    subject: "Fizika",
    class_number: 1,
    content: `Kružno kretanje je kretanje tijela po kružnoj putanji. Opisuje se pomoću ugaonih veličina: ugaoni pomjeraj θ (u radijanima), ugaona brzina ω = θ/t (rad/s), i ugaono ubrzanje α = Δω/t (rad/s²). Jedan pun obrtaj odgovara uglu 2π radijana = 360°.

Veza između linearnih i ugaonih veličina: v = ωr (linearna brzina), a_t = αr (tangencijalno ubrzanje), s = θr (lučni put), gdje je r poluprečnik kružnice. Period T je vrijeme jednog punog obrtaja, a frekvencija f = 1/T je broj obrtaja u sekundi (Hz).

Veza ugaone brzine sa periodom i frekvencijom: ω = 2π/T = 2πf. Primjeri kružnog kretanja: Zemlja oko Sunca (T ≈ 365 dana), kazaljke sata, točkovi automobila, elektroni u ciklotronu.

QUIZ_DATA:[{"question":"Jedan pun obrtaj u radijanima je:","options":["π","2π","π/2","4π"],"correct":1},{"question":"Ako je ω = 10 rad/s i r = 2 m, linearna brzina je:","options":["5 m/s","12 m/s","20 m/s","0.2 m/s"],"correct":2},{"question":"Period i frekvencija su povezani formulom:","options":["T = f","T = 1/f","T = 2πf","T = f²"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Ravnomjerno kružno kretanje",
    subject: "Fizika",
    class_number: 1,
    content: `Ravnomjerno kružno kretanje je kretanje po kružnici konstantnom ugaonom brzinom (ω = const). Intenzitet linearne brzine je stalan (v = const), ali se njen pravac neprekidno mijenja — brzina je uvijek tangentna na kružnicu.

Centripetalno ubrzanje je ubrzanje usmjereno ka centru kružnice koje mijenja pravac brzine: a_c = v²/r = ω²r. Ovo ubrzanje ne mijenja intenzitet brzine, samo njen smjer. Centripetalna sila koja uzrokuje ovo ubrzanje je F_c = mv²/r = mω²r.

Primjeri centripetalne sile: gravitacija (za satelite), trenje (za auto u krivini), napon konca (za tijelo na koncu), normalna sila (za kuglu u šupljoj cijevi). Bez centripetalne sile, tijelo bi se kretalo pravolinijski po tangenti na kružnicu (prvi Njutnov zakon).

QUIZ_DATA:[{"question":"Centripetalno ubrzanje je usmjereno:","options":["Po tangenti","Ka centru kružnice","Od centra kružnice","Vertikalno naviše"],"correct":1},{"question":"Auto mase 1000 kg se kreće brzinom 20 m/s u krivini poluprečnika 100 m. Centripetalna sila je:","options":["200 N","2000 N","4000 N","20000 N"],"correct":2},{"question":"Kod ravnomjernog kružnog kretanja, intenzitet brzine je:","options":["Promjenjiv","Konstantan","Nula","Raste"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Sila",
    subject: "Fizika",
    class_number: 1,
    content: `Sila je fizička veličina koja uzrokuje promjenu stanja kretanja tijela ili njegovu deformaciju. Sila je vektorska veličina — ima intenzitet, pravac i smjer. Jedinica za silu u SI sistemu je njutn (N): 1 N = 1 kg·m/s². Sile se mogu prikazati vektorima i mjeriti dinamometrom.

Rezultantna sila je vektorski zbir svih sila koje djeluju na tijelo. Ako sile djeluju duž iste prave, sabiraju se algebarski (u istom smjeru se sabiraju, u suprotnom oduzimaju). Za sile pod uglom koristi se pravilo paralelograma ili metoda razlaganja sila na komponente.

Vrste sila: gravitaciona sila (F = mg), sila trenja (F_tr = μN), elastična sila (F = kx, Hukov zakon), normalna sila, sila zatezanja konca. Sile na daljinu (gravitacija, elektromagnetna) djeluju bez direktnog kontakta, dok kontaktne sile zahtijevaju dodir.

QUIZ_DATA:[{"question":"Jedinica za silu u SI sistemu je:","options":["Kilogram","Njutn","Džul","Paskal"],"correct":1},{"question":"Gravitaciona sila na tijelo mase 5 kg je približno:","options":["5 N","9.81 N","49 N","50 N"],"correct":2},{"question":"Hukov zakon glasi:","options":["F = ma","F = mg","F = kx","F = mv²/r"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Njutnovi zakoni",
    subject: "Fizika",
    class_number: 1,
    content: `Prvi Njutnov zakon (zakon inercije): tijelo ostaje u stanju mirovanja ili ravnomjernog pravolinijskog kretanja sve dok rezultantna sila na njega ne postane različita od nule. Inercija je svojstvo tijela da se opire promjeni stanja kretanja — veća masa znači veću inerciju.

Drugi Njutnov zakon: ubrzanje tijela je direktno proporcionalno rezultantnoj sili i obrnuto proporcionalno masi: F = ma. Ovo je najvažnija jednačina klasične mehanike. Za istu silu, lakše tijelo dobija veće ubrzanje; za istu masu, veća sila proizvodi veće ubrzanje.

Treći Njutnov zakon (zakon akcije i reakcije): ako tijelo A djeluje silom na tijelo B, tada tijelo B djeluje na tijelo A silom jednakog intenziteta, istog pravca, ali suprotnog smjera. Akcija i reakcija djeluju na različita tijela i nikad se ne poništavaju.

QUIZ_DATA:[{"question":"Prvi Njutnov zakon se odnosi na:","options":["Silu i ubrzanje","Akciju i reakciju","Inerciju","Gravitaciju"],"correct":2},{"question":"Sila od 10 N djeluje na tijelo mase 2 kg. Ubrzanje je:","options":["20 m/s²","5 m/s²","0.2 m/s²","12 m/s²"],"correct":1},{"question":"Prema trećem Njutnovom zakonu, akcija i reakcija:","options":["Djeluju na isto tijelo","Imaju isti smjer","Djeluju na različita tijela","Se poništavaju"],"correct":2}]:QUIZ_DATA`
  },

  // ======================== FIZIKA II (class 2) ========================
  {
    title: "Mehanički rad",
    subject: "Fizika",
    class_number: 2,
    content: `Mehanički rad je fizička veličina koja opisuje dejstvo sile na tijelo duž određenog pomjeraja. Rad se definiše kao W = F·s·cosα, gdje je F intenzitet sile, s pređeni put, a α ugao između sile i pomjeraja. Jedinica za rad je džul (J): 1 J = 1 N·m.

Ako je sila u smjeru kretanja (α = 0°), rad je pozitivan (W = Fs). Ako je sila suprotna kretanju (α = 180°), rad je negativan (W = -Fs). Ako je sila okomita na kretanje (α = 90°), rad je nula — normalna sila i centripetalna sila ne vrše rad.

Rad gravitacione sile W = mgh zavisi samo od visinske razlike, ne od oblika putanje — gravitaciona sila je konzervativna. Rad sile trenja zavisi od putanje i uvijek je negativan jer se sila trenja suprotstavlja kretanju.

QUIZ_DATA:[{"question":"Rad sile F = 50 N na putu s = 4 m u smjeru sile je:","options":["12.5 J","54 J","200 J","100 J"],"correct":2},{"question":"Kad je sila okomita na pomjeraj, rad je:","options":["Maksimalan","Negativan","Nula","Zavisi od mase"],"correct":2},{"question":"Jedinica za mehanički rad je:","options":["Njutn","Vat","Džul","Paskal"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Mehanička snaga",
    subject: "Fizika",
    class_number: 2,
    content: `Snaga je fizička veličina koja pokazuje koliko se brzo vrši rad: P = W/t, gdje je W rad a t vrijeme. Jedinica za snagu je vat (W): 1 W = 1 J/s. Veća snaga znači da se isti rad obavlja za kraće vrijeme ili da se za isto vrijeme obavi više rada.

Za konstantnu silu u smjeru kretanja, snaga se može izraziti kao P = Fv, gdje je F sila a v brzina. Ovo je korisno za izračunavanje snage motora pri konstantnoj brzini. Na primjer, ako auto vozi 30 m/s i sila otpora je 500 N, potrebna snaga motora je P = 500 × 30 = 15000 W = 15 kW.

Koeficijent korisnog dejstva (stepen korisnosti) η = P_korisna/P_ukupna × 100% pokazuje koji dio uložene energije se pretvara u korisni rad. Nijedan realni uređaj nema η = 100% jer se dio energije uvijek gubi (trenje, toplota, zvuk).

QUIZ_DATA:[{"question":"Snaga od 1 W znači:","options":["1 J rada u 1 s","1 N sile na 1 m","1 kg ubrzano za 1 m/s²","1 J energije"],"correct":0},{"question":"Motor razvija silu 2000 N pri brzini 15 m/s. Snaga je:","options":["133 W","30000 W","15000 W","2000 W"],"correct":1},{"question":"Stepen korisnosti realnog motora je:","options":["Uvijek 100%","Uvijek manji od 100%","Uvijek veći od 100%","Tačno 50%"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Kinetička energija",
    subject: "Fizika",
    class_number: 2,
    content: `Kinetička energija je energija koju tijelo posjeduje zbog svog kretanja. Definiše se formulom Eₖ = mv²/2, gdje je m masa tijela a v njegova brzina. Jedinica je džul (J). Kinetička energija je skalarna veličina i uvijek je pozitivna ili nula.

Teorema o kinetičkoj energiji kaže da je rad rezultantne sile jednak promjeni kinetičke energije: W = ΔEₖ = mv₂²/2 - mv₁²/2. Ako je rad pozitivan, kinetička energija raste (tijelo ubrzava); ako je negativan, kinetička energija opada (tijelo usporava).

Kinetička energija zavisi kvadratno od brzine: dupliranje brzine učetvorostručuje energiju. Zato je zaustavljanje automobila sa 100 km/h četiri puta teže nego sa 50 km/h. Ovo je ključno za bezbjednost u saobraćaju — zaustavni put raste sa kvadratom brzine.

QUIZ_DATA:[{"question":"Kinetička energija tijela mase 2 kg pri brzini 3 m/s je:","options":["3 J","6 J","9 J","18 J"],"correct":2},{"question":"Ako se brzina tijela udvostruči, kinetička energija:","options":["Se udvostruči","Se utrostruči","Se učetvorostruči","Ostaje ista"],"correct":2},{"question":"Rad rezultantne sile jednak je:","options":["Promjeni potencijalne energije","Promjeni kinetičke energije","Ukupnoj energiji","Snazi"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Potencijalna energija",
    subject: "Fizika",
    class_number: 2,
    content: `Potencijalna energija je energija koju tijelo posjeduje zbog svog položaja u polju sile. Gravitaciona potencijalna energija je Eₚ = mgh, gdje je m masa, g ubrzanje slobodnog pada, a h visina u odnosu na referentni nivo. Izbor referentnog nivoa je proizvoljan.

Elastična potencijalna energija opruge je Eₚ = kx²/2, gdje je k konstanta opruge a x izduženje ili sabijanje opruge u odnosu na ravnotežni položaj. Ova energija se oslobađa kad se opruga vrati u ravnotežni položaj.

Potencijalna energija je definisana samo za konzervativne sile (gravitaciona, elastična) kod kojih rad ne zavisi od putanje, već samo od početnog i krajnjeg položaja. Razlika potencijalnih energija dva položaja jednaka je radu konzervativne sile: W = Eₚ₁ - Eₚ₂.

QUIZ_DATA:[{"question":"Potencijalna energija tijela mase 3 kg na visini 10 m je (g ≈ 10 m/s²):","options":["30 J","300 J","3 J","100 J"],"correct":1},{"question":"Elastična potencijalna energija opruge zavisi od:","options":["Samo konstante opruge","Samo izduženja","Konstante opruge i kvadrata izduženja","Mase tijela na opruzi"],"correct":2},{"question":"Potencijalna energija je definisana za:","options":["Sve sile","Samo silu trenja","Samo konzervativne sile","Samo gravitacionu silu"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Zakon održanja mehaničke energije",
    subject: "Fizika",
    class_number: 2,
    content: `Mehanička energija tijela je zbir kinetičke i potencijalne energije: E = Eₖ + Eₚ. Zakon održanja mehaničke energije kaže: u izolovanom sistemu u kojem djeluju samo konzervativne sile, ukupna mehanička energija ostaje konstantna: E₁ = E₂, odnosno Eₖ₁ + Eₚ₁ = Eₖ₂ + Eₚ₂.

Primjer: tijelo pada sa visine h iz mirovanja. Na vrhu: Eₖ = 0, Eₚ = mgh. Pri udaru u tlo: Eₖ = mv²/2, Eₚ = 0. Po zakonu održanja: mgh = mv²/2, odakle v = √(2gh). Energija se transformiše iz potencijalne u kinetičku, ali ukupna ostaje ista.

Kada djeluju nekonzervativne sile (trenje), mehanička energija se ne održava — dio se pretvara u toplotnu ili drugu formu energije. Tada važi opšti zakon: W_nekonz = ΔE, rad nekonzervativnih sila jednak je promjeni mehaničke energije. Ukupna energija (uključujući toplotu) se i dalje održava.

QUIZ_DATA:[{"question":"Zakon održanja mehaničke energije važi kada djeluju samo:","options":["Sile trenja","Konzervativne sile","Nekonzervativne sile","Spoljašnje sile"],"correct":1},{"question":"Tijelo pada sa 5 m iz mirovanja. Brzina pri padu (g = 10 m/s²) je:","options":["5 m/s","10 m/s","50 m/s","100 m/s"],"correct":1},{"question":"Kad tijelo pada, potencijalna energija se pretvara u:","options":["Toplotnu","Kinetičku","Hemijsku","Nuklearnu"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Statika fluida",
    subject: "Fizika",
    class_number: 2,
    content: `Fluidi (tečnosti i gasovi) su supstance koje nemaju stalan oblik i mogu teći. Pritisak u fluidu je sila po jedinici površine: p = F/A. Jedinica je paskal (Pa): 1 Pa = 1 N/m². Atmosferski pritisak na nivou mora je približno 101325 Pa ≈ 1 atm.

Hidrostatički pritisak je pritisak koji fluid vrši na dubini h: p = ρgh, gdje je ρ gustina fluida, g gravitaciono ubrzanje, h dubina. Pritisak raste linearno sa dubinom i ne zavisi od oblika posude (Paskalov paradoks). Na dubini 10 m vode, pritisak je oko 1 atm veći od atmosferskog.

Paskalov zakon: pritisak koji se vrši na zatvoreni fluid prenosi se jednako u svim pravcima. Ovo je princip rada hidrauličnog presa: mala sila na malom klipu proizvodi veliku silu na velikom klipu (F₂/F₁ = A₂/A₁). Zakon spojenih sudova: u spojenim sudovima sa istom tečnošću, nivo je isti.

QUIZ_DATA:[{"question":"Jedinica za pritisak u SI sistemu je:","options":["Njutn","Paskal","Džul","Bar"],"correct":1},{"question":"Hidrostatički pritisak na dubini 5 m u vodi (ρ = 1000 kg/m³) je:","options":["5000 Pa","49050 Pa","500 Pa","9810 Pa"],"correct":1},{"question":"Paskalov zakon se primjenjuje u:","options":["Termometru","Hidrauličnom presu","Barometru","Kompasu"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Arhimedov zakon",
    subject: "Fizika",
    class_number: 2,
    content: `Arhimedov zakon glasi: na tijelo uronjeno u fluid djeluje sila potiska (uzgona) jednaka težini istisnute tečnosti: F_A = ρ_fluid · V_uronjeni · g. Sila potiska je usmjerena vertikalno naviše i djeluje u težištu istisnute tečnosti.

Ponašanje tijela u fluidu zavisi od odnosa gustine tijela i fluida: ako je ρ_tijela < ρ_fluida, tijelo pliva (potisak = težina, tijelo je djelimično uronjeno); ako je ρ_tijela = ρ_fluida, tijelo lebdi; ako je ρ_tijela > ρ_fluida, tijelo tone (potisak < težina).

Arhimedov zakon ima brojne primjene: brodovi (metalna konstrukcija sa vazdušnim prostorom ima manju prosječnu gustinu od vode), podmornice (regulišu gustinu balastnim tankovima), baloni (koriste gasove lakše od vazduha). Priča kaže da je Arhimed otkrio ovaj zakon u kadi i viknuo "Eureka!".

QUIZ_DATA:[{"question":"Sila potiska zavisi od:","options":["Mase tijela","Gustine tijela","Zapremine istisnutog fluida","Oblika tijela"],"correct":2},{"question":"Tijelo pliva kada je:","options":["ρ_tijela > ρ_fluida","ρ_tijela < ρ_fluida","ρ_tijela = 0","Uvijek pliva"],"correct":1},{"question":"Arhimedov zakon važi za:","options":["Samo tečnosti","Samo gasove","Tečnosti i gasove","Samo vodu"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Dinamika fluida",
    subject: "Fizika",
    class_number: 2,
    content: `Dinamika fluida proučava kretanje fluida (tečnosti i gasova). Tok fluida može biti laminarni (slojevit, uredan) ili turbulentni (haotičan, sa vrtlozima). Rejnoldsov broj Re = ρvL/μ određuje tip toka: Re < 2300 je laminarni, Re > 4000 turbulentni tok.

Idealni fluid je nezamisliv model: nestišljiv, bez viskoznosti (unutrašnjeg trenja), sa laminarnim tokom. Realni fluidi imaju viskoznost koja uzrokuje otpor kretanju. Viskoznost zavisi od temperature — za tečnosti opada sa temperaturom, za gasove raste.

Strujnica je linija čija tangenta u svakoj tački pokazuje pravac brzine fluida. U stacionarnom toku, strujnice se ne mijenjaju s vremenom i čestice fluida se kreću duž njih. Što su strujnice gušće, veća je brzina fluida u tom području.

QUIZ_DATA:[{"question":"Laminarni tok je:","options":["Haotičan i sa vrtlozima","Slojevit i uredan","Moguć samo u gasovima","Moguć samo pri velikim brzinama"],"correct":1},{"question":"Rejnoldsov broj manji od 2300 ukazuje na:","options":["Turbulentni tok","Laminarni tok","Zvučni tok","Supersonični tok"],"correct":1},{"question":"Viskoznost tečnosti sa porastom temperature:","options":["Raste","Opada","Ostaje ista","Postaje nula"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Jednačina kontinuiteta",
    subject: "Fizika",
    class_number: 2,
    content: `Jednačina kontinuiteta izražava zakon održanja mase za fluide: količina fluida koja ulazi u cijev mora biti jednaka količini koja izlazi. Za nestišljiv fluid: A₁v₁ = A₂v₂, gdje je A poprečni presjek cijevi a v brzina fluida. Proizvod Av naziva se protok.

Ova jednačina objašnjava zašto fluid ubrzava kada prolazi kroz suženje — manji presjek zahtijeva veću brzinu da bi ista količina fluida prošla u istom vremenu. To je razlog zašto voda iz baštenskog crijeva izlazi brže kad prstom stisnemo otvor.

Zapreminski protok Q = Av = const duž cijevi za stacionarni tok nestišljivog fluida. Jedinica za protok je m³/s. Maseni protok ṁ = ρAv je konstantan i za stišljive fluide. Jednačina kontinuiteta je fundamentalni zakon hidrodinamike.

QUIZ_DATA:[{"question":"Ako se presjek cijevi prepolovi, brzina fluida:","options":["Se prepolovi","Se udvostruči","Ostaje ista","Se učetvorostruči"],"correct":1},{"question":"Jednačina kontinuiteta za nestišljiv fluid glasi:","options":["A₁v₁ = A₂v₂","p₁ + ρv₁² = p₂ + ρv₂²","F = ρVg","p = ρgh"],"correct":0},{"question":"Zapreminski protok se mjeri u:","options":["m/s","m²/s","m³/s","kg/s"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Bernulijeva jednačina",
    subject: "Fizika",
    class_number: 2,
    content: `Bernulijeva jednačina je zakon održanja energije primijenjen na tok idealnog fluida: p + ρv²/2 + ρgh = const duž strujnice. Pritisak p je statički pritisak, ρv²/2 dinamički pritisak, a ρgh hidrostatički pritisak. Zbir sva tri je konstantan.

Ključna posljedica: gdje je brzina fluida veća, pritisak je manji i obrnuto. Ovo objašnjava uzgon aviona (vazduh iznad krila je brži, pritisak manji, pa nastaje sila naviše), Venturijev efekat (suženje cijevi ubrzava fluid i smanjuje pritisak), i mnoge druge pojave.

Primjene Bernulijevog efekta: raspršivači parfema, bunzenov plamenik, karburator, mjerenje brzine fluida Pitoovom cijevi. U sportu, Magnus efekat (zakrivljeni udarci u fudbalu) se objašnjava razlikom pritisaka oko rotirajuće lopte.

QUIZ_DATA:[{"question":"Prema Bernulijevoj jednačini, gdje je brzina fluida veća:","options":["Pritisak je veći","Pritisak je manji","Pritisak je isti","Temperatura je veća"],"correct":1},{"question":"Bernulijeva jednačina važi za:","options":["Svaki fluid","Idealni fluid u stacionarnom toku","Samo gasove","Samo turbulentni tok"],"correct":1},{"question":"Uzgon aviona se objašnjava:","options":["Njutnovim zakonima","Arhimedovim zakonom","Bernulijevim efektom","Paskalovim zakonom"],"correct":2}]:QUIZ_DATA`
  },

  // ======================== CSBH I (class 1) ========================
  {
    title: "Glasovi i glasovne promjene",
    subject: "CSBH",
    class_number: 1,
    content: `Glasovi su najmanje jezičke jedinice koje razlikuju značenje riječi. Dijele se na samoglasnike (vokale: a, e, i, o, u) i suglasnike (konsonante). Suglasnici se dijele po zvučnosti na zvučne (b, d, g, z, ž, đ, dž, dz) i bezvučne (p, t, k, s, š, ć, č, c, f, h), te po mjestu i načinu tvorbe.

Glasovne promjene su promjene glasova u riječima do kojih dolazi radi lakšeg izgovora. Najvažnije glasovne promjene su: palatalizacija (k → č, g → ž, h → š ispred e, i: junak → junače), sibilarizacija (k → c, g → z, h → s ispred i: vojnik → vojnici), jotovanje (n + j → nj, l + j → lj: granje od gran-je).

Jednačenje suglasnika po zvučnosti (svadba od svat-ba), jednačenje po mjestu tvorbe (obamrijeti od ob-zamrijeti), nepostojano a (momak → momka), i gubljenje suglasnika (bezzvučan → bezvučan) su takođe česte glasovne promjene u srpskom jeziku.

QUIZ_DATA:[{"question":"Koliko samoglasnika ima u srpskom jeziku?","options":["3","4","5","6"],"correct":2},{"question":"Palatalizacija je glasovna promjena u kojoj:","options":["k, g, h prelaze u č, ž, š","k, g, h prelaze u c, z, s","Zvučni prelaze u bezvučne","Samoglasnici se mijenjaju"],"correct":0},{"question":"U riječi 'svadba' izvršena je:","options":["Palatalizacija","Sibilarizacija","Jednačenje po zvučnosti","Jotovanje"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Akcenat",
    subject: "CSBH",
    class_number: 1,
    content: `Akcenat je isticanje jednog sloga u riječi jačinom, visinom tona ili dužinom. Srpski jezik ima četiri akcenta: kratkosilazni (ȅ), kratkouzlazni (è), dugosilazni (ȇ) i dugouzlazni (é). Silazni akcenti mogu stajati samo na prvom slogu, dok uzlazni mogu stajati na svakom slogu osim posljednjeg.

Pored akcenata, postoji i zanaglasna dužina — dug slog iza akcentovanog sloga. Jednosložne riječi mogu imati samo silazne akcente. Enklitike (me, te, se, sam, si, je...) i proklitike (prijedlozi, veznici) nemaju sopstveni akcenat — oslanjaju se na susjednu riječ.

Akcenat može razlikovati značenje riječi: lȕk (oružje) i lúk (povrće), grȁd (grad) i grȃd (tuča), pȁs (životinja) i pȃs (pojas). Poznavanje akcentuacije je važno za pravilno razumijevanje i izgovor srpskog jezika.

QUIZ_DATA:[{"question":"Koliko akcenata ima srpski jezik?","options":["2","3","4","5"],"correct":2},{"question":"Silazni akcenat može stajati samo na:","options":["Posljednjem slogu","Prvom slogu","Bilo kom slogu","Drugom slogu"],"correct":1},{"question":"Enklitike su riječi koje:","options":["Imaju dva akcenta","Nemaju sopstveni akcenat","Imaju silazni akcenat","Mijenjaju akcenat susjedne riječi"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Imenice - vrste i deklinacija",
    subject: "CSBH",
    class_number: 1,
    content: `Imenice su promjenljive vrste riječi kojima imenujemo bića, stvari, pojave i pojmove. Po značenju se dijele na vlastite (Beograd, Marko) i zajedničke (grad, čovjek), konkretne (kuća, knjiga) i apstraktne (ljubav, sreća), zbirne (lišće, grožđe) i gradivne (voda, zlato).

Imenice imaju rod (muški, ženski, srednji), broj (jednina, množina) i padež (nominativ, genitiv, dativ, akuzativ, vokativ, instrumental, lokativ). Deklinacija je promjena imenica po padežima. Postoje tri deklinacije: prva (muški i srednji rod), druga (ženski rod na -a), treća (ženski rod na suglasnik).

Padeži odgovaraju na pitanja: nominativ (ko? šta?), genitiv (koga? čega?), dativ (kome? čemu?), akuzativ (koga? šta?), vokativ (dozivanje), instrumental (s kim? čim?), lokativ (o kome? o čemu?). Svaki padež ima karakteristične nastavke za jedninu i množinu.

QUIZ_DATA:[{"question":"Koliko padeža ima srpski jezik?","options":["5","6","7","8"],"correct":2},{"question":"Imenica 'ljubav' je:","options":["Konkretna","Apstraktna","Zbirna","Gradivna"],"correct":1},{"question":"Na koje pitanje odgovara dativ?","options":["Ko? Šta?","Koga? Čega?","Kome? Čemu?","S kim? Čim?"],"correct":2}]:QUIZ_DATA`
  },
  {
    title: "Pridjevi - komparacija",
    subject: "CSBH",
    class_number: 1,
    content: `Pridjevi su promjenljive riječi koje opisuju osobine bića, stvari i pojava. Dijele se na opisne (lijep, velik, pametan) i odnosne (gradski, školski, drveni). Pridjevi se slažu sa imenicom u rodu, broju i padežu. Opisni pridjevi imaju neodređeni (nov) i određeni vid (novi).

Komparacija (poređenje) je promjena pridjeva po stepenu osobine. Postoje tri stepena: pozitiv (osnovni oblik: visok), komparativ (viši stepen: viši) i superlativ (najviši stepen: najviši). Komparativ se gradi nastavcima -iji, -ji, -ši ili opisno (više + pozitiv). Superlativ se gradi prefiksom naj- + komparativ.

Nepravilna komparacija: dobar → bolji → najbolji, loš → gori → najgori, velik → veći → najveći, mali → manji → najmanji. Apsolutni superlativ izražava visok stepen osobine bez poređenja: prelijep, silno velik, izuzetno pametan.

QUIZ_DATA:[{"question":"Komparativ pridjeva 'lijep' je:","options":["Ljepši","Najljepši","Više lijep","Ljepiji"],"correct":0},{"question":"Superlativ se gradi pomoću:","options":["Prefiksa pre-","Prefiksa naj- + komparativ","Nastavka -iji","Prefiksa super-"],"correct":1},{"question":"Pridjevi 'gradski' i 'školski' su:","options":["Opisni","Odnosni","Prisvojni","Gradivni"],"correct":1}]:QUIZ_DATA`
  },
  {
    title: "Zamjenice",
    subject: "CSBH",
    class_number: 1,
    content: `Zamjenice su riječi koje zamjenjuju imenice, pridjeve ili brojeve. Lične zamjenice označavaju lica: ja, ti, on/ona/ono (jednina), mi, vi, oni/one/ona (množina). Lične zamjenice imaju pune (mene, tebe) i kratke (me, te) oblike — kratki oblici su enklitike.

Povratna zamjenica sebe/se odnosi se na vršioca radnje. Prisvojne zamjenice označavaju pripadanje: moj, tvoj, njegov, njen, naš, vaš, njihov. Pokazne zamjenice ukazuju na bića ili predmete: ovaj (blizu govornika), taj (blizu sagovornika), onaj (daleko od obojice).

Upitne zamjenice služe za postavljanje pitanja: ko?, šta?, koji?, čiji?, kakav?, koliki?. Odnosne zamjenice uvode zavisne rečenice: koji, čiji, kakav, koliki. Neodređene zamjenice: neko, nešto, neki, nekakav. Odrične: niko, ništa, nikoji, nikakav.

QUIZ_DATA:[{"question":"Kratki oblici ličnih zamjenica su:","options":["Proklitike","Enklitike","Samostalne riječi","Pridjevi"],"correct":1},{"question":"Zamjenica 'taj' je:","options":["Lična","Prisvojna","Pokaz