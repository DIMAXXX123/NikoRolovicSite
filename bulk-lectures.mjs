const URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg';
const AUTHOR = '241c9077-b700-4400-8f96-20e3a650eef4';

const headers = {
  'apikey': SK, 'Authorization': `Bearer ${SK}`,
  'Content-Type': 'application/json', 'Prefer': 'return=minimal'
};

// All topics from ucidoma.edu.me
const topics = {
  'Matematika': {
    1: ['Iskazi i operacije sa iskazima','Iskazne formule i tautologija','Kvantori i zadavanje iskaza','Operacije sa skupovima','Prirodni i cijeli brojevi','Djeljivost u skupu cijelih brojeva','NZD NZS i Euklidov algoritam','Racionalni brojevi','Realni brojevi','Procenat i proporcija','Operacije sa polinomima','Formule za skraćeno množenje','Dijeljenje polinoma','Bezuova teorema','NZS i NZD polinoma','Algebarski razlomci - proširivanje i skraćivanje','Sabiranje i oduzimanje algebarskih razlomaka','Množenje i dijeljenje algebarskih razlomaka'],
    2: ['Stepeni cjelobrojnog izložioca','Osobine funkcija','Stepene funkcije','Pojam n-tog korijena','Stepeni racionalnog izložioca','Kompozicija funkcija','Inverzna funkcija','Korijena funkcija','Kompleksni brojevi','Geometrijska interpretacija kompleksnih brojeva','Kvadratna jednačina','Priroda rješenja kvadratne jednačine','Vietove formule'],
    3: ['Trigonometrijska kružnica','Svođenje trigonometrijskih funkcija','Trigonometrijski identiteti','Adicione formule','Trigonometrijske funkcije dvostrukog ugla','Formule za zbir i razliku trigonometrijskih funkcija','Kosinusna i sinusna teorema','Trigonometrijske jednačine','Grafici trigonometrijskih funkcija','Primjena trigonometrije','Površine ravnih figura','Površina i zapremina prizme','Površina i zapremina piramide','Površina i zapremina zarubljene piramide','Površina i zapremina valjka'],
    4: ['Pojam niza i osobine','Konvergencija brojnog niza','Svojstva konvergentnih nizova','Monotoni nizovi - Vajerštrasova teorema','Broj e','Osnovna svojstva funkcija - domen nule znak','Granična vrijednost funkcije','Značajne granične vrijednosti','Neprekidnost funkcije','Asimptote funkcije','Pojam izvoda','Pravila diferenciranja','Izvod složene funkcije','Diferencijal funkcije','Monotonost funkcije'],
  },
  'Fizika': {
    1: ['Fizičke veličine','Mjerenje i greške pri mjerenju','Kretanje','Brzina','Ubrzanje','Ravnomjerno promjenjivo kretanje','Slobodan pad','Vertikalni hitac naviše i naniže','Horizontalni hitac','Kružno kretanje','Ravnomjerno kružno kretanje','Sila','Njutnovi zakoni'],
    2: ['Mehanički rad i rad sile','Mehanička snaga','Kinetička energija','Potencijalna energija','Zakon održanja mehaničke energije','Statika fluida','Arhimedov zakon','Dinamika fluida','Jednačina kontinuiteta','Bernulijeva jednačina'],
    3: ['Električna struja','Omov zakon za dio strujnog kola','Redna i paralelna veza otpornika','Omov zakon za cijelo strujno kolo','Džul-Lencov zakon','Magnetno polje','Magnetno polje strujnog provodnika','Amperova sila','Lorencova sila','Magnetni fluks','Elektromagnetna indukcija','Princip rada transformatora','Mehaničke oscilacije','Mehanički talasi'],
    4: ['Zakoni geometrijske optike','Optička prizma i disperzija','Ravna i sferna ogledala','Sočiva i jednačina sočiva','Optički instrumenti','Priroda svjetlosti','Interferencija svjetlosti','Difrakcija svjetlosti','Polarizacija svjetlosti','Teorija relativnosti','Relativistička dinamika','Fotoelektrični efekat'],
  },
  'Hemija': {
    1: ['Struktura atoma','Prostorni raspored elektrona u atomu','Elektronska konfiguracija','Periodični sistem elemenata','Jonska veza','Kovalentna veza','Metalna veza','Vodonična veza','Stehiometrijski zakoni','Empirijska i molekulska formula','Kvantitativni odnosi u hemijskim reakcijama'],
    2: ['Kiseline i baze - Arenijusova teorija','Brenstred-Lorijeva teorija','Jačina kiselina i baza','pH vrijednost vodenih rastvora','Hidroliza soli','Puferski rastvori','Osobine nemetala','Vodonik i njegova jedinjenja','Halkogeni elementi','Elementi 15 grupe PSE'],
    3: ['Hibridizacija orbitala','Klasifikacija organskih jedinjenja','Alkani - nomenklatura i svojstva','Alkeni - nomenklatura i reakcije','Alkadiieni','Cikloalkani','Aromatični ugljovodonici','Halogeni derivati ugljovodonika','Alkoholi','Fenoli','Etri','Aldehidi i ketoni','Karboksilne kiseline','Estri','Amini'],
    4: ['Ugljeni hidrati','Monosaharidi','Disaharidi','Polisaharidi','Lipidi - klasifikacija','Triacilgliceroli','Proteini - struktura','Biološki važni proteini','Struktura DNK i RNK','Vitamini rastvorljivi u mastima','Vitamini rastvorljivi u vodi','Enzimi - mehanizam djelovanja'],
  },
  'Biologija': {
    1: ['Biologija kao nauka','Hemijski sastav ćelije','Citosol i ćelijske organele','Jedro','Mitoza','Mejoza','Enzimi','ATP i koenzimi','Fotosinteza','Ćelijsko disanje','Vrenje'],
    2: ['Sistematske kategorije','Carstvo protista','Carstvo gljiva','Biljna tkiva','Sjemenice','Carstvo životinja','Dupljari','Mekušci','Prstenaste gliste','Zglavkari'],
    3: ['Embrionalno razviće','Tkiva','Koža','Endokrini sistem','Neuron i refleksni luk','Mišićni sistem','Srce i krvni sistem','Sistem organa za disanje','Sistem organa za varenje','Sistem organa za izlučivanje'],
    4: ['Uvod u genetiku','Genetička osnova reprodukcije','Mendelovi zakoni','Tipovi nasleđivanja','Hromozomska osnova nasleđivanja','Genetička determinacija pola','Ekologija - predmet proučavanja','Ekološki faktori','Populacija i biocenoza','Ekosistem','Biomi','Zagađivanje životne sredine'],
  },
  'Geografija': {
    1: ['Uvod u fizičku geografiju','Kosmos','Sunčev sistem','Zemlja u Kosmosu','Mjesec','Prikazivanje Zemlje na karti','Unutrašnja građa Zemlje','Vulkani i zemljotresi','Tektonski pokreti','Fluvijalna erozija','Kraška erozija','Glacijalna erozija'],
    2: ['Geografski položaj Crne Gore','Geološka građa Crne Gore','Kraški reljef u Crnoj Gori','Klima Crne Gore','Jadransko more','Rijeke Crne Gore','Jezera Crne Gore','Stanovništvo Crne Gore','Migracije','Naselja u Crnoj Gori'],
    3: ['Evropa - prirodne odlike','Azija - prirodne odlike','Afrika','Sjeverna Amerika','Južna Amerika','Australija i Okeanija','Svjetsko stanovništvo','Svjetska privreda'],
    4: ['Privredni razvoj Crne Gore','Industrija Crne Gore','Poljoprivreda','Turizam','Saobraćaj','Energetika','Zaštita životne sredine'],
  },
  'Istorija': {
    1: ['Uvod u istoriju','Civilizacija Mesopotamije','Stari Egipat','Stara Indija i Kina','Stara Grčka','Sparta','Atina','Grčko-persijski ratovi','Helenističko doba','Stari Rim - nastanak','Rim u doba Republike','Rim gospodar Sredozemlja','Pad Rimskog carstva'],
    2: ['Velika seoba naroda','Feudalizam','Franačka država','Vizantija','Arabljani i islam','Stari Sloveni','Dukljanska država','Srednjovjekovna Srbija','Krstaški ratovi','Mletačka republika','Zeta u doba Balšića'],
    3: ['Velika geografska otkrića','Humanizam i renesansa','Reformacija','Osmansko carstvo','Habsburška monarhija','Apsolutističke monarhije','Engleska revolucija','Crna Gora u doba vladike Danila','Crna Gora - Petar I i Petar II','Francuska revolucija','Američka revolucija','Napoleonova osvajanja','Bečki kongres'],
    4: ['Evropa na početku XX vijeka','Prvi svjetski rat','Revolucija u Rusiji','Fašizam i nacizam','Crna Gora u I svjetskom ratu','Podgorička skupština','Crna Gora u Kraljevini Jugoslaviji','Drugi svjetski rat','Okupacija Crne Gore','Trinaestojulski ustanak','Oslobođenje Crne Gore','Svijet nakon II svjetskog rata','Hladni rat'],
  },
  'Engleski jezik': {
    1: ['Present Simple and Present Continuous','Past Simple and Past Continuous','Present Perfect','First Conditional','Gerund or Infinitive','Used to','Present Perfect and Past Simple','Writing an Informal Email'],
    2: ['Dynamic and Stative Verbs','Present Perfect Continuous','Narrative Tenses','Verb Patterns','Relative Clauses','Future Time Clauses','Determiners','Writing an Article'],
    3: ['Present and Past Habits','Past Perfect Simple and Continuous','Defining and Non-defining Relative Clauses','Reduced Relative Clauses','Modal Verbs','Reported Speech','Future Time Clauses Advanced','Writing a Formal Letter'],
    4: ['Conditionals Revision','Mixed Conditionals','Advanced Passive Forms','Passive Reporting Structures','Unreal Present and Past','Cleft Sentences','Inversion','Argumentative Essay Writing'],
  },
  'CSBH': {
    1: ['Glasovi i glasovne promjene','Akcenat u crnogorskom jeziku','Imenice - vrste i deklinacija','Pridjevi - komparacija','Zamjenice','Glagoli - konjugacija','Prilozi','Prijedlozi','Rečenica - prosta i složena','Pravopis - osnovna pravila'],
    2: ['Leksikologija - značenje riječi','Sinonimi antonimi homonimi','Pravopis - velika slova','Zavisne rečenice','Nezavisne rečenice','Stilske figure','Književni rodovi i vrste','Epska književnost','Lirska književnost','Dramska književnost'],
    3: ['Razvoj crnogorskog jezika','Standardizacija jezika','Funkcionalni stilovi','Jezička kultura','Crnogorska književnost 19. vijeka','Petar II Petrović Njegoš','Gorski vijenac - analiza','Književnost romantizma','Književnost realizma','Moderna crnogorska proza'],
    4: ['Lingvistika kao nauka','Fonologija','Morfologija - napredni pojmovi','Sintaksa složenih rečenica','Semantika','Pragmatika','Savremena crnogorska književnost','Književna kritika','Komparativna književnost','Retorika i javni govor'],
  },
};

// Simple content generator
function makeContent(title, subject) {
  return `${title}\n\nOvo je lekcija iz predmeta ${subject}. U ovoj lekciji obrađujemo temu "${title}".\n\nUčenici treba da savladaju osnovne koncepte ove teme, razumiju ključne pojmove i budu spremni za primjenu stečenog znanja u praktičnim zadacima.\n\nQUIZ_DATA:[{"question":"Koja je tema ove lekcije?","options":["${title}","Nešto drugo","Ne znam","Ništa od navedenog"],"correct":0},{"question":"Iz kog predmeta je ova lekcija?","options":["Matematika","Fizika","${subject}","Hemija"],"correct":2}]:QUIZ_DATA`;
}

// Get existing titles
const existing = await fetch(`${URL}/rest/v1/lectures?select=title`, { headers }).then(r => r.json());
const existingTitles = new Set(existing.map(l => l.title));
console.log(`Existing: ${existingTitles.size} lectures`);

let added = 0, skipped = 0;
for (const [subject, classes] of Object.entries(topics)) {
  for (const [cls, titles] of Object.entries(classes)) {
    for (const title of titles) {
      if (existingTitles.has(title)) { skipped++; continue; }
      const res = await fetch(`${URL}/rest/v1/lectures`, {
        method: 'POST', headers,
        body: JSON.stringify({
          title, subject, class_number: parseInt(cls),
          content: makeContent(title, subject),
          author_id: AUTHOR
        })
      });
      if (res.ok) { added++; existingTitles.add(title); }
      else console.error(`FAIL: ${title} - ${res.status}`);
    }
  }
}
console.log(`Done! Added: ${added}, Skipped: ${skipped}`);
