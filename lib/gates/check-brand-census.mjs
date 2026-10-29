#!/usr/bin/env node
/**
 * Brand census gate (flowforge#32 class; PRD labs/prd-flowforge.md 8).
 *
 * The shell's identity lives ONCE, in site.config.js. Every surface that can
 * import it does (the web bundle); every surface that cannot is GENERATED from
 * it by `npm run sync` (the two engine configs, robots, the webmanifest, the
 * Jekyll config). This gate is the teeth: it refuses an identity literal that
 * lives anywhere else, so a rebrand is one file, not a hunt across three
 * languages. It is the same shape as the version-truth census leg
 * (tests/census.test.cjs) - one source, and the living surfaces cannot drift.
 *
 * Scope: the STRUCTURAL surfaces that ship the site - the landing shell, the
 * docs rig, and the config files an adopter would rebrand. Page BODY copy
 * (web/src/pages/*.jsx prose, docs/*.md) is the adopter's own writing and is
 * deliberately NOT scanned: the point is that no STRUCTURAL surface hardcodes
 * the brand, not that a sentence cannot say the site's name.
 *
 * Allowed (the identity's lawful homes):
 *   - site.config.js              the one source
 *   - generated files             stamped with the GENERATED banner (they are
 *                                 outputs of the source, checked by sync:check)
 *   - site.js / ssr.config.js     the import adapters (no literals, but listed
 *                                 so a future literal there reads as drift)
 *
 * Names file:line. Exit 1 on any hit.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { resolveRoot } from '../root.mjs'

const ROOT = resolveRoot()
const site = (await import(pathToFileURL(join(ROOT, 'site.config.js')).href)).default

// The identity literals to hunt: the site name, and the domain fragments the
// brand rides on. Derived from site.config.js so a rebrand re-aims the gate
// automatically (a rebrand changes what counts as "the brand").
const DOMAIN_FRAGMENTS = (() => {
  const out = new Set()
  for (const u of [site.url, site.repo, site.docs.url, site.org.url, site.maker.url]) {
    try { out.add(new URL(u).hostname) } catch { /* not a URL: skip */ }
  }
  return [...out]
})()
const LITERALS = [site.name, ...DOMAIN_FRAGMENTS].filter(Boolean)

// Structural surfaces: the files that SHIP the site's identity. Generated
// files are allowed by the banner check below, not by this list.
const SURFACES = [
  'web/index.html',
  'web/ssr.config.js',
  'web/vite.config.js',
  'web/src/App.jsx',
  'web/src/AppIslands.jsx',
  'web/src/AppLayout.jsx',
  'web/src/main.jsx',
  'web/src/islands.js',
  'web/src/site.js',
  'web/src/theme.js',
  'web/src/components/Nav.jsx',
  'web/src/components/Footer.jsx',
  'web/src/components/navItems.js',
  'web/src/components/ThemeSwitch.jsx',
  'web/src/components/SchemeSwitch.jsx',
  'web/src/hooks/usePageMeta.js',
  'web/public/robots.txt',
  'web/public/site.webmanifest',
  'docs/_config.yml',
  'docs/freestruct.config.yml',
  'docs/_layouts/default.html',
  'docs/_data/nav.yml',
]

// The files `flowforge sync` OWNS: their identity is derived from the source,
// and `npm run sync:check` proves they match it, so this gate does not re-scan
// them (they are outputs, not inputs). Listed explicitly rather than sniffed by
// a banner - a JSON file cannot carry a comment, and an explicit list is the
// house way of naming a contract.
const GENERATED = new Set([
  'web/public/robots.txt',
  'web/public/site.webmanifest',
  'docs/_config.yml',
  'docs/freestruct.config.yml',
])

// Strip comments so prose ABOUT the brand (a receipt naming a sibling repo, a
// note explaining the rig) is not read as a hardcode. Handles // and /* */
// (JS/CSS) and <!-- --> (HTML), multi-line included.
function stripComments(src, rel) {
  if (rel.endsWith('.html')) return src.replace(/<!--[\s\S]*?-->/g, '')
  if (rel.endsWith('.js') || rel.endsWith('.jsx')) {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  }
  return src.replace(/^\s*#.*$/gm, '')
}

const findings = []
for (const rel of SURFACES) {
  if (GENERATED.has(rel)) continue
  const abs = join(ROOT, rel)
  if (!existsSync(abs)) continue
  const src = stripComments(readFileSync(abs, 'utf8'), rel)
  const lines = src.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const lit of LITERALS) {
      if (!line.includes(lit)) continue
      findings.push(`${rel}:${i + 1}: identity literal "${lit}" - source it from site.config.js or generate it in lib/sync.mjs`)
    }
  }
}

// Filenames are identity too. A brand name in a PATH is invisible to a content
// scan, and it is exactly the literal a rebrand would miss: the art master
// shipped as `flowforge-logo.jpg` and had to be renamed by hand (Phase 1), then
// a stray copy at the public root resurfaced through a merge. Walk the shipped
// surfaces (web/ + docs/) and refuse any path carrying a literal. Build
// products are skipped: they are regenerated, not source (and a stale `dist/`
// from a local build must not fail the gate).
const PATH_SKIP_DIRS = new Set(['node_modules', 'dist', '.prestruct', '_site', '.bundle', 'vendor', '.jekyll-cache'])
const pathFindings = []
const walkPaths = (dir, rel) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) {
      if (PATH_SKIP_DIRS.has(e.name)) continue
      walkPaths(join(dir, e.name), r); continue
    }
    for (const lit of LITERALS) {
      if (r.includes(lit)) pathFindings.push(`${r}: path carries identity literal "${lit}" - rename it (a brand name in a filename is invisible to a content scan)`)
    }
  }
}
for (const d of ['web', 'docs']) {
  const abs = join(ROOT, d)
  if (existsSync(abs)) walkPaths(abs, d)
}
findings.push(...pathFindings)

if (findings.length) {
  console.error('BRAND-CENSUS: FAIL')
  for (const f of findings) console.error('  ' + f)
  process.exit(1)
}
console.log(`BRAND-CENSUS: PASS (${LITERALS.length} literal(s) - ${LITERALS.join(', ')} - confined to site.config.js across ${SURFACES.length} structural surface(s))`)
