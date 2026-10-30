// tests/gate-drift.test.cjs - the gate-drift verb, both ways.
//
// A site adopter VENDORS the gates into its own scripts/ (flattened, identity
// substituted). This verb is how the adopter learns the rig moved under it.
// Real fixtures on disk, no mocks: a synthetic adopter built from the rig's own
// gates (current), then the same tree with one gate's RULE mutated (drift).
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const ROOT = path.join(__dirname, '..')
const DRIFT = path.join(ROOT, 'lib', 'gate-drift.mjs')

function run(adopter) {
  try {
    const out = execFileSync('node', [DRIFT, '--adopter', adopter], { encoding: 'utf8' })
    return { code: 0, out }
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }
  }
}

// Build a synthetic adopter: a scripts/ dir holding the rig's gates, flattened
// the way a stamp flattens them (`../root.cjs` -> `./root.cjs`).
function buildAdopter() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-drift-'))
  fs.mkdirSync(path.join(dir, 'scripts'))
  const gateDir = path.join(ROOT, 'lib', 'gates')
  const copy = (src, name) => {
    const text = fs.readFileSync(src, 'utf8').replace(/\.\.\/(root\.(?:cjs|mjs))/g, './$1')
    fs.writeFileSync(path.join(dir, 'scripts', name), text)
  }
  for (const f of fs.readdirSync(gateDir)) copy(path.join(gateDir, f), f)
  for (const f of ['root.cjs', 'root.mjs', 'sync.mjs']) copy(path.join(ROOT, 'lib', f), f)
  return dir
}

test('a freshly vendored copy is current with the rig (modulo path + identity)', () => {
  const dir = buildAdopter()
  const r = run(dir)
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /gate-drift: PASS/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('a gate whose RULE moved behind the rig is refused by name', () => {
  const dir = buildAdopter()
  // Mutate a RULE (not a comment - comments are normalized away): change a
  // constant the rig carries, the way a real rule change would land.
  const p = path.join(dir, 'scripts', 'check-docs-links.cjs')
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace("const files = [];", "const files = [];\nconst RULE_MARKER = 1;"))
  const r = run(dir)
  assert.equal(r.code, 1, r.out)
  assert.match(r.out, /DRIFT check-docs-links\.cjs/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('a gate the rig ships but the adopter lacks is MISSING (the loudest drift)', () => {
  const dir = buildAdopter()
  fs.rmSync(path.join(dir, 'scripts', 'check-jekyll-filters.cjs'))
  const r = run(dir)
  assert.equal(r.code, 1, r.out)
  assert.match(r.out, /MISS check-jekyll-filters\.cjs/)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('a directory with no scripts/ is a usage refusal (exit 2), never a silent pass', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-drift-bare-'))
  const r = run(dir)
  assert.equal(r.code, 2, r.out)
  fs.rmSync(dir, { recursive: true, force: true })
})
