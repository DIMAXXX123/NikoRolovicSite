# Niko Rolović — full visual redesign: "Duolingo-style" light theme

This is the single source of truth for the redesign. Every agent working on it reads this file first and follows it literally. The goal: the WHOLE app (every route under `src/app`, every component under `src/components`) looks like one product in the style below. Nothing else changes: routes, data fetching, Supabase calls, business logic, state, nav-config, i18n strings, game engine — all untouched.

The reference the owner approved: a light, playful, chunky "gamified learning app" look — white pages, thick 2px light-grey outlines, "3D" buttons with a darker bottom edge that press down, one saturated green as primary, blue as secondary, rounded (12–16px) corners, Nunito 800 type, and the bottom navigation exactly as specified in §5. Keep the app's existing SCREEN STRUCTURE (same grids, lists, tabs, cards) — restyle it, do not re-architect it. Do NOT add gamification data that does not exist (no XP, hearts, streaks, winding paths).

---

## 1. Hard rules

1. **Light only.** Page background `#FFFFFF`. There is no dark mode anymore. `html` must NOT carry `class="dark"`. `themeColor` in `src/app/layout.tsx` becomes `#FFFFFF`.
2. **Forbidden — must reach zero occurrences in `src/` (grep before you finish):**
   `#7c5cfc` `#5b3fd9` `#050508` `#0c0c14` `#1a1a2e` `#e8e8f0` `#6b6b80` `#3d3d50` `rgba(124,92,252` `rgba(124, 92, 252` `glass-` `gradient-text` `glow-` `deep-glass` `premium-card` `card-premium` `glass-premium` `bg-white/[0.` `border-white/[0.` `text-white/` `bg-black/` `from-[#7c5cfc]` `backdrop-blur` `dark:` `text-[#e8e8f0]` `bg-[#0c0c14]` `border-[#1a1a2e]` `shadow-[0_0_` `text-white` (except on a solid coloured button/badge background — see §4) .
   Also forbidden: any `linear-gradient`/`radial-gradient` used as a decorative background (allowed only inside the Block Blast game board cells and the like-burst/success particle animations), `mix-blend`, glassmorphism, neon glows, `animate-pulse-glow`, `animate-glow-pulse`, `animate-bg-shift`.
3. **Fonts:** Nunito only (weights 700, 800, 900), loaded once via `next/font/google` in `src/app/layout.tsx` and applied to `<body>`. Remove the DM Sans `<link>`. Body text weight 700; headings/buttons/labels 800; big numbers 900.
4. **No behavioural changes.** Do not rename exports, props, routes, localStorage keys, Supabase queries, handlers, or delete features. If a component is purely decorative for the dark theme (glow orbs, gradient meshes), delete the decoration, keep the component.
5. **Tailwind v4 + `@theme inline`.** Colour tokens keep their NAMES (`--color-background`, `--color-primary`, …) so existing `bg-background`, `text-primary`, `border-border` classes keep working; only the VALUES change (§2). Hard-coded hex classes (`bg-[#0c0c14]`) are replaced with token classes or the new hexes from §2.
6. **Accessibility:** body text ≥ 15px; secondary text `#777777` (never lighter than `#AFAFAF`, and `#AFAFAF` only for disabled/placeholder); every tappable element ≥ 44px tall; focus ring `2px solid #1CB0F6` offset 2px.
7. **Montenegrin UI strings stay exactly as they are.** Do not translate, rephrase or "improve" copy.
8. Every agent runs `npm run lint` and `npm run build` on its own files' scope before reporting, and fixes every error it introduced. Do not silence with `eslint-disable` or `// @ts-ignore`.

---

## 2. Design tokens (final values)

Put these in `src/app/globals.css` `@theme inline` block (and the `--theme-*` fallbacks the ThemeSwitcher sets — see §6):

| token | value | use |
|---|---|---|
| `--color-background` | `#FFFFFF` | page |
| `--color-foreground` | `#4B4B4B` | body text |
| `--color-heading` (new) | `#3C3C3C` | h1–h3 |
| `--color-card` | `#FFFFFF` | cards, sheets |
| `--color-card-foreground` | `#4B4B4B` | |
| `--color-muted` | `#F7F7F7` | subtle section fills, input bg |
| `--color-muted-foreground` | `#777777` | secondary text |
| `--color-disabled` (new) | `#AFAFAF` | disabled text, placeholders, inactive nav |
| `--color-border` | `#E5E5E5` | ALL outlines, dividers |
| `--color-border-strong` (new) | `#CECECE` | bottom "3D" edge of grey/outlined elements |
| `--color-input` | `#E5E5E5` | |
| `--color-primary` | `#58CC02` | primary buttons, active states, progress fill |
| `--color-primary-dark` (new) | `#46A302` | bottom edge of primary buttons |
| `--color-primary-light` (new) | `#D7FFB8` | active nav box, selected tint |
| `--color-primary-light-border` (new) | `#B5EE8A` | border of the active nav box |
| `--color-primary-text` (new) | `#58A700` | green text on white (the fill green fails contrast for text) |
| `--color-primary-foreground` | `#FFFFFF` | text on primary |
| `--color-secondary` | `#1CB0F6` | secondary/outlined button text, links, focus, selected chips |
| `--color-secondary-dark` (new) | `#1899D6` | bottom edge of blue buttons |
| `--color-secondary-light` (new) | `#DDF4FF` | selected chip bg |
| `--color-secondary-light-border` (new) | `#84D8FF` | selected chip border |
| `--color-accent` | `#CE82FF` | purple accent (creator role, tertiary highlights) |
| `--color-accent-dark` (new) | `#A560E8` | |
| `--color-gold` (new) | `#FFC800` | gold/yellow (top rank, stars, warnings) |
| `--color-gold-dark` (new) | `#E5A800` | |
| `--color-orange` (new) | `#FF9600` | tournament / basketball accent |
| `--color-destructive` | `#FF4B4B` | errors, delete, report |
| `--color-destructive-dark` (new) | `#EA2B2B` | |
| `--color-destructive-foreground` | `#FFFFFF` | |
| `--color-ring` | `#1CB0F6` | focus |
| `--color-popover` / `--color-popover-foreground` | `#FFFFFF` / `#4B4B4B` | |
| `--color-chart-1..5` | `#58CC02` `#1CB0F6` `#CE82FF` `#FFC800` `#FF4B4B` | |
| `--radius` | `1rem` (16px) | cards, inputs, buttons |
| sidebar-* tokens | same as background/foreground/primary/border | keep them defined |

Per-subject colours (used for subject icons/tiles, pick by subject name; keep the app's emoji inside the circle):
Fizika `#1CB0F6` · Matematika `#58CC02` · CSBH `#FF4B4B` · Hemija `#CE82FF` · Engleski `#1CB0F6` · Italjanski `#58CC02` · Fizicko `#FF9600` · Likovno `#FF86D0` · Biologija `#58CC02` · Istorija `#FFC800` · Geografija `#1CB0F6` · Njemacki `#FFC800` · Spanski `#FF9600` · Izb_spanski `#FF9600`. Tint background for the circle = the colour at 18% opacity over white (e.g. `color-mix(in srgb, #1CB0F6 18%, white)`), the emoji/monogram sits on top.

Role colours: student `#1CB0F6`, moderator `#FF9600`, admin `#FF4B4B`, creator `#CE82FF`. Event-type dots keep their semantic colours but only from this palette.

---

## 3. Typography

Nunito everywhere. Scale (px / weight / line-height):

- Page title (`h1`): 26 / 800 / 1.2, colour `#3C3C3C`, `letter-spacing: -0.01em`. No gradient text.
- Section title (`h2`): 20 / 800 / 1.25.
- Card title / list row title: 17 / 800 / 1.3.
- Body: 15 / 700 / 1.5, `#4B4B4B`.
- Meta / helper: 13 / 700 / 1.4, `#777777`.
- Label / chip / nav label: 12 / 800 / 1 uppercase `letter-spacing: 0.04em` (nav label is 10px, see §5).
- Button label: 15 / 800 uppercase `letter-spacing: 0.04em`.
- Big number (grade average, score): 36 / 900 / 1, tabular numerals.

`body { letter-spacing: 0; line-height: 1.5 }` (remove the current −0.01em / 1.65). Remove `h1..h6 { letter-spacing:-0.02em }` global override; set `font-weight: 800`.

---

## 4. Components (exact specs)

Implement these in `src/components/ui/*` (existing shadcn/base-ui files — keep their exports and prop APIs, change the classes) and reuse them everywhere. Where a page has its own inline buttons/cards, restyle them to these same specs.

### 4.1 Buttons (`src/components/ui/button.tsx`)
All variants: `height 50px` (size `sm` 40px, `lg` 56px), `border-radius 16px`, `font: 800 15px Nunito uppercase, letter-spacing .04em`, `padding 0 20px`, `transition: transform .08s, box-shadow .08s`, `display:inline-flex; align-items:center; justify-content:center; gap:8px`, `user-select:none`.
The "3D edge" is a `box-shadow: 0 4px 0 <edge>`; on `:active` → `transform: translateY(4px); box-shadow: none`. Disabled: `background #E5E5E5; color #AFAFAF; box-shadow 0 4px 0 #CECECE; cursor not-allowed`.

| variant | bg | text | edge (shadow colour) | border |
|---|---|---|---|---|
| `default` (primary) | `#58CC02` | `#FFFFFF` | `#46A302` | none |
| `secondary` | `#1CB0F6` | `#FFFFFF` | `#1899D6` | none |
| `outline` | `#FFFFFF` | `#1CB0F6` | `#E5E5E5` | `2px solid #E5E5E5` |
| `ghost` | transparent | `#1CB0F6` | none | none (hover bg `#F7F7F7`) |
| `destructive` | `#FF4B4B` | `#FFFFFF` | `#EA2B2B` | none |
| `link` | transparent | `#1CB0F6` | none | underline on hover |
| `gold` (new) | `#FFC800` | `#4B4B4B` | `#E5A800` | none |

Icon-only buttons (`size="icon"`): 44×44, radius 12, outline style.

### 4.2 Card (`ui/card.tsx`)
`background #FFFFFF; border: 2px solid #E5E5E5; border-radius 16px; box-shadow: 0 2px 0 #E5E5E5; padding 16px`. Clickable cards add `active:translate-y-[2px] active:shadow-none`. Highlighted/current card: `border-color #B5EE8A; background #F4FFEA; box-shadow 0 2px 0 #B5EE8A`. No hover glow, no lift, no gradient overlay. `CardTitle` = 17/800, `CardDescription` = 13/700 `#777777`.

### 4.3 Badge (`ui/badge.tsx`)
Pill: `height 24px; padding 0 10px; border-radius 999px; font 800 11px uppercase letter-spacing .06em; border 2px solid`. Variants: `default` green tint (`bg #D7FFB8; border #B5EE8A; text #58A700`), `secondary` blue tint (`#DDF4FF / #84D8FF / #1CB0F6`), `destructive` red tint (`#FFDFE0 / #FFB3B5 / #EA2B2B`), `outline` (`bg #fff; border #E5E5E5; text #777777`), `gold` (`#FFF4C4 / #FFE28A / #C79000`), `purple` (`#F3E3FF / #E1BDFF / #A560E8`).

### 4.4 Tabs (`ui/tabs.tsx`)
List: `background #F7F7F7; border 2px solid #E5E5E5; border-radius 16px; padding 4px; gap 4px`. Trigger: `height 40px; border-radius 12px; font 800 13px uppercase; color #777777`. Active trigger: `background #FFFFFF; color #1CB0F6; border 2px solid #E5E5E5; box-shadow 0 2px 0 #E5E5E5`. No underline-style tabs anywhere — every tab strip in the app becomes this segmented control.

### 4.5 Input / Textarea (`ui/input.tsx`, `ui/textarea.tsx`)
`height 50px (textarea min 120px); background #F7F7F7; border 2px solid #E5E5E5; border-radius 16px; padding 0 16px; font 700 15px; color #4B4B4B; placeholder #AFAFAF`. Focus: `border-color #1CB0F6; background #FFFFFF; outline none`. Error: `border-color #FF4B4B`. `Label` = 13/800 uppercase `#777777`, margin-bottom 6px.

### 4.6 Dialog / Sheet (`ui/dialog.tsx`, `ui/sheet.tsx`)
Overlay `rgba(0,0,0,.4)` (no blur). Panel: `background #FFFFFF; border-radius 24px (sheet: 24px top corners); border 2px solid #E5E5E5; padding 24px`. Title 20/800 `#3C3C3C`. Buttons inside are the §4.1 buttons, full width, stacked with 12px gap (primary on top).

### 4.7 Avatar (`ui/avatar.tsx`, `components/avatars.tsx`)
Circle with `border 2px solid #E5E5E5; background #F7F7F7`. Fallback initials 800 on a role-tinted background. No rings/glows.

### 4.8 Chips / filter pills (inline in pages)
`height 44px (40px only inside dense table/row contexts); padding 0 14px; border-radius 12px; border 2px solid #E5E5E5; background #FFFFFF; font 800 12px uppercase; color #777777; box-shadow 0 2px 0 #E5E5E5`. Selected: `background #DDF4FF; border-color #84D8FF; color #1CB0F6; box-shadow 0 2px 0 #84D8FF`.

### 4.9 Progress bar
`height 16px; border-radius 999px; background #E5E5E5; overflow hidden`; fill `background #58CC02` with an inner highlight `box-shadow: inset 0 4px 0 rgba(255,255,255,.3)`; fill radius 999.

### 4.10 List rows
`min-height 64px; padding 12px 16px; display flex; gap 12px; align-items center; border 2px solid #E5E5E5; border-radius 16px; background #fff; box-shadow 0 2px 0 #E5E5E5; margin-bottom 10px` (rows are separate cards, not hairline-divided). Leading circle 44px (subject colour tint + emoji/monogram), title 17/800, subtitle 13/700 `#777777`, trailing chevron `#AFAFAF` (lucide `ChevronRight`, strokeWidth 2.6).

### 4.11 Empty state
Centered: a 64px circle `#F7F7F7` with a lucide icon `#AFAFAF` strokeWidth 2.4, title 17/800 `#4B4B4B`, text 13/700 `#777777`, optional outline button.

### 4.12 Skeleton
`background #E5E5E5; border-radius 12px` with the existing shimmer replaced by a simple opacity pulse.

### 4.13 Toast / tooltip
White card (§4.2) with 13/800 text; no dark toasts.

---

## 5. Bottom navigation — EXACT (`src/components/bottom-nav.tsx`)

This is the one element the owner explicitly picked. Reproduce it exactly:

- `<nav>` fixed bottom, full width, `height: 84px` (this includes room for the home indicator; add `padding-bottom: env(safe-area-inset-bottom)` on top of it via the existing `.h-safe-area-bottom` spacer or padding), `background #FFFFFF`, `border-top: 2px solid #E5E5E5`, no radius, no blur, no shadow. Inner: `max-width 28rem (max-w-md); margin 0 auto; display flex; justify-content space-around; align-items flex-start; padding 8px 10px 0`.
- Item: `<Link>` `display flex; flex-direction column; align-items center; gap 3px; width 62px; color #AFAFAF`.
- Icon box: `width 54px; height 44px; border-radius 12px; border 2px solid transparent; display flex; align-items center; justify-content center`.
- Icon: the existing lucide icon from `nav-config`, `26×26`, `strokeWidth 2.4`, `fill none`, `stroke currentColor`.
- Label: `font 800 10px Nunito uppercase; letter-spacing .04em; line-height 12px`.
- Active item: `color #58A700`; its icon box `background #D7FFB8; border-color #B5EE8A`. No dot, no underline, no fill change on the icon.
- Press: `active:translate-y-[1px]`. Transition 120ms.
- Keep the nav-config logic (custom order, `profile` always last, `nav-config-changed` event) untouched. The page wrapper keeps enough bottom padding (`pb-28` → make it `pb-[100px]`).

---

## 6. Header + theme switcher (`src/app/(main)/layout.tsx`, `src/components/theme-switcher.tsx`)

Header: fixed, `height 64px; background #FFFFFF; border-bottom 2px solid #E5E5E5`, no blur, no glass. Left button: NR mark = `40×40; border-radius 12px; background #58CC02; box-shadow 0 3px 0 #46A302; color #fff; font 900 14px` + "Niko Rolović" 800 16px `#4B4B4B` + "Beta" badge (§4.3 outline variant, 10px). Right: the tournament button (🏀 stays, but the button becomes a 40×40 outline icon button §4.1 with `box-shadow 0 3px 0 #E5E5E5`, no gradient, no bounce — a gentle `hover:-translate-y-[1px]` is fine), the Block Blast button (same outline box; the 3×3 mini grid stays but with flat solid cells, no inner gradients/insets), and the ThemeSwitcher.

ThemeSwitcher: keep the component, its localStorage key `nr-theme`, the popup tooltip and the Palette icon (restyled as a 40×40 outline icon button). Replace the three DARK themes with three LIGHT accent themes that only change the primary family — everything else stays white:
- `zeleno` (default): primary `#58CC02`, dark `#46A302`, light `#D7FFB8`, light-border `#B5EE8A`, text `#58A700`.
- `plavo`: primary `#1CB0F6`, dark `#1899D6`, light `#DDF4FF`, light-border `#84D8FF`, text `#1899D6`.
- `ljubicasto`: primary `#CE82FF`, dark `#A560E8`, light `#F3E3FF`, light-border `#E1BDFF`, text `#A560E8`.
`applyTheme` sets `--theme-primary`, `--theme-primary-dark`, `--theme-primary-light`, `--theme-primary-light-border`, `--theme-primary-text` and must NOT add the `dark` class (remove that line). The `@theme` block maps `--color-primary: var(--theme-primary, #58CC02)` etc. Unknown saved keys (`midnight`, `arctic`, `forest`) fall back to `zeleno`.

---

## 7. Screen-by-screen guidance (structure stays, skin changes)

Common: page title as §3 h1 with the class line under it as meta; `BetaDisclaimer` becomes a §4.2 card with `border-color #FFE28A; background #FFF9E0`, a lucide `TriangleAlert` in `#C79000`, text 13/700 `#7A5A00`.

- **/lectures** (`subject-grid.tsx`, `subject-icon.tsx`): keep the 2-column grid. Tile = §4.2 card, centered: 56px subject-colour tinted circle with the existing emoji/flag, name 15/800. Tile with lectures: small green badge with count. "Dodaj predmet" = §4.1 outline button full width with `Plus`. Optional-subject picker rows = §4.10.
- **/lectures/[subject]** (`lecture-list.tsx`): §4.10 rows, leading circle shows the lecture number (800), "OVDJE SI" marker becomes a green §4.3 badge; likes count as a chip with `ThumbsUp`.
- **/lectures/[subject]/[id]** (`lecture-tabs.tsx`, `lecture-content.tsx`, `quiz-runner.tsx`, `lecture-like-button.tsx`): tabs = §4.4; content in a §4.2 card with 15/700 body and 20/800 section titles; key-terms list as chips; quiz answers = full-width outline buttons (§4.1) that turn green tint (`#D7FFB8/#B5EE8A/#58A700`) when correct, red tint when wrong, with a fixed bottom result bar (white, 2px top border) holding the primary "Provjeri"/"Nastavi" button; progress bar §4.9 at top. Like button = outline icon button, active = green tint.
- **/news** (`news-feed.tsx`, `news-card.tsx`): hero card and regular cards = §4.2; category as §4.3 badge; author avatar §4.7; heart = outline icon button, liked = red tint (`#FFDFE0/#FFB3B5/#EA2B2B`); "Učitaj još" = outline button; keep double-tap like and `like-burst` (particles may keep their colours).
- **/gallery** (`gallery/page.tsx`): photo cards §4.2 with the image at radius 12 inside; upload FAB = 56px primary button (circle, `box-shadow 0 4px 0 #46A302`) bottom-right above the nav; report/menu = ghost buttons; moderation labels = badges.
- **/events** (`events-view.tsx`): view toggle = §4.4 tabs; month header with outline icon buttons for prev/next; day cells 40px circles, today = primary fill white number, selected = 2px `#1CB0F6` ring, event dots 6px in palette colours; event list = §4.10 rows.
- **/schedule** (`schedule-view.tsx`): class/section selectors and day pills = §4.8 chips; week table inside a §4.2 card with 2px `#E5E5E5` row dividers; current period row green tint.
- **/grades**: trimester pills = chips; average = big number 36/900 in a §4.2 card with §4.9 progress; subject accordion rows = §4.10 with the final grade in a 44px circle; grade pickers 1–5 = 44px outline circles, selected = primary fill.
- **/ednevnik**, **/teachers**: rows §4.10, section titles 20/800, badges §4.3, buttons §4.1.
- **/tournament**: tabs §4.4; bracket/match cards §4.2 with team monogram circles; favourite star = gold.
- **/game** (`game/page.tsx`, `game-overlays.tsx`): page chrome white; score/best as big numbers; the 8×8 board is a §4.2 card with cells `#F7F7F7` border 2px `#E5E5E5`, filled cells in palette colours (gradients allowed inside cells only); tray shapes on white; overlays §4.6 with §4.1 buttons; leaderboard rows §4.10 with rank circle (1 = gold, 2 = `#CECECE`, 3 = `#FF9600`).
- **/profile** (`page.tsx`, `calculator.tsx`, `nav-editor.tsx`): hero = §4.2 card with 80px avatar, name 20/800, role badge; stats row (three columns: 20/900 number over 12/800 uppercase label); settings rows §4.10 with trailing switch/chevron; nav-editor items = draggable §4.10 rows; calculator inputs §4.5; logout = destructive button.
- **/about**, **/privacy**, **/terms**, **/content-policy**: text pages in §4.2 cards, headings 20/800, body 15/700.
- **(auth)/*** (`login`, `register`, `reset-password`, `update-password`, `verify`, `complete-profile`, `(auth)/layout.tsx`): white page, NR mark 64px centered at top, title 26/800, inputs §4.5, primary button full width, secondary links in `#1CB0F6` 800, error text `#FF4B4B`; no gradients, no glass panels.
- **(admin)/*** (`admin/page.tsx`, `lectures`, `news`, `events`, `photos`, `students`, `roles`): same system — cards, chips, inputs, buttons, tables inside cards with 2px dividers; destructive actions red.
- **`site-tour.tsx`**: tour cards §4.6 style; keep the copy and the steps; particles may keep their colours; remove dark backdrops (use `rgba(0,0,0,.4)`).
- **`role-animation.tsx`, `success-animation.tsx`, `like-burst.tsx`**: keep motion, recolour to the palette; success circle `#58CC02`.
- **`profile-guard.tsx`**: no visual.
- **`public/manifest.json`**: `theme_color` and `background_color` → `#FFFFFF`.

---

## 8. `globals.css` rewrite plan

Keep the file, rewrite it: (1) `@import "tailwindcss"; @import "tw-animate-css";` (2) `@theme inline` with §2 tokens; (3) `@layer base` — body white, Nunito, colours; remove the `body::after` gradient orbs and `floatOrb` keyframes; (4) keep useful utilities and rename/restyle: `.animate-fade-in`, `.animate-slide-up`, `.animate-scale-in`, `.animate-stagger`, `.animate-press`, `.animate-pop-in`, `.animate-heart-pop`, `.animate-heart-float`, `.animate-heart-explode`, `.animate-count-up`, `.animate-tick`, `.skeleton`, `.page-transition`, `.press-ripple` (make it a flat `#F7F7F7` press), `.btn-press`; DELETE `.glass*`, `.gradient-text`, `.gradient-border`, `.gradient-overlay`, `.glow-hover`, `.premium-card`, `.card-premium`, `.deep-glass`, `.animate-pulse-glow`, `.animate-glow-pulse`, `.animate-bg-shift`, `.animate-breathe`, `.hover-float`, `.accent-left-hover`, `.pill-active` (replace uses with §4.8), custom scrollbar → `width 6px; thumb #E5E5E5`. Any class you delete must have zero remaining uses in `src/` (grep) — replace them at the call sites with the specs above.

---

## 9. Verification (the "nothing floats" check)

1. `npm run lint` — clean.
2. `npm run build` — passes.
3. Grep for every forbidden token in §1.2 and every deleted class in §8 → 0 hits in `src/`.
4. Screenshots: `node scripts/shot-all.mjs` (Phase 4 writes it: builds, starts `next start -p 3457`, uses the project's own `puppeteer` devDependency, viewport 390×844 deviceScaleFactor 2, captures EVERY route listed in §7 plus `/lectures/Matematika` and one lecture detail, saves to `docs/screens/<route>.png`, kills the server). Review each PNG: no horizontal overflow, no clipped text, nothing hidden behind the nav/header, no dark leftovers, contrast OK, every tappable element ≥ 44px.
5. Layout guards: `main` has `pt-16` for the header and `pb-[100px]` for the nav; no page sets its own dark background; `overflow-x: hidden` on `body`.
