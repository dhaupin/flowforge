# Changelog

All notable changes to the flowforge shell. The released version lives in `package.json` + `web/package.json` (kept equal by a same-commit bump - the Version protocol lives in [AGENTS.md](./AGENTS.md)). Releases go out on `vX.Y.Z` git tags via npm Trusted Publishing - the runbook is [DEPLOY.md](./DEPLOY.md).

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), [SemVer](https://semver.org/). `packs/<name>/pack.json` manifests carry THEIR OWN semver, independent of the CLI/shell - see [packs/README.md](./packs/README.md).

## Unreleased - staging (2026-10-29)

A two-bucket round: adopt the fixes the family's newest repos already paid for (Bucket A) and bring the shell's process surfaces up to the family standard (Bucket B). No version bump - the release stays 0.9.0 until the first tag; the census leg keeps every surface honest meanwhile.

### Added

- `scripts/check-birth-gate.cjs` - the birth-gate lane (issue #5), five checks: YAML-parse every workflow (duplicate-key refusal kills the unquoted-step-name class that dies at GitHub's parser with zero check runs), assert staging-mount independence when a `mounts/` dir appears, gc-safe serde on any pack script, a determinism note, and the pins-never-float rule (every `uses:` must be a 40-hex commit SHA, the human tag in a comment - a moving `@v4` is a supply-chain hole). Wired into `npm run check`.
- `scripts/lint-packs.cjs` + `npm run lint:packs` - the packstruct passthrough wrapper verb (issue #12): runs the repo's own install (node_modules/.bin, then PATH), default dir = the packs ROOT, exit 2 names the exact-devDep fix when absent. `test.yml` now routes through it.
- `scripts/ship-from-download.cjs` + `tests/ship-from-download.test.cjs` - the generic phone publish lane (issue #24): stages a zip-extracted npm tree into `$HOME`, refuses shared-storage/`$HOME`/non-empty roots by name, token from ENV only (never a file, argv, or log). 21 behavior tests, temp dirs + fake runner, no network.
- `scripts/unwrap-prose.cjs` - the flowing-prose tool (issue #25).
- `tests/census.test.cjs` - the version-truth census leg (issue #28): root `package.json` is THE version source; `web/package.json` and the README Status line cannot drift.
- `web/scripts/adopt-icons.mjs` + `web/scripts/og-image.mjs` - the icon/OG pipeline (issue #17): raster brand art -> traced vector -> full icon set + an authored `brand-mark.json` the OG card redraws. Helpers ride `npm i --no-save`; no rasterizer dep committed.
- `web/public/brand/flowforge-logo.jpg` - the brand master, and the real icon set it produces (`icon.svg` into BOTH faces byte-equal, `icon-192/512`, `favicon-32`, `apple-touch-icon`, `og-image.png`): the shell's placeholder art is replaced. The pipeline traces the mark correctly (adoption fix below), so the icons now read as the art, not its negative.
- `.gitignore` (root) - the docs-preview belt-and-suspenders block (issue #22).
- `docs/freestruct.config.yml` author + `jsonLd` identity blocks (issue #11).
- `DEPLOY.md` local docs-preview recipe (issue #22) - the out-of-tree Ruby/bundler shape an unprivileged sandbox needs.

### Changed

- `package.json` - added `test`, `prepublishOnly`, and `lint:packs`; `check` now includes the birth-gate lane; one root devDependency (`js-yaml`) + a committed lockfile for the hermetic install.
- `.github/workflows/release.yml` - the publish ladder (issues #23/#29): a gate refusing 0.x and a tag that disagrees with the packaged version, `prepublishOnly` riding every publish, and SHA-pinned actions.
- `.github/workflows/test.yml` + `docs-deploy.yml` - actions SHA-pinned (issue #6); test.yml adds the hermetic `npm ci` + `npm test` spine.
- `docs/_freestruct/inject-brand.html` - upgraded to the engine-edition JSON-LD (issue #11): Organization + WebSite pair, `{{authorJson}}` founder seam, `{{searchActionJson}}` seam.
- `docs/_layouts/default.html` + `web/src/styles.css` - Rouge/code token parity (issue #7), mobile table guard + `.main { min-width: 0 }` (issue #13), header brand link through `{{ site.baseurl }}/` (issue #15).
- `web/src/islands.js` - the observer guard (issue #6/#13 class): `mounted`/`observers`/`observing` WeakSets, `mount()` disconnects its observer.
- `docs/_data/nav.yml` + `docs/discussions/index.md` - Reference group + the flowing-prose note (issue #15/#25).
- `web/public/robots.txt` - flowforge crawler policy + sitemap pointer (issue #16).
- README / AGENTS / DEPLOY / MANIFEST / CHANGELOG - unwrapped to flowing prose (issue #25) and updated for the new gates, pins, and ladder.

### Fixed

- `web/scripts/adopt-icons.mjs` polarity (issue #17 adoption): the upstream eyestruct `make-icons.mjs` @ e4a73ac traces with `blackOnWhite: true` while its mask sets ink to 255 (white), so potrace traced the BACKGROUND frame and every icon shipped as a photographic negative of the art (correlation of traced fill vs. the ink mask: -0.999; +0.999 with `blackOnWhite: false`). Fixed on adoption, plus an in-script polarity guard that refuses the inverted bbox so the class cannot return.

- The version surfaces can no longer drift silently (the census leg fails the build), and a publish can no longer cut a 0.x tarball or a tag that lies about its version.

## 0.9.0 - 2026-10-24

The first scaffold: the rig extracted from **dhaupin/crashtest @ 905aa91**, generic-branded, with a receipt table per file ([MANIFEST.md](./MANIFEST.md)). Ready for the first manual npm push + GitHub release (`v0.9.0` tag; the OIDC workflow ships it).

### Added

- `web/` - the prestruct landing shell: light/dark theme switch (no-flash bootstrap, icon-is-the-action), tokens-only palette (dark + light, neutral graphite), nav/sidebar/footer from one vocabulary file, the island engine, placeholder pages, and a highlighted terminal block.
- `docs/` - the Jekyll rig: search > GitHub icon > theme switch > menu header, pagefind modal search, Rouge token colors shared with the landing, freestruct SEO layer, sample page proving frontmatter + highlighting.
- `scripts/` - the docs gates: frontmatter, links (doubled-baseurl trap), style/voice, fiction signatures (generic seeds), and the single-argument Liquid filter trap.
- `.github/workflows/docs-deploy.yml` - token-authenticated pagefind scrape + PINNED freestruct layer + GitHub Pages.
- `.github/workflows/release.yml` - npm Trusted Publishing (OIDC) template.
- `AGENTS.md` - the agent-facing map + house rules + version protocol.
- `DEPLOY.md` - the deploy runbook, crosslinked.
- `labs/TASKS.md` - the rolling work log (seeded with the extraction entry).
- `packs/README.md` - the `/packs` contract + the struct-family links.

### Notes

- The rig's version surfaces: `package.json` and `web/package.json` (both 0.9.0). PNG icon slots (`icon-192/512`, `favicon-32`, `apple-touch-icon`, `og-image.png`) are referenced but not shipped - drop yours into `web/public/`.
