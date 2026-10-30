#!/usr/bin/env node
/**
 * templates.mjs - the template registry and the CHAIN resolver.
 *
 * A template is a named profile of the site rig. Profiles CHAIN the way vant
 * chains skills (docs/essential/extensibility.md): a profile's TEMPLATE.md
 * frontmatter carries a `chain:` list of child profiles, and the parent
 * COMPOSES them rather than duplicating their files. `coreforge` chains
 * `coreforge-headless`, so the CI battery (`.github/`) lives ONCE in the
 * headless profile and the full shell inherits it - one copy, no drift between
 * the two shapes.
 *
 * Resolution mirrors vant's override rule: children first (depth-first, in
 * `chain` order), then the parent's own files on top, so a parent file of the
 * same path WINS. A cycle is refused, named.
 *
 *   node lib/templates.mjs --list          the profiles + their chains
 *   node lib/templates.mjs --resolve NAME   print the resolved file set
 *
 * The registry below is the source of truth for `lib/template.mjs` (which
 * GENERATES templates/<name>/) and for `coreforge create` (which STAMPS a
 * resolved profile into an adopter's tree). It is the only place a profile is
 * declared; adding one is one entry here.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import yaml from 'js-yaml'
import { resolveRoot } from './root.mjs'

const ROOT = resolveRoot()

// The profiles. `from` names the dogfood dirs/files the generator copies;
// `scaffold` names hand-authored root files (adopter-shaped package.json,
// .gitignore, the Pages canary) merged in verbatim (tokenized). `chain` names
// child profiles composed underneath this one.
export const TEMPLATES = {
  // The full site shell: the two sites + the identity file, chaining the CI
  // battery. A stamped repo gets landing + docs + workflows from one call.
  coreforge: {
    description: 'The full site shell - landing + docs + identity file, chaining the CI battery.',
    chain: ['coreforge-headless'],
    from: { dirs: ['web', 'docs'], files: ['site.config.js'] },
  },
  // CI only: the `.github/` battery (test / the reusable docs lane + caller /
  // release), no sites. A repo that brings its own landing/docs still inherits
  // the gates, the reusable docs lane, and the release ladder.
  'coreforge-headless': {
    description: 'CI only - the .github/ battery (test, reusable docs lane, release), no sites.',
    chain: [],
    from: { dirs: ['.github'], files: [] },
  },
}

// Parse a TEMPLATE.md manifest (vant SKILL.md shape: YAML frontmatter, then a
// human body). Returns { name, description, chain } or null when absent.
export function parseManifest(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  const fm = yaml.load(m[1]) || {}
  return {
    name: fm.name,
    description: fm.description,
    chain: Array.isArray(fm.chain) ? fm.chain : [],
  }
}

// Resolve a profile's chain depth-first: children first (in order), then the
// profile itself. Parent overrides child on a path collision, which falls out
// of applying children before parents. A cycle or an unknown child refuses.
export function resolveChain(name, seen = []) {
  if (seen.includes(name)) {
    throw new Error(`template chain cycle: ${[...seen, name].join(' -> ')}`)
  }
  const cfg = TEMPLATES[name]
  if (!cfg) throw new Error(`unknown template profile "${name}" (known: ${Object.keys(TEMPLATES).join(', ')})`)
  const order = []
  for (const child of cfg.chain) order.push(...resolveChain(child, [...seen, name]))
  order.push(name)
  return order
}

// Load a generated profile's file map (rel -> Buffer) by walking templates/<name>/.
// TEMPLATE.md is rig metadata, not payload, so it is skipped.
export function loadProfile(name) {
  const dir = join(ROOT, 'templates', name)
  if (!existsSync(dir)) throw new Error(`template "${name}" is not generated - run \`npm run template\``)
  const files = new Map()
  const walk = (d, rel) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) { walk(join(d, e.name), r); continue }
      if (r === 'TEMPLATE.md') continue
      files.set(r, readFileSync(join(d, e.name)))
    }
  }
  walk(dir, '')
  return files
}

// Resolve a profile into the file set `create` stamps: children first, then the
// parent, parent wins on collision (vant's override rule).
export function resolveTemplate(name) {
  const merged = new Map()
  for (const profile of resolveChain(name)) {
    for (const [rel, buf] of loadProfile(profile)) merged.set(rel, buf)
  }
  return merged
}

// CLI: --list / --resolve NAME, for eyeballing and for the tests.
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const argv = process.argv.slice(2)
  if (argv.includes('--list')) {
    for (const [name, cfg] of Object.entries(TEMPLATES)) {
      console.log(`${name}: ${cfg.description}`)
      if (cfg.chain.length) console.log(`  chain: ${cfg.chain.join(', ')}`)
    }
    process.exit(0)
  }
  const i = argv.indexOf('--resolve')
  if (i !== -1) {
    const name = argv[i + 1]
    const files = resolveTemplate(name)
    for (const rel of [...files.keys()].sort()) console.log(rel)
    console.log(`# ${files.size} file(s) from ${resolveChain(name).join(' + ')}`)
    process.exit(0)
  }
  console.log('usage: node lib/templates.mjs --list | --resolve <name>')
  process.exit(2)
}
