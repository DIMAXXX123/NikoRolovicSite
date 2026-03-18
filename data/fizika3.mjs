export const fizika3 = [
{title:"Električna struja",subject:"Fizika",class_number:3,content:`Električna struja je usmjereno kretanje naelektrisanih čestica kroz provodnik. Jačina struje I=Q/t — količina naelektrisanja kroz presjek u jedinici vremena. Mjerna jedinica: amper (A). Konvencionalni smjer: od + ka − polu.

Uslovi za struju: slobodne naelektrisane čestice (nosioci) i električno polje (izvor EMS). U metalima su nosioci slobodni elektroni, u elektrolitima ioni, u gasovima ioni i elektroni.

Struja može biti jednosmjerna (DC) i naizmjenična (AC). Dejstva: toplotno, magnetno, hemijsko (elektroliza) i fiziološko.

<!--QUIZ_DATA
[{"question":"Jačina električne struje?","options":["I=Q·t","I=Q/t","I=U/R","I=P/U"],"correct":1},{"question":"Nosioci struje u metalima?","options":["Protoni","Ioni","Slobodni elektroni","Neutroni"],"correct":2},{"question":"Mjerna jedinica za struju?","options":["Volt","Om","Vat","Amper"],"correct":3}]
QUIZ_DATA-->`},
{title:"Omov zakon za dio strujnog kola",subject:"Fizika",class_number:3,content:`Omov zakon: I=U/R ili U=IR. Otpor R je osobina provodnika da se suprotstavlja struju. R=ρl/S — zavisi od specifičnog otpora ρ, dužine l i presjeka S. Jedinica: om (Ω).

Dobar provodnik ima mali ρ (bakar: 1.7·10⁻⁸ Ωm). Na I-U dijagramu omski provodnik daje pravu liniju. Neomski provodnici (diode, termistori) ne poštuju Omov zakon.

Reostat je uređaj za promjenu otpora u kolu. Otpor raste sa temperaturom za metale, a opada za poluprovodnike.

<!--QUIZ_DATA
[{"question":"Omov zakon za dio kola?","options":["I=U·R","I=U/R","I=R/U","U=I/R"],"correct":1},{"question":"Od čega zavisi otpor provodnika?","options":["Samo materijala","Napona i struje","Materijala, dužine i presjeka","Samo temperature"],"correct":2},{"question":"Jedinica za otpor?","options":["Amper","Volt","Vat","Om"],"correct":3}]
QUIZ_DATA-->`},
{title:"Redna i paralelna veza otpornika",subject:"Fizika",class_number:3,content:`Redna veza: ista struja kroz sve, R=R₁+R₂+...+Rₙ. Napon se dijeli proporcionalno otporima: U₁=IR₁. Ukupno: U=U₁+U₂+...

Paralelna veza: isti napon, 1/R=1/R₁+1/R₂+... Za dva: R=R₁R₂/(R₁+R₂). Struja se dijeli obrnuto proporcionalno otporima: I₁=U/R₁.

Redna veza: razdjelnik napona, osigurači. Paralelna: kućne instalacije — svaki potrošač isti napon, nezavisno isključivanje.

<!--QUIZ_DATA
[{"question":"Ukupni otpor u rednoj vezi?","options":["1/R=1/R₁+1/R₂","R=R₁R₂/(R₁+R₂)","R=R₁+R₂","R=R₁−R₂"],"correct":2},{"question":"Šta je isto u paralelnoj vezi?","options":["Struja","Otpor","Snaga","Napon"],"correct":3},{"question":"Šta je isto u rednoj vezi?","options":["Napon","Struja","Otpor","Snaga"],"correct":1}]
QUIZ_DATA-->`},
{title:"Omov zakon za cijelo strujno kolo",subject:"Fizika",class_number:3,content:`I=ε/(R+r) — uzima u obzir unutrašnji otpor r izvora. ε je elektromotorna sila. Napon na polovima: U=ε−Ir=IR.

Kratak spoj (R=0): I=ε/r — maksimalna i opasna struja. Otvoreno kolo (I=0): U=ε. Veća struja → veći pad na r → manji napon na polovima.

Snaga izvora P=εI. Korisna: P=I²R. Gubici: P=I²r. KKD: η=R/(R+r). Max korisna snaga kad R=r, ali KKD=50%.

<!--QUIZ_DATA
[{"question":"Omov zakon za cijelo kolo?","options":["I=U/R","I=ε/(R+r)","I=ε/R","I=εr/R"],"correct":1},{"question":"Napon na polovima pri kratkom spoju?","options":["U=ε","U=0","U=IR","U=εr"],"correct":1},{"question":"Max snaga na vanjskom otporu kad?","options":["R=0","R=∞","R=r","R=2r"],"correct":2}]
QUIZ_DATA-->`},
{title:"Džul-Lencov zakon",subject:"Fizika",class_number:3,content:`Toplotno dejstvo struje: Q=I²Rt. Može se pisati i Q=U²t/R=UIt. Otkrili Džul (1841) i Lenc (1842).

Za rednu vezu (ista I): više toplote na većem otporu (Q=I²Rt). Za paralelnu (isti U): više na manjem (Q=U²t/R).

Primjene: grijači, pegle, sijalice, osigurači. U elektroenergetici gubici u vodovima I²R se smanjuju povećanjem napona prenosa.

<!--QUIZ_DATA
[{"question":"Džul-Lencov zakon?","options":["Q=IRt","Q=I²Rt","Q=U²Rt","Q=I²R/t"],"correct":1},{"question":"U rednoj vezi više toplote na:","options":["Manjem otporu","Oba jednako","Većem otporu","Zavisi od napona"],"correct":2},{"question":"Kako se smanjuju gubici u vodovima?","options":["Smanjenjem napona","Povećanjem struje","Povećanjem napona","Smanjenjem otpora na 0"],"correct":2}]
QUIZ_DATA-->`},
{title:"Magnetno polje",subject:"Fizika",class_number:3,content:`Magnetno polje djeluje na pokretna naelektrisanja i magnete. Izvor: pokretna naelektrisanja (struje) i stalni magneti. Opisuje se vektorom magnetne indukcije B, jedinica tesla (T).

Silnice su zatvorene linije — od sjevernog ka južnom polu. Ne postoje magnetni monopoli. Gustina silnica proporcionalna jačini polja.

Zemljino magnetno polje štiti od naelektrisanih čestica iz svemira. Kompas se orijentiše prema njemu — sjeverni pol igle pokazuje ka magnetnom južnom polu Zemlje.

<!--QUIZ_DATA
[{"question":"Izvor magnetnog polja?","options":["Mirna naelektrisanja","Pokretna naelektrisanja i magneti","Gravitacija","Svjetlost"],"correct":1},{"question":"Jedinica magnetne indukcije?","options":["Veber","Amper","Tesla","Henri"],"correct":2},{"question":"Linije magnetnog polja su:","options":["Otvorene","Zatvorene","Prave","Paralelne"],"correct":1}]
QUIZ_DATA-->`},
{title:"Magnetno polje strujnog provodnika",subject:"Fizika",class_number:3,content:`Provodnik sa strujom stvara magnetno polje. Smjer — pravilo desne ruke: palac u smjeru struje, prsti pokazuju smjer silnica (koncentrične kružnice).

Za pravolinijski provodnik: B=μ₀I/(2πr), μ₀=4π·10⁻⁷ T·m/A. Za kružnu petlju: B=μ₀I/(2R) u centru. Za solenoid: B=μ₀nI, n=N/l.

Elektromagnet je solenoid sa željeznim jezgrom — pojačava polje stotine puta. Primjene: električni zvonci, releji, MRI skeneri.

<!--QUIZ_DATA
[{"question":"Smjer polja oko provodnika?","options":["Pravilo lijeve ruke","Pravilo desne ruke","Lencovo pravilo","Amperov zakon"],"correct":1},{"question":"Kako B zavisi od rastojanja za pravolinijski provodnik?","options":["Ne zavisi","Proporcionalna r","Obrnuto proporcionalna r","Obrnuto proporcionalna r²"],"correct":2},{"question":"Polje u solenoidu?","options":["B=μ₀I","B=μ₀nI","B=μ₀NI/r","B=μ₀I/(2πr)"],"correct":1}]
QUIZ_DATA-->`},
{title:"Amperova sila",subject:"Fizika",class_number:3,content:`Sila magnetnog polja na provodnik sa strujom: F=BIl sin α. Maksimalna kad je provodnik okomit na polje (α=90°), nula kad su paralelni (α=0°).

Smjer — pravilo lijeve ruke: prsti od S ka J polu magneta, palac u smjeru struje, dlan gura provodnik. Vektorski: F=Il×B.

Osnova rada elektromotora. Dva paralelna provodnika: istomjerne struje se privlače, suprotne odbijaju. Primjene: elektromotori, galvanometri, zvučnici.

<!--QUIZ_DATA
[{"question":"Amperova sila?","options":["F=BIl","F=BIl sin α","F=BQv","F=BIl cos α"],"correct":1},{"question":"Kad je Amperova sila max?","options":["α=0°","α=45°","α=90°","α=180°"],"correct":2},{"question":"Osnova rada elektromotora?","options":["Elektromagnetna indukcija","Amperova sila","Lorencova sila","Džul-Lencov zakon"],"correct":1}]
QUIZ_DATA-->`},
{title:"Lorencova sila",subject:"Fizika",class_number:3,content:`Sila magnetnog polja na pokretnu naelektrisanu česticu: F=qvB sin α. Uvijek okomita na brzinu — ne vrši rad, samo mijenja smjer.

U homogenom polju, čestica okomita na B kreće se po kružnici poluprečnika r=mv/(qB). Lorencova sila igra ulogu centripetalne sile.

Primjene: maseni spektrometar, ciklotron, Hallov efekat, zadržavanje plazme u fuzionim reaktorima, katodna cijev.

<!--QUIZ_DATA
[{"question":"Lorencova sila?","options":["F=qvB sin α","F=BIl sin α","F=qE","F=mv²/r"],"correct":0},{"question":"Da li Lorencova sila vrši rad?","options":["Da, uvijek","Da, ako α=90°","Ne, okomita na brzinu","Ponekad"],"correct":2},{"question":"Putanja čestice u homogenom polju (okomit ulaz)?","options":["Pravolinijska","Parabolična","Kružnica","Spirala"],"correct":2}]
QUIZ_DATA-->`},
{title:"Magnetni fluks",subject:"Fizika",class_number:3,content:`Magnetni fluks Φ=B·S·cos α — količina magnetnog polja kroz površinu. B indukcija, S površina, α ugao B i normale. Jedinica: veber (Wb)=T·m².

Max kad B okomito na površinu (α=0°), nula kad paralelno (α=90°). Promjena fluksa izaziva elektromagnetnu indukciju (Faradejev zakon).

Magnetni fluks kroz zatvorenu površinu je uvijek nula — ne postoje magnetni monopoli (Gausov zakon za magnetizam).

<!--QUIZ_DATA
[{"question":"Magnetni fluks?","options":["Φ=B·S·sin α","Φ=B·S·cos α","Φ=B/S","Φ=B²·S"],"correct":1},{"question":"Jedinica magnetnog fluksa?","options":["Tesla","Henri","Veber","Amper"],"correct":2},{"question":"Fluks kroz zatvorenu površinu?","options":["Maksimalan","B·S","Zavisi od oblika","Uvijek nula"],"correct":3}]
QUIZ_DATA-->`},
{title:"Elektromagnetna indukcija",subject:"Fizika",class_number:3,content:`EMS nastaje promjenom magnetnog fluksa — otkrio Faradej 1831. Faradejev zakon: ε=−dΦ/dt. Za kalem sa N navoja: ε=−N·dΦ/dt.

Lencovo pravilo: indukovana struja se suprotstavlja promjeni fluksa. Ako magnet prilazi kalemu, struja stvara polje koje odbija magnet — posljedica zakona održanja energije.

Načini ostvarivanja: pomjeranje provodnika, promjena B, promjena S, promjena ugla. Primjene: generatori, transformatori, indukcione peći.

<!--QUIZ_DATA
[{"question":"Ko je otkrio elektromagnetnu indukciju?","options":["Tesla","Faradej","Maksvel","Ersted"],"correct":1},{"question":"Faradejev zakon?","options":["ε=BIl","ε=−dΦ/dt","ε=IR","ε=−LdI/dt"],"correct":1},{"question":"Lencovo pravilo određuje:","options":["Veličinu EMS","Smjer indukovane struje","Magnetni fluks","Jačinu polja"],"correct":1}]
QUIZ_DATA-->`},
{title:"Princip rada transformatora",subject:"Fizika",class_number:3,content:`Transformator mijenja napon AC struje koristeći elektromagnetnu indukciju. Ima željezno jezgro i dva namotaja: primarni (N₁ navoja) i sekundarni (N₂ navoja).

Odnos napona: U₂/U₁=N₂/N₁=k. k>1 uzlazni (podiže napon), k<1 silazni. Za idealan: P₁=P₂, tj. U₁I₁=U₂I₂ — podiže napon ali smanjuje struju.

Prenos energije na visokom naponu (110-400 kV) smanjuje gubitke I²R. Transformatorima se snižava na 220/380 V. KKD: 95-99%.

<!--QUIZ_DATA
[{"question":"Osnovna formula transformatora?","options":["U₂/U₁=N₁/N₂","U₂/U₁=N₂/N₁","U₂/U₁=I₂/I₁","U₁U₂=N₁N₂"],"correct":1},{"question":"Uzlazni transformator?","options":["k<1","k=1","k>1","k=0"],"correct":2},{"question":"Zašto visoki napon za prenos?","options":["Jeftiniji provodnik","Smanjenje gubitaka I²R","Transformatori rade samo na visokom","Povećanje snage"],"correct":1}]
QUIZ_DATA-->`},
{title:"Energija magnetnog polja",subject:"Fizika",class_number:3,content:`Energija magnetnog polja kalema: W=LI²/2. L je induktivnost (henri, H). Za solenoid: L=μ₀N²S/l. Gustina energije: w=B²/(2μ₀).

Samoindukcija: promjena struje u kalemu indukuje EMS u samom kalemu: ε=−L·dI/dt. Zavojnica se opire promjenama struje — struja ne može trenutno porasti ili opasti.

Energija magnetnog polja se oslobađa pri isključivanju struje i može izazvati iskru. Analogna je energiji električnog polja kondenzatora W=CU²/2.

<!--QUIZ_DATA
[{"question":"Energija magnetnog polja kalema?","options":["W=LI","W=LI²/2","W=L²I/2","W=LI²"],"correct":1},{"question":"Jedinica induktivnosti?","options":["Farad","Om","Henri","Veber"],"correct":2},{"question":"Šta je samoindukcija?","options":["Indukcija u drugom kalemu","EMS u samom kalemu usljed promjene struje","Indukcija u stalnom magnetu","Indukcija kretanjem provodnika"],"correct":1}]
QUIZ_DATA-->`},
{title:"Mehaničke oscilacije",subject:"Fizika",class_number:3,content:`Oscilacije: periodično kretanje oko ravnoteže. Harmonijske: x(t)=A sin(ωt+φ₀). A amplituda, ω kružna frekvencija, T=2π/ω period, f=1/T frekvencija.

Matematičko klatno: T=2π√(l/g) — ne zavisi od mase ni amplitude (male osc.). Opruga: T=2π√(m/k), m masa, k koeficijent elastičnosti.

Energija: E=kA²/2 konstantna. U ravnoteži sva kinetička, u krajnjem položaju sva potencijalna. Prigušene oscilacije: amplituda eksponencijalno opada.

<!--QUIZ_DATA
[{"question":"Period matematičkog klatna?","options":["T=2π√(m/k)","T=2π√(l/g)","T=2πl/g","T=2π√(g/l)"],"correct":1},{"question":"Period klatna zavisi od:","options":["Mase i amplitude","Dužine konca i g","Samo amplitude","Mase i dužine"],"correct":1},{"question":"Energija harmonijskog oscilatora?","options":["Raste","Opada","Konstantna","Osciluje"],"correct":2}]
QUIZ_DATA-->`},
{title:"Mehanički talasi",subject:"Fizika",class_number:3,content:`Mehanički talas: prostiranje oscilacija kroz elastičnu sredinu. Prenosi energiju bez prenosa materije. Transverzalni: oscilovanje okomito na prostiranje. Longitudinalni: oscilovanje u smjeru prostiranja (zvuk).

Brzina: v=λf=λ/T. λ talasna dužina, f frekvencija. Brzina zavisi od sredine — u čvrstim tijelima najveća. Jednačina: y(x,t)=A sin(ωt−kx), k=2π/λ.

Pojave: refleksija, refrakcija, difrakcija, interferencija (konstruktivna i destruktivna). Stojni talasi: superpozicija talasa u suprotnim smjerovima.

<!--QUIZ_DATA
[{"question":"Šta prenosi mehanički talas?","options":["Materiju","Energiju bez materije","Samo informaciju","Naelektrisanje"],"correct":1},{"question":"Brzina talasa?","options":["v=λ/f","v=λf","v=f/λ","v=λ+f"],"correct":1},{"question":"Koji talas osciluje okomito na prostiranje?","options":["Longitudinalni","Transverzalni","Stojni","Zvučni"],"correct":1}]
QUIZ_DATA-->`},
];
