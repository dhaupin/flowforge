#!/usr/bin/env node
/**
 * web/scripts/og-image.mjs - regenerates web/public/og-image.png (1200x630)
 * from the authored seal. Consumes web/scripts/brand-mark.json (written by
 * adopt-icons.mjs) so the card redraws the EXACT traced mark, not a
 * placeholder circle. Identity (name, tagline, url) rides ssr.config.js -
 * brand as data, no hex or copy baked into this file beyond the token
 * palette defaults.
 *
 * Transcribed from __AUTHOR__/eyestruct web/scripts/og-image.mjs @ 33a7c19
 * (the token-palette card; the mark inlines via brand-mark.json).
 *
 * Reproduce (no lockfile change - the font is a build-local helper):
 *   cd web
 *   npm i --no-save @resvg/resvg-js dejavu-fonts-ttf
 *   node scripts/og-image.mjs
 *
 * Flags (defaults are the __NAME__ identity; every value is brand data):
 *   --mark <path>   brand-mark.json   (default web/scripts/brand-mark.json)
 *   --out <path>    png output        (default web/public/og-image.png)
 *   --paper/--surface/--raised/--ink/--soft/--accent/--line <hex>  token overrides
 */
import { Resvg } from '@resvg/resvg-js'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..', '..')

const argv = process.argv.slice(2)
const flag = (name) => {
  const i = argv.indexOf(name)
  return i === -1 ? undefined : argv[i + 1]
}

// Identity from ssr.config.js - the one brand truth for the landing shell.
const ssr = (await import(path.join(REPO, 'web', 'ssr.config.js'))).default
const siteName = ssr.siteName || 'site'
const tagline = ssr.tagline || ''
const siteUrl = (ssr.siteUrl || '').replace(/^https?:\/\//, '')

// The token palette (defaults match the shell's dark :root block).
const P = flag('--paper') || '#10131a'
const S = flag('--surface') || '#161b24'
const RAISED = flag('--raised') || '#1d2430'
const INK = flag('--ink') || '#e7eaf1'
const SOFT = flag('--soft') || '#98a2b3'
const A = flag('--accent') || '#6d8cff'
const LINE = flag('--line') || '#2a3140'

// The authored seal (adopt-icons.mjs writes it). Absent -> no mark, card still renders.
const markPath = path.resolve(flag('--mark') || path.join(HERE, 'brand-mark.json'))
let markEls = ''
let markAccent = A
if (fs.existsSync(markPath)) {
  const mark = JSON.parse(fs.readFileSync(markPath, 'utf8'))
  markAccent = mark.colors?.accent || A
  const t = mark.transform || { ox: 0, oy: 0, scale: 1 }
  const iris = mark.iris?.raw || {}
  const inner = (mark.paths || []).map((d) => `<path d="${d}" fill="${mark.colors?.ink || INK}" fill-rule="evenodd"/>`).join('')
  markEls = `<g transform="translate(120,170) scale(1.75) translate(${-(t.ox)},${-(t.oy)}) scale(${1 / (t.scale || 1)})">
    ${inner}
    <circle cx="${iris.cx}" cy="${iris.cy}" r="${iris.midRadius}" fill="none" stroke="${markAccent}" stroke-width="${iris.thickness}"/>
    <rect x="${iris.cx - iris.tickHalfLen}" y="${iris.cy - iris.tickHalfWidth}" width="${iris.tickHalfLen * 2}" height="${iris.tickHalfWidth * 2}" rx="${iris.tickHalfWidth}" fill="${markAccent}"/>
  </g>`
}

const resolveTtf = (name) =>
  path.join(path.dirname(require.resolve('dejavu-fonts-ttf/package.json')), 'ttf', name)

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${P}"/>
  <rect width="1200" height="8" fill="${A}"/>
  <rect x="60" y="90" width="1080" height="450" rx="16" fill="${S}" stroke="${LINE}" stroke-width="2"/>
  <g transform="translate(120,170)">
    <rect x="0" y="0" width="112" height="112" rx="24" fill="${RAISED}" stroke="${LINE}" stroke-width="2"/>
  </g>
  ${markEls}
  <text x="270" y="196" font-family="DejaVu Sans" font-size="72" font-weight="bold" fill="${INK}">${siteName}</text>
  <text x="270" y="246" font-family="DejaVu Sans" font-size="26" fill="${SOFT}">${tagline}</text>
  <text x="120" y="420" font-family="DejaVu Sans" font-size="24" fill="${SOFT}">${siteUrl}</text>
  <text x="120" y="470" font-family="DejaVu Sans" font-size="20" fill="${SOFT}">__ORG_NAME__</text>
</svg>`

const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    loadSystemFonts: false,
    fontFiles: [resolveTtf('DejaVuSans.ttf'), resolveTtf('DejaVuSans-Bold.ttf')],
    defaultFontFamily: 'DejaVu Sans',
  },
}).render().asPng()

const out = path.resolve(flag('--out') || path.join(REPO, 'web', 'public', 'og-image.png'))
fs.writeFileSync(out, png)
console.log(`wrote ${out} (${png.length} bytes)`)
