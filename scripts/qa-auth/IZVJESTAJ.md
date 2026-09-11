# QA prijave, registracije i profila — izvještaj

Grana `claude/qa-auth`, polazna tačka `main` (`196b2e6`).

## Šta je blokiralo provjeru na produkciji

QA kontejner nema mrežni pristup ni portalu ni bazi. Izlazna mrežna politika
okruženja odbija oba domena prije nego što zahtjev uopšte izađe:

```
$ curl -D- https://niko-rolovic-site.vercel.app/login
HTTP/2 403
x-deny-reason: host_not_allowed
Host not in allowlist: niko-rolovic-site.vercel.app.

$ curl -D- https://ydcbxqrnmnbceyzqgbui.supabase.co/auth/v1/health
HTTP/2 403
x-deny-reason: host_not_allowed
Host not in allowlist: ydcbxqrnmnbceyzqgbui.supabase.co.
```

Chromium dobija isto (`net::ERR_TUNNEL_CONNECTION_FAILED`), pa scenariji koji
traže pravu bazu — prava registracija, sverka po spisku od kraja do kraja,
e-pošta, garde sa stvarnom sesijom — nisu odigrani u pregledaču. Da bi se
otključali, oba domena treba dodati u *network egress settings* okruženja.

Zbog toga u bazi **nije napravljen nijedan red** (v. `qa-auth.json`): pravljenje
naloga u boevnoj bazi bez mogućnosti da se kroz njih prođe ne bi ništa dalo, a
ostavilo bi smeće.

## Šta je ipak provjereno

- **Zajedničko ograničenje pokušaja** — `consume_rate_limit()` pozvan direktno
  kroz Supabase MCP: 5 prolazi, šesti i sedmi dobiju `allowed:false`, svi dijele
  isti `reset_at`. Brojač je jedan red u Postgresu ključan po poravnatom
  prozoru, tako da ga svi serveri zaista dijele. Probni red je obrisan.
- **Lokalni produkcijski build** (`npm run build` + `npm start`) u iPhone 13 i
  Pixel 7 rezoluciji: iscrtavanje ekrana prijave/registracije/reseta,
  validacija u pregledaču (kratka lozinka, neispravna e-pošta, prazna polja,
  različite lozinke), poštovanje sistemske teme pri prvom dolasku, ciklus teme
  `system → light → dark → system` i pamćenje poslije osvježavanja, prebacivanje
  palete, i prikaz poruka za 404/409/429 (odgovori servera podmetnuti).
- **Sverka imena** — `node --test scripts/test-auth-helpers.mjs`.

## Nađeno i popravljeno

### 1. Đ/đ: ime bez dijakritike nije prolazilo sverku

`normalizeCG()` je preslikavao `đ → dj`, pa je red iz spiska `Đorđe` postajao
`djordje`. Učenik koji otkuca `Djordje` prolazi, ali onaj koji otkuca `Dorde`
(tastatura bez crnogorskog rasporeda — samo se izgubi crta) dobija
*„Nismo te pronašli u bazi učenika"*. Za `č/ć/š/ž` problema nema jer NFKD skida
kombinujuće znakove; `Đ` nosi crtu, ne kombinujući znak, pa NFKD na njega ne
djeluje.

U spisku su time bili pogođeni stvarni učenici: **Anđelka Magovčević**,
**Nađa Kurpejović**, **Amar Đulamerović** i svako `Đ` ime.

Popravka: `normalizeVariants()` vraća oba oblika (`djordje` i `dorde`), a
`findVerifiedStudent()` traži presjek. Sada prolaze sva tri načina kucanja.
Tiče se i `/api/register` i `/api/complete-profile`.

### 2. Odbijanje zbog previše pokušaja nije govorilo koliko čekati

Sve tri rute šalju `Retry-After`, ali su stranice pokazivale samo
*„Pokušaj ponovo kasnije"* — zaglavlje se nigdje nije čitalo. Dodat je
`src/lib/retry-after.ts` (čita zaglavlje, sklapa rečenicu sa crnogorskom
množinom) i uvezan u prijavu, registraciju i reset lozinke:

- „Previše pokušaja prijave. Pokušaj ponovo za 4 minuta."
- „Previše zahtjeva. Pokušaj ponovo za 45 sekundi."

Kad zaglavlja nema, tekst ostaje neodređen kao ranije.

## Nađeno, nije dirano

**Registracija može ostaviti nalog bez profila.** U `/api/register` se poslije
uspješnog `createUser()` ne provjerava greška `profiles.insert()`:

```ts
await admin.from('profiles').insert({ ... })   // greška se guta
return NextResponse.json({ ok: true, userId: authData.user.id })
```

Ako taj upis padne, nalog postoji u `auth`, red u spisku je već označen kao
`used`, a profila nema. `ProfileGuard` onda pri svakoj prijavi odjavi korisnika,
i on je trajno zaključan — sam se ne može ponovo registrovati jer je red
iskorišćen. Popravka traži poništavanje (brisanje naloga i vraćanje `used`),
što se bez pristupa bazi ne može isprobati, pa je ostavljeno.

## Ostalo neprovjereno

Sve što traži pravu bazu: prava registracija od kraja do kraja i upis profila sa
tačnim razredom, potvrda e-pošte i `/complete-profile` kroz serverski put,
prijava tačnom lozinkom i prijava po linku iz e-pošte, Google dugme, reset
lozinke od e-pošte do prijave novom lozinkom, ograničenje pokušaja kroz stvarne
HTTP zahtjeve (DB funkcija jeste provjerena), garde sa stvarnom sesijom
(`/login` kad si prijavljen, učenik na `/admin`), i profil — avatar, donja
navigacija, odjava.

`scripts/qa-auth/` sadrži spreman Playwright paket za sve to: `seed.mjs`,
`run.mjs`, `cleanup.mjs`. Kad se domeni otvore, dovoljno je pokrenuti ga.
