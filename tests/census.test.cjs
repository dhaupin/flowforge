'use strict'

// The version-truth census leg (flowforge#28, the rig rider).
//
// package.json is THE single version source of a repo. Any living surface
// that names the CURRENT version - a second side package.json, a README
// status line, a badge - is a hand-synced second truth, and hand-sync dies
// the way all our hand-syncs die: quietly. This leg derives the root
// version and refuses every living surface that drifted from it, so a
// release commit physically cannot move one without the others.
//
// Worked example baked here: dhaupin/eyestruct@3d8a822's version-truth
// test (tests/census.test.js). The classification the leg encodes:
//
//   LAWFUL, keep as-is: dated era rows (changelog dated sections, freeze
//   posts, dated work-log entries); range pins (^1.0.0 - they bind 1.x
//   COMPATIBILITY, not the current version); dep specs and workflow
//   comments naming OTHER packages' versions.
//
//   CAUGHT: a side package.json whose version differs, and a README
//   Status line carrying a stale current-version number.
//
// Behavior-only, temp-free, no network: it reads repo files like the
// docs gates do. The rig ships it so every sibling inherits the rule.

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const REPO = path.join(__dirname, '..')

test('version truth: package.json is the single version source, and the living surfaces cannot drift from it', () => {
  const root = require('../package.json').version
  assert.ok(/^\d+\.\d+\.\d+/.test(root), 'census runner: root package.json version did not parse')

  // web/package.json: a second hand-synced truth must equal the root.
  const web = require('../web/package.json')
  assert.equal(web.version, root, 'web/package.json version drifted from root package.json - the release commit moves them together, and the leg now holds the moving')

  // README status line: the current-version claim derives from root.
  const readme = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8')
  const status = readme.match(/Status: \*\*(\d+\.\d+\.\d+)/)
  assert.ok(status, 'README must carry a "Status: **X.Y.Z, ..." line for the version pin (the pin relocates WITH the claim if the copy moves)')
  assert.equal(status[1], root, 'README status line carries a stale version - move it in the same commit as root package.json, or drop the number')
})
