#!/usr/bin/env node
'use strict'

// scripts/lint-packs.cjs - the opt-in packstruct passthrough wrapper
// (flowforge#12, shaped after crashtest's lint-packs verb and eyestruct's
// lib/lint-packs.js). The lane runs packstruct over the repo's OWN install -
// node_modules/.bin first, then PATH - and never downloads or bundles one.
// This is the piece every port otherwise re-derives from scratch; the rig
// ships it so the battery is discoverable instead of folklore.
//
// Policy (pinned, honest-skip vs loud):
//   - invoked with no packstruct installed -> exit 2 naming the exact-devDep
//     fix (a never-working requested lane is a broken config, not a skip)
//   - present but exits non-zero -> verdicts pass through verbatim; the exit
//     code rides (0 clean / 1 findings / 2 packstruct's own config class).
//
// The packs ROOT is packstruct's contract root: `packs/public` alone reads
// as "0 packs checked, missing packs/public/public/" (the live footgun from
// gistory's first wiring). Default dir = the packs root; an explicit dir
// passes through UNTOUCHED.
//
// Usage: node scripts/lint-packs.cjs [--deep] [--json] [--against <lib>] [dir]

const { spawnSync } = require('node:child_process')
const { existsSync } = require('node:fs')
const path = require('node:path')

const PACKSTRUCT_FIX = 'fix: npm i -D packstruct@<exact> - install packstruct as an EXACT devDependency (same commit -> same findings applies to the linter too; this lane never downloads one)'

function packstructInstalled(cwd) {
  if (existsSync(path.join(cwd, 'node_modules', '.bin', 'packstruct'))) return 'local'
  const probe = spawnSync('packstruct', ['--version'], { encoding: 'utf8' })
  if (probe.error && probe.error.code === 'ENOENT') return null
  return 'path'
}

function spawnPackstruct(cwd, args) {
  const source = packstructInstalled(cwd)
  if (!source) return { error: { code: 'ENOENT' } }
  if (source === 'local') {
    return spawnSync(path.join(cwd, 'node_modules', '.bin', 'packstruct'), args, { encoding: 'utf8', stdio: 'inherit' })
  }
  return spawnSync('packstruct', args, { encoding: 'utf8', stdio: 'inherit' })
}

function flagValue(argv, flag) {
  const i = argv.indexOf(flag)
  return i === -1 ? undefined : argv[i + 1]
}

function posArg(argv) {
  return argv.find((a) => !a.startsWith('--') && a !== flagValue(argv, '--against'))
}

const argv = process.argv.slice(2)
const dir = posArg(argv) || 'packs'
const args = ['lint', dir]
if (argv.includes('--deep')) args.push('--deep')
if (argv.includes('--json')) args.push('--json')
const against = flagValue(argv, '--against')
if (against !== undefined) args.push('--against', against)

process.stdout.write(`lint-packs: running packstruct over ${dir} (the repo's own install - never downloaded); ${args.join(' ')}\n`)
const res = spawnPackstruct(process.cwd(), args)
if (res.error && res.error.code === 'ENOENT') {
  process.stderr.write(`lint-packs[PACKSTRUCT_MISSING]: packstruct is not installed in this tree\nlint-packs: ${PACKSTRUCT_FIX}\n`)
  process.exit(2)
}
// Passthrough fidelity: the exit code IS the verdict.
process.exit(res.status ?? 1)
