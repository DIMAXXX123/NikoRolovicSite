/**
 * Generates the placeholder app icon set from an "NR" monogram.
 *
 * There is no logo source file in the repository yet — when one lands, replace
 * the SVG below (or drop in real artwork) and re-run:  node scripts/generate-icons.mjs
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const BG = '#050508'
const PRIMARY = '#7c5cfc'
const ACCENT = '#5b3fd9'

/**
 * @param size    output size in px
 * @param inset   fraction of the canvas kept free around the artwork.
 *                Maskable icons need a 20% safe zone on every side, because
 *                Android may crop the icon to a circle or a squircle.
 * @param rounded whether the plate itself gets rounded corners (any icon that
 *                is not maskable is shown as-is, so it draws its own shape)
 */
function monogram(size, { inset = 0, rounded = false } = {}) {
  const pad = size * inset
  const plate = size - pad * 2
  const radius = rounded ? plate * 0.22 : 0
  const fontSize = plate * 0.44

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${PRIMARY}"/>
      <stop offset="100%" stop-color="${ACCENT}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0%" stop-color="${PRIMARY}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${PRIMARY}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <rect x="${pad}" y="${pad}" width="${plate}" height="${plate}" rx="${radius}" fill="${BG}"/>
  <rect x="${pad}" y="${pad}" width="${plate}" height="${plate}" rx="${radius}" fill="url(#glow)"/>
  ${rounded ? `<rect x="${pad + plate * 0.02}" y="${pad + plate * 0.02}" width="${plate * 0.96}" height="${plate * 0.96}" rx="${plate * 0.2}" fill="none" stroke="url(#g)" stroke-opacity="0.45" stroke-width="${Math.max(1, plate * 0.02)}"/>` : ''}
  <text x="${size / 2}" y="${size / 2}" font-family="DejaVu Sans, sans-serif" font-size="${fontSize}"
        font-weight="700" letter-spacing="${fontSize * -0.03}" fill="url(#g)"
        text-anchor="middle" dominant-baseline="central">NR</text>
</svg>`
}

const targets = [
  { file: 'icon-192.png', size: 192, opts: { rounded: true } },
  { file: 'icon-512.png', size: 512, opts: { rounded: true } },
  // Maskable icons are always cropped, so the monogram sits inside the safe zone
  // and the background bleeds to the edges.
  { file: 'icon-maskable-192.png', size: 192, opts: { inset: 0.2 } },
  { file: 'icon-maskable-512.png', size: 512, opts: { inset: 0.2 } },
  // Safari rounds the apple-touch-icon corners itself, so this one is
  // full-bleed with nothing near the edges that a rounded crop would clip.
  { file: 'apple-touch-icon.png', size: 180, opts: {} },
]

for (const { file, size, opts } of targets) {
  const png = await sharp(Buffer.from(monogram(size, opts))).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(join(PUBLIC_DIR, file), png)
  console.log(`${file}  ${size}x${size}  ${png.length}B`)
}

// A vector favicon so desktop tabs are not stuck with the 192px raster.
writeFileSync(join(PUBLIC_DIR, 'icon.svg'), monogram(512, { rounded: true }))
console.log('icon.svg')
