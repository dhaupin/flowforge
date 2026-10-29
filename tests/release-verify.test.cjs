'use strict'

// The release-verify leg, run OFFLINE on every push (the standing receipt
// eyestruct carries: dhaupin/eyestruct@4e2b552 tests/release-verify.test.js).
// It exercises the SAME script the release ladder's verify job runs on the
// served tarball, so the contents assertions are proven every push instead
// of living only on release days (the walk-exit rule: the probe is
// permanent).
//
// Case 1 (positive): npm pack of THIS tree -> the pack ladder -> PASS. The
//   consumer-install half needs the registry; when offline the script
//   prints a NAMED skip - the leg asserts "no silent skip", not "always
//   network".
// Case 2 (negative, fully offline): a doctored tarball carrying a file
//   under a family-forbidden prefix is refused BY NAME, before any install.

const test = require('node:test')
const assert = require('node:assert')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const root = path.join(__dirname, '..')
const script = path.join(root, 'lib', 'verify-release.cjs')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

// This shell ships the whole rig on purpose (web/, docs/, tests/, labs/,
// packs/, .github/ - the copy source an adopter diffs), so those prefixes
// are permitted by name. The family defaults still refuse source maps,
// .env*, and node_modules.
const allow = 'web/,docs/,tests/,labs/,packs/,templates/,.github/'

test('the pack ladder verifies real npm pack output (contents + identity + consumer install)', () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-release-verify-'))
  const pack = spawnSync('npm', ['pack', '--pack-destination', work], { cwd: root, encoding: 'utf8', timeout: 120000 })
  assert.equal(pack.status, 0, `npm pack failed: ${pack.stderr}`)
  const tgz = path.join(work, `flowforge-${pkg.version}.tgz`)
  assert.ok(fs.existsSync(tgz), `npm pack produced nothing at ${tgz}`)
  const r = spawnSync('node', [script, '--pack', tgz, '--version', pkg.version, '--allow', allow], { cwd: root, encoding: 'utf8', timeout: 300000 })
  const out = `${r.stdout}\n${r.stderr}`
  assert.equal(r.status, 0, `pack ladder failed (${r.status}):\n${out}`)
  assert.ok(out.includes('PASS forbidden scan'), 'forbidden scan never ran')
  assert.ok(out.includes('PASS served set == npm pack of this tree'), 'expected-set equality never asserted')
  assert.ok(out.includes('PASS identity: flowforge@'), 'identity line missing')
  // This shell declares no main/exports/bin, so the default load probe is a
  // NAMED skip; either a real consumer PASS or that named SKIP is fine, a
  // silent absence is not.
  if (!out.includes('PASS consumer probes')) {
    assert.ok(out.includes('SKIP consumer load probe') || out.includes('SKIP consumer install'), `no PASS and no named SKIP for the consumer probe:\n${out}`)
  }
  fs.rmSync(work, { recursive: true, force: true })
})

test('a doctored tarball is refused BY NAME before any install', () => {
  const toy = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-verify-smuggle-'))
  fs.writeFileSync(path.join(toy, 'package.json'), JSON.stringify({ name: 'flowforge', version: pkg.version, files: ['package.json'] }, null, 2))
  const pack = spawnSync('npm', ['pack', '--pack-destination', toy], { cwd: toy, encoding: 'utf8', timeout: 120000 })
  assert.equal(pack.status, 0, `toy npm pack failed: ${pack.stderr}`)
  const ex = path.join(toy, 'extracted')
  fs.mkdirSync(ex, { recursive: true })
  assert.equal(spawnSync('tar', ['-xzf', path.join(toy, `flowforge-${pkg.version}.tgz`), '-C', ex], { encoding: 'utf8' }).status, 0)
  fs.mkdirSync(path.join(ex, 'package', 'models'), { recursive: true })
  fs.writeFileSync(path.join(ex, 'package', 'models', 'smuggled.bin'), 'must never ship\n')
  const doctored = path.join(toy, 'doctored.tgz')
  assert.equal(spawnSync('tar', ['-czf', doctored, '-C', path.join(ex, 'package'), '.'], { encoding: 'utf8' }).status, 0)
  const rv = spawnSync('node', [script, '--pack', doctored, '--version', pkg.version], { cwd: toy, encoding: 'utf8', timeout: 300000 })
  const out = `${rv.stdout}\n${rv.stderr}`
  assert.equal(rv.status, 1, `the smuggle was not refused (${rv.status}):\n${out}`)
  assert.ok(out.includes('models/smuggled.bin'), `the refusal does not name the smuggle:\n${out}`)
  fs.rmSync(toy, { recursive: true, force: true })
})
