#!/usr/bin/env node
/**
 * web/scripts/adopt-icons.mjs - the icon pipeline (flowforge#17): brand art
 * -> traced vector -> full icon set -> an authored brand-mark.json the OG
 * card can redraw. One command regenerates the whole set from a raster logo,
 * so every repo in the family gets the same one-command rebrand.
 *
 * Three stages, all reproducible, lockfile untouched (helpers ride
 * `npm i --no-save`):
 *   1. sample + trace - read the source art (sharp), bin the ink mask by
 *      luminance, potrace the mask into a clean SVG path. The accent
 *      geometry (iris ring + tick) is MEASURED from the accent pixels.
 *   2. author the seal - everything measured is committed as
 *      brand-mark.json (viewBox, paths, iris, transform) for og-image.mjs.
 *   3. rasterize the set - favicon-32, icon-192, icon-512, apple-touch-icon,
 *      and icon.svg copied into BOTH web/public/ and docs/ so the two faces
 *      stay byte-identical.
 *
 * Transcribed from dhaupin/eyestruct web/scripts/make-icons.mjs @ e4a73ac
 * (the traced-mark pipeline; introduced 6556225) - generalized to take any
 * source art via --art.
 * Run it after dropping a logo; output paths are the only repo-specific bits.
 *
 * Reproduce (build-local helpers, no lockfile change):
 *   cd web
 *   npm i --no-save sharp potrace @resvg/resvg-js
 *   node scripts/adopt-icons.mjs --art public/brand/logo.png
 *
 * Flags (defaults match the family identity; every value is brand data):
 *   --art <path>       source raster (required)
 *   --ink <hex>        traced-ink fill            (default #e7eaf1)
 *   --accent <hex>     iris/tick accent           (default #6d8cff)
 *   --tile-bg <hex>    tile background            (default #10131a)
 *   --out <dir>        PNG/SVG output dir         (default web/public)
 *   --docs <dir>       docs icon.svg copy dir     (default docs)
 *
 * Scheme note (issue #20): the accent is baked into the mark at generation
 * time. The ruling is option (a) - a STATIONARY default-mark accent (iris)
 * regardless of the runtime paint scheme, so dau art never mismatches a
 * scheme switch. Regenerate with --accent only when the brand itself moves.
 */
import { Resvg } from '@resvg/resvg-js'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const sharp = require('sharp')
const potrace = require('potrace')

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..', '..')

const argv = process.argv.slice(2)
const flag = (name) => {
  const i = argv.indexOf(name)
  return i === -1 ? undefined : argv[i + 1]
}

const ART = flag('--art')
if (!ART) {
  console.error('adopt-icons: --art <path-to-raster-logo> is required (there is no default art in the shell)')
  process.exit(2)
}
const INK = flag('--ink') || '#e7eaf1'
const ACCENT = flag('--accent') || '#6d8cff'
const TILE_BG = flag('--tile-bg') || '#10131a'
const PUB = path.resolve(flag('--out') || path.join(REPO, 'web', 'public'))
const DOCS = path.resolve(flag('--docs') || path.join(REPO, 'docs'))

// --- 1. load + classify ----------------------------------------------------
const WORK = 1024
const { data, info } = await sharp(ART)
  .resize(WORK, WORK)
  .raw()
  .toBuffer({ resolveWithObject: true })

const at = (x, y) => {
  const i = (y * info.width + x) * info.channels
  return [data[i], data[i + 1], data[i + 2]]
}
// Accent classification: the mark's accent pixels are bluer than they are
// red and bright enough; everything else light is the ink band. Tune these
// two predicates if your art's accent is a different hue family.
const isAccent = (r, g, b) => b - r > 50 && b > 140
const isInk = (r, g, b) => r + g + b > 330

const inkMask = Buffer.alloc(WORK * WORK)      // 255 = traced ink
const accentList = []
for (let y = 0; y < WORK; y++) {
  for (let x = 0; x < WORK; x++) {
    const [r, g, b] = at(x, y)
    if (isAccent(r, g, b)) accentList.push(x, y)
    else if (isInk(r, g, b)) inkMask[y * WORK + x] = 255
  }
}

// --- 2. trace the ink band -------------------------------------------------
const inkPng = await sharp(inkMask, { raw: { width: WORK, height: WORK, channels: 1 } })
  .png()
  .toBuffer()
const traced = await new Promise((resolve, reject) => {
  // blackOnWhite:false = trace the WHITE pixels. The mask above sets ink to
  // 255 (white) on a 0 (black) field, so this is the polarity that traces the
  // MARK. With blackOnWhite:true potrace traces the black field instead - the
  // background frame - and the icon renders as a light tile with a dark mark
  // (the negative of the art). Verified by correlating the traced fill against
  // the ink mask: +0.999 here, -0.999 with true. (The eyestruct source at
  // e4a73ac carries the same latent inversion; fixed on adoption.)
  potrace.trace(inkPng, { threshold: 128, turdSize: 8, optTolerance: 0.4, blackOnWhite: false },
    (err, svg) => (err ? reject(err) : resolve(svg)))
})
const paths = [...traced.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).filter((d) => d.length > 1)
if (!paths.length) throw new Error('potrace produced no paths')

// Polarity guard. The traced paths must cover the ink MASK, not the
// background field around it. The wrong polarity traces the full WORK box
// (the dark frame), so its bbox spans ~0..WORK; the mark's bbox is inset.
// Compare the traced bbox to the mask bbox and refuse a mismatch - this is
// the exact inversion the blackOnWhite flag above can reintroduce.
let minX = WORK, maxX = -1, minY = WORK, maxY = -1
for (let y = 0; y < WORK; y++) {
  for (let x = 0; x < WORK; x++) {
    if (inkMask[y * WORK + x]) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}

const pathNums = [...paths.join(' ').matchAll(/(-?[\d.]+)[ ,]+(-?[\d.]+)/g)]
const px = pathNums.map((m) => +m[1])
const py = pathNums.map((m) => +m[2])
const tol = WORK * 0.04
const tracedCoversFrame = Math.min(...px) < tol && Math.min(...py) < tol &&
  Math.max(...px) > WORK - tol && Math.max(...py) > WORK - tol
const maskInset = minX > tol || minY > tol || maxX < WORK - tol || maxY < WORK - tol
if (tracedCoversFrame && maskInset) {
  throw new Error('adopt-icons: traced paths span the full frame but the ink mask is inset - potrace polarity is inverted (check blackOnWhite); the icon would ship as a negative of the art')
}

// --- 3. measure the accent iris + tick -------------------------------------
const acc = []
for (let i = 0; i < accentList.length; i += 2) acc.push({ x: accentList[i], y: accentList[i + 1] })
let aMinX = WORK, aMaxX = -1, aMinY = WORK, aMaxY = -1, cxA = 0, cyA = 0
for (const p of acc) {
  aMinX = Math.min(aMinX, p.x); aMaxX = Math.max(aMaxX, p.x)
  aMinY = Math.min(aMinY, p.y); aMaxY = Math.max(aMaxY, p.y)
  cxA += p.x; cyA += p.y
}
cxA /= acc.length; cyA /= acc.length
const ringOuterRadius = (aMaxY - aMinY) / 2
let run = 0
for (let y = Math.floor(cyA); y <= aMaxY; y++) {
  const [r, g, b] = at(Math.round(cxA), y)
  if (isAccent(r, g, b)) run++
  else if (run) break
}
const ringThickness = run * 2
const tickHalfLen = (aMaxX - aMinX) / 2
const tickProbeX = Math.round(cxA + tickHalfLen - (aMaxX - cxA) * 0.05)
let tickThick = 0
for (let y = Math.floor(cyA) - 60; y <= Math.floor(cyA) + 60; y++) {
  const [r, g, b] = at(tickProbeX, y)
  if (isAccent(r, g, b)) tickThick++
}
const tickHalfWidth = Math.max(tickThick, 6) / 2

// --- 4. compose the tile (64 viewBox, content box 6..58) -------------------
const SCALE = 48 / Math.max(maxX - minX, maxY - minY)
const ox = 32 - ((minX + maxX) / 2) * SCALE
const oy = 32 - ((minY + maxY) / 2) * SCALE
const pathEls = paths.map((d) => `<path d="${d}" fill="${INK}" fill-rule="evenodd"/>`).join('\n  ')
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="${TILE_BG}"/>
<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${SCALE.toFixed(5)})">
  ${pathEls}
  <circle cx="${cxA.toFixed(1)}" cy="${cyA.toFixed(1)}" r="${(ringOuterRadius - ringThickness / 2).toFixed(1)}" fill="none" stroke="${ACCENT}" stroke-width="${ringThickness.toFixed(1)}"/>
  <rect x="${(cxA - tickHalfLen).toFixed(1)}" y="${(cyA - tickHalfWidth).toFixed(1)}" width="${(tickHalfLen * 2).toFixed(1)}" height="${(tickHalfWidth * 2).toFixed(1)}" rx="${tickHalfWidth.toFixed(1)}" fill="${ACCENT}"/>
</g>
</svg>
`

fs.writeFileSync(path.join(PUB, 'icon.svg'), iconSvg)
fs.writeFileSync(path.join(DOCS, 'icon.svg'), iconSvg)

fs.writeFileSync(path.join(HERE, 'brand-mark.json'), JSON.stringify({
  viewBox: 64,
  paths,
  iris: {
    cx: +((cxA * SCALE + ox) / 1).toFixed(2),
    raw: {
      workSize: WORK,
      cx: +cxA.toFixed(1), cy: +cyA.toFixed(1),
      midRadius: +(ringOuterRadius - ringThickness / 2).toFixed(1),
      thickness: +ringThickness.toFixed(1),
      tickHalfLen: +tickHalfLen.toFixed(1), tickHalfWidth: +tickHalfWidth.toFixed(1),
    },
  },
  colors: { ink: INK, accent: ACCENT, tileBg: TILE_BG },
  inkMask: { minX, maxX, minY, maxY },
  transform: { ox: +ox.toFixed(2), oy: +oy.toFixed(2), scale: +SCALE.toFixed(5) },
}, null, 2) + '\n')

// --- 5. rasterize the PNG ladder -------------------------------------------
const pngRoot = new Resvg(iconSvg, { fitTo: { mode: 'width', value: 512 } })
  .render().asPng()
const sizes = { 'icon-512.png': 512, 'icon-192.png': 192, 'apple-touch-icon.png': 180, 'favicon-32.png': 32 }
for (const [name, size] of Object.entries(sizes)) {
  await sharp(pngRoot).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(PUB, name))
}

console.log('ink bbox:', { minX, maxX, minY, maxY })
console.log('iris:', { cxA: cxA.toFixed(1), cyA: cyA.toFixed(1), ringOuterRadius: ringOuterRadius.toFixed(1), ringThickness: ringThickness.toFixed(1), tickHalfLen: tickHalfLen.toFixed(1), tickHalfWidth: tickHalfWidth.toFixed(1) })
console.log('paths:', paths.length, '| scale', SCALE.toFixed(5), 'origin', ox.toFixed(1), oy.toFixed(1))
console.log(`icon set written: ${PUB} (svg + 4 png) + ${DOCS}/icon.svg + ${path.join(HERE, 'brand-mark.json')}`)
