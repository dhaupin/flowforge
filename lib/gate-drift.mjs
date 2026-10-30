#!/usr/bin/env node
/**
 * gate-drift.mjs - does an adopter's vendored gate copy still match the rig?
 *
 * The rig (`lib/`) is versioned once and reaches a LIBRARY adopter by
 * `npm install` - no copy, no drift. But a SITE adopter (a repo stamped from
 * `templates/coreforge/`) VENDORS the gates into its own `scripts/` at stamp
 * time, because a zero-install tree cannot import the rig at runtime. A
 * vendored copy drifts the moment the rig moves, and nothing in the adopter
 * can tell: `npm run lint:docs` is green on the OLD gate.
 *
 * This verb answers "has the rig moved under us?" mechanically. It normalizes
 * the two transforms every vendored copy carries BY DESIGN - the path flatten
 * (`lib/gates/x.cjs` requires `../root.cjs`; a flattened `scripts/x.cjs`
 * requires `./root.cjs`) and the identity substitution (`flowforge` -> the
 * adopter's name, per the template tokens) - then diffs what is LEFT. Anything
 * left is REAL logic drift: a rule the rig gained or changed that the adopter
 * does not have.
 *
 *   node lib/gate-drift.mjs --adopter /path/to/adopter
 *   node lib/gate-drift.mjs --adopter /path/to/adopter --json
 *
 * Exit 0 = no real drift (every vendored gate is the rig's, modulo the two
 * mechanical transforms). Exit 1 = real drift, named file by file. Exit 2 =
 * usage (no --adopter, or the adopter has no scripts/ to compare).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { resolveRoot } from './root.mjs'

const ROOT = resolveRoot()

// The rig's gate surface: lib/gates/* plus the lib/ helpers a flattened copy
// vendors alongside them. A gate the rig ships but the adopter does not have
// is the loudest drift of all (a whole rule missing).
const GATE_DIR = join(ROOT, 'lib', 'gates')
const LIB_HELPERS = ['root.cjs', 'root.mjs', 'sync.mjs']

function rigGates() {
  const gates = readdirSync(GATE_DIR).filter((f) => f.endsWith('.cjs') || f.endsWith('.mjs'))
  return [...gates.map((f) => join('lib', 'gates', f)), ...LIB_HELPERS.map((f) => join('lib', f))]
}

// The adopter's identity, from its site.config.js, so we can tokenize it away
// before the diff. Falls back to the repo dir name when the config is absent.
async function adopterIdentity(dir) {
  const cfg = join(dir, 'site.config.js')
  const literals = new Set()
  if (existsSync(cfg)) {
    try {
      const site = (await import(pathToFileURL(cfg).href)).default
      for (const v of [site.name, site.author, site.url, site.repo, site.docs?.url, site.docs?.host, site.docs?.baseurl, site.org?.name, site.org?.url, site.maker?.label]) {
        if (v) literals.add(String(v))
      }
      if (site.name) literals.add(`${site.name}-site`)
    } catch { /* a config that will not import is the adopter's problem, not ours */ }
  }
  literals.add(basename(dir))
  return [...literals].filter(Boolean).sort((a, b) => b.length - a.length)
}

// Normalize a gate source so only REAL logic differences survive:
//   1. path flatten - the rig's `lib/gates/x.cjs` requires `../root.cjs`; a
//      flattened `scripts/x.cjs` requires `./root.cjs`. And any `lib/gates/`
//      or `lib/` path prefix in a comment becomes the adopter's `scripts/`.
//   2. identity - both repos' literals collapse to one token
//   3. local verb / self-name - `flowforge-sync.mjs` is `sync.mjs`; `flowforge`
//      is the adopter's name; `flowforge#5` and `coreforge#5` are both `#5`
//   4. the sync banner, which names the local verb (`flowforge sync` / `sync`)
// Comments and code are both normalized: a rule lives in code, but a stale
// receipt in a comment is how a reader is misled, so it counts as drift too.
function normalize(text, rigLiterals, adopterLiterals) {
  let out = text
  out = out.replace(/\.\.\/(root\.(?:cjs|mjs))/g, './$1')
  for (const lit of [...rigLiterals, ...adopterLiterals]) {
    out = out.split(lit).join('__ID__')
  }
  // The local verb name in the sync banner, receipts, and the file's own name.
  out = out.replace(/\b(?:flowforge|coreforge|govstruct|eyestruct|packstruct|poststruct|prestruct|monoforge|crashtest)(?:-sync)?\b/g, '__ID__')
  out = out.replace(/\b__ID__\.mjs\b/g, 'sync.mjs')
  out = out.replace(/__ID__-sync/g, 'sync')
  // The tool-dir path prefix: `lib/gates/` (rig) and `scripts/` (adopter) are
  // the same location after the flatten.
  out = out.replace(/\b(?:lib\/gates|lib|scripts)\//g, 'PATH/')
  return out
}

function readIf(p) {
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}

// Strip comments so the rule comparison ignores prose. A gate's RULE lives in
// its code; a comment can differ harmlessly (an adopter's own receipts). The
// `//` strip is guarded so a URL (`https://`) is never mistaken for a comment.
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*(\/\/|\*).*$/gm, '')
    .replace(/^([^"'`\n]*?[^:"'` \t])\/\/.*$/gm, '$1')
}

async function main() {
  const argv = process.argv.slice(2)
  const i = argv.indexOf('--adopter')
  if (i === -1 || !argv[i + 1]) {
    console.error('usage: node lib/gate-drift.mjs --adopter <dir> [--json]')
    process.exit(2)
  }
  const adopter = argv[i + 1]
  const scriptsDir = join(adopter, 'scripts')
  if (!existsSync(scriptsDir)) {
    console.error(`gate-drift: ${adopter} has no scripts/ - not a stamped site adopter`)
    process.exit(2)
  }
  const json = argv.includes('--json')

  const rigSite = (await import(pathToFileURL(join(ROOT, 'site.config.js')).href)).default
  const rigLiterals = [rigSite.name, rigSite.author, rigSite.url, rigSite.repo, rigSite.docs?.url, rigSite.docs?.host, `${rigSite.name}-site`].filter(Boolean).sort((a, b) => b.length - a.length)
  const adopterLiterals = await adopterIdentity(adopter)

  const rows = []
  for (const rel of rigGates()) {
    const rigPath = join(ROOT, rel)
    const rigSrc = readIf(rigPath)
    if (rigSrc === null) continue
    const name = basename(rel)
    const adopterPath = join(scriptsDir, name)
    const adopterSrc = readIf(adopterPath)
    if (adopterSrc === null) {
      rows.push({ gate: name, status: 'missing', detail: 'the rig ships this gate; the adopter does not have it' })
      continue
    }
    const rigCode = normalize(stripComments(rigSrc), rigLiterals, adopterLiterals)
    const adopterCode = normalize(stripComments(adopterSrc), rigLiterals, adopterLiterals)
    if (rigCode !== adopterCode) {
      rows.push({ gate: name, status: 'drift', detail: 'REAL logic drift - the rig moved and this copy did not' })
    } else if (normalize(rigSrc, rigLiterals, adopterLiterals) !== normalize(adopterSrc, rigLiterals, adopterLiterals)) {
      rows.push({ gate: name, status: 'receipts', detail: 'rules match; only comment/receipt prose differs (harmless)' })
    } else {
      rows.push({ gate: name, status: 'current', detail: 'matches the rig (modulo path + identity)' })
    }
  }

  const drift = rows.filter((r) => r.status === 'drift' || r.status === 'missing')
  if (json) {
    console.log(JSON.stringify({ adopter, rows, drift: drift.length }, null, 2))
  } else {
    for (const r of rows) {
      const mark = r.status === 'current' ? 'ok  ' : r.status === 'receipts' ? 'note' : r.status === 'missing' ? 'MISS' : 'DRIFT'
      console.log(`${mark} ${r.gate}${r.status === 'current' ? '' : ' - ' + r.detail}`)
    }
    console.log(drift.length
      ? `gate-drift: FAIL (${drift.length} gate(s) behind the rig - re-pull from lib/gates/ with receipts)`
      : `gate-drift: PASS (${rows.length} gate(s) carry the rig's rules)`)
  }
  process.exit(drift.length ? 1 : 0)
}

main()
