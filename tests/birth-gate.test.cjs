'use strict'
/**
 * Behavior tests for scripts/check-birth-gate.cjs (issues #4/#5, check 6 from
 * issue #9).
 *
 * The gate resolves paths from its own location, so fixtures copy the script
 * into a temp tree. It also `require('js-yaml')` from the repo root, so the
 * fixture runs point NODE_PATH at the real node_modules - without it the lane
 * correctly refuses to run (exit 2) rather than passing quietly.
 */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const ROOT = path.resolve(__dirname, '..')
const GATE = path.join(ROOT, 'scripts', 'check-birth-gate.cjs')

function runGate(scriptPath) {
  try {
    const out = execFileSync('node', [scriptPath], {
      encoding: 'utf-8',
      env: { ...process.env, NODE_PATH: path.join(ROOT, 'node_modules') },
    })
    return { code: 0, out }
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') }
  }
}

// Build a minimal fixture tree: a scripts/ copy of the gate + the workflows
// passed in (name -> source). Returns the fixture's gate path.
function fixture(workflows) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'birth-gate-'))
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true })
  fs.mkdirSync(path.join(dir, '.github', 'workflows'), { recursive: true })
  fs.copyFileSync(GATE, path.join(dir, 'scripts', 'check-birth-gate.cjs'))
  for (const [name, src] of Object.entries(workflows)) {
    fs.writeFileSync(path.join(dir, '.github', 'workflows', name), src)
  }
  return path.join(dir, 'scripts', 'check-birth-gate.cjs')
}

const SHA = '3d3c42e5aac5ba805825da76410c181273ba90b1'
const REUSABLE = `name: Build
on:
  workflow_call:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@${SHA} # v7
`
const CALLER = `name: Deploy
on:
  push:
jobs:
  build:
    uses: ./.github/workflows/build.yml
`
const PLAIN = `name: Test
on:
  push:
jobs:
  t:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@${SHA} # v7
`

test('passes on the live repo tree', () => {
  const r = runGate(GATE)
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /BIRTH-GATE: PASS/)
})

test('passes when a caller points at a workflow_call file', () => {
  const gate = fixture({ 'build.yml': REUSABLE, 'deploy.yml': CALLER })
  const r = runGate(gate)
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /reusable: 1 local call\(s\), 1 workflow_call file\(s\), 0 uncalled/)
})

test('fails when a caller points at a workflow without workflow_call', () => {
  const gate = fixture({ 'test.yml': PLAIN, 'deploy.yml': CALLER.replace('build.yml', 'test.yml') })
  const r = runGate(gate)
  assert.equal(r.code, 1)
  assert.match(r.out, /without `on: workflow_call`/)
})

test('fails when a caller points at a missing file', () => {
  const gate = fixture({ 'deploy.yml': CALLER })
  const r = runGate(gate)
  assert.equal(r.code, 1)
  assert.match(r.out, /points at a file that does not exist/)
})

test('fails when a workflow_call file is never called (dead lane)', () => {
  const gate = fixture({ 'build.yml': REUSABLE })
  const r = runGate(gate)
  assert.equal(r.code, 1)
  assert.match(r.out, /dead reusable lane/)
})

test('fails on a floating (non-SHA) action pin', () => {
  const floating = PLAIN.replace(`@${SHA} # v7`, '@v4')
  const gate = fixture({ 'test.yml': floating })
  const r = runGate(gate)
  assert.equal(r.code, 1)
  assert.match(r.out, /is not SHA-pinned/)
})

test('fails on a duplicate YAML mapping key (the birth-run class)', () => {
  // The unquoted `self-test:` inside a step name reads as a second key.
  const dup = `name: CI
on:
  push:
jobs:
  t:
    runs-on: ubuntu-latest
    steps:
      - name: self-test: run it
        run: echo ok
`
  const gate = fixture({ 'ci.yml': dup })
  const r = runGate(gate)
  assert.equal(r.code, 1)
  assert.match(r.out, /YAML parse failed/)
})
