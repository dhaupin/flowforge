/**
 * src/theme.js
 * The two theme axes as data (issue #20): light/dark and the paint scheme.
 * Shared by ThemeSwitch + SchemeSwitch and mirrored by index.html's pre-paint
 * bootstrap and the docs layout - keep the key names and the paper map in
 * sync with all three (the no-flash bootstrap reads the same keys).
 */

export const THEME_KEY = 'flowforge-theme'
export const SCHEME_KEY = 'flowforge-paint-scheme'

// The shipped presets. Iris is the default and carries no CSS block (it IS
// the base tokens); a dau may set a free-text scheme and ship its own block.
export const SCHEMES = ['iris', 'petrol', 'golden', 'jade']

// Each scheme's paper value per half - the one place a scheme touches the
// browser chrome (the theme-color meta / mobile URL bar).
const PAPER = {
  iris:   { dark: '#10131a', light: '#f5f6fa' },
  petrol: { dark: '#0a1113', light: '#edf3f2' },
  golden: { dark: '#121011', light: '#f6f1e7' },
  jade:   { dark: '#121011', light: '#f6f1e7' },
}

export function paperFor(name, light) {
  return (PAPER[name] || PAPER.iris)[light ? 'light' : 'dark']
}
