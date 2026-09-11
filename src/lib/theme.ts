/**
 * Theme model.
 *
 * Two independent axes:
 *   - palette   — Midnight / Arctic / Forest, picked with the palette button.
 *   - colorMode — 'system' (default, follows the phone), or an explicit
 *                 'light' / 'dark' that overrides it and is remembered.
 *
 * Both live in localStorage and are applied by an inline script in <head>
 * (see buildThemeBootstrapScript) so the first paint is already correct.
 */

export type ThemeVars = Record<string, string>

export type Palette = {
  name: string
  key: string
  /** Swatch shown on the palette button — always the palette's brand colour. */
  color: string
  dark: ThemeVars
  light: ThemeVars
}

export type ColorMode = 'system' | 'light' | 'dark'
export type ResolvedColorMode = 'light' | 'dark'

export const PALETTE_STORAGE_KEY = 'nr-theme'
export const COLOR_MODE_STORAGE_KEY = 'nr-color-mode'

/** Fired on `window` whenever the palette or the colour mode changes. */
export const THEME_CHANGED_EVENT = 'nr-theme-changed'

export const PALETTES: Palette[] = [
  {
    name: 'Midnight',
    key: 'midnight',
    color: '#7c5cfc',
    dark: {
      '--theme-primary': '#7c5cfc',
      '--theme-primary-foreground': '#ffffff',
      '--theme-accent': '#5b3fd9',
      '--theme-secondary': '#0c0c14',
      '--theme-background': '#050508',
      '--theme-foreground': '#e8e8f0',
      '--theme-card': '#0c0c14',
      '--theme-muted': '#1a1a2e',
      '--theme-muted-foreground': '#6b6b80',
      '--theme-border': '#1a1a2e',
      '--theme-chrome': '5, 5, 8',
      '--theme-hairline': '255, 255, 255',
    },
    light: {
      '--theme-primary': '#6741e8',
      '--theme-primary-foreground': '#ffffff',
      '--theme-accent': '#5b3fd9',
      '--theme-secondary': '#eeeef7',
      '--theme-background': '#f7f7fb',
      '--theme-foreground': '#16161f',
      '--theme-card': '#ffffff',
      '--theme-muted': '#e8e8f2',
      '--theme-muted-foreground': '#5d5d72',
      '--theme-border': '#dedee9',
      '--theme-chrome': '247, 247, 251',
      '--theme-hairline': '16, 16, 32',
    },
  },
  {
    name: 'Arctic',
    key: 'arctic',
    color: '#3b82f6',
    dark: {
      '--theme-primary': '#3b82f6',
      '--theme-primary-foreground': '#ffffff',
      '--theme-accent': '#2563eb',
      '--theme-secondary': '#0a0e14',
      '--theme-background': '#060a10',
      '--theme-foreground': '#e8ecf0',
      '--theme-card': '#0a0e18',
      '--theme-muted': '#141e2e',
      '--theme-muted-foreground': '#5a7090',
      '--theme-border': '#152030',
      '--theme-chrome': '6, 10, 16',
      '--theme-hairline': '255, 255, 255',
    },
    light: {
      '--theme-primary': '#2563eb',
      '--theme-primary-foreground': '#ffffff',
      '--theme-accent': '#1d4ed8',
      '--theme-secondary': '#e9f0fb',
      '--theme-background': '#f4f8fd',
      '--theme-foreground': '#0f1b2a',
      '--theme-card': '#ffffff',
      '--theme-muted': '#dfeafa',
      '--theme-muted-foreground': '#4a6484',
      '--theme-border': '#d3e2f5',
      '--theme-chrome': '244, 248, 253',
      '--theme-hairline': '15, 27, 42',
    },
  },
  {
    name: 'Forest',
    key: 'forest',
    color: '#10b981',
    dark: {
      '--theme-primary': '#10b981',
      '--theme-primary-foreground': '#ffffff',
      '--theme-accent': '#059669',
      '--theme-secondary': '#080e0a',
      '--theme-background': '#050a08',
      '--theme-foreground': '#e0f0e8',
      '--theme-card': '#0a140e',
      '--theme-muted': '#142e20',
      '--theme-muted-foreground': '#5a8070',
      '--theme-border': '#1a3028',
      '--theme-chrome': '5, 10, 8',
      '--theme-hairline': '255, 255, 255',
    },
    light: {
      '--theme-primary': '#059669',
      '--theme-primary-foreground': '#ffffff',
      '--theme-accent': '#047857',
      '--theme-secondary': '#e7f5ef',
      '--theme-background': '#f4faf7',
      '--theme-foreground': '#0d1f18',
      '--theme-card': '#ffffff',
      '--theme-muted': '#dcefe5',
      '--theme-muted-foreground': '#47705f',
      '--theme-border': '#cfe8dc',
      '--theme-chrome': '244, 250, 247',
      '--theme-hairline': '13, 31, 24',
    },
  },
]

export const DEFAULT_PALETTE = PALETTES[0]

export function getPalette(key: string | null | undefined): Palette {
  return PALETTES.find(p => p.key === key) ?? DEFAULT_PALETTE
}

export function isColorMode(value: string | null | undefined): value is ColorMode {
  return value === 'system' || value === 'light' || value === 'dark'
}

/** Writes the palette variables and the `dark` class onto <html>. */
export function applyTheme(paletteKey: string, resolved: ResolvedColorMode) {
  const palette = getPalette(paletteKey)
  const root = document.documentElement
  const vars = resolved === 'light' ? palette.light : palette.dark
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value)
  }
  root.classList.toggle('dark', resolved === 'dark')
  root.dataset.theme = palette.key
  root.dataset.colorScheme = resolved
  root.style.colorScheme = resolved
}

/**
 * The <head> script. It runs before first paint, so the page never flashes the
 * wrong palette, and it repeats applyTheme's logic in plain ES5 because it has
 * to run standalone, outside the bundle.
 */
export function buildThemeBootstrapScript(): string {
  const data = JSON.stringify(
    PALETTES.map(p => ({ key: p.key, dark: p.dark, light: p.light }))
  )

  return `(function(){try{
var P=${data};
var pk=localStorage.getItem(${JSON.stringify(PALETTE_STORAGE_KEY)});
var p=null;for(var i=0;i<P.length;i++){if(P[i].key===pk){p=P[i];break;}}
if(!p){p=P[0];}
var m=localStorage.getItem(${JSON.stringify(COLOR_MODE_STORAGE_KEY)});
if(m!=='light'&&m!=='dark'){m='system';}
var r=m==='system'?(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;
var v=r==='light'?p.light:p.dark;var e=document.documentElement;
for(var k in v){e.style.setProperty(k,v[k]);}
e.classList.toggle('dark',r==='dark');
e.dataset.theme=p.key;e.dataset.colorScheme=r;e.style.colorScheme=r;
}catch(err){document.documentElement.classList.add('dark');}})();`
}
