const URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg';
const AUTHOR = '241c9077-b700-4400-8f96-20e3a650eef4';

const lectures = [
  // ==================== BIOLOGIJA (8) ====================
  // Class 1
  { title: "Ćelija - osnovna jedinica života", subject: "Biologija", class_number: 1,
    content: `Ćelija je najmanja strukturna i funkcionalna jedinica svih živih bića. Svaka ćelija sadrži ćelijsku membranu, citoplazmu i jedro (nukleus). Ćelijska membrana kontroliše šta ulazi i izlazi iz ćelije.

Postoje dva osnovna tipa ćelija: prokariotske (bez pravog jedra, npr. bakterije) i eukariotske (sa jedrom, npr. biljne i životinjske ćelije). Biljne ćelije imaju ćelijski zid i hloroplaste, dok životinjske nemaju.

\n\nQUIZ_DATA:[{"question":"Koja je najmanja jedinica života?","options":["Atom","Ćelija","Organ","Tkivo"],"correct":1},{"question":"Šta biljne ćelije imaju, a životinjske nemaju?","options":["Jedro","Citoplazmu","Ćelijski zid i hloroplaste","Mitohondrije"],"correct":2}]:QUIZ_DATA` },

  { title: "Klasifikacija živih bića", subject: "Biologija", class_number: 1,
    content: `Živa bića se klasifikuju u pet carstava: monere (bakterije), protisti (jednoćelijski organizmi), gljive, biljke i životinje. Ova klasifikacija pomaže naučnicima da organizuju i proučavaju raznolikost života.

Svako živo biće ima naučno ime koje se sastoji od dva dijela: rod i vrsta. Na primjer, čovjek se naučno zove Homo sapiens. Ovaj sistem je uveo švedski naučnik Karl Lineji.

\n\nQUIZ_DATA:[{"question":"Koliko carstava živih bića postoji?","options":["3","4","5","6"],"correct":2},{"question":"Ko je uveo sistem naučnog imenovanja?","options":["Darvin","Lineji","Njutn","Mendeljejev"],"correct":1}]:QUIZ_DATA` },

  // Class 2
  { title: "Fotosinteza - ishrana biljaka", subject: "Biologija", class_number: 2,
    content: `Fotosinteza je proces kojim biljke koriste sunčevu svetlost, ugljen-dioksid i vodu da proizvode glukozu i kiseonik. Ovaj proces se odvija u hloroplastima, organelama koje sadrže hlorofil - zeleni pigment.

Jednačina fotosinteze glasi: 6CO₂ + 6H₂O + svetlost → C₆H₁₂O₆ + 6O₂. Bez fotosinteze ne bi bilo kiseonika u atmosferi, a samim tim ni života kakvog poznajemo.

\n\nQUIZ_DATA:[{"question":"Gdje se odvija fotosinteza?","options":["U mitohondrijama","U jedru","U hloroplastima","U ribozomima"],"correct":2},{"question":"Šta biljke proizvode tokom fotosinteze?","options":["Ugljen-dioksid i vodu","Glukozu i kiseonik","Azot i vodonik","Masti i proteine"],"correct":1}]:QUIZ_DATA` },

  { title: "Građa ljudskog tijela - organski sistemi", subject: "Biologija", class_number: 2,
    content: `Ljudsko tijelo se sastoji od više organskih sistema koji rade zajedno. Sistem za varenje hrane razlaže hranu na hranljive materije. Krvotok (kardiovaskularni sistem) transportuje krv, kiseonik i hranljive materije.

Nervni sistem kontroliše sve funkcije tijela i omogućava nam da reagujemo na okolinu. Mozak, kičmena moždina i nervi čine centralni i periferni nervni sistem. Respiratorni sistem omogućava disanje i razmjenu gasova.

\n\nQUIZ_DATA:[{"question":"Koji sistem kontroliše sve funkcije tijela?","options":["Krvotok","Nervni sistem","Sistem za varenje","Respiratorni sistem"],"correct":1},{"question":"Šta čini centralni nervni sistem?","options":["Srce i krvni sudovi","Mozak i kičmena moždina","Pluća i dušnik","Želudac i creva"],"correct":1}]:QUIZ_DATA` },

  // Class 3
  { title: "Genetika - nauka o nasljeđivanju", subject: "Biologija", class_number: 3,
    content: `Genetika proučava kako se osobine prenose sa roditelja na potomke. DNK (dezoksiribonukleinska kiselina) nosi genetske informacije u obliku gena. Geni određuju naše osobine kao što su boja očiju, kose i krvna grupa.

Gregor Mendel, "otac genetike", je eksperimentima sa graškom otkrio osnovna pravila nasljeđivanja. Svaki gen ima dva alela - jedan od majke i jedan od oca. Aleli mogu biti dominantni ili recesivni.

\n\nQUIZ_DATA:[{"question":"Šta nosi genetske informacije?","options":["Proteini","RNK","DNK","Lipidi"],"correct":2},{"question":"Ko je 'otac genetike'?","options":["Darvin","Mendel","Lineji","Paster"],"correct":1},{"question":"Od koga dobijamo po jedan alel?","options":["Samo od majke","Samo od oca","Od oba roditelja","Od bake i djeda"],"correct":2}]:QUIZ_DATA` },

  { title: "Evolucija i prirodna selekcija", subject: "Biologija", class_number: 3,
    content: `Teorija evolucije objašnjava kako se vrste mijenjaju tokom vremena. Čarls Darvin je predložio mehanizam prirodne selekcije: organizmi koji su bolje prilagođeni okolini imaju veće šanse za preživljavanje i razmnožavanje.

Dokazi za evoluciju uključuju fosile, sličnosti u građi tijela različitih vrsta (homologe organe) i DNK analizu. Evolucija je spor proces koji traje milionima godina.

\n\nQUIZ_DATA:[{"question":"Ko je predložio teoriju prirodne selekcije?","options":["Mendel","Njutn","Darvin","Lajel"],"correct":2},{"question":"Šta su homologi organi?","options":["Identični organi","Slični organi kod različitih vrsta","Organi bez funkcije","Organi za disanje"],"correct":1}]:QUIZ_DATA` },

  // Class 4
  { title: "Ekologija i ekosistemi", subject: "Biologija", class_number: 4,
    content: `Ekologija proučava odnose između živih bića i njihove okoline. Ekosistem čine svi organizmi na jednom području zajedno sa neživom sredinom (voda, tlo, klima). Primjeri ekosistema su šuma, jezero, livada i pustinja.

U svakom ekosistemu postoje lanci ishrane: proizvođači (biljke), potrošači (životinje) i razlagači (bakterije, gljive). Energija teče od sunca kroz proizvođače do potrošača, a hranljive materije se recikliraju.

\n\nQUIZ_DATA:[{"question":"Šta proučava ekologija?","options":["Ćelije","Gene","Odnose organizama i okoline","Hemijske reakcije"],"correct":2},{"question":"Ko su proizvođači u ekosistemu?","options":["Životinje","Biljke","Bakterije","Gljive"],"correct":1}]:QUIZ_DATA` },

  { title: "Zaštita životne sredine", subject: "Biologija", class_number: 4,
    content: `Čovjek negativno utiče na životnu sredinu kroz zagađenje vode, vazduha i tla, krčenje šuma i prekomjerno iskorišćavanje resursa. Klimatske promjene uzrokovane emisijom gasova staklene bašte predstavljaju globalnu prijetnju.

Zaštita životne sredine uključuje reciklažu, korišćenje obnovljivih izvora energije, zaštitu ugroženih vrsta i nacionalne parkove. Svako od nas može doprinijeti smanjenjem otpada i štednjom energije i vode.

\n\nQUIZ_DATA:[{"question":"Šta uzrokuje klimatske promjene?","options":["Vulkani","Gasovi staklene bašte","Zemljotresi","Mjesečeve mjene"],"correct":1},{"question":"Koji od ovih je obnovljivi izvor energije?","options":["Nafta","Ugalj","Solarna energija","Prirodni gas"],"correct":2}]:QUIZ_DATA` },

  // ==================== CSBH (8) ====================
  // Class 1
  { title: "Glasovi srpskog jezika - samoglasnici i suglasnici", subject: "CSBH", class_number: 1,
    content: `Srpski jezik ima 30 glasova: 5 samoglasnika (a, e, i, o, u) i 25 suglasnika. Samoglasnici se izgovaraju slobodnim protokom vazduha, dok pri izgovoru suglasnika postoji prepreka.

Suglasnici se dijele na zvučne i bezvučne. Zvučni suglasnici su: b, d, g, z, ž, đ, dž, a njihovi bezvučni parovi su: p, t, k, s, š, ć, č. Ovo je važno za pravopis jer se dešava jednačenje suglasnika po zvučnosti.

\n\nQUIZ_DATA:[{"question":"Koliko samoglasnika ima srpski jezik?","options":["3","4","5","6"],"correct":2},{"question":"Koji je bezvučni par suglasnika 'b'?","options":["d","p","v","g"],"correct":1}]:QUIZ_DATA` },

  { title: "Imenice - vrste i promjena", subject: "CSBH", class_number: 1,
    content: `Imenice su riječi koje označavaju bića, stvari i pojave. Dijele se na zajedničke (grad, rijeka) i vlastite (Beograd, Dunav). Po rodu mogu biti muškog, ženskog ili srednjeg roda.

Imenice se mijenjaju po padežima (deklinacija). U srpskom jeziku postoji sedam padeža: nominativ, genitiv, dativ, akuzativ, vokativ, instrumental i lokativ. Svaki padež odgovara na određeno pitanje.

\n\nQUIZ_DATA:[{"question":"Koliko padeža ima srpski jezik?","options":["5","6","7","8"],"correct":2},{"question":"Koja vrsta imenica se piše velikim slovom?","options":["Zajedničke","Vlastite","Zbirne","Gradivne"],"correct":1}]:QUIZ_DATA` },

  // Class 2
  { title: "Glagoli - glagolska vremena", subject: "CSBH", class_number: 2,
    content: `Glagoli su riječi koje označavaju radnju, stanje ili zbivanje. U srpskom jeziku postoji više glagolskih vremena. Prezent označava sadašnje vrijeme (čitam, pišem), perfekat prošlo (čitao sam), a futur buduće (čitaću).

Glagoli se dijele na svršene i nesvršene (vid). Nesvršeni glagoli označavaju radnju koja traje (čitati), dok svršeni označavaju završenu radnju (pročitati). Ova podjela je važna za pravilnu upotrebu vremena.

\n\nQUIZ_DATA:[{"question":"Koje glagolsko vrijeme označava sadašnjost?","options":["Perfekat","Prezent","Futur","Aorist"],"correct":1},{"question":"Glagol 'pročitati' je:","options":["Nesvršeni","Svršeni","Povratni","Bezlični"],"correct":1}]:QUIZ_DATA` },

  { title: "Pravopis - veliko i malo slovo", subject: "CSBH", class_number: 2,
    content: `Veliko slovo se piše na početku rečenice, kod vlastitih imenica (imena ljudi, gradova, država), naziva praznika i istorijskih događaja. Nazivi naroda i jezika se pišu malim slovom (Srbi, ali srpski jezik).

Posebna pravila važe za višečlane nazive: kod geografskih pojmova sve riječi velikim slovom (Crna Gora), kod ustanova prva riječ velikim (Narodna biblioteka). Naslovi knjiga - samo prva riječ velikim slovom.

\n\nQUIZ_DATA:[{"question":"Kako se piše naziv jezika?","options":["Velikim slovom","Malim slovom","Zavisi od konteksta","Sve velikim"],"correct":1},{"question":"Kako se piše 'crna gora' kao država?","options":["crna gora","Crna gora","Crna Gora","CRNA GORA"],"correct":2}]:QUIZ_DATA` },

  // Class 3
  { title: "Književni rodovi i vrste", subject: "CSBH", class_number: 3,
    content: `Književnost se dijeli na tri roda: liriku, epiku i dramu. Lirika izražava osjećanja i misli (poezija), epika priča priče (roman, pripovijetka, novela), a drama prikazuje radnju kroz dijalog likova.

U epici razlikujemo kraće forme (basna, bajka, pripovijetka) i duže (roman, ep). Drama se dijeli na komediju, tragediju i dramu u užem smislu. Svaki rod ima svoje specifične karakteristike i pravila.

\n\nQUIZ_DATA:[{"question":"Koliko književnih rodova postoji?","options":["2","3","4","5"],"correct":1},{"question":"Koji književni rod izražava osjećanja?","options":["Epika","Drama","Lirika","Proza"],"correct":2}]:QUIZ_DATA` },

  { title: "Složena rečenica", subject: "CSBH", class_number: 3,
    content: `Složena rečenica se sastoji od dvije ili više prostih rečenica. Nezavisno složene rečenice povezuju ravnopravne klauze veznicima: i, a, ali, ili, pa, nego. Zavisno složene imaju glavnu i zavisnu klauzu.

Zavisne klauze mogu biti izrične (da), uzročne (jer, zato što), uslovne (ako, ukoliko), namjerne (da), posljedične (tako da), vremenske (kad, dok) i odnosne (koji, koja, koje). Zarez se stavlja ispred suprotnih veznika.

\n\nQUIZ_DATA:[{"question":"Šta povezuje nezavisno složenu rečenicu?","options":["Zarezi","Tačke","Veznici","Zamjenice"],"correct":2},{"question":"Koji veznik uvodi uslovnu rečenicu?","options":["Jer","Da","Ako","Ali"],"correct":2}]:QUIZ_DATA` },

  // Class 4
  { title: "Stilske figure", subject: "CSBH", class_number: 4,
    content: `Stilske figure su posebni načini izražavanja koji obogaćuju književni tekst. Metafora prenosi značenje po sličnosti ("zlatne ruke"), poređenje upoređuje uz "kao" ("brz kao munja"), a personifikacija pridaje ljudske osobine neživim stvarima.

Hiperbola je preuveličavanje ("rekao sam ti milion puta"), litota umanjivanje, ironija govori suprotno od onog što misli. Gradacija nizanje pojmova uzlazno ili silazno, a onomatopeja oponaša zvuk ("zum-zum").

\n\nQUIZ_DATA:[{"question":"Šta je metafora?","options":["Preuveličavanje","Prenošenje značenja po sličnosti","Oponašanje zvuka","Umanjivanje"],"correct":1},{"question":"Koja figura oponaša zvukove?","options":["Ironija","Hiperbola","Onomatopeja","Gradacija"],"correct":2}]:QUIZ_DATA` },

  { title: "Funkcionalni stilovi", subject: "CSBH", class_number: 4,
    content: `Funkcionalni stilovi su načini upotrebe jezika zavisno od situacije. Književnoumjetnički stil koristi stilske figure i emocije (romani, pjesme). Naučni stil je precizan i objektivan (udžbenici, enciklopedije).

Publicistički stil se koristi u novinama i medijima, administrativni u pravnim dokumentima i molbama, a razgovorni u svakodnevnoj komunikaciji. Svaki stil ima svoje leksičke, gramatičke i stilske osobenosti.

\n\nQUIZ_DATA:[{"question":"Koji stil se koristi u romanima?","options":["Naučni","Administrativni","Književnoumjetnički","Publicistički"],"correct":2},{"question":"Gdje se koristi administrativni stil?","options":["U poeziji","U novinama","U pravnim dokumentima","U razgovoru"],"correct":2}]:QUIZ_DATA` },

  // ==================== GEOGRAFIJA (8) ====================
  // Class 1
  { title: "Planeta Zemlja - oblik i kretanje", subject: "Geografija", class_number: 1,
    content: `Zemlja ima oblik geoida - blago spljoštene lopte na polovima. Njen prečnik iznosi oko 12.742 km. Zemlja se kreće na dva načina: rotacija (oko svoje ose) i revolucija (oko Sunca).

Rotacija traje 24 sata i uzrokuje smjenu dana i noći. Revolucija traje 365 dana i 6 sati, što uzrokuje smjenu godišnjih doba. Zemina osa je nagnuta pod uglom od 23,5° prema ravni orbite.

\n\nQUIZ_DATA:[{"question":"Koliko traje rotacija Zemlje?","options":["12 sati","24 sata","365 dana","30 dana"],"correct":1},{"question":"Šta uzrokuje smjenu godišnjih doba?","options":["Rotacija","Revolucija","Mjesečeve mjene","Vulkani"],"correct":1}]:QUIZ_DATA` },

  { title: "Geografska karta i orijentacija", subject: "Geografija", class_number: 1,
    content: `Geografska karta je umanjeni prikaz Zemljine površine na ravnoj podlozi. Razmjer karte pokazuje odnos udaljenosti na karti i u stvarnosti. Na primjer, razmjer 1:100.000 znači da 1 cm na karti predstavlja 1 km u prirodi.

Četiri glavne strane svijeta su: sjever, jug, istok i zapad. Između njih su međustrane: sjeveroistok, jugoistok, jugozapad i sjeverozapad. Za orijentaciju možemo koristiti kompas, Sunce ili Sjevernu zvijezdu.

\n\nQUIZ_DATA:[{"question":"Šta pokazuje razmjer karte?","options":["Visinu planina","Dubinu mora","Odnos udaljenosti na karti i u stvarnosti","Temperaturu"],"correct":2},{"question":"Koliko glavnih strana svijeta postoji?","options":["2","4","6","8"],"correct":1}]:QUIZ_DATA` },

  // Class 2
  { title: "Reljef - planine i nizije", subject: "Geografija", class_number: 2,
    content: `Reljef je oblik Zemljine površine. Osnovne reljefne forme su: planine (iznad 500 m), brda (200-500 m), nizije (do 200 m) i doline. Planine nastaju tektorskim pokretima - sudarom kontinentalnih ploča.

Najviša planina na svijetu je Everest (8.849 m) u Himalajima. Na Balkanu su značajne planine Dinaridi. Nizije su pogodne za poljoprivredu - najvažnija u našem regionu je Panonska nizija.

\n\nQUIZ_DATA:[{"question":"Koja je najviša planina na svijetu?","options":["Mon Blan","Kilimandžaro","Everest","Elbrus"],"correct":2},{"question":"Šta je pogodno za poljoprivredu?","options":["Planine","Nizije","Vulkani","Klisure"],"correct":1}]:QUIZ_DATA` },

  { title: "Klima i klimatski faktori", subject: "Geografija", class_number: 2,
    content: `Klima je prosječno stanje vremena na nekom području tokom dužeg perioda (najmanje 30 godina). Osnovni klimatski elementi su temperatura, padavine, vlažnost vazduha i vjetar.

Klimatski faktori koji utiču na klimu su: geografska širina, nadmorska visina, blizina mora, morske struje i reljef. Postoje tri osnovne klimatske zone: tropska (topla), umjerena i polarna (hladna).

\n\nQUIZ_DATA:[{"question":"Koliko godina treba za određivanje klime?","options":["5","10","30","100"],"correct":2},{"question":"Koja klimatska zona je najtoplija?","options":["Umjerena","Polarna","Tropska","Kontinentalna"],"correct":2}]:QUIZ_DATA` },

  // Class 3
  { title: "Evropa - fizičko-geografske karakteristike", subject: "Geografija", class_number: 3,
    content: `Evropa je drugi najmanji kontinent sa površinom od oko 10,2 miliona km². Graniči se sa Azijom na istoku (Uralske planine), Arktičkim okeanom na sjeveru i Atlantskim okeanom na zapadu.

Najznačajniji planinski sistemi su Alpi, Pirineji, Karpati i Skandinavske planine. Najveće nizije su Istočnoevropska i Srednjeevropska. Najduža rijeka je Volga (3.531 km), a najveće jezero je Ladoško.

\n\nQUIZ_DATA:[{"question":"Šta dijeli Evropu od Azije?","options":["Alpi","Pirineji","Uralske planine","Karpati"],"correct":2},{"question":"Koja je najduža rijeka Evrope?","options":["Dunav","Rajna","Volga","Don"],"correct":2}]:QUIZ_DATA` },

  { title: "Stanovništvo i migracije", subject: "Geografija", class_number: 3,
    content: `Na Zemlji trenutno živi preko 8 milijardi ljudi. Stanovništvo nije ravnomjerno raspoređeno - najviše ljudi živi u Aziji (preko 4,5 milijardi). Gustina naseljenosti je broj stanovnika po km².

Migracije su preseljenja ljudi iz jednog područja u drugo. Mogu biti unutrašnje (u okviru jedne države) i spoljašnje (između država). Uzroci migracija su ekonomski, politički, ekološki i lični.

\n\nQUIZ_DATA:[{"question":"Koliko ljudi živi na Zemlji?","options":["5 milijardi","6 milijardi","8 milijardi","10 milijardi"],"correct":2},{"question":"Na kom kontinentu živi najviše ljudi?","options":["Evropa","Afrika","Sjeverna Amerika","Azija"],"correct":3}]:QUIZ_DATA` },

  // Class 4
  { title: "Crna Gora - geografski položaj i reljef", subject: "Geografija", class_number: 4,
    content: `Crna Gora se nalazi na jugoistoku Evrope, na Balkanskom poluostrvu. Graniči sa Srbijom, Kosovom, Albanijom, Hrvatskom i Bosnom i Hercegovinom. Ima izlaz na Jadransko more sa obalom dugom 293 km.

Reljef Crne Gore je pretežno planinski. Najviši vrh je Bobotov kuk (2.523 m) na Durmitoru. Skadarsko jezero je najveće jezero na Balkanu. Rijeke Tara, Morača i Piva su najznačajniji vodotoci.

\n\nQUIZ_DATA:[{"question":"Koji je najviši vrh Crne Gore?","options":["Lovćen","Bobotov kuk","Komovi","Bjelasica"],"correct":1},{"question":"Koje je najveće jezero na Balkanu?","options":["Ohridsko","Prespansko","Skadarsko","Plivsko"],"correct":2}]:QUIZ_DATA` },

  { title: "Privreda Crne Gore", subject: "Geografija", class_number: 4,
    content: `Privreda Crne Gore se zasniva na turizmu, energetici, poljoprivredi i uslugama. Turizam je najvažnija privredna grana - primorski gradovi Budva, Kotor i Herceg Novi privlače milione turista godišnje.

Energetika se oslanja na hidroelektrane (Perućica, Piva) i termoelektranu Pljevlja. Poljoprivreda je razvijena u Zetskoj ravnici i oko Skadarskog jezera. Crna Gora je kandidat za članstvo u EU.

\n\nQUIZ_DATA:[{"question":"Koja je najvažnija privredna grana Crne Gore?","options":["Rudarstvo","Industrija","Turizam","Šumarstvo"],"correct":2},{"question":"Gdje je razvijena poljoprivreda u Crnoj Gori?","options":["Na Durmitoru","U Zetskoj ravnici","Na Lovćenu","U Nikšiću"],"correct":1}]:QUIZ_DATA` },

  // ==================== ENGLESKI JEZIK (7) ====================
  // Class 1 (need 2)
  { title: "Present Simple - svakodnevne radnje", subject: "Engleski jezik", class_number: 1,
    content: `Present Simple koristimo za svakodnevne radnje, navike i opšte istine. Struktura: subjekt + glagol (+ s/es za treće lice jednine). Na primjer: "I play football every day." ali "She plays football every day."

Za pitanja koristimo pomoćni glagol do/does: "Do you like pizza?" "Does he speak English?" Za odričnu formu dodajemo don't/doesn't: "I don't like spiders." "She doesn't eat meat."

\n\nQUIZ_DATA:[{"question":"Kad koristimo Present Simple?","options":["Za prošlost","Za budućnost","Za svakodnevne radnje","Za trenutnu radnju"],"correct":2},{"question":"Koji je tačan oblik: She ___ to school every day.","options":["go","goes","going","gone"],"correct":1}]:QUIZ_DATA` },

  { title: "Brojevi, boje i osnovni vokabular", subject: "Engleski jezik", class_number: 1,
    content: `Osnovni brojevi na engleskom: one (1), two (2), three (3), four (4), five (5), six (6), seven (7), eight (8), nine (9), ten (10). Za redne brojeve dodajemo -th: fourth, fifth, sixth (izuzeci: first, second, third).

Boje: red (crvena), blue (plava), green (zelena), yellow (žuta), black (crna), white (bijela), orange (narandžasta), purple (ljubičasta), pink (roze), brown (braon). Boje se u engleskom stavljaju ispred imenice: "a red car", "a blue sky".

\n\nQUIZ_DATA:[{"question":"Kako se kaže 'peti' na engleskom?","options":["Fiveth","Fifth","Fivth","Five"],"correct":1},{"question":"Gdje se stavlja boja u engleskoj rečenici?","options":["Poslije imenice","Ispred imenice","Na kraju rečenice","Na početku"],"correct":1}]:QUIZ_DATA` },

  // Class 2 (need 1)
  { title: "Past Simple - prošlo vrijeme", subject: "Engleski jezik", class_number: 2,
    content: `Past Simple koristimo za završene radnje u prošlosti. Za pravilne glagole dodajemo -ed: play→played, watch→watched, study→studied. Nepravilni glagoli imaju posebne oblike: go→went, eat→ate, see→saw.

Za pitanja koristimo did: "Did you go to school yesterday?" Za negaciju: "I didn't see him." Česti vremenski izrazi su: yesterday, last week, two days ago, in 2020.

\n\nQUIZ_DATA:[{"question":"Kako se pravi Past Simple pravilnih glagola?","options":["Dodajemo -ing","Dodajemo -ed","Dodajemo -s","Ne mijenjamo"],"correct":1},{"question":"Koji je Past Simple od 'go'?","options":["Goed","Goes","Went","Going"],"correct":2}]:QUIZ_DATA` },

  // Class 3 (need 2)
  { title: "Conditional sentences - uslovne rečenice", subject: "Engleski jezik", class_number: 3,
    content: `Uslovne rečenice izražavaju situacije i njihove posljedice. First Conditional (realna mogućnost): If + Present Simple, will + glagol. "If it rains, I will stay home."

Second Conditional (nerealna situacija): If + Past Simple, would + glagol. "If I had a million dollars, I would travel the world." Third Conditional (nerealna prošlost): If + Past Perfect, would have + past participle.

\n\nQUIZ_DATA:[{"question":"Koji kondicional koristimo za realnu mogućnost?","options":["Zero","First","Second","Third"],"correct":1},{"question":"Dopuni: If I ___ rich, I would buy a house.","options":["am","was","were","will be"],"correct":2}]:QUIZ_DATA` },

  { title: "Passive Voice - pasivna konstrukcija", subject: "Engleski jezik", class_number: 3,
    content: `Pasivnu konstrukciju koristimo kada je radnja važnija od vršioca. Struktura: subjekt + to be + past participle. Aktivno: "Shakespeare wrote Hamlet." Pasivno: "Hamlet was written by Shakespeare."

Pasiv se koristi u svim vremenima: Present Simple Passive (is/are + pp): "English is spoken worldwide." Past Simple Passive (was/were + pp): "The bridge was built in 1990."

\n\nQUIZ_DATA:[{"question":"Kada koristimo pasivnu konstrukciju?","options":["Kada je vršilac važniji","Kada je radnja važnija","Uvijek","Nikada"],"correct":1},{"question":"Koji je pasiv od 'They built the house'?","options":["The house built","The house was built","The house is built","The house building"],"correct":1}]:QUIZ_DATA` },

  // Class 4 (need 2)
  { title: "Essay writing - pisanje eseja", subject: "Engleski jezik", class_number: 4,
    content: `Esej na engleskom ima jasnu strukturu: uvod (introduction), razrada (body paragraphs) i zaključak (conclusion). Uvod sadrži temu i tezu (thesis statement) - glavnu ideju koju branite.

Svaki paragraf razrade počinje temom rečenicom (topic sentence), zatim slijede argumenti i primjeri. Koristite vezne riječi: firstly, moreover, however, in conclusion. Zaključak sumira glavne tačke bez novih informacija.

\n\nQUIZ_DATA:[{"question":"Koliko dijelova ima esej?","options":["2","3","4","5"],"correct":1},{"question":"Šta sadrži uvod eseja?","options":["Primjere","Tezu","Zaključak","Statistiku"],"correct":1}]:QUIZ_DATA` },

  { title: "Reported Speech - neupravni govor", subject: "Engleski jezik", class_number: 4,
    content: `Reported Speech koristimo kada prenosimo tuđe riječi. Pri tome mijenjamo glagolsko vrijeme za jedan korak unazad: Present→Past, Past→Past Perfect, Will→Would. "I am happy" → He said he was happy.

Zamjenice i prilozi se takođe mijenjaju: this→that, here→there, today→that day, tomorrow→the next day. Za pitanja: "Where do you live?" → She asked where I lived.

\n\nQUIZ_DATA:[{"question":"Šta se mijenja u Reported Speech?","options":["Samo zamjenice","Samo vrijeme","Vrijeme, zamjenice i prilozi","Ništa"],"correct":2},{"question":"'I will come' u neupravnom govoru postaje:","options":["He said he will come","He said he would come","He said he comes","He said he came"],"correct":1}]:QUIZ_DATA` },

  // ==================== HEMIJA (7) ====================
  // Class 1 (need 2)
  { title: "Atomi i elementi", subject: "Hemija", class_number: 1,
    content: `Atom je najmanja čestica hemijskog elementa. Sastoji se od jezgra (protoni i neutroni) i elektronskog omotača (elektroni). Protoni imaju pozitivno naelektrisanje, elektroni negativno, a neutroni su neutralni.

Hemijski element je supstanca sastavljena od istovrsnih atoma. Poznato je 118 elemenata, organizovanih u Periodnom sistemu elemenata (PSE). Svaki element ima simbol: H (vodonik), O (kiseonik), C (ugljenik), Fe (gvožđe).

\n\nQUIZ_DATA:[{"question":"Od čega se sastoji atom?","options":["Samo od protona","Od jezgra i elektronskog omotača","Samo od elektrona","Od molekula"],"correct":1},{"question":"Koliko hemijskih elemenata je poznato?","options":["92","100","118","150"],"correct":2}]:QUIZ_DATA` },

  { title: "Agregatna stanja i promjene", subject: "Hemija", class_number: 1,
    content: `Supstance mogu postojati u tri agregatna stanja: čvrsto, tečno i gasovito. U čvrstom stanju čestice su gusto pakovane i vibriraju na mjestu. U tečnom se slobodno kreću, a u gasovitom su razmaknute i kreću se haotično.

Prelazi između stanja: topljenje (čvrsto→tečno), isparavanje (tečno→gasovito), kondenzacija (gasovito→tečno), mržnjenje (tečno→čvrsto), sublimacija (čvrsto→gasovito). Voda se topi na 0°C i ključa na 100°C.

\n\nQUIZ_DATA:[{"question":"Kako se zove prelaz iz čvrstog u tečno stanje?","options":["Isparavanje","Kondenzacija","Topljenje","Sublimacija"],"correct":2},{"question":"Na kojoj temperaturi ključa voda?","options":["50°C","80°C","100°C","120°C"],"correct":2}]:QUIZ_DATA` },

  // Class 2 (need 2)
  { title: "Hemijske reakcije i jednačine", subject: "Hemija", class_number: 2,
    content: `Hemijska reakcija je proces u kome se jedne supstance (reaktanti) pretvaraju u druge (proizvodi). Hemijska jednačina opisuje reakciju koristeći hemijske formule. Na primjer: 2H₂ + O₂ → 2H₂O.

Jednačinu moramo izbalansirati - broj atoma svakog elementa mora biti jednak na obje strane. Vrste reakcija: sinteza (A+B→AB), analiza (AB→A+B), zamjena (A+BC→AC+B) i sagorijevanje.

\n\nQUIZ_DATA:[{"question":"Šta su reaktanti?","options":["Proizvodi reakcije","Polazne supstance","Katalizatori","Rastvarači"],"correct":1},{"question":"Šta znači izbalansirati jednačinu?","options":["Dodati katalizator","Izjednačiti broj atoma na obje strane","Dodati vodu","Povećati temperaturu"],"correct":1}]:QUIZ_DATA` },

  { title: "Kiseline, baze i pH vrijednost", subject: "Hemija", class_number: 2,
    content: `Kiseline su supstance koje u vodi otpuštaju H⁺ jone. Imaju kiseo ukus i reaguju sa metalima. Primjeri: hlorovodonična kiselina (HCl), sumporna kiselina (H₂SO₄), sirćetna kiselina (CH₃COOH).

Baze otpuštaju OH⁻ jone, imaju sapunast opip. Primjeri: natrijum-hidroksid (NaOH), kalcijum-hidroksid (Ca(OH)₂). pH skala mjeri kiselost: 0-6 je kiselo, 7 neutralno, 8-14 bazno. Reakcija kiseline i baze daje so i vodu (neutralizacija).

\n\nQUIZ_DATA:[{"question":"Šta kiseline otpuštaju u vodi?","options":["OH⁻ jone","H⁺ jone","Na⁺ jone","Cl⁻ jone"],"correct":1},{"question":"Koja pH vrijednost je neutralna?","options":["0","5","7","14"],"correct":2}]:QUIZ_DATA` },

  // Class 3 (need 2)
  { title: "Organska hemija - uvod", subject: "Hemija", class_number: 3,
    content: `Organska hemija proučava jedinjenja ugljenika. Ugljenik može da gradi četiri kovalentne veze, što mu omogućava stvaranje velikog broja jedinjenja. Najjednostavnija organska jedinjenja su ugljovodonici.

Ugljovodonici se dijele na zasićene (alkani: metan CH₄, etan C₂H₆) i nezasićene (alkeni sa dvostrukom vezom, alkini sa trostrukom). Alkani su glavni sastojak prirodnog gasa i nafte.

\n\nQUIZ_DATA:[{"question":"Koliko veza može ugljenik da gradi?","options":["1","2","3","4"],"correct":3},{"question":"Šta su alkani?","options":["Nezasićeni ugljovodonici","Zasićeni ugljovodonici","Kiseline","Baze"],"correct":1}]:QUIZ_DATA` },

  { title: "Oksidaciono-redukcione reakcije", subject: "Hemija", class_number: 3,
    content: `Oksidaciono-redukcione (redoks) reakcije uključuju prenos elektrona između supstanci. Oksidacija je gubitak elektrona, a redukcija je primanje elektrona. Ova dva procesa se uvijek dešavaju istovremeno.

Primjer: kad gvožđe rđa, ono se oksiduje (Fe→Fe³⁺ + 3e⁻), a kiseonik se redukuje. U galvanskim ćelijama (baterijama) redoks reakcije proizvode električnu energiju. Elektroliza je obrnut proces.

\n\nQUIZ_DATA:[{"question":"Šta je oksidacija?","options":["Primanje elektrona","Gubitak elektrona","Primanje protona","Gubitak protona"],"correct":1},{"question":"Šta proizvode galvanske ćelije?","options":["Toplotu","Svjetlost","Električnu energiju","Zvuk"],"correct":2}]:QUIZ_DATA` },

  // Class 4 (need 1)
  { title: "Polimeri i plastični materijali", subject: "Hemija", class_number: 4,
    content: `Polimeri su veliki molekuli nastali povezivanjem mnogo malih molekula (monomera). Prirodni polimeri su celuloza, svila i guma. Sintetički polimeri (plastika) su polietilen, PVC, najlon i polistiren.

Plastika je jeftina i praktična, ali veliki ekološki problem jer se ne razgrađuje stotinama godina. Reciklaža plastike i razvoj biorazgradivih polimera su ključni za zaštitu okoline. Termoplasti se mogu ponovo topiti, a duroplasti ne.

\n\nQUIZ_DATA:[{"question":"Šta su monomeri?","options":["Veliki molekuli","Mali molekuli od kojih nastaju polimeri","Katalizatori","Rastvarači"],"correct":1},{"question":"Koji polimer je prirodan?","options":["PVC","Polietilen","Celuloza","Najlon"],"correct":2}]:QUIZ_DATA` },

  // ==================== ISTORIJA (7) ====================
  // Class 1 (need 2)
  { title: "Stari Egipat - civilizacija na Nilu", subject: "Istorija", class_number: 1,
    content: `Stari Egipat je jedna od najstarijih civilizacija, nastala oko 3100. godine p.n.e. uz rijeku Nil. Nil je bio izvor života - godišnje poplave su donosile plodno tlo za poljoprivredu. Egipćani su razvili pismo (hijeroglifi), matematiku i astronomiju.

Faraon je bio vrhovni vladar, smatran bogom na Zemlji. Piramide u Gizi su građene kao grobnice faraona - najveća je Keopsova piramida. Egipćani su vjerovali u zagrobni život i mumificirali mrtve.

\n\nQUIZ_DATA:[{"question":"Kada je nastala civilizacija Starog Egipta?","options":["Oko 1000. p.n.e.","Oko 3100. p.n.e.","Oko 500. p.n.e.","Oko 5000. p.n.e."],"correct":1},{"question":"Ko je bio vrhovni vladar Egipta?","options":["Car","Kralj","Faraon","Sultan"],"correct":2}]:QUIZ_DATA` },

  { title: "Stara Grčka - demokratija i kultura", subject: "Istorija", class_number: 1,
    content: `Stara Grčka je kolevka zapadne civilizacije. Atina je razvila demokratiju - sistem vladavine u kome građani direktno odlučuju. Sparta je bila poznata po vojnoj moći i disciplini.

Grci su dali svijetu filozofiju (Sokrat, Platon, Aristotel), Olimpijske igre, pozorište i arhitekturu. Aleksandar Veliki je stvorio ogromno carstvo od Grčke do Indije i širio grčku kulturu (helenizam).

\n\nQUIZ_DATA:[{"question":"Koji grad je razvio demokratiju?","options":["Sparta","Teba","Atina","Korint"],"correct":2},{"question":"Ko je stvorio carstvo od Grčke do Indije?","options":["Perikle","Aleksandar Veliki","Sokrat","Leonida"],"correct":1}]:QUIZ_DATA` },

  // Class 2 (need 2)
  { title: "Srednji vijek - feudalizam", subject: "Istorija", class_number: 2,
    content: `Srednji vijek traje od pada Zapadnog Rimskog carstva (476.) do pada Konstantinopolja (1453.). Feudalizam je bio društveni sistem u kome su kraljevi dijelili zemlju (feude) plemićima u zamjenu za vojnu službu.

Društvo je bilo podijeljeno na staleže: plemstvo (ratovalo), sveštenstvo (molilo se) i kmetovi (radili na zemlji). Crkva je imala ogroman uticaj. Vitezovi su bili profesionalni ratnici koji su slijedili kodeks časti.

\n\nQUIZ_DATA:[{"question":"Kada počinje Srednji vijek?","options":["1000. godine","476. godine","1453. godine","800. godine"],"correct":1},{"question":"Šta je feud?","options":["Novac","Zemlja data plemiću","Oružje","Titula"],"correct":1}]:QUIZ_DATA` },

  { title: "Nemanjići - srpska srednjovjekovna država", subject: "Istorija", class_number: 2,
    content: `Dinastija Nemanjića vladala je srpskom državom od 12. do 14. vijeka. Stefan Nemanja je ujedinio srpske zemlje i osnovao dinastiju. Njegov sin Sava je postao prvi srpski arhiepiskop i dobio autokefalnost za srpsku crkvu (1219).

Stefan Dušan je najmoćniji srpski vladar - proglasio se carem (1346) i donio Dušanov zakonik, jedan od najvažnijih pravnih dokumenata srednjeg vijeka. Poslije njegove smrti (1355), carstvo se raspalo.

\n\nQUIZ_DATA:[{"question":"Ko je osnovao dinastiju Nemanjića?","options":["Stefan Dušan","Stefan Nemanja","Sveti Sava","Stefan Prvovenčani"],"correct":1},{"question":"Kada se Stefan Dušan proglasio carem?","options":["1219.","1346.","1389.","1455."],"correct":1}]:QUIZ_DATA` },

  // Class 3 (need 2)
  { title: "Francuska revolucija", subject: "Istorija", class_number: 3,
    content: `Francuska revolucija (1789-1799) je bila prekretnica u istoriji. Uzroci su bili socijalna nejednakost, ekonomska kriza i apsolutistička vlast kralja Luja XVI. Revolucija je počela padom Bastilje 14. jula 1789.

Revolucionari su usvojili Deklaraciju o pravima čovjeka i građanina. Kralj Luj XVI je pogubljen 1793. Slijedio je period Terora pod Robespjerom. Revolucija je okončana Napoleonovim dolaskom na vlast. Ideje slobode, jednakosti i bratstva promijenile su svijet.

\n\nQUIZ_DATA:[{"question":"Kada je počela Francuska revolucija?","options":["1776.","1789.","1799.","1815."],"correct":1},{"question":"Šta je palo 14. jula 1789.?","options":["Versaj","Bastilja","Luvr","Notr Dam"],"correct":1}]:QUIZ_DATA` },

  { title: "Industrijska revolucija", subject: "Istorija", class_number: 3,
    content: `Industrijska revolucija počela je u Engleskoj krajem 18. vijeka. Pronalazak parne mašine (Džejms Vat) omogućio je mehanizaciju proizvodnje. Fabrike su zamijenile zanatske radionice, a gradovi su brzo rasli.

Posljedice su bile ogromne: masovna proizvodnja, urbanizacija, nastanak radničke klase i poboljšanje transporta (željeznica, parobrod). Ali donijela je i zagađenje, loše radne uslove i eksploataciju djece.

\n\nQUIZ_DATA:[{"question":"Gdje je počela Industrijska revolucija?","options":["Francuska","Njemačka","Engleska","SAD"],"correct":2},{"question":"Ko je usavršio parnu mašinu?","options":["Edison","Vat","Njutn","Bel"],"correct":1}]:QUIZ_DATA` },

  // Class 4 (need 1)
  { title: "Drugi svetski rat", subject: "Istorija", class_number: 4,
    content: `Drugi svetski rat (1939-1945) je najrazorniji sukob u istoriji. Počeo je napadom nacističke Njemačke na Poljsku. Sile Osovine (Njemačka, Italija, Japan) su se borile protiv Saveznika (Britanija, SSSR, SAD, Francuska).

Holokaust - nacistički genocid nad Jevrejima - odnio je 6 miliona života. Rat se završio kapitulacijom Njemačke u maju i Japana u septembru 1945. Osnovane su Ujedinjene nacije sa ciljem sprečavanja novih ratova.

\n\nQUIZ_DATA:[{"question":"Kada je počeo Drugi svetski rat?","options":["1914.","1935.","1939.","1941."],"correct":2},{"question":"Koja organizacija je osnovana nakon rata?","options":["NATO","Ujedinjene nacije","EU","Varšavski pakt"],"correct":1}]:QUIZ_DATA` },

  // ==================== MATEMATIKA (4) ====================
  // Class 1 (need 2)
  { title: "Prirodni brojevi i osnovne operacije", subject: "Matematika", class_number: 1,
    content: `Prirodni brojevi su brojevi koje koristimo za brojanje: 1, 2, 3, 4, 5... Nula (0) se ponekad uključuje. Četiri osnovne računske operacije su: sabiranje (+), oduzimanje (-), množenje (×) i dijeljenje (÷).

Sabiranje i množenje su komutativne operacije: a+b=b+a i a×b=b×a. Množenje ima prednost nad sabiranjem: 2+3×4=2+12=14, a ne 20. Zagrade imaju najviši prioritet.

\n\nQUIZ_DATA:[{"question":"Koliko je 2+3×4?","options":["20","14","24","10"],"correct":1},{"question":"Koja operacija ima prednost - sabiranje ili množenje?","options":["Sabiranje","Množenje","Iste su","Zavisi od brojeva"],"correct":1}]:QUIZ_DATA` },

  { title: "Razlomci - sabiranje i oduzimanje", subject: "Matematika", class_number: 1,
    content: `Razlomak se sastoji od brojioca (gore) i imenioca (dole). Na primjer, u razlomku 3/4, brojilac je 3, a imenilac 4. Razlomak predstavlja dio cjeline.

Da bismo sabrali razlomke, moraju imati isti imenilac. Ako nemaju, nalazimo najmanji zajednički sadržalac. Na primjer: 1/3 + 1/4 = 4/12 + 3/12 = 7/12. Razlomke skraćujemo dijeljenjem brojioca i imenioca istim brojem.

\n\nQUIZ_DATA:[{"question":"Šta je imenilac u razlomku 5/8?","options":["5","8","3","13"],"correct":1},{"question":"Koliko je 1/3 + 1/6?","options":["2/9","1/2","2/6","1/3"],"correct":1}]:QUIZ_DATA` },

  // Class 3 (need 1)
  { title: "Kvadratna jednačina", subject: "Matematika", class_number: 3,
    content: `Kvadratna jednačina ima oblik ax² + bx + c = 0, gdje je a≠0. Rješava se pomoću formule: x = (-b ± √(b²-4ac)) / 2a. Izraz D = b²-4ac se zove diskriminanta.

Ako je D > 0, jednačina ima dva različita realna rješenja. Ako je D = 0, ima jedno dvostruko rješenje. Ako je D < 0, nema realnih rješenja. Na primjer: x²-5x+6=0 → D=25-24=1 → x₁=3, x₂=2.

\n\nQUIZ_DATA:[{"question":"Kakav oblik ima kvadratna jednačina?","options":["ax+b=0","ax²+bx+c=0","ax³+b=0","a/x=b"],"correct":1},{"question":"Ako je diskriminanta D<0, koliko rješenja ima jednačina?","options":["Dva","Jedno","Nijedno realno","Beskonačno"],"correct":2}]:QUIZ_DATA` },

  // Class 4 (need 1)
  { title: "Izvodi funkcija", subject: "Matematika", class_number: 4,
    content: `Izvod funkcije mjeri brzinu promjene funkcije u datoj tački. Geometrijski, izvod predstavlja nagib tangente na grafik funkcije. Oznaka: f'(x) ili dy/dx.

Osnovna pravila: izvod konstante je 0, izvod od xⁿ je n·xⁿ⁻¹, izvod od sin(x) je cos(x), izvod od eˣ je eˣ. Pravilo za zbir: (f+g)' = f'+g'. Pravilo za proizvod: (fg)' = f'g + fg'.

\n\nQUIZ_DATA:[{"question":"Šta predstavlja izvod geometrijski?","options":["Površinu","Zapreminu","Nagib tangente","Dužinu luka"],"correct":2},{"question":"Koliko je izvod od x³?","options":["x²","3x²","3x³","x³"],"correct":1}]:QUIZ_DATA` },

  // ==================== FIZIKA (3) ====================
  // Class 1 (need 1)
  { title: "Osnove mjerenja - fizičke veličine i jedinice", subject: "Fizika", class_number: 1,
    content: `Fizika proučava prirodne pojave i zakone. Fizičke veličine se izražavaju brojem i mjernom jedinicom. Osnovne SI jedinice su: metar (m) za dužinu, kilogram (kg) za masu, sekunda (s) za vrijeme.

Mjerenje je poređenje nepoznate veličine sa poznatom jedinicom. Za mjerenje dužine koristimo lenjir, za masu vagu, za vrijeme sat. Prefiksi: kilo (1000), centi (0,01), mili (0,001). Na primjer: 1 km = 1000 m.

\n\nQUIZ_DATA:[{"question":"Koja je SI jedinica za masu?","options":["Gram","Kilogram","Tona","Miligram"],"correct":1},{"question":"Koliko metara ima 1 kilometar?","options":["10","100","1000","10000"],"correct":2}]:QUIZ_DATA` },

  // Class 3 (need 1)
  { title: "Električna struja i Omov zakon", subject: "Fizika", class_number: 3,
    content: `Električna struja je usmjereno kretanje naelektrisanih čestica (elektrona) kroz provodnik. Jačina struje (I) se mjeri u amperima (A). Napon (U) je sila koja pokreće elektrone i mjeri se u voltima (V).

Omov zakon glasi: I = U/R, gdje je R otpor provodnika (mjeri se u omima, Ω). Veći napon znači jaču struju, veći otpor znači slabiju struju. U kolu sa serijskom vezom struja je svuda ista, a naponi se sabiraju.

\n\nQUIZ_DATA:[{"question":"Kako glasi Omov zakon?","options":["U=I+R","I=U/R","R=I×U","U=R/I"],"correct":1},{"question":"U čemu se mjeri napon?","options":["Amperima","Omima","Vatima","Voltima"],"correct":3}]:QUIZ_DATA` },

  // Class 4 (need 1)
  { title: "Talasi i zvuk", subject: "Fizika", class_number: 4,
    content: `Talasi su poremećaji koji se šire kroz sredinu. Postoje poprečni (čestica osciluje okomito na pravac prostiranja) i podužni talasi (čestica osciluje u pravcu prostiranja). Zvuk je podužni mehanički talas.

Brzina zvuka u vazduhu iznosi oko 340 m/s. Frekvencija zvuka određuje visinu tona (mjeri se u hercima, Hz). Ljudsko uho čuje frekvencije od 20 Hz do 20.000 Hz. Ultrazvuk je iznad 20.000 Hz, infrazvuk ispod 20 Hz.

\n\nQUIZ_DATA:[{"question":"Kolika je brzina zvuka u vazduhu?","options":["100 m/s","340 m/s","1000 m/s","300.000 km/s"],"correct":1},{"question":"Koji opseg frekvencija čuje ljudsko uho?","options":["1-100 Hz","20-20000 Hz","100-50000 Hz","0-10000 Hz"],"correct":1}]:QUIZ_DATA` },
];

async function insertLecture(lec) {
  const res = await fetch(URL + '/rest/v1/lectures', {
    method: 'POST',
    headers: {
      'apikey': SK,
      'Authorization': 'Bearer ' + SK,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      title: lec.title,
      subject: lec.subject,
      content: lec.content,
      class_number: lec.class_number,
      author_id: AUTHOR
    })
  });
  return { title: lec.title, subject: lec.subject, class: lec.class_number, status: res.status, ok: res.ok };
}

async function main() {
  console.log(`Inserting ${lectures.length} lectures...`);
  let ok = 0, fail = 0;
  for (const lec of lectures) {
    const r = await insertLecture(lec);
    if (r.ok) {
      ok++;
      console.log(`✅ [${r.subject} C${r.class}] ${r.title}`);
    } else {
      fail++;
      console.log(`❌ [${r.subject} C${r.class}] ${r.title} — HTTP ${r.status}`);
    }
  }
  console.log(`\nDone: ${ok} succeeded, ${fail} failed out of ${lectures.length} total.`);
}

main();
