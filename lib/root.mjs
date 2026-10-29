// lib/root.mjs - the ESM twin of lib/root.cjs (see that file for the rule).
//
// Resolve the SITE root by walking up to the nearest `site.config.js`,
// skipping any candidate under node_modules (that is the tool's own copy, not
// the adopter's site). `--root <dir>` overrides for tests and for callers that
// check a tree other than their own.
import { existsSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const underNodeModules = (dir) => dir.split(/[\\/]/).includes('node_modules')

const TOOL_DIRS = new Set(['gates', 'scripts', 'lib', 'bin'])

export function resolveRoot(from = dirname(fileURLToPath(import.meta.url))) {
  const i = process.argv.indexOf('--root')
  if (i !== -1 && process.argv[i + 1]) return resolve(process.argv[i + 1])
  for (let dir = resolve(from); ; ) {
    if (!underNodeModules(dir) && existsSync(resolve(dir, 'site.config.js'))) return dir
    const up = dirname(dir)
    if (up === dir) break
    dir = up
  }
  let dir = resolve(from)
  while (TOOL_DIRS.has(basename(dir))) dir = dirname(dir)
  return dir
}
