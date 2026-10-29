#!/usr/bin/env node
/**
 * template.mjs - build templates/site/ from the live dogfood tree.
 *
 * The dogfood (web/ + docs/ + site.config.js) stays in place (PRD 7/9, owner
 * call 2026-10-29). templates/site/ is the COPY SOURCE `flowforge create` will
 * stamp: the same shell, with the identity swapped for monoforge-convention
 * tokens (__NAME__, __SITE_URL__, ...). It is GENERATED, not hand-kept, for
 * the same reason the dogfood stays put: a hand-maintained duplicate drifts,
 * and the whole point of Option 1 was low churn. One generator, one guard.
 *
 *   node lib/template.mjs           write templates/site/
 *   node lib/template.mjs --check   refuse if it has drifted from the tree
 *
 * Deterministic: same tree -> same bytes, no wall clock. The tool half (lib/)
 * is NOT copied - it travels to an adopter by npm install, not by copy. Only
 * the site half (the shell) is templated.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { resolveRoot } from './root.mjs'

const ROOT = resolveRoot()
const OUT = join(ROOT, 'templates', 'site')
const site = (await import(pathToFileURL(join(ROOT, 'site.config.js')).href)).default

// The copyable shell: the two sites + the identity file. (Root package.json,
// the workflows, and the tool docs are Phase 2 - `create` wires them once the
// CLI exists, so they are deliberately NOT templated yet.)
const INCLUDE_DIRS = ['web', 'docs']
const INCLUDE_FILES = ['site.config.js']

// Never copied: deps, build products, locks, and the sync-owned outputs (the
// adopter regenerates those with `flowforge sync` - they are DERIVED, not
// source, and the brand census gate already allows them only as generated).
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.prestruct', '_site', '.bundle', 'vendor', '.jekyll-cache'])
const EXCLUDE_FILES = new Set(['package-lock.json', 'Gemfile.lock', '.gitignore'])
const SYNC_OWNED = new Set([
  'docs/_config.yml',
  'docs/freestruct.config.yml',
  'web/public/robots.txt',
  'web/public/site.webmanifest',
])

// Identity -> token. Longest/most-specific first so a full URL is not clipped
// by the bare name. Curated, not derived from the census set: the census also
// treats github.com as a domain fragment (harmless for a hardcode scan, wrong
// to tokenize - it would mangle every repo URL).
const TOKENS = [
  [site.docs.url, '__DOCS_URL__'],
  [site.url, '__SITE_URL__'],
  [site.repo, '__REPO_URL__'],
  [site.docs.host, '__DOCS_HOST__'],
  [site.org.url, '__ORG_URL__'],
  [site.maker.label, '__MAKER_LABEL__'],
  [site.org.name, '__ORG_NAME__'],
  [site.docs.baseurl, '__DOCS_BASEURL__'],
  [`${site.name}-site`, '__NAME__-site'],
  [site.name, '__NAME__'],
  [site.author, '__AUTHOR__'],
].filter(([from]) => from)

const tokenize = (text) => {
  let out = text
  for (const [from, to] of TOKENS) out = out.split(from).join(to)
  return out
}

function walk(dir, rel, acc) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue
      walk(join(dir, e.name), r, acc)
    } else if (!EXCLUDE_FILES.has(e.name)) {
      if (!SYNC_OWNED.has(r)) acc.push(r)
    }
  }
}

// Build the file map (rel -> tokenized bytes). Binary files are copied byte-
// for-by-byte (no identity lives in a PNG).
function build() {
  const rels = [...INCLUDE_FILES]
  for (const d of INCLUDE_DIRS) walk(join(ROOT, d), d, rels)
  rels.sort()
  const files = new Map()
  const residue = []
  for (const rel of rels) {
    const buf = readFileSync(join(ROOT, rel))
    const isText = !/\.(png|jpe?g|ico|woff2?|ttf|otf|gif|webp|avif|pdf)$/i.test(rel)
    if (!isText) { files.set(rel, buf); continue }
    const out = tokenize(buf.toString('utf8'))
    // Self-guard: a surviving identity literal means the token map missed a
    // form (e.g. a new spelling), and shipping it would leak the dogfood's
    // brand into every stamped site. Fail at cause, named.
    for (const lit of [site.name, site.author, ...TOKENS.map(([f]) => f)]) {
      if (lit && out.includes(lit)) residue.push(`${rel}: identity literal "${lit}" survived tokenization`)
    }
    files.set(rel, Buffer.from(out, 'utf8'))
  }
  if (residue.length) {
    console.error('template: FAIL (identity residue - add the missing token to TOKENS)')
    for (const r of residue) console.error('  ' + r)
    process.exit(1)
  }
  return files
}

const check = process.argv.includes('--check')
const files = build()
let drifted = 0

if (!check) {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
}

for (const [rel, buf] of files) {
  const abs = join(OUT, rel)
  const prev = existsSync(abs) ? readFileSync(abs) : null
  if (prev && prev.equals(buf)) continue
  if (check) {
    console.error(`template: templates/site/${rel} has DRIFTED from the tree - run \`npm run template\``)
    drifted++
  } else {
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, buf)
  }
}

// A stale extra file (one the tree no longer has) is drift too.
if (check) {
  const want = new Set(files.keys())
  const have = []
  if (existsSync(OUT)) walk(OUT, '', have)
  for (const rel of have) {
    if (!want.has(rel)) {
      console.error(`template: templates/site/${rel} is stale (not in the tree) - run \`npm run template\``)
      drifted++
    }
  }
}

if (check && drifted) {
  console.error(`template:check: FAIL (${drifted} drifted file(s))`)
  process.exit(1)
}
console.log(check
  ? `template:check: PASS (${files.size} file(s) current)`
  : `template: PASS (wrote ${files.size} file(s) to templates/site/)`)
