# QA prijave, registracije i profila

Playwright provjera svih tokova prijave i profila na iPhone i Android
rezoluciji. Namjerno stoji van `package.json` aplikacije — ništa odavde ne
ulazi u produkcijski build.

## Pokretanje

```bash
cd scripts/qa-auth
npm install                       # playwright + supabase-js

export NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
export QA_BASE_URL=https://niko-rolovic-site.vercel.app

node seed.mjs                     # upisuje [TEST] redove i QA nalog
export QA_RUN_ID=<ispisan iz seed.mjs>
node run.mjs                      # snimci u artifacts/
node cleanup.mjs                  # briše sve što je seed.mjs napravio
```

## Baza je boevna

Nema odvojene test baze. Zato:

- svaki red koji skripta pravi nosi prefiks `[TEST]`;
- svi nalozi idu na `qa-auth-<runId>-*@example.com`;
- identifikatori se upisuju u `qa-auth.json` u korijenu repozitorijuma;
- `cleanup.mjs` briše isključivo te redove i nikad tuđe.

Seed koristi razred 4, odjeljenje 6 da se ne miješa sa stvarnim spiskom
drugog razreda koji je već u upotrebi.

## Promjenljive

| Promjenljiva | Značenje |
| --- | --- |
| `QA_BASE_URL` | adresa portala (podrazumijevano produkcija) |
| `QA_RUN_ID` | vezuje `run.mjs` za naloge koje je `seed.mjs` napravio |
| `QA_PASSWORD` / `QA_NEW_PASSWORD` | lozinke za QA nalog |
| `QA_RECOVERY_CODE` | kod iz e-pošte, nastavlja reset lozinke do kraja |
| `QA_SKIP_WAIT` | preskače čekanje da istekne prozor ograničenja |

## Šta se provjerava

1. **Registracija** — sverka po spisku sa i bez dijakritike (`Đorđe`/`Djordje`/`Dorde`),
   odbijanje onoga koga nema na spisku, ponovljena e-pošta, kratka lozinka,
   neispravna e-pošta, prazna polja.
2. **Dopuna profila** — `/complete-profile` ide kroz `/api/complete-profile`;
   provjerava se i da pregledač više ne čita `verified_students` direktno.
3. **Prijava** — tačna i pogrešna lozinka, nepostojeća e-pošta, Google dugme
   (samo se provjerava da vodi na `accounts.google.com`).
4. **Reset lozinke** — slanje koda, ekran za unos, nova lozinka.
5. **Ograničenje broja pokušaja** — zajedničko za sve servere; provjerava se
   odbijanje, `Retry-After`, poruka na ekranu sa vremenom čekanja i da poslije
   isteka prozora ponovo prolazi.
6. **Garde** — anoniman na `/news`, `/profile`, `/admin`, `/grades`; prijavljen
   na `/login`; učenik na `/admin` (i da admin ekran ne bljesne prije
   redirekcije).
7. **Profil** — teme, donja navigacija, odjava, i poštovanje sistemske teme pri
   prvom dolasku.
