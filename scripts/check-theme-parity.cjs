#!/usr/bin/env node
/**
 * Paint-scheme parity gate (issue #20; the #18/#19/#21 drift class).
 *
 * The shell ships four paint-scheme presets on a second axis beside
 * light/dark. A scheme lives as `data-scheme` token blocks in TWO surfaces
 * (web/src/styles.css and docs/_layouts/default.html) and its name list lives
 * in ONE place (web/src/theme.js). The failure this gate catches, twice-paid
 * in the family round: a scheme that lands in one surface and not the other,
 * or a scheme whose LIGHT half is missing so its dark accent silently bleeds
 * into light mode (the missing --accent-deep bug from #18/#19/#21).
 *
 * A scheme's tokens may span several rules (golden/jade share one warm cast
 * and carry the accent trio in a second rule), so the gate unions every rule
 * whose selector list contains the scheme's exact selector.
 *
 * Checks (each names file:line):
 *   - every non-default scheme in web/src/theme.js has a `[data-scheme="x"]`
 *     block in styles.css AND the docs layout - HARD FAIL
 *   - each scheme's dark and light rule SETS each set --accent and
 *     --accent-deep - HARD FAIL
 *   - no orphan `[data-scheme="x"]` for a name the picker does not offer
 *     (comments are stripped first) - HARD FAIL
 * Exit 1 on any finding.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..')
const THEME = path.join(ROOT, 'web', 'src', 'theme.js')
const SURFACES = [
  path.join(ROOT, 'web', 'src', 'styles.css'),
  path.join(ROOT, 'docs', '_layouts', 'default.html'),
]

const findings = []
const fail = (msg) => findings.push(msg)

// Scheme list + the default, read from theme.js (the one source of truth).
const themeSrc = fs.readFileSync(THEME, 'utf-8')
const listMatch = themeSrc.match(/SCHEMES\s*=\s*\[([^\]]*)\]/)
if (!listMatch) {
  console.error('THEME-PARITY: FAIL (could not read SCHEMES from web/src/theme.js)')
  process.exit(1)
}
const schemes = [...listMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
const DEFAULT = schemes[0] // iris - carries no block, it IS the base tokens

// Strip /* ... */ comments so scheme names in prose do not read as rules.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))

// Union the declarations of every rule whose selector list contains `sel`.
function collectRules(src, sel) {
  const lines = stripComments(src).split('\n')
  let decl = '', first = null
  for (let i = 0; i < lines.length; i++) {
    let from = 0, found = false
    while (true) {
      const idx = lines[i].indexOf(sel, from)
      if (idx === -1) break
      const after = lines[i].slice(idx + sel.length)
      if (/^\s*[,{]/.test(after)) { found = true; break }
      from = idx + sel.length
    }
    if (!found) continue
    if (first === null) first = i + 1
    for (let j = i; j < lines.length; j++) {
      decl += lines[j] + '\n'
      if (lines[j].includes('}')) break
    }
  }
  return first === null ? null : { line: first, decl }
}

for (const surface of SURFACES) {
  const rel = path.relative(ROOT, surface)
  const src = fs.readFileSync(surface, 'utf-8')

  for (const name of schemes) {
    if (name === DEFAULT) continue
    const dark = collectRules(src, `[data-scheme="${name}"]`)
    const light = collectRules(src, `[data-scheme="${name}"][data-theme="light"]`)
    if (!dark) fail(`${rel}: scheme "${name}" has no [data-scheme="${name}"] block (add it, or drop the name from web/src/theme.js)`)
    if (!light) fail(`${rel}: scheme "${name}" has no [data-scheme="${name}"][data-theme="light"] half (the light theme would inherit the dark accent)`)

    for (const [half, rule] of [['dark', dark], ['light', light]]) {
      if (!rule) continue
      for (const tok of ['--accent', '--accent-deep']) {
        if (!rule.decl.includes(tok + ':')) {
          fail(`${rel}:${rule.line}: scheme "${name}" ${half} half does not set ${tok}`)
        }
      }
    }
  }

  // Orphan check (comments already stripped).
  const clean = stripComments(src)
  for (const m of clean.matchAll(/\[data-scheme="([^"]+)"\]/g)) {
    if (!schemes.includes(m[1])) {
      const line = clean.slice(0, m.index).split('\n').length
      fail(`${rel}:${line}: block for scheme "${m[1]}" which is not in web/src/theme.js SCHEMES (orphan)`)
    }
  }
}

if (findings.length) {
  console.error('THEME-PARITY: FAIL')
  for (const f of findings) console.error('  ' + f)
  process.exit(1)
}
console.log(`THEME-PARITY: PASS (${schemes.length} scheme(s) - ${schemes.join(', ')} - present in both surfaces, both halves, accent trio set)`)
