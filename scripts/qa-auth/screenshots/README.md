# Snimci ekrana

Snimljeno Playwright-om u iPhone 13 i Pixel 7 rezoluciji
(`deviceScaleFactor: 1` da fajlovi ostanu mali).

**Važno:** ovi snimci su sa lokalnog produkcijskog builda (`npm run build`
+ `npm start`) grane `claude/qa-auth`, a ne sa produkcije. QA kontejner nije
imao mrežni pristup ni portalu ni Supabase-u, pa tokovi koji zavise od baze
(stvarna prijava, sverka po spisku, e-pošta) nisu snimani. Odgovori servera
za ekrane sa greškama su podmetnuti (`page.route`) da bi se vidjelo kako
stranica prikazuje 404/409/429.

| Fajl | Šta pokazuje |
| --- | --- |
| `01-login-sistemska-tema-{light,dark}` | prvi dolazak poštuje sistemsku temu |
| `02-registracija` | ekran registracije |
| `03-registracija-neispravna-polja` | kratka lozinka i neispravna e-pošta (validacija pregledača) |
| `04-registracija-nije-na-spisku` | 404 + ponuda da se pošalje zahtjev administratoru |
| `05-registracija-429-sa-vremenom` | "Pokušaj ponovo za 45 sekundi." |
| `06-prijava-pogresna-lozinka` | "Pogrešan email ili lozinka" |
| `07-prijava-429-sa-vremenom` | "Pokušaj ponovo za 4 minuta." |
| `08-reset-429-sa-vremenom` | "Pokušaj ponovo za 15 minuta." |
| `09-reset-ekran-za-kod` | ekran za unos koda iz e-pošte |
| `10-tamna-tema`, `11-druga-paleta` | prebacivanje teme i palete |
