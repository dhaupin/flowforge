/**
 * src/components/SchemeSwitch.jsx
 * Paint-scheme picker (issue #20). The scheme lives on <html data-scheme>
 * (CSS picks the token block) and is persisted in localStorage; the inline
 * bootstrap in index.html applies a persisted scheme before first paint, so
 * the page never flashes the wrong palette. This component only flips it.
 *
 * Hydration note: the first client render MUST match the prerendered markup
 * (the family's byte-for-byte rule), so state starts at the deterministic
 * default and an effect adopts the bootstrap's persisted scheme after mount.
 * The select's own label syncs one frame late; the page palette never does.
 */
import { useEffect, useState } from 'react'
import { SCHEMES, SCHEME_KEY, paperFor } from '../theme.js'

function currentScheme() {
  return document.documentElement.dataset.scheme || 'iris'
}

function applyScheme(name) {
  const el = document.documentElement
  if (name === 'iris') delete el.dataset.scheme
  else el.dataset.scheme = name
  try { localStorage.setItem(SCHEME_KEY, name) } catch { /* private mode */ }
  // theme-color follows the scheme's paper in the current theme.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', paperFor(name, el.dataset.theme === 'light'))
}

export default function SchemeSwitch() {
  const [scheme, setScheme] = useState('iris')

  useEffect(() => { setScheme(currentScheme()) }, [])

  return (
    <select
      className="scheme-switch"
      aria-label="Paint scheme"
      value={scheme}
      onChange={(e) => { setScheme(e.target.value); applyScheme(e.target.value) }}
    >
      {SCHEMES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}
