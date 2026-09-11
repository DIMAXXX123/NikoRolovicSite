# Mobile QA — studentski portal Gimnazije Niko Rolović

Branch: `claude/qa-mobile` (from `main` @ `196b2e6`) · 11 Sep 2026

---

## 0. What actually got tested, and the one thing that blocked the plan

**The production URL could not be reached from this session.** The environment's
egress policy denies `niko-rolovic-site.vercel.app` *and* `*.supabase.co`
(`connect_rejected — organization policy`). The Vercel share link was issued
successfully, but the host itself is not in the allowlist, so neither curl nor
Playwright can open it. Per the proxy's own guidance, policy denials are reported
rather than retried.

So the sweep ran against **a production build of `main` served locally**
(`next build && next start`), with a local Supabase-compatible stub standing in
for the database and auth. That keeps the real Next.js output, the real CSS, the
real components, the real middleware and the real cookie/auth flow — which is
what mobile layout QA actually depends on. What it does *not* reproduce is
covered under "Not verified" at the bottom.

Fixtures are synthetic Montenegrin content marked `[TEST]`, deliberately built to
stress layout (very long titles, one unbroken 60-character word, long URLs, a
`<pre>` block, a wide table, double-barrelled surnames). **No production data was
read into the working tree and nothing was written to production** — see
`qa-mobile.json`.

| Device profile | Viewport | Notes |
|---|---|---|
| iPhone 13 | 390×844, DPR 3, Safari UA | safe-area insets simulated at 47 px top / 34 px bottom |
| Pixel 7 | 412×915, Chrome UA | |
| Narrow | 360×740 | the 360 px check |

72 page-runs (24 screens × 3 profiles), full-page + viewport + scrolled-to-bottom
screenshots for each, in `qa-tmp/` locally; the problem screens are in
`screenshots/` here.

---

## 1. Found and fixed

### 1.1 `/manifest.json` was redirected away from every installer — PWA install was broken

**The most consequential finding.** The auth middleware's matcher excluded
`_next/static`, `favicon.ico`, images and `api/`, but not `manifest.json`.
Browsers fetch a web app manifest **without credentials**, so the guard saw every
manifest request as anonymous and answered:

```
GET /manifest.json   →  307  →  /register   (text/html)
```

Chrome therefore had no manifest at all: no `name`, no `icons`, no
`display: standalone`. "Add to Home Screen" fell back to a generated icon and the
app opened in a browser tab instead of standalone — exactly the symptom in the
brief. The icons themselves were never the problem.

Fix — `src/middleware.ts`, one entry in the matcher. After:

```
GET /manifest.json (no cookies)  →  200  application/json
Page.getAppManifest  →  errors: []
```

### 1.2 Lecture pages scrolled sideways

`/lectures/<subject>/<id>` had horizontal page scroll on **all three** profiles
(667 px of content on a 390 px screen; 661 on 360). Cause: the rich-text class in
`lecture-content.tsx` styled `img` with `max-w-full` but said nothing about
`pre`, `code`, `table` or long links — so any admin-authored lecture containing a
code block or a wide table drags the whole document, including the fixed header,
off-screen.

Fix — `pre`/`table` get their own `overflow-x: auto`, `code` and `a` get
`break-words`, and the wrapper gets `max-w-full`. Now the page is exactly
360/390/412 px wide and the code block scrolls inside its own box.

*Screenshots 01 (before), 06 (after).*

### 1.3 A long word in a news headline ran off the card

A title with one unbroken 60-character word rendered 626 px wide inside a 286 px
box, spilling over the card and past the screen edge on every profile. Montenegrin
compounds and pasted URLs make this reachable in practice.

Fix — `break-words` on the three news headline variants in `news-card.tsx`.

*Screenshots 03 (before), 04 (after).*

### 1.4 The header broke apart at 360 px

"Niko Rolović" wrapped onto two lines inside the 64 px bar and collided with the
BETA pill.

Fix — `min-w-0` + `truncate` on the brand, `shrink-0` on the logo, the BETA pill
and the action-button group (`(main)/layout.tsx`). The bar now stays 64 px at
320/360/375/390/412 px; the name truncates instead of wrapping and is still shown
in full from 390 px up.

*Screenshots 02 (before), 05 (after).*

### 1.5 Form controls were desktop-sized

The shared `Input` and `Button` come from shadcn with `h-8` — 32 px. Every text
field and every primary action ("Prijavi se", "REGISTRUJ SE") was 32 px tall on a
phone, well under the 44 px minimum.

Fix — `h-11 md:h-8` on `Input` and on `Button size=default`, `h-12 md:h-9` on
`size=lg`. Mobile gets 44/48 px; desktop and the admin panel keep their density.

### 1.6 No autofill hints anywhere

Not one `autocomplete` attribute existed on any auth form. With two password
fields on `/register` and `/update-password`, iOS and Android password managers
routinely fill the wrong box.

Added: `email`, `current-password`, `new-password` (×2 per form),
`given-name`, `family-name`, and `one-time-code` on the `/verify` code field.

---

## 2. Checked and correct — no change needed

**Bottom nav, header and the dvh/safe-area work.** With iPhone 13 insets applied:

| | measured |
|---|---|
| header | 64 px bar + 47 px top inset = 112 px, top edge at y=0 |
| bottom nav | 70 px bar + 34 px bottom inset = 105 px, bottom edge flush at y=664 |
| nav `box-sizing` | `content-box` — the 70 px bar height survives the padding |
| body | `padding-top: 47px`, `padding-bottom: 34px` |

The nav sits flush with the viewport edge while its icons and labels clear the
home-indicator area, and the `pb-28` on the content wrapper leaves the nav
clear — **zero occurrences of content trapped under the bottom nav** across all
72 runs, measured at maximum scroll.

One dead class: `<div className="h-safe-area-bottom" />` inside `bottom-nav.tsx`
is undefined in the CSS *and* sits inside a `height: 70px` box, so it does
nothing. Harmless, but misleading — the real inset comes from
`.glass-nav-premium { padding-bottom: env(safe-area-inset-bottom) }`.

**Pinch zoom works.** Viewport meta is
`width=device-width, initial-scale=1, viewport-fit=cover` — no `user-scalable=no`,
no `maximum-scale`. At 3× the layout viewport stays 390 px, `scrollWidth` stays
390 px, and nothing reflows or breaks. *Screenshot 10.*

**Manifest and icons.** Every icon serves and the declared sizes match the actual
pixels:

| file | HTTP | type | actual |
|---|---|---|---|
| `/manifest.json` | 200 | application/json | — |
| `/icons/icon-192.png` | 200 | image/png | 192×192 |
| `/icons/icon-512.png` | 200 | image/png | 512×512 |
| `/icons/icon-maskable-192.png` | 200 | image/png | 192×192 |
| `/icons/icon-maskable-512.png` | 200 | image/png | 512×512 |
| `/icons/apple-touch-icon.png` | 200 | image/png | 180×180 |
| `/icons/icon.svg` | 200 | image/svg+xml | vector |
| `/favicon.ico` | 200 | image/x-icon | — |

Both `maskable` entries are present, `apple-touch-icon` is declared in the
`<head>` for Safari, and the manifest has **no `screenshots` key** — so once it
parses (fix 1.1) the installer uses `icon-192`/`icon-512`, never a page capture.

**Console is clean.** Across 72 page-runs there is **not one error or warning
originating from the application**. The only 4xx responses are
`/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js`, which exist
only on Vercel and 404 locally; the `net::ERR_ABORTED` entries are Next.js
prefetches cancelled on navigation, which is normal. (Errors from my own stub —
CORS and the realtime WebSocket — are excluded as harness artifacts.)

**Input types.** `type="email"` on all email fields, `inputMode="numeric"` on the
verification code, 16 px font on text inputs so iOS does not zoom on focus.

---

## 3. Slow network

Chromium throttling, iPhone 13, against the local server. **"Content" = first real
text in `#main-content`.** Server latency is effectively zero here, so add real
Supabase round-trips to every figure — treat these as asset/waterfall cost, not
absolute numbers.

| Profile | Screen | Content | Network idle | Skeletons | Spinners |
|---|---|---|---|---|---|
| Fast 3G | /news | 1118 ms | 4546 ms | 0 | 0 |
| Fast 3G | /gallery | 1120 ms | 2803 ms | 0 | 0 |
| Fast 3G | /lectures | 243 ms | 2611 ms | 0 | 0 |
| Fast 3G | /schedule | 246 ms | 2030 ms | 0 | 0 |
| Fast 3G | /profile | 941 ms | 2737 ms | 0 | 0 |
| Fast 3G | /events | 235 ms | 2036 ms | 0 | 0 |
| Slow 3G | /news | 3704 ms | 14302 ms | 0 | 0 |
| Slow 3G | /gallery | 2606 ms | 4283 ms | 0 | 0 |
| Slow 3G | /lectures | 1107 ms | 6084 ms | 0 | 0 |
| Slow 3G | /schedule | 1310 ms | 3840 ms | 0 | 0 |
| Slow 3G | /profile | 2164 ms | 4854 ms | 0 | 0 |
| Slow 3G | /events | 1111 ms | 3660 ms | 0 | 0 |

**Where skeletons still show:** nowhere, in this run — every screen had settled
before the 1.5 s sample and no skeleton or spinner was still visible at network
idle. The skeleton code in `gallery`, `profile` and `lecture-tabs` is real but
only appears in the client-fetch window, which the server-rendered shell closes
first. `/news` is the outlier: 3.7 s to first text and 14.3 s to idle on Slow 3G,
because the feed keeps requesting the next page as you scroll. *Screenshot 11.*

---

## 4. Still open — my judgement is these are design calls, not one-line fixes

### 4.1 Touch targets below 44 px (the largest remaining category)

The shared components are fixed, but many per-screen controls are still small.
Worst offenders, measured:

| Size | Control | Screen |
|---|---|---|
| 14×14 | heart button beside a team name | `/tournament` |
| 11.6×20 | `✕` dismiss | `/game` |
| 19.8×36 | lesson-number chips | `/schedule` (360 px) |
| 30×30 | icon button | `/gallery` |
| 32×32 | round icon button | `/tournament` |
| 36×36 | icon buttons | `/events`, `/teachers` |
| 40×40 | 🏀 and Block Blast buttons | header, every screen |
| 32×32 | the two theme-switcher buttons | header, every screen |
| 16–21 px tall | text links ("Prikaži više", "Zaboravio lozinku?", the legal-page links) | several |

**On the header specifically:** I tried raising the two 32 px theme buttons to
40 px and reverted it. At 390 px the extra 16 px pushed the brand name into
truncation — trading one visible defect for another. The header carries a logo, a
brand, a BETA pill and four buttons; at 360 px there is simply not room for four
44 px targets alongside that. This needs a layout decision (drop a button into an
overflow menu, or hide the brand text under ~400 px), not a class change.

*Screenshots 07, 08, 09.*

### 4.2 `/tournament` appears to be hard-coded for dark mode

In light mode the match card stays near-black and the inactive tabs
("Setka", "Rezultati", "Timovi") are mid-grey on a light ground — poor contrast.
The page predates light mode and paints literal dark hex values. The
`globals.css` compatibility shim remaps the common ones but does not cover this
screen. *Screenshot 07.*

### 4.3 The auth card is vertically centred and does not scroll

`(auth)/layout.tsx` uses `min-h-dvh flex items-center justify-center`. On
`/register` (7 fields) with the keyboard open, the lower fields and the submit
button fall below the keyboard line and the document itself cannot scroll —
the browser's own visual-viewport panning is the only way to reach them. Worth
switching to a scrollable column with vertical padding.

### 4.4 Two client-side queries worth a second look (noticed in passing, not layout)

- `/events` issues a **`DELETE` on `events` filtered by `event_date=lt.<today>`**
  from the browser. A student's session pruning rows is surprising; if RLS did not
  stop it, it would be destructive.
- `/profile` runs `from('profiles').select('*')` with **no filter**, pulling every
  profile row to the client.

Both are presumably fenced off by RLS, but neither is verifiable from here and
both would be better done server-side.

### 4.5 Third-party flag images

`/lectures` loads subject flags from `https://flagcdn.com`. The CSP allows it
(`img-src *`), so it works in production — but it is an external dependency on the
critical path of a school portal on mobile data. Self-hosting them would be
cheaper and more reliable.

---

## 5. Not verified — and why

- **Real Safari / WebKit.** Only Chromium is installed and `playwright install` is
  off-limits here. The iPhone 13 runs use Chromium with Safari's UA and viewport,
  which catches layout but not WebKit rendering. **The specific question of
  whether the bottom nav slips under Safari's collapsing address bar cannot be
  answered from this session** — it depends on Safari's own `dvh`/toolbar
  behaviour. The CSS is correct by inspection (`100dvh`, `env(safe-area-inset-*)`,
  `content-box` on the nav) and the geometry is right under simulated insets, but
  it needs one pass on a real iPhone.
- **Safe-area insets are simulated.** `Emulation.setSafeAreaInsets` was not
  available, so a stylesheet supplies the iPhone 13 values (47 px / 34 px) to the
  same rules `env()` feeds. Real-device confirmation still wanted.
- **The production deployment.** Blocked by network policy, as above. Everything
  here is `main` built locally — the same source, but not the same box.
- **Real production content.** The database holds student PII and this environment
  correctly refused to let me pull it into the working tree, so fixtures are
  synthetic. Real lecture HTML may contain structures my fixtures do not; the
  `pre`/`table` fix covers the common ones.
- **The admin screens** (`/admin/*`) were out of scope — this was a student's-eye
  pass.

## 6. Account

`claude/qa-seed` does not exist on `origin`, so `qa-accounts.md` and the
`qa-student@example.com` password were unavailable. I did **not** create a
replacement account in the Supabase project: with `*.supabase.co` blocked, a
production account could not have been used for any of this testing, and creating
one would have meant writing to a production auth table purely to delete it again.
The local stub uses `qa-mob-7f66caa0@example.com`, which never left this
container. Nothing was created in production and there is nothing to clean up —
recorded in `qa-mobile.json`.

## 7. To re-run this

The harness is not committed (it needs `playwright` as a dev dependency, a
`.env.local` pointing at the stub, and a one-line CSP widening to let the browser
reach `127.0.0.1:54321` — all reverted before this commit). `npm run build` passes
on the committed tree.
