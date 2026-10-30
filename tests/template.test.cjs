'use strict'

// Behavior tests for lib/template.mjs - the copy source `flowforge create`
// stamps (Phase 1 of labs/prd-flowforge.md).
//
// The template is GENERATED from the live dogfood tree, so the two contracts
// are: it is current (no drift), and it carries no identity literal of the
// dogfood's brand (the token pass cannot leak). Both run against the real
// generator - no mocks.

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { pathToFileURL } = require('node:url')

const ROOT = path.join(__dirname, '..')
const TEMPLATE = path.join(ROOT, 'lib', 'template.mjs')
const OUT = path.join(ROOT, 'templates', 'coreforge')
const HEADLESS = path.join(ROOT, 'templates', 'coreforge-headless')

function run(args = []) {
  try {
    const out = execFileSync('node', [TEMPLATE, ...args], { encoding: 'utf8' })
    return { code: 0, out }
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }
  }
}

test('template:check passes on the live tree (templates/ is current)', () => {
  const r = run(['--check'])
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /template:check: PASS/)
})

test('the full profile ships the shell (web + docs + the identity file)', () => {
  for (const rel of ['site.config.js', 'web/package.json', 'web/index.html', 'docs/_layouts/default.html']) {
    assert.ok(fs.existsSync(path.join(OUT, rel)), `templates/coreforge/${rel} must exist`)
  }
})

test('the headless profile ships the CI battery and nothing else', () => {
  for (const rel of ['.github/workflows/test.yml', '.github/workflows/docs-build.yml', '.github/workflows/docs-deploy.yml', '.github/workflows/release.yml']) {
    assert.ok(fs.existsSync(path.join(HEADLESS, rel)), `templates/coreforge-headless/${rel} must exist`)
  }
  assert.ok(!fs.existsSync(path.join(HEADLESS, 'web')), 'the headless profile carries no web/')
  assert.ok(!fs.existsSync(path.join(HEADLESS, 'docs')), 'the headless profile carries no docs/')
})

test('the profiles chain: coreforge composes coreforge-headless (vant chain shape)', async () => {
  const { resolveChain, resolveTemplate, TEMPLATES } = await import(pathToFileURL(path.join(ROOT, 'lib', 'templates.mjs')).href)
  assert.deepEqual(resolveChain('coreforge'), ['coreforge-headless', 'coreforge'])
  assert.deepEqual(resolveChain('coreforge-headless'), ['coreforge-headless'])
  // The resolved set is the union: the shell files AND the workflows.
  const files = resolveTemplate('coreforge')
  assert.ok(files.has('site.config.js'), 'resolved coreforge carries site.config.js')
  assert.ok(files.has('.github/workflows/test.yml'), 'resolved coreforge inherits the CI battery from the child')
  // A cycle is refused, named.
  TEMPLATES['coreforge-headless'].chain = ['coreforge']
  assert.throws(() => resolveChain('coreforge'), /cycle/, 'a chain cycle must refuse')
  TEMPLATES['coreforge-headless'].chain = []
})

test('the template carries no identity literal of the dogfood brand (only tokens)', async () => {
  const site = (await import(pathToFileURL(path.join(ROOT, 'site.config.js')).href)).default
  const literals = [site.name, site.author, site.docs.url, site.url]
  const hits = []
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) { walk(p); continue }
      if (/\.(png|jpe?g|ico|woff2?|ttf|otf|gif|webp|avif|pdf)$/i.test(e.name)) continue
      const text = fs.readFileSync(p, 'utf8')
      for (const lit of literals) if (lit && text.includes(lit)) hits.push(`${path.relative(ROOT, p)}: "${lit}"`)
    }
  }
  walk(OUT)
  walk(HEADLESS)
  assert.deepEqual(hits, [], `template carries dogfood identity:\n${hits.join('\n')}`)
})

test('the template carries the token vocabulary (so `create` has something to stamp)', () => {
  const text = fs.readFileSync(path.join(OUT, 'site.config.js'), 'utf8')
  assert.match(text, /__NAME__/, 'site.config.js must carry __NAME__')
})

test('template is deterministic: a rebuild leaves the bytes identical', () => {
  const before = {}
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) { walk(p); continue }
      before[path.relative(ROOT, p)] = fs.readFileSync(p).toString('base64')
    }
  }
  walk(OUT)
  walk(HEADLESS)
  const r = run()
  assert.equal(r.code, 0, r.out)
  for (const [rel, b64] of Object.entries(before)) {
    assert.equal(fs.readFileSync(path.join(ROOT, rel)).toString('base64'), b64, `${rel} changed on rebuild`)
  }
})
