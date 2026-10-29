'use strict'

// lib/root.cjs - resolve the SITE root, not the tool's own directory.
//
// The tool lives in the package (lib/); the tree it checks is the adopter's
// site. Resolving the root by walking up to the nearest `site.config.js` keeps
// both shapes working under one rule: the dogfood (config at the repo root,
// gates at lib/gates/) and an installed adopter (config above
// node_modules/flowforge). `--root <dir>` overrides for tests and for callers
// that check a tree other than their own.

const fs = require('node:fs')
const path = require('node:path')

const underNodeModules = (dir) => dir.split(/[\\/]/).includes('node_modules')

// The tool's own directory names: strip them to reach a tree root when no
// site.config.js is found (the gate may run in a fixture that has no config).
const TOOL_DIRS = new Set(['gates', 'scripts', 'lib', 'bin'])

function resolveRoot(from = __dirname) {
  const i = process.argv.indexOf('--root')
  if (i !== -1 && process.argv[i + 1]) return path.resolve(process.argv[i + 1])
  for (let dir = path.resolve(from); ; ) {
    if (!underNodeModules(dir) && fs.existsSync(path.join(dir, 'site.config.js'))) return dir
    const up = path.dirname(dir)
    if (up === dir) break
    dir = up
  }
  let dir = path.resolve(from)
  while (TOOL_DIRS.has(path.basename(dir))) dir = path.dirname(dir)
  return dir
}

module.exports = { resolveRoot }
