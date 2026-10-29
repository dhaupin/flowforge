'use strict'

// Brand-contract behavior tests (Phase 0 of labs/prd-flowforge.md).
//
// The contract has two halves and both are exercised here for real (no mocks,
// no network): `flowforge sync` fans site.config.js out to the surfaces that
// cannot import it, and the brand census gate refuses an identity literal that
// lives anywhere else. A temp tree is built per case so a planted violation is
// proven to fail without touching the live repo.

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const yaml = require('js-yaml')

const REPO = path.join(__dirname, '..')
const SYNC = path.join(REPO, 'scripts', 'flowforge-sync.mjs')
const CENSUS = path.join(REPO, 'scripts', 'check-brand-census.mjs')

// `cwd` defaults to the repo; pass a temp dir to run the temp copies of the
// scripts (which resolve their ROOT relative to their own location).
function run(script, args = [], cwd = REPO) {
  try {
    const out = execFileSync('node', [script, ...args], { cwd, encoding: 'utf8' })
    return { code: 0, out }
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }
  }
}
const tempScript = (dir, name) => path.join(dir, 'scripts', name)

// A minimal temp tree the census/sync scripts can run against. The scripts
// resolve site.config.js and their SURFACES relative to the SCRIPT's location,
// so a temp tree must carry a copy of the scripts + config + the surface it
// probes. That mirrors how an adopter's repo is shaped.
function tempTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flowforge-brand-'))
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true })
  fs.copyFileSync(path.join(REPO, 'site.config.js'), path.join(dir, 'site.config.js'))
  for (const s of ['flowforge-sync.mjs', 'check-brand-census.mjs']) {
    fs.copyFileSync(path.join(REPO, 'scripts', s), path.join(dir, 'scripts', s))
  }
  fs.mkdirSync(path.join(dir, 'web', 'public'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true })
  // sync imports js-yaml; the temp tree resolves deps the way an install would.
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return dir
}

test('sync:check passes on the live tree (derived surfaces are current)', () => {
  const r = run(SYNC, ['--check'])
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /sync:check: PASS/)
})

test('brand census passes on the live tree', () => {
  const r = run(CENSUS)
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /BRAND-CENSUS: PASS/)
})

test('sync is deterministic: two runs produce identical bytes', () => {
  const dir = tempTree()
  run(tempScript(dir, 'flowforge-sync.mjs'), [], dir)
  const first = fs.readFileSync(path.join(dir, 'web', 'public', 'robots.txt'), 'utf8')
  run(tempScript(dir, 'flowforge-sync.mjs'), [], dir)
  const second = fs.readFileSync(path.join(dir, 'web', 'public', 'robots.txt'), 'utf8')
  assert.equal(first, second, 'sync wrote different bytes on the second run')
  fs.rmSync(dir, { recursive: true, force: true })
})

test('sync:check FAILS when a generated surface has drifted', () => {
  const dir = tempTree()
  run(tempScript(dir, 'flowforge-sync.mjs'), [], dir)
  const p = path.join(dir, 'web', 'public', 'robots.txt')
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace('Sitemap:', 'Sitemap: # hand-edited\nSitemap:'))
  const r = run(tempScript(dir, 'flowforge-sync.mjs'), ['--check'], dir)
  assert.equal(r.code, 1, 'a hand-edited generated file must fail sync:check')
  assert.match(r.out, /DRIFTED/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('brand census FAILS on a planted identity literal in a structural surface', () => {
  const dir = tempTree()
  // index.html is a scanned surface; plant the site name as a shipped value.
  fs.writeFileSync(path.join(dir, 'web', 'index.html'), '<title>flowforge</title>\n')
  const r = run(tempScript(dir, 'check-brand-census.mjs'), [], dir)
  assert.equal(r.code, 1, 'a hardcoded identity literal must fail the census')
  assert.match(r.out, /web\/index\.html:1/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('brand census IGNORES identity names inside comments (prose about the brand is not a hardcode)', () => {
  const dir = tempTree()
  fs.writeFileSync(path.join(dir, 'web', 'index.html'), '<!-- flowforge receipt note -->\n<title>neutral</title>\n')
  const r = run(tempScript(dir, 'check-brand-census.mjs'), [], dir)
  assert.equal(r.code, 0, r.out)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('ssr.config.js is a pure adapter: it has no identity literals of its own', () => {
  const src = fs.readFileSync(path.join(REPO, 'web', 'ssr.config.js'), 'utf8')
  assert.match(src, /import site from '\.\.\/site\.config\.js'/, 'ssr.config.js must import the one source')
  // The adapter body may only reference site.*, never a literal.
  const body = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  assert.doesNotMatch(body, /https?:\/\//, 'ssr.config.js carries a URL literal - it must derive every value from site.config.js')
})

test('the one identity source is site.config.js (not a product-named config)', () => {
  assert.ok(fs.existsSync(path.join(REPO, 'site.config.js')), 'site.config.js must exist at the repo root')
  assert.ok(!fs.existsSync(path.join(REPO, 'flowforge.config.js')), 'a product-named config must not exist (PRD 5.1)')
})

test('every generated YAML surface parses (a colon in a value cannot break the docs lane)', () => {
  // The regression this guards: site.config.js description contains
  // "from: landing" - unquoted that reads as a nested mapping and Jekyll
  // refuses the WHOLE config. sync must emit a YAML-safe scalar.
  for (const rel of ['docs/_config.yml', 'docs/freestruct.config.yml']) {
    const src = fs.readFileSync(path.join(REPO, rel), 'utf8')
    assert.doesNotThrow(() => yaml.load(src), `${rel} must parse as YAML`)
  }
})

test('sync quotes a value containing colon+space (the YAML-nesting trap)', () => {
  const dir = tempTree()
  let cfg = fs.readFileSync(path.join(dir, 'site.config.js'), 'utf8')
  cfg = cfg.replace("name: 'flowforge',", "name: 'flow: forge',")
  fs.writeFileSync(path.join(dir, 'site.config.js'), cfg)
  const r = run(tempScript(dir, 'flowforge-sync.mjs'), [], dir)
  assert.equal(r.code, 0, r.out)
  const doc = yaml.load(fs.readFileSync(path.join(dir, 'docs', '_config.yml'), 'utf8'))
  assert.equal(doc.title, 'flow: forge', 'a colon+space value must round-trip through the generated YAML')
  fs.rmSync(dir, { recursive: true, force: true })
})
