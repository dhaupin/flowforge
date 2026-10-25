# flowforge MANIFEST - the receipts

Every file in this rig is either an extraction from a deployed, verified
surface or a tiny generic glue file. This table names which, at which SHA,
so adopters can diff against the source and so bumping a pinned engine is a
deliberate review rather than a drift.

Extraction source: **dhaupin/crashtest @ 905aa91** (2026-10-24) unless noted.
Byte-exact copies were verified with `cmp` at extraction time.

## docs/ (Jekyll rig)

| file                        | receipt                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `_config.yml`               | genericized from crashtest docs/_config.yml (same kramdown/rouge/permalink/excludes engine settings) |
| `Gemfile`                   | byte-exact copy (generic deps: jekyll ~> 4.3 + jekyll-redirect-from) - `bundler-cache: true` in docs-deploy.yml REFUSES to run without it; extracted 2026-10-25 after the gap was caught land-side. 2026-10-25 (issue #3 ride-along): `bigdecimal ~> 3.1` declared - a BUNDLED gem on Ruby 3.4 that liquid 4.0.4 needs; commit a Gemfile.lock without it and CI goes dark with `cannot load such file -- bigdecimal`. |
| `_data/nav.yml`             | new starter (2026-10-25): the layout iterates `site.data.nav`, and an empty sidebar was the silent first-render gap - the starter links only pages the shell ships, with exemplar rows commented |
| `_layouts/default.html`     | extracted; brand paths also ride `site.baseurl`, theme key `flowforge-theme`, tokens neutralized |
| `default.html` (brand + tokens) | flowforge round (2026-10-25, parity with web): header brand `flow`/`forge`, both GitHub hrefs -> dhaupin/flowforge, doc-footer -> flowforge is open source / the site / terms / privacy / the Creadev family, layout title -> `flowforge docs | flowforge` (the og:title placeholder leak from issue #3's trim verification dies here), home sample identity in index.md -> flowforge truth. TOKEN RECONCILIATION: `--surface` dark #0d1017 -> #161b24 and `--accent-deep` -> #5166c7/#33449e - aligned to the WEB token sheet as the single brand truth (freestruct's adapted docs carries #4055c5-style values in ITS palette, and crashtest's docs has the same undeclared accent-deep web declares - proof the value is adopter brand data, one sheet wins). |
| `_layouts/default.html` (trim) | trim (2026-10-25, issue #3 precursor): the head now carries title + description ONLY (Jekyll-owned frontmatter facts) - canonical/og:title/og:description/og:url/og:type/og:site_name/JSON-LD move to freestruct's missing-only engine surface, so its audit grades zero consumer rows. Transcribed from freestruct's own adapted default.html @ 4e1facc, same-day. Rode along: `--accent-deep` token declared in both themes (the Rouge .no/.mi rules referenced it while :root never declared it). Per-page robots/noindex line stays (frontmatter fact; missing-only engine respects it). |
| `icon.svg`                  | placeholder, byte-identical with `web/public/icon.svg` (the two-surface brand contract)        || `index.md`                  | sample page; proves the frontmatter gate + Rouge highlighting. Identity updated to flowforge (2026-10-25 branding round); body's three instructional sections kept character-for-character |
| `_freestruct/inject-brand.html` | extracted shape, placeholders genericized (adds twitter/og:image/JSON-LD the layout lacks)  |
| `discussions/index.md`      | new sample (2026-10-25), genericized from crashtest's release-post index: `announcing-vX.Y.Z.md` per release, the file's raw markdown IS the announcement (strip frontmatter, post), lint-gated like every page |
| `freestruct.config.yml`     | new glue (unpacked 2026-10-25): the config the docs-deploy freestruct step DISCOVERS from repo root (`docs/freestruct.config.yml`, legacy `ssr-config.yml`) - missing from the crashtest cut and would have red-lit the first docs deploy; placeholder identity mirrors `_config.yml` |
| `_freestruct/inject-brand.html` (trim) | retro-fit (2026-10-25, issue #3): the template shipped the dupe-free shape from the crashtest cut (extraction SHA: dhaupin/crashtest@905aa91) - twitter/og:image/JSON-LD ONLY against the old baked-head layout; with the layout trimmed to title+description it now carries the full per-page engine set (canonical + og:title/description/url/type/site_name/locale via the engine's {{pageTitle}}/{{pageUrl}} placeholders, per freestruct's own adapted template @ 4e1facc) - twitter set + SoftwareApplication JSON-LD (Organization author identity, the `{{siteAuthor}}`-fix receipt) unchanged. |
| `_freestruct/inject-brand.html` (fix) | unpacking fix (2026-10-25): the `{{siteAuthor}}` placeholder is not in the pinned freestruct substitution table (seo.js @ dfb30aa498) and would have shipped literally; author block now rides the supported `{{siteName}}`/`{{siteUrl}}` as an Organization |

## web/ (prestruct landing shell)

| file                        | receipt                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `package.json`              | extracted deps (react/react-dom/react-router-dom pinned as in source)                        |
| `vite.config.js`            | byte-exact copy                                                                              |
| `ssr.config.js`             | extracted shape; identity + routes are the adopter's data (one route per AppLayout Route)      |
| `index.html`                | extracted; theme key `flowforge-theme`, no-flash bootstrap retained                           |
| `src/App.jsx`, `src/main.jsx`, `src/islands.js`, `src/hooks/usePageMeta.js` | byte-exact copies (engine files - copy once, never edit) |
| `src/AppLayout.jsx`         | extracted shape; routes reduced to the shell's                                               |
| `src/AppIslands.jsx`        | extracted template; registry empty + commented usage                                          |
| `src/components/Nav.jsx`    | extracted; brand text + GitHub href are placeholders; header order kept: GitHub icon > theme switch > menu > burger |
| `src/components/ThemeSwitch.jsx` | byte-exact copy, theme key `flowforge-theme`                                            |
| `src/components/Footer.jsx`, `src/components/navItems.js` | extracted shape; one shared nav vocabulary                  |
| `src/styles.css`            | extracted design system; palette values neutralized (token NAMES and structure are the contract, values are your brand) |
| `public/_headers`, `public/_redirects` | byte-exact copies (CSP + no-SPA-fallback redirect wisdom)                          |
| `public/icon.svg`           | placeholder (matches docs/icon.svg byte-equal)                                               |
| `public/icon-192.png`, `icon-512.png`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.png` | generated (unpacked-day 2, 2026-10-25): rasterized from `public/icon.svg` via @resvg-js OUT-OF-TREE (no rasterizer dep committed); og-image is the token composition (paper + line frame + the mark + wordmark) - making the webmanifest/favicon links stop 404ing. CRASHTEST'S PNGs were NOT imported (brand data stays per-repo). |
| `scripts/repair-404.cjs`    | new (unpacked-day 2, 2026-10-25, flowforge-authored): UPSTREAM prestruct bug receipt - engine `generate404()` uses function replacers whose return strings carry literal `$1/$2`, which function form does NOT expand (string replacers do). Whole description/og:title/twitter:title/canonical tags get consumed and ship as leaked text the browser hoists into the body (live on crashtest.creadev.org's 404 too; tracked upstream since 2026-10-23 as prestruct#33 with the root-fix proposal in prestruct#42 - generate the 404 through the injection pipeline - still present in npm 1.1.0 and repo main, unfixed; RETIRE this script at the pin bump that carries the #33/#42 fix). Rewrites the four tags from ssr.config truth + ASSERTS clean (no `$1/$2`, exactly one description, canonical on origin); wired AFTER `prestruct build` in web build. |

## scripts/ (the docs gates)

| file                        | receipt                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `check-docs-frontmatter.cjs` | byte-exact copy (gate: 4 required fields, baseurl-relative permalinks)                       |
| `check-docs-links.cjs`      | extracted; `SITE_PREFIX` now a one-line constant to mirror your baseurl                        |
| `check-docs-style.cjs`      | byte-exact copy (voice/hyphen rules)                                                          |
| `check-fiction-signatures.cjs` | same scanner logic; seed signatures are GENERIC - seed your own the moment a fiction is caught twice |
| `check-jekyll-filters.cjs`  | byte-exact copy (the two-arg single-arg Liquid filter trap - found live in packstruct CI, crashtest#23) |

## .github/workflows/

| file                        | receipt                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `docs-deploy.yml`           | extracted from crashtest docs.yml; includes the TOKEN-AUTH pagefind scrape (rate-limit lesson) and the PINNED freestruct install (npm `^1.1.0` since 2026-10-25/issue #3 - was the git-ref pin) || `release.yml`               | template: npm Trusted Publishing (OIDC), no publish tokens, tag-driven |
| `test.yml`                  | new (2026-10-25, same-day CI hookup): the shell's push/PR battery - the five scripts/ gates, web build (prestruct + repair-404 assert), docs Jekyll build (PR coverage docs-deploy doesn't give), packstruct lint over packs/ (pinned npm 1.0.0; empty shell = 0 packs checked, exit 0, the first pack.json is gated from its first commit) and a crashtest row ARM-GATED on `crashtest.config.js` existing (crashtest run without a config is a hard exit 2, not a pass - the shell has no handlers to attack yet; remove the `if:` lines the day a config lands). Family posture: poststruct + eyestruct = TBA slots documented in the workflow header (both repos are README/horcrux stubs; no CLI to pin - wiring them before a CLI exists would be theater). |

## Engine pins (bump = deliberate review)

| engine     | pin                                                  | why                                                                         |
| ---------- | ---------------------------------------------------- | --------------------------------------------------------------------------- || prestruct  | `^1.0.0` (npm; matches the source repo's shipped pin) | the prerender engine - floating = random deploys |
| packstruct | `1.0.0` (npm; test.yml) | the /packs manifest lint - exact pin; bumps move this row in the same commit |
| crashtest  | `1.1.0` (npm; test.yml, ARM-GATED on crashtest.config.js) | the adversarial-QA runner - pinned & parked until the shell has a target (no handlers = no config = no run) |
| freestruct | `^1.1.0` (npm; docs-deploy.yml) - was github `dhaupin/freestruct#dfb30aa498`, moved 2026-10-25 (issue #3): the npm name finally published, and 1.1.0 reorganized `docs/lib/` -> `engine/` + a `bin/freestruct.mjs` shim, so the git-sha install was already pointing at a tree that no longer matches the invocation. Bumped to semantic npm pin the same day the tag shipped; the PINNED lesson stands, only the transport changed. Invoke now: `node node_modules/freestruct/engine/inject.js` (the engine moved out of docs/lib at 1.1.0; the npm package's old docs/lib path is gone). |
| pagefind   | latest-resolve IN CI, token-authenticated, hard-refused on an unparseable tag | unauthenticated scrapes get rate-limited from shared runner IPs          |
| actions    | `actions/checkout@v4`, `actions/setup-node@v4`, `upload-pages-artifact@v3`, `configure-pages`/`deploy-pages` as pinned in the copied workflow | |

## Repo-level docs and the agency layer

| file                        | receipt                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `AGENTS.md`                 | new (this cut): agent cheat sheet - map, house rules, version protocol; crosslinks README/DEPLOY/CHANGELOG/labs/packs |
| `DEPLOY.md`                 | new (this cut): the deploy + release runbook (web/CF-Pages shape, docs/Pages, npm OIDC); crosslinks |
| `CHANGELOG.md`              | new (this cut): npm-format log; entries ride the same commit as version bumps                  |
| `labs/TASKS.md`             | new (this cut): seeded rolling log; every session appends receipts                             |
| `packs/README.md` + `packs/.gitignore` | new (this cut): the /packs contract + struct-family links; `packs/local/` gitignored |
| `package.json` (root)       | new (this cut): npm-publishable metapackage @0.9.0, `files` = the rig, no runtime deps         |
| `web/package.json`          | version moved to 0.9.0 (kept equal with the root version - the version protocol)               |

## Bump procedure

1. Change the pinned SHA/version in the workflow or `MANIFEST.md`.
2. Run the verify suite in the README.
3. Land all of it (works + receipt bump) in the SAME commit - the rig's docs
   must never claim a state the workflows do not run.
