#!/usr/bin/env node
'use strict'

// scripts/check-birth-gate.cjs - the birth-gate lane (flowforge#5).
//
// Five cheap checks that catch the failure classes a rig-birthed repo hits,
// shipped as one gate so every adopter inherits them instead of re-learning
// them (receipts: the gistory birth-run, flowforge#4). The lane is honest by
// design: each check names file:line or the offending path, and a check that
// cannot derive its input says so instead of passing quietly.
//
//   1. YAML-parse every committed workflow (duplicate keys refused). A step
//      name with an unquoted `self-test:` reads as a second mapping key and
//      dies at GitHub's parser with ZERO check runs - a 1-second crash under
//      the file's bare name. Real YAML parse makes that class impossible.
//   2. Declare the mounts. If the repo hosts staging mounts of independent
//      projects, each must be present in the host's lint ignores. The shell
//      hosts none; the check is a no-op until a mounts/ dir appears (then it
//      asserts declaration rather than 55 unattributed lint errors later).
//   3. Serde before graphs. Any script that builds a git dir and packs it
//      must set gc.auto 0 and gc.writeCommitGraph false first (the
//      `tar: file changed as we read it` class).
//   4. Determinism proof. If a pack script is present, this lane notes that
//      a pack-twice byte-compare must ride CI; the shell ships no packer, so
//      the check reports the no-op honestly.
//   5. Pins never float. Every `uses:` in a workflow must be a 40-hex commit
//      SHA (with the human tag in a trailing comment). A moving `@v4` is a
//      supply-chain hole: the ref can be repointed at any time, so the bytes
//      CI runs are not the bytes anyone reviewed.
//   6. Reusable-workflow contract (issue #9). A local `uses: ./...` must point
//      at a file that exists AND declares `on: workflow_call`; a caller that
//      points at a plain workflow fails at runtime with a confusing error, and
//      a reusable workflow that is never called is dead weight. Both directions
//      are checked so a thin-caller refactor cannot half-land.
//
// Usage: node scripts/check-birth-gate.cjs
// Exit: 0 clean, 1 a check failed (file:line named), 2 the lane could not
// derive its input (missing parser).

const fs = require('node:fs')
const path = require('node:path')

const REPO = path.join(__dirname, '..')
let yaml
try {
  yaml = require('js-yaml')
} catch {
  console.error('BIRTH-GATE: cannot run - js-yaml is not installed (npm install)')
  process.exit(2)
}

const problems = []
const notes = []

// --- 1. YAML-parse every committed workflow -------------------------------
const wfDir = path.join(REPO, '.github', 'workflows')
const wfFiles = fs.existsSync(wfDir)
  ? fs.readdirSync(wfDir).filter((f) => /\.ya?ml$/.test(f)).sort()
  : []
if (!wfFiles.length) problems.push('.github/workflows: no workflow files found - the birth-gate has nothing to parse')
for (const f of wfFiles) {
  const full = path.join(wfDir, f)
  const src = fs.readFileSync(full, 'utf8')
  try {
    // DEFAULT schema (NOT { json: true }): only the default schema refuses a
    // duplicated mapping key, which is exactly the unquoted-`self-test:`-as-
    // second-key class this gate exists to kill. The JSON schema silently
    // takes the last value instead.
    yaml.load(src)
  } catch (err) {
    // js-yaml reports a line in err.mark.line (0-based).
    const line = err && err.mark && typeof err.mark.line === 'number' ? err.mark.line + 1 : '?'
    problems.push(`.github/workflows/${f}:${line}: YAML parse failed - ${err && err.message ? err.message.split('\n')[0] : err}`)
  }
}

// --- 2. Declare the mounts ------------------------------------------------
const mountsDir = path.join(REPO, 'mounts')
if (fs.existsSync(mountsDir)) {
  const mounts = fs.readdirSync(mountsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  const lintIgnores = fs.existsSync(path.join(REPO, '.prettierignore'))
    ? fs.readFileSync(path.join(REPO, '.prettierignore'), 'utf8')
    : ''
  for (const m of mounts) {
    if (!lintIgnores.includes(`mounts/${m}`)) {
      problems.push(`mounts/${m}: staging mount is not declared in the host's lint ignores (.prettierignore) - declare independence at birth, not 55 lint errors later`)
    }
  }
  if (mounts.length) notes.push(`mounts: declared ${mounts.length} staging mount(s)`)
} else {
  notes.push('mounts: none (the shell hosts no staging mounts)')
}

// --- 3. Serde before graphs ------------------------------------------------
// Any script that runs `git init`/`git -C ...` then packs must set the two
// gc settings first. We look for pack-ish scripts under scripts/ and warn if
// they touch git without the gc guards.
const scriptsDir = path.join(REPO, 'scripts')
const serdeScripts = fs.existsSync(scriptsDir)
  ? fs.readdirSync(scriptsDir).filter((f) => /\.(cjs|mjs|js)$/.test(f) && f !== 'check-birth-gate.cjs')
  : []
let serdeChecked = 0
for (const f of serdeScripts) {
  const src = fs.readFileSync(path.join(scriptsDir, f), 'utf8')
  const touchesGit = /\bgit\s+(init|add|commit|archive|-C)\b/.test(src) || /'git'/.test(src) || /"git"/.test(src)
  const packs = /\b(tar|pack|archive)\b/i.test(src)
  if (touchesGit && packs) {
    serdeChecked++
    if (!/gc\.auto/.test(src) || !/gc\.writeCommitGraph/.test(src)) {
      problems.push(`scripts/${f}: builds a git dir and packs it without setting gc.auto 0 + gc.writeCommitGraph false first (the tar "file changed as we read it" class)`)
    }
  }
}
notes.push(serdeChecked ? `serde: ${serdeChecked} pack script(s) carry the gc guards` : 'serde: no pack scripts in the shell')

// --- 4. Determinism proof --------------------------------------------------
const packScripts = serdeScripts.filter((f) => /\b(tar|pack|archive)\b/i.test(fs.readFileSync(path.join(scriptsDir, f), 'utf8')))
if (packScripts.length) {
  notes.push(`determinism: ${packScripts.length} pack script(s) present - CI must run the pack twice and byte-compare (see the workflow's determinism step)`)
} else {
  notes.push('determinism: no pack step in the shell (nothing to byte-compare)')
}

// --- 5. Pins never float (every action SHA-pinned) ------------------------
let usesChecked = 0
let usesFloating = 0
for (const f of wfFiles) {
  const lines = fs.readFileSync(path.join(wfDir, f), 'utf8').split('\n')
  lines.forEach((line, i) => {
    const m = line.match(/^\s*(?:-\s*)?uses:\s*(\S+)/)
    if (!m) return
    const ref = m[1]
    // Local composite actions (./path) are not remote refs - skip.
    if (ref.startsWith('./')) return
    usesChecked++
    const at = ref.lastIndexOf('@')
    const pin = at === -1 ? '' : ref.slice(at + 1)
    if (!/^[0-9a-f]{40}$/.test(pin)) {
      usesFloating++
      problems.push(`.github/workflows/${f}:${i + 1}: uses: ${ref} is not SHA-pinned - a moving ref is a supply-chain hole (pin the 40-hex commit, name the human tag in a trailing comment)`)
    }
  })
}
if (!usesChecked) notes.push('pins: no action refs in the shell')
else if (usesFloating) notes.push(`pins: ${usesChecked} action ref(s), ${usesFloating} FLOATING`)
else notes.push(`pins: ${usesChecked} action ref(s), all SHA-pinned`)

// --- 6. Reusable-workflow contract (issue #9) ------------------------------
// Local `uses: ./path` refs must exist and declare on: workflow_call; and any
// workflow_call workflow must be called by someone (no dead reusable lane).
const reusableFiles = new Set()
for (const f of wfFiles) {
  let doc
  try {
    doc = yaml.load(fs.readFileSync(path.join(wfDir, f), 'utf8'))
  } catch {
    continue // unparseable files are already named by check 1; skip here
  }
  const on = doc && doc.on
  // `on` may parse as the string 'on' key or a mapping; workflow_call may be
  // null (bare) or a mapping with inputs.
  if (on && typeof on === 'object' && Object.prototype.hasOwnProperty.call(on, 'workflow_call')) {
    reusableFiles.add(f)
  }
}
let localCallers = 0
const localCallTargets = new Set()
for (const f of wfFiles) {
  const lines = fs.readFileSync(path.join(wfDir, f), 'utf8').split('\n')
  lines.forEach((line, i) => {
    const m = line.match(/^\s*(?:-\s*)?uses:\s*(\S+)/)
    if (!m || !m[1].startsWith('./')) return
    localCallers++
    const rel = m[1].replace(/^\.\//, '')
    localCallTargets.add(rel)
    const target = path.join(REPO, rel)
    if (!fs.existsSync(target)) {
      problems.push(`.github/workflows/${f}:${i + 1}: uses: ${m[1]} points at a file that does not exist`)
      return
    }
    if (!reusableFiles.has(path.basename(rel))) {
      problems.push(`.github/workflows/${f}:${i + 1}: uses: ${m[1]} points at a workflow without \`on: workflow_call\` - it cannot be called (add the trigger or inline it)`)
    }
  })
}
const uncalledReusable = [...reusableFiles].filter(
  (rf) => !localCallTargets.has(`.github/workflows/${rf}`) && !localCallTargets.has(rf),
)
for (const rf of uncalledReusable) {
  problems.push(`.github/workflows/${rf}: declares \`on: workflow_call\` but no workflow calls it - dead reusable lane`)
}
if (localCallers || reusableFiles.size) {
  notes.push(`reusable: ${localCallers} local call(s), ${reusableFiles.size} workflow_call file(s), ${uncalledReusable.length} uncalled`)
}

// --- report ----------------------------------------------------------------
for (const n of notes) console.log(`BIRTH-GATE: ${n}`)
if (problems.length) {
  console.error(`BIRTH-GATE: FAIL (${problems.length} problem(s))`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(`BIRTH-GATE: PASS (${wfFiles.length} workflow(s) parsed, ${notes.length} checks clean)`)
