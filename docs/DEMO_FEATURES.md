# Demo features for the Ministry presentation

Companion to `docs/DUOLINGO_REDESIGN.md` (the visual spec — every new UI element follows it: §4 components, §2 tokens, §3 type). These are the FUNCTIONAL additions the owner asked for: small, reliable, visibly useful in a live demo on a phone. Nothing here changes the database schema; everything persists in `localStorage` or reads what anonymous visitors can already read (news, lectures, events, approved photos, likes, scores, profile display fields — email is not readable).

Global rules: TypeScript strict, no `any`; guard every browser API (`typeof window !== 'undefined'`, `'vibrate' in navigator`, `navigator.share`); never break SSR (read localStorage only in effects or lazy initialisers guarded for the server); every new string is Montenegrin (ijekavian, Latin) and listed below; every new control ≥ 44px; `npx tsc --noEmit` and `npm run build` must pass; extend `scripts/e2e-smoke.mjs` with a check per feature.

---

## F1. Haptics (vibration feedback)

`src/lib/haptics.ts`:
```ts
export type HapticKind = 'tap' | 'select' | 'success' | 'error'
const PATTERNS: Record<HapticKind, number | number[]> = { tap: 8, select: 12, success: [12, 40, 20], error: [40, 40, 40] }
export const HAPTICS_KEY = 'app_haptics'      // 'on' | 'off', default on
export function hapticsEnabled(): boolean      // false on server, false when the setting is 'off', false when prefers-reduced-motion
export function setHapticsEnabled(on: boolean) // writes the key, dispatches window event 'haptics-changed'
export function haptic(kind: HapticKind = 'tap'): void // no-op unless enabled and navigator.vibrate exists; try/catch
```
Wire it (call `haptic(...)` first thing in the existing handler — do not restructure handlers):
- `src/components/ui/button.tsx`: every Button click → `tap` (wrap the incoming `onClick`; keep the prop API).
- `src/components/bottom-nav.tsx`: each Link `onClick` → `select` (only when navigating to a different item).
- `src/components/theme-switcher.tsx`: `select`.
- Likes: news heart (`news-card.tsx` / `news-feed.tsx`), photo heart (`gallery/page.tsx`), lecture thumbs-up (`lecture-like-button.tsx`) → `success` when the like is added, `tap` when removed.
- Quiz (`quiz-runner.tsx`): correct answer → `success`, wrong → `error`; result screen → `success`.
- Block Blast (`game/page.tsx`): piece placed → `tap`; line cleared → `success`; game over → `error`.
- Chips/tabs used as selectors (schedule, events, grades) → `select` — only where a handler already exists.
- Profile → Podešavanja: new toggle row **"Vibracija"** (icon `Vibrate` from lucide) after the notifications row, same switch component/classes as the existing rows, reads/writes via `hapticsEnabled/setHapticsEnabled`, tapping it fires one `tap` when turning on.
iOS Safari has no `navigator.vibrate` — that is expected; the code just no-ops there.

## F2. "Još" for a visitor without a session (`src/app/(main)/profile/page.tsx`)

Replace `if (!profile) return null` with a guest view (same page, same components):
1. Hero `Card`: 80px circle with `UserRound` icon on `#F7F7F7`, title **"Gost"** 20/800, helper 13/700 **"Prijavi se da vidiš svoj profil, ocjene i podešavanja."**, two full-width buttons stacked: primary **"Prijavi se"** → `/login`, outline **"Registruj se"** → `/register`.
2. `QuickAccessCards` (already exists) — for guests show ALL of `QUICK_ACCESS_PAGES` plus rows for **"Block Blast"** (`/game`, icon `Gamepad2`, `#FF9600`), **"Turnir u košarci"** (`/tournament`, icon `Trophy`, `#FFC800`), **"eDnevnik"** (`/ednevnik`, icon `ClipboardList`, `#CE82FF`) — add these three entries to `QUICK_ACCESS_PAGES` for everyone (they are hidden automatically when already in the user's nav).
3. Settings rows that work without a session: **Navigacija** (opens `NavEditor`), **Kalkulator prosjeka** (opens `GpaCalculator`), **Vibracija** toggle (F1), **Veličina teksta** (existing font-size row) — reuse the existing row markup/handlers; keep the rows that need a session (notifications, role, logout, delete) hidden for guests.
4. The existing footer (creator credit, contact links, privacy/terms) stays.
Keep the logged-in branch untouched apart from adding the Vibracija row and the three quick-access entries.

## F3. Lecture progress (local)

`src/lib/progress.ts`: key `lecture_progress` → `Record<lectureId, isoDate>`; `isRead(id)`, `markRead(id)`, `unmarkRead(id)`, `readCount(ids: string[])`, `useLectureProgress()` hook (state + `progress-changed` window event so lists update live). Guarded for SSR.
- Lecture detail (`[subject]/[id]/lecture-content.tsx` or `page.tsx` — whichever renders below the content): a full-width button under the content: outline **"Označi kao pročitano"** (icon `Check`) → after click becomes primary-light tinted (bg `#D7FFB8`, border `#B5EE8A`, text `#58A700`) **"Pročitano"** (icon `CheckCircle2`); clicking again unmarks. Finishing a quiz (result screen) marks the lecture read automatically.
- Lecture list (`[subject]/lecture-list.tsx`): read rows get a 20px green `CheckCircle2` at the end of the title line (before the chevron) and the number circle turns primary-light; unread stay as they are.
- Subject page header (`[subject]/page.tsx`): under the title a line **"{read} / {total} pročitano"** 13/700 `#777777` + a §4.9 progress bar (16px, fill `#58CC02`). `total` = lectures loaded for that subject/class (the page already knows the list; if it paginates, use the count returned by the query with `{ count: 'exact', head: false }` — one extra query is acceptable).
- Lekcije tiles (`lectures/page.tsx` → `subject-grid.tsx`): `page.tsx` (server component) runs ONE query `supabase.from('lectures').select('id, subject').eq('class_number', <profile class or all>)` and passes `{ [subject]: string[] }` (lecture ids per subject) to `SubjectGrid` as a prop `lectureIdsBySubject` (optional, default `{}`). Each tile shows a small outline `Badge` **"{n} lekcija"** (n>0) under the name and, when the visitor has read ≥1, a 6px progress bar (`read/total`) at the bottom of the tile; tiles with 0 lectures show nothing extra. Guests see counts for all classes (no profile) — use the same query without the class filter.

## F4. Lecture search

On `/lectures` (`subject-grid.tsx` or a new client component `lecture-search.tsx` rendered above the grid by `page.tsx`): an `Input` with a `Search` icon, placeholder **"Pretraži lekcije…"**, height 50. From 2 characters (debounced 250ms): query `lectures` `select('id, title, subject, class_number')` `.ilike('title', '%q%')` `.order('created_at', { ascending: false })` `.limit(20)`; also filter subject names locally. Render results under the input as §4.10 rows (44px subject-colour circle with the subject emoji via `SubjectIcon size="sm"`, title 17/800, subtitle 13/700 `"{subject} · {class}. razred"`), each a `Link` to `/lectures/{subject}/{id}`; matching subjects first as tiles-in-a-row. Empty result: §4.11 empty state **"Nema rezultata za „{q}“"**. Clearing the input restores the grid. A ✕ clear button (44px) appears when the input has text.

## F5. Share

`src/lib/share.ts`: `shareOrCopy({ title, text, url })` → `navigator.share` when available, else `navigator.clipboard.writeText(url)` and return `'copied'`; the caller shows the existing toast pattern (white §4.13 card, 13/800) with **"Link kopiran"**; on share success `haptic('success')`.
- News card (`news-card.tsx`): an outline icon button (`Share2`, 44px) next to the heart; shares `{ title: news.title, url: location.origin + '/news' }` (news has no detail route — link to the feed).
- Lecture detail header: same button; shares the lecture title and its URL.
- Gallery photo card: same button next to the heart; shares the caption/author line and `/gallery`.

## F6. PWA polish

- `public/manifest.json`: add `"id": "/", "scope": "/", "lang": "sr-Latn", "orientation": "portrait", "start_url": "/gallery"`, and `"icons": [ {"src":"/icons/icon-192.png","sizes":"192x192","type":"image/png"}, {"src":"/icons/icon-512.png","sizes":"512x512","type":"image/png"}, {"src":"/icons/icon-512-maskable.png","sizes":"512x512","type":"image/png","purpose":"maskable"} ]` (the PNGs already exist in `public/icons/`).
- `src/app/layout.tsx` metadata: `icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' }`, `appleWebApp: { capable: true, statusBarStyle: 'default', title: 'NR Gimnazija' }`.
- Install hint: `src/components/install-banner.tsx` (client) listens for `beforeinstallprompt`, stores the event, and shows a dismissible §4.2 card at the top of `/profile` (guest and user) with **"Instaliraj aplikaciju"** 17/800, helper **"Brži pristup sa početnog ekrana."**, primary button **"Instaliraj"** (calls `prompt()`), ghost **"Kasnije"** (sets `localStorage.install_dismissed = '1'`). Renders nothing when the event never fires (iOS) or after dismissal/installation.

## F7. Small comfort fixes

- Scroll to top on every route change (`(main)/layout.tsx` effect on `pathname`) — except when navigating back (skip if `history.state` indicates back — if not detectable, always scroll; acceptable).
- Every list "Učitaj još" button shows the existing spinner/disabled state while loading (verify news, gallery, lecture list, events).
- Tournament: the round label bug — `${m.round} finala` renders "finale finala"; render `m.round === 'finale' ? 'Finale' : \`${m.round} finala\`` (visual string fix approved by the owner).
- Block Blast: the leaderboard must NOT open automatically on page load (`showLeaderboard` initial state `false`); the header "Tabela lidera" button opens it (approved by the owner).

---

## New UI strings (complete list)
"Vibracija", "Gost", "Prijavi se da vidiš svoj profil, ocjene i podešavanja.", "Prijavi se", "Registruj se", "Block Blast", "Turnir u košarci", "eDnevnik", "Označi kao pročitano", "Pročitano", "{n} / {m} pročitano", "{n} lekcija", "Pretraži lekcije…", "Nema rezultata za „{q}“", "Link kopiran", "Instaliraj aplikaciju", "Brži pristup sa početnog ekrana.", "Instaliraj", "Kasnije", "Finale".

## Verification
`npx tsc --noEmit`, `npm run build`, `node scripts/e2e-smoke.mjs` (extended: haptics setting toggles and persists; guest Još renders hero + quick access + opens NavEditor and calculator; mark-as-read toggles and the list/subject/tile counters update; search returns rows for a real title fragment and shows the empty state for "zzzz"; share button copies (mock `navigator.share` absent) and shows the toast; manifest has icons; leaderboard closed on load; tournament shows "Finale"). Then `node scripts/shot-all.mjs` and review `/lectures`, `/lectures/Matematika`, `/profile`, `/news`, `/gallery`, `/game` screenshots against the visual spec.
