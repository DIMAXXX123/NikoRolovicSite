export const matematika3 = [
{title:"Trigonometrijska kružnica",subject:"Matematika",class_number:3,content:`Trigonometrijska kružnica je kružnica sa centrom u koordinatnom početku i poluprečnikom 1. Svaka tačka na njoj ima koordinate (cos α, sin α), gdje je α ugao koji poluprava zaklapa sa pozitivnim dijelom x-ose. Kretanje suprotno od kazaljke daje pozitivne uglove, a u smjeru kazaljke negativne.

Na osnovu trigonometrijske kružnice određujemo znakove funkcija u kvadrantima: u I su sve pozitivne, u II samo sin, u III samo tg, u IV samo cos. Pun obrtaj je 2π radijana (360°). Važne vrijednosti: sin 0=0, sin π/2=1, cos 0=1, cos π/2=0, sin π=0, cos π=−1.

Trigonometrijska kružnica omogućava vizuelno razumijevanje periodičnosti: sin(α+2π)=sin α. Takođe služi za definisanje trigonometrijskih funkcija za sve uglove, ne samo oštre.

<!--QUIZ_DATA
[{"question":"Koliki je poluprečnik trigonometrijske kružnice?","options":["2","1","π","0.5"],"correct":1},{"question":"U kom kvadrantu su sin i cos pozitivni?","options":["II","III","I","IV"],"correct":2},{"question":"Koliko radijana je pun obrtaj?","options":["π","π/2","3π","2π"],"correct":3}]
QUIZ_DATA-->`},
{title:"Svođenje trigonometrijskih funkcija",subject:"Matematika",class_number:3,content:`Svođenje trigonometrijskih funkcija je postupak kojim se funkcije proizvoljnog ugla svode na funkcije oštrog ugla (0°−90°). Koriste se formule redukcije koje zavise od kvadranta u kojem se ugao nalazi.

Osnovno pravilo: za uglove oblika π/2±α ili 3π/2±α funkcija se mijenja u kofunkciju (sin↔cos, tg↔ctg). Za uglove oblika π±α ili 2π±α funkcija ostaje ista. Znak rezultata se određuje prema znaku polazne funkcije u odgovarajućem kvadrantu.

Primjeri: sin(π−α)=sin α, cos(π−α)=−cos α, sin(π+α)=−sin α, cos(π/2−α)=sin α. Ove formule znatno olakšavaju rad sa trigonometrijskim izrazima.

<!--QUIZ_DATA
[{"question":"Na šta se svodi sin(π−α)?","options":["-sin α","cos α","sin α","-cos α"],"correct":2},{"question":"Kada se funkcija mijenja u kofunkciju?","options":["Za π±α","Za 2π±α","Za π/2±α","Nikad"],"correct":2},{"question":"Koliko je cos(π+α)?","options":["cos α","sin α","-sin α","-cos α"],"correct":3}]
QUIZ_DATA-->`},
{title:"Trigonometrijski identiteti",subject:"Matematika",class_number:3,content:`Trigonometrijski identiteti su jednakosti koje važe za sve dozvoljene vrijednosti ugla. Najvažniji je Pitagorin identitet: sin²α+cos²α=1, koji proizilazi iz jednačine kružnice x²+y²=1.

Iz njega slijede: 1+tg²α=1/cos²α i 1+ctg²α=1/sin²α. Takođe: tg α=sin α/cos α i ctg α=cos α/sin α. Ovi identiteti omogućavaju pretvaranje jedne trigonometrijske funkcije u drugu.

Za dokazivanje identiteta obično se jedna strana transformiše u drugu koristeći: svođenje na sin i cos, množenje konjugatom, faktorizaciju. Primjer: (1−cos²α)/sin α = sin²α/sin α = sin α.

<!--QUIZ_DATA
[{"question":"Koji je osnovni Pitagorin identitet?","options":["sin α+cos α=1","sin²α+cos²α=1","sin²α−cos²α=1","tg²α+1=sin²α"],"correct":1},{"question":"Čemu je jednak tg α?","options":["cos α/sin α","sin α·cos α","sin α/cos α","1/sin α"],"correct":2},{"question":"Čemu je jednak 1+tg²α?","options":["1/sin²α","2","1/cos²α","sin²α+cos²α"],"correct":2}]
QUIZ_DATA-->`},
{title:"Adicione formule",subject:"Matematika",class_number:3,content:`Adicione formule izražavaju trigonometrijske funkcije zbira ili razlike dva ugla. Osnovne formule: sin(α±β)=sin α cos β ± cos α sin β i cos(α±β)=cos α cos β ∓ sin α sin β.

Za tangens: tg(α±β)=(tg α ± tg β)/(1 ∓ tg α·tg β). Ove formule su temelj za izvođenje formula dvostrukog ugla, poluugla i transformacionih formula.

Primjer: sin 75°=sin(45°+30°)=sin 45° cos 30°+cos 45° sin 30°=(√2/2)(√3/2)+(√2/2)(1/2)=(√6+√2)/4.

<!--QUIZ_DATA
[{"question":"Formula za sin(α+β)?","options":["sin α sin β+cos α cos β","sin α cos β+cos α sin β","sin α cos β−cos α sin β","cos α cos β−sin α sin β"],"correct":1},{"question":"Formula za cos(α+β)?","options":["cos α cos β+sin α sin β","sin α cos β+cos α sin β","cos α cos β−sin α sin β","cos α sin β−sin α cos β"],"correct":2},{"question":"Koliko je sin 75°?","options":["(√6−√2)/4","(√6+√2)/4","√3/2","(√2+1)/2"],"correct":1}]
QUIZ_DATA-->`},
{title:"Trigonometrijske funkcije dvostrukog ugla",subject:"Matematika",class_number:3,content:`Formule dvostrukog ugla su specijalan slučaj adicionih formula za β=α. Iz sin(α+α): sin 2α=2 sin α cos α. Iz cos(α+α): cos 2α=cos²α−sin²α=2cos²α−1=1−2sin²α.

Za tangens: tg 2α=2tg α/(1−tg²α). Iz formula za cos 2α izvode se formule poluugla: cos²(α/2)=(1+cos α)/2, sin²(α/2)=(1−cos α)/2.

Primjena: jednačina sin 2x=cos x → 2 sin x cos x=cos x → cos x(2sin x−1)=0, daje cos x=0 ili sin x=1/2.

<!--QUIZ_DATA
[{"question":"Formula za sin 2α?","options":["sin²α+cos²α","2 sin α cos α","sin α+cos α","2 sin²α"],"correct":1},{"question":"Koji izraz je jednak cos 2α?","options":["2 cos α","cos²α+sin²α","1−2sin²α","2cos²α+1"],"correct":2},{"question":"Formula za tg 2α?","options":["2tg α/(1−tg²α)","tg²α/2","2tg α/(1+tg²α)","tg α+tg α"],"correct":0}]
QUIZ_DATA-->`},
{title:"Formule za zbir i razliku trigonometrijskih funkcija",subject:"Matematika",class_number:3,content:`Formule za pretvaranje zbira u proizvod: sin α+sin β=2 sin((α+β)/2) cos((α−β)/2), sin α−sin β=2 cos((α+β)/2) sin((α−β)/2).

Za kosinus: cos α+cos β=2 cos((α+β)/2) cos((α−β)/2), cos α−cos β=−2 sin((α+β)/2) sin((α−β)/2). Postoje i obrnute formule za pretvaranje proizvoda u zbir.

Ove transformacije su korisne pri rješavanju jednačina: sin 3x+sin x=0 → 2 sin 2x cos x=0, čime se dobijaju dva jednostavnija uslova.

<!--QUIZ_DATA
[{"question":"Čemu je jednak sin α+sin β?","options":["2 sin((α+β)/2) cos((α−β)/2)","2 cos((α+β)/2) sin((α−β)/2)","sin α·sin β","2 sin α cos β"],"correct":0},{"question":"Čemu je jednak cos α−cos β?","options":["2 cos((α+β)/2) cos((α−β)/2)","−2 sin((α+β)/2) sin((α−β)/2)","cos α·cos β","0"],"correct":1},{"question":"Na šta se transformiše sin 3x+sin x?","options":["2 sin 2x cos x","2 cos 2x sin x","sin 4x","2 sin x cos 3x"],"correct":0}]
QUIZ_DATA-->`},
{title:"Kosinusna i sinusna teorema",subject:"Matematika",class_number:3,content:`Kosinusna teorema generalizuje Pitagorinu teoremu: c²=a²+b²−2ab cos γ, gdje su a,b,c stranice a γ ugao naspram c. Za γ=90° dobijamo Pitagorinu teoremu. Koristi se kad znamo 3 stranice ili 2 stranice i ugao između njih.

Sinusna teorema: a/sin α=b/sin β=c/sin γ=2R, gdje je R poluprečnik opisanog kruga. Koristi se kad znamo stranicu i dva ugla, ili dvije stranice i ugao naspram jedne.

Kombinacijom obje teoreme rješavamo sve tipove trouglova. Primjene: navigacija, geodezija, astronomija. Sinusna teorema može dati dvoznačno rješenje kad su date dvije stranice i ugao naspram kraće.

<!--QUIZ_DATA
[{"question":"Kosinusna teorema glasi:","options":["c²=a²+b²","c²=a²+b²−2ab cos γ","c=a+b−2ab","c²=a²+b²+2ab cos γ"],"correct":1},{"question":"Čemu je jednak a/sin α po sinusnoj teoremi?","options":["R","2R","πR","R/2"],"correct":1},{"question":"Kada kosinusna prelazi u Pitagorinu?","options":["α=45°","γ=180°","γ=90°","a=b"],"correct":2}]
QUIZ_DATA-->`},
{title:"Trigonometrijske jednačine",subject:"Matematika",class_number:3,content:`Trigonometrijske jednačine sadrže nepoznatu kao argument trigonometrijske funkcije. Osnovna: sin x=a ima rješenje x=(−1)ⁿ arcsin a+nπ, n∈Z, za |a|≤1. Jednačina cos x=a: x=±arccos a+2nπ.

Za tangens: tg x=a → x=arctg a+nπ, za svako realno a. Složenije jednačine se svode na osnovne pomoću identiteta, formula dvostrukog ugla ili smjena. Npr. 2sin²x−3sin x+1=0 se smjenom t=sin x svodi na kvadratnu.

Važno je provjeriti oblast definisanosti i validnost svih rješenja, posebno za jednačine sa tangensom ili kotangensom.

<!--QUIZ_DATA
[{"question":"Opšte rješenje sin x=a?","options":["x=arcsin a+2nπ","x=(−1)ⁿ arcsin a+nπ","x=arcsin a+nπ","x=±arcsin a+nπ"],"correct":1},{"question":"Za koje a jednačina cos x=a ima rješenje?","options":["|a|≤2","|a|≤1","a>0","Za sve realne a"],"correct":1},{"question":"Opšte rješenje tg x=a?","options":["x=arctg a+2nπ","x=±arctg a+nπ","x=arctg a+nπ","x=(−1)ⁿ arctg a+nπ"],"correct":2}]
QUIZ_DATA-->`},
{title:"Grafici trigonometrijskih funkcija",subject:"Matematika",class_number:3,content:`Grafik y=sin x je sinusoida koja osciluje između −1 i 1 sa periodom 2π. Prolazi kroz O, max 1 u π/2, min −1 u 3π/2. Grafik y=cos x je ista kriva pomjerena za π/2 ulijevo.

Grafik y=tg x ima period π i vertikalne asimptote u x=π/2+nπ. Funkcija je rastuća između asimptota. Za y=ctg x asimptote su u x=nπ.

Opšti oblik y=A sin(Bx+C)+D: A je amplituda, 2π/B period, −C/B fazno pomjeranje, D vertikalno pomjeranje. Npr. y=3sin(2x−π/3)+1 ima amplitudu 3, period π.

<!--QUIZ_DATA
[{"question":"Period funkcije y=sin x?","options":["π","2π","π/2","4π"],"correct":1},{"question":"Gdje y=tg x ima asimptote?","options":["x=nπ","x=π/2+nπ","x=2nπ","Nema asimptote"],"correct":1},{"question":"Amplituda y=3sin(2x)?","options":["2","6","3","1"],"correct":2}]
QUIZ_DATA-->`},
{title:"Primjena trigonometrije",subject:"Matematika",class_number:3,content:`Trigonometrija se primjenjuje u geodeziji, navigaciji, fizici i inženjerstvu. Visina objekta se može odrediti mjerenjem ugla elevacije: h=d·tg α, gdje je d udaljenost a α ugao elevacije.

U fizici, trigonometrijske funkcije opisuju oscilacije i talase. Naizmjenična struja: i(t)=I₀ sin(ωt+φ). Sinusna i kosinusna teorema se koriste u triangulaciji terena.

Primjer: sa vrha brda visine 200 m grad se vidi pod uglom depresije 15°. Horizontalna udaljenost: d=200/tg 15°≈746 m.

<!--QUIZ_DATA
[{"question":"Visina objekta pomoću ugla elevacije?","options":["h=d/tg α","h=d·sin α","h=d·tg α","h=d·cos α"],"correct":2},{"question":"Oblik funkcije naizmjenične struje?","options":["i(t)=I₀ cos²(ωt)","i(t)=I₀·tg(ωt)","i(t)=I₀ sin(ωt+φ)","i(t)=I₀/sin(ωt)"],"correct":2},{"question":"Šta je triangulacija?","options":["Metoda crtanja trouglova","Mjerenje uglova za određivanje udaljenosti","Rješavanje kvadratnih jednačina","Računanje površina"],"correct":1}]
QUIZ_DATA-->`},
{title:"Površine ravnih figura",subject:"Matematika",class_number:3,content:`Površina pravougaonika P=ab, trougla P=ah/2, kruga P=πr², paralelograma P=ah, trapeza P=(a+b)h/2. Za trougao postoji i Heronova formula P=√(s(s−a)(s−b)(s−c)) gdje je s=(a+b+c)/2.

Trigonometrijska formula za trougao: P=(1/2)ab sin γ — korisna kad znamo dvije stranice i ugao između njih. Površina pravilnog n-tougla upisanog u krug: P=(nR²/2)sin(2π/n).

Za složenije figure, površina se računa razbijanjem na jednostavnije dijelove. Važno je razlikovati površinu (mjera dijela ravni) i obim (dužina granice).

<!--QUIZ_DATA
[{"question":"Heronova formula?","options":["P=ab/2","P=√(s(s−a)(s−b)(s−c))","P=(1/2)ab sin γ","P=ah"],"correct":1},{"question":"Površina kruga?","options":["2πr","πr²","πd","2r²"],"correct":1},{"question":"Formula za trougao sa dvije stranice i uglom?","options":["P=ah/2","P=√(s(s−a)(s−b)(s−c))","P=(1/2)ab sin γ","P=ab"],"correct":2}]
QUIZ_DATA-->`},
{title:"Površina i zapremina prizme",subject:"Matematika",class_number:3,content:`Prizma ima dvije podudarne paralelne baze i bočne strane (paralelogrami). Ako su bočne ivice okomite na baze — prava prizma, inače kosa. Površina: P=2B+M, gdje je B površina baze, M bočna površina.

Za pravu prizmu: M=O·h (O obim baze, h visina). Zapremina: V=B·h za svaku prizmu. Na primjer, za pravu trostanu prizmu sa jednakostraničnim trouglom stranice a=6 i h=10: B=9√3, V=90√3 cm³.

Prizma sa šestougaonom bazom je česta u praksi (vijci, olovke). Zapremina se uvijek računa kao proizvod površine baze i visine.

<!--QUIZ_DATA
[{"question":"Zapremina prizme?","options":["V=B·h²","V=2B·h","V=B·h","V=B+h"],"correct":2},{"question":"Bočna površina prave prizme?","options":["M=B·h","M=O·h","M=2B+2h","M=O²"],"correct":1},{"question":"Kakva je prizma ako su bočne ivice okomite na baze?","options":["Kosa","Prava","Pravilna","Zarubljena"],"correct":1}]
QUIZ_DATA-->`},
{title:"Površina i zapremina piramide",subject:"Matematika",class_number:3,content:`Piramida ima jednu bazu (mnogougao) i bočne strane (trouglovi) sa zajedničkim vrhom. Površina: P=B+M. Za pravilnu piramidu: M=(O·a)/2, gdje je a apotema bočne strane.

Zapremina: V=(1/3)B·h — trećina zapremine prizme iste baze i visine. Za pravilnu četvorostranu piramidu sa a=8 i h=6: B=64, V=(1/3)·64·6=128 cm³.

Piramide se javljaju u arhitekturi (egipatske piramide) i kristalografiji. Visina se računa Pitagorinom teoremom iz apoteme i dimenzija baze.

<!--QUIZ_DATA
[{"question":"Zapremina piramide?","options":["V=B·h","V=(1/2)B·h","V=(1/3)B·h","V=(2/3)B·h"],"correct":2},{"question":"Koliki dio prizme zauzima piramida iste baze i visine?","options":["1/2","1/4","2/3","1/3"],"correct":3},{"question":"Šta je apotema pravilne piramide?","options":["Visina piramide","Bočna ivica","Visina bočne strane","Dijagonala baze"],"correct":2}]
QUIZ_DATA-->`},
{title:"Površina i zapremina zarubljene piramide",subject:"Matematika",class_number:3,content:`Zarubljena piramida nastaje presjecanjem piramide ravni paralelnom sa bazom. Ima dvije paralelne baze i bočne strane — trapeze. Površina: P=B₁+B₂+M.

Zapremina: V=(h/3)(B₁+B₂+√(B₁·B₂)) — formula tri baze. Za pravilnu zarubljenu piramidu: M=(O₁+O₂)·a/2. Ako je B₂=0, formula prelazi u formulu za piramidu.

Primjeri u praksi: čaše, kante, nasipi puteva. Bočne strane su trapezoidnog oblika.

<!--QUIZ_DATA
[{"question":"Kako nastaje zarubljena piramida?","options":["Spajanjem dviju piramida","Presjecanjem piramide ravni paralelnom sa bazom","Rotacijom trapeza","Rezanjem prizme"],"correct":1},{"question":"Zapremina zarubljene piramide?","options":["V=h(B₁+B₂)/2","V=(h/3)(B₁+B₂+√(B₁·B₂))","V=(h/3)B₁","V=h·B₁·B₂"],"correct":1},{"question":"Oblik bočnih strana zarubljene piramide?","options":["Trouglovi","Pravougaonici","Trapezi","Paralelogrami"],"correct":2}]
QUIZ_DATA-->`},
{title:"Površina i zapremina valjka",subject:"Matematika",class_number:3,content:`Valjak nastaje rotacijom pravougaonika oko jedne stranice. Ima dvije kružne baze poluprečnika r i omotač. Površina baze B=πr², omotač M=2πrh, ukupna P=2πr(r+h).

Zapremina: V=πr²h — proizvod površine baze i visine, analogno prizmi. Za r=5 i h=12: V=300π≈942.5 cm³, P=170π≈534.1 cm².

Valjak je najčešće geometrijsko tijelo u praksi: konzerve, cijevi, stubovi. Za kosi valjak koristi se ista formula ali sa okomitom visinom.

<!--QUIZ_DATA
[{"question":"Zapremina valjka?","options":["V=2πrh","V=πr²h","V=(1/3)πr²h","V=πr(r+h)"],"correct":1},{"question":"Površina omotača valjka?","options":["πr²","2πr²","2πrh","πrh"],"correct":2},{"question":"Šta nastaje rotacijom pravougaonika?","options":["Kupa","Sfera","Valjak","Prizma"],"correct":2}]
QUIZ_DATA-->`},
];
