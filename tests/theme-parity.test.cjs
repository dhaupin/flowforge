'use strict'
/**
 * Behavior tests for lib/gates/check-theme-parity.cjs (issue #20).
 *
 * The gate reads the repo's real scheme surfaces, so these tests exercise it
 * against the live tree (green) and against synthetic fixtures built in a
 * temp dir (the failure classes it must catch). The gate resolves paths from
 * its own location, so the fixture runs copy the script into the temp tree.
 */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const ROOT = path.resolve(__dirname, '..')
const GATE = path.join(ROOT, 'lib', 'gates', 'check-theme-parity.cjs')

// Run the gate FROM THE FIXTURE TREE (it resolves paths from its own location),
// so fixtures must copy the script in - the live-tree test runs the real one.
function runGate(scriptPath) {
  try {
    const out = execFileSync('node', [scriptPath], { encoding: 'utf-8' })
    return { code: 0, out }
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') }
  }
}

// Build a minimal fixture tree: theme.js + the two surfaces, overridable.
function fixture({ schemes, styles, docs }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-parity-'))
  fs.mkdirSync(path.join(dir, 'web', 'src'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'docs', '_layouts'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'lib', 'gates'), { recursive: true })
  fs.copyFileSync(path.join(ROOT, 'lib', 'root.cjs'), path.join(dir, 'lib', 'root.cjs'))
  fs.copyFileSync(GATE, path.join(dir, 'lib', 'gates', 'check-theme-parity.cjs'))
  fs.writeFileSync(path.join(dir, 'web', 'src', 'theme.js'),
    `export const SCHEMES = [${schemes.map((s) => `'${s}'`).join(', ')}]\n`)
  fs.writeFileSync(path.join(dir, 'web', 'src', 'styles.css'), styles)
  fs.writeFileSync(path.join(dir, 'docs', '_layouts', 'default.html'), docs)
  return path.join(dir, 'lib', 'gates', 'check-theme-parity.cjs')
}

const DARK = (n) => `html[data-scheme="${n}"] { --accent: #111; --accent-deep: #222; }`
const LIGHT = (n) => `html[data-scheme="${n}"][data-theme="light"] { --accent: #333; --accent-deep: #444; }`
const GOOD = (n) => `${DARK(n)}\n${LIGHT(n)}\n`

test('passes on the live repo tree', () => {
  const r = runGate(GATE)
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /THEME-PARITY: PASS/)
})

test('passes when every scheme has both halves in both surfaces', () => {
  const gate = fixture({ schemes: ['petrol', 'jade'], styles: GOOD('jade'), docs: GOOD('jade') })
  const r = runGate(gate)
  assert.equal(r.code, 0, r.out)
})

test('fails when a scheme is missing from one surface', () => {
  const gate = fixture({ schemes: ['petrol', 'jade'], styles: GOOD('jade'), docs: '' })
  const r = runGate(gate)
  assert.equal(r.code, 1)
  assert.match(r.out, /jade.*no \[data-scheme="jade"\] block/)
})

test('fails when the light half is missing (the missing-accent bug)', () => {
  const gate = fixture({ schemes: ['petrol', 'jade'], styles: DARK('jade'), docs: DARK('jade') })
  const r = runGate(gate)
  assert.equal(r.code, 1)
  assert.match(r.out, /jade.*no \[data-scheme="jade"\]\[data-theme="light"\] half/)
})

test('fails when a half omits --accent-deep', () => {
  const noDeep = `html[data-scheme="jade"] { --accent: #111; }\n${LIGHT('jade')}`
  const gate = fixture({ schemes: ['petrol', 'jade'], styles: noDeep, docs: noDeep })
  const r = runGate(gate)
  assert.equal(r.code, 1)
  assert.match(r.out, /jade.*dark half does not set --accent-deep/)
})

test('fails on an orphan scheme block the picker does not offer', () => {
  const gate = fixture({ schemes: ['petrol', 'jade'], styles: GOOD('jade') + DARK('bogus'), docs: GOOD('jade') })
  const r = runGate(gate)
  assert.equal(r.code, 1)
  assert.match(r.out, /"bogus".*orphan/)
})

test('ignores scheme names inside CSS comments', () => {
  const withComment = `/* see [data-scheme="ghost"] for history */\n${GOOD('jade')}`
  const gate = fixture({ schemes: ['petrol', 'jade'], styles: withComment, docs: GOOD('jade') })
  const r = runGate(gate)
  assert.equal(r.code, 0, r.out)
})
