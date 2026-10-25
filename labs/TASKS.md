# labs/TASKS.md - the rolling work log

One file, appended per landing/session, newest last, with receipts (files,
gates, SHAs). The house law this file serves: **the log is the memory** -
the next agent should never guess what happened. Conventions live in
[../AGENTS.md](../AGENTS.md); versioned product changes also get a
[CHANGELOG.md](../CHANGELOG.md) entry in the same commit.

## Open asks (carry forward until landed)

- _none yet - the 0.9.0 scaffold cut is the first entry below._

---

### 2026-10-25 - test.yml: packstruct + crashtest wired from start (poststruct/eyestruct TBA slots documented)

- Lead-in receipts, from answering the user's "did we hook packstruct +
  crashtest into CI?" question: the shell shipped NO family CI (docs-deploy
  + release only), /packs was the README-contract-only empty state by
  design, and the packstruct-in-CI + crashtest-dogfood hookups live in the
  freestruct repo. User asked to wire packstruct + crashtest NOW and
  carry poststruct + eyestruct ("TBA") from the start too.

- Fact-check before wiring (truth over vibes): poststruct = README +
  horcrux parked archive + labs stubs (NO product), eyestruct = README
  only. Both on npm-ready: packstruct@1.0.0, crashtest@1.1.0.

- `test.yml` (new, the shell's push/PR battery):
  1. the five scripts/ gates (npm run check + lint:docs),
  2. web build through the ENGINE's own gates (prestruct build + the
     repair-404 assert-clean step - so a prestruct#33-class leak also
     red-lights CI, not just deploys),
  3. docs Jekyll build (PR coverage docs-deploy's main-push-only lane
     doesn't give),
  4. packstruct lint over packs/ - PINNED npm 1.0.0, vacuous green
     proven locally ("0 pack(s) checked", exit 0) on the empty-shells
     state; the first pack.json is gated from its FIRST commit,
  5. crashtest row ARM-GATED on crashtest.config.js existing (checked
     upstream first: `crashtest run` with no config is a hard EXIT 2,
     never a pass - the shell has no handlers/scripts to attack yet, so
     the step parks with pinned crashtest@1.1.0 instead of fake-red;
     remove the `if:` lines the day a config lands).

- poststruct + eyestruct: explicitly NOT wired, wired = theater with no
  CLI to pin. Both live as documented TBA slots in the workflow header
  with individual wake conditions (poststruct: published check-profile
  CLI or first check-profile pack in packs/public/; eyestruct: same rule
  once it exits README-only). Pins never float: any future bump moves
  the MANIFEST row in the same commit (workflow header says so too).

- CI CAUGHT the first mark, same commit (the battery earning its keep
  one run in): the first CI run red-lit packstruct lint with
  "missing packs//public/ - packs live at <packs-root>/public/<name>/""
  - the shell NEVER committed packs/public/ (empty dirs don't track,
  and the cut only shipped packs/README.md + packs/.gitignore) while
  my local pre-push probe ran in a scratch tree that HAD created
  packs/public manually - masking the defect. Fix: packs/public/.gitkeep
  committed so the tracked tree carries the contract shape; packstruct
  re-run locally against the REAL repo tree: 0 packs / exit 0.
  FICTION CLASS (first catch, so no new gate per house law - second
  catch mints one): "a verification run in a constructed fixture can
  pass for the repo; run the pre-push probe against the REAL tree".

- Local verify before push: js-yaml parse of test.yml OK, npm run
  lint:docs PASS, npm install+build --prefix web = 3/3 pages +
  REPAIR-404 PASS. CI run (40236634491) proved the other legs: all
  gates, web build, Ruby/Jekyll docs build green first try; after the
  .gitkeep fix, packstruct also joins. crashtest rows skipped as
  designed (no crashtest.config.js yet).

- Receipts: MANIFEST.md (test.yml row + packstruct/crashtest pin rows,
  crashtest marked arm-gated). Open asks: none new.

---

### 2026-10-25 - freestruct 1.1.0 precursor close-out (issue #3: trim + pin bump, landed the same day the tag shipped)

- New tracker item flowforge#3 (filed by the freebuff-web bot) turned out
  to be a DO-IT-TODAY, not a queue item: freestruct's 1.1.0 tag was
  already on the repo + npm by the time we looked (dhaupin/freestruct
  tags: v1.0.0 @ 1e71a66, v1.1.0 @ 473318e00; npm serves 1.1.0). Two
  asks, both landed now, plus two ride-alongs.

- **Layout head trim** (docs/_layouts/default.html, transcribed from
  freestruct's own adapted copy @ 4e1facc): the baked
  canonical/og:title/og:description/og:url/og:type/og:site_name block is
  gone; the layout keeps title + description (SSG-owned frontmatter
  facts) + favicon/color-scheme and the per-page
  `{% if page.noindex %}` robots line (missing-only engine respects an
  existing robots meta, so noindex pages keep their gate). freestruct's
  audit grades zero consumer rows now.

- **Template retro-fit** (docs/_freestruct/inject-brand.html): with the
  layout trimmed, our dupe-free-from-crashtest-cut template no longer
  matches reality (it carried ONLY twitter/og:image/JSON-LD against the
  old baked head - those tags would've been owned by nobody). Now
  carries the full per-page engine set (canonical + og:title/
  description/url/type/site_name/locale via the engine's {{pageTitle}}/
  {{pageUrl}}/{{canonicalUrl}} placeholders - the same shape freestruct's
  own docs template carries), with our extras kept (SoftwareApplication
  JSON-LD + Organization author from the {{siteAuthor}}-fix receipt,
  twitter set unchanged). og:image still intentionally absent until the
  PNG set lands - the engine strips the line when no image is
  configured (verified live, the line vanishes), so no 404 bait.

- **Pin bump** (docs-deploy.yml): `github:dhaupin/freestruct#dfb30aa498`
  -> `freestruct@^1.1.0` npm, and the invocation
  `node node_modules/freestruct/docs/lib/inject.js` -> `node
  node_modules/freestruct/engine/inject.js` (1.1.0 reorganized docs/lib
  -> engine/, added a bin/freestruct.mjs shim; the old docs/lib path is
  GONE in the npm package - contents API 404s at the tag). Contract
  verified engine-side @ v1.1.0: config still discovered walking up from
  cwd, output defaults to docs/_site next to the config, positional
  override + --strict unchanged. Local smoke run (npm 1.1.0 engine,
  scratch tree with our config + template + a trimmed-head shape page):
  exit 0, og/canonical fills are per-page, twitter + JSON-LD present,
  no og:image (stripped), missing-only left the pre-existing description
  alone, rerun dedupes the injected region.

- Ride-alongs from the same walk, landed with it: `bigdecimal ~> 3.1`
  into docs/Gemfile (a BUNDLED gem on Ruby 3.4 that liquid 4.0.4 needs;
  the day a Gemfile.lock gets committed, CI goes dark without it), and
  `--accent-deep` declared in docs/_layouts/default.html BOTH themes
  (the Rouge .no/.mi/.mf/.mh rules referenced it while :root never
  declared it - two raw-highlight classes rendered colorless since the
  extraction; freestruct's adapted copy fixes it upstream, so we took
  it with receipts).

- Known-not-run locally: `bundle exec jekyll build` (no Ruby on this
  host) - the Jekyll build of the trimmed layout is proven by the CI
  docs-deploy run on this push instead; everything engine-side and
  everything against the assembled head shape ran locally against npm
  1.1.0. Receipts: MANIFEST.md (Gemfile, layout-trim, template-trim
  rows; freestruct pin row moved to npm semver).

- Open asks (carry forward): the docs BRANDING homework is still open
  and now twice-visible in the head - layout title suffix ("Your Site /
  Your Site" renders as the h1-title while og:title carries it into
  search results too) + page frontmatter titles on the sample pages.
  The engine surface itself is correctly flowforge-branded (og:site_name
  = flowforge, canonical/og:url = docs.creadev.org/flowforge,
  SoftwareApplication name = flowforge). One round: swap the layout
  title line + index.md frontmatter to flowforge truth.

---

- The archived rig extraction landed: verified the parked seed archive
  byte-for-byte first (`sha256 horcrux/flowforge.tar.gz` =
  `51577a971225419c277051a3570763e2bc6b0bea2c6ad02b3839293b916e093a`,
  matching the receipt in the onboarding issue), then unpacked it and moved
  `flowforge/*` to the repo root (the rig is written as a root tree:
  MANIFEST paths are root-relative, `web/` + `docs/` + `scripts/` sit at
  top). `horcrux/` stays as the parked archive; `LICENSE` kept. The rig's
  own README replaced the 11-byte stub.
- Issue #1 convention pulls folded in: direct Creadev.org backlink bullet
  added to the root README's map section (the workshop -> creadev.org);
  second ask already satisfied by the rig - `docs/discussions/index.md`
  ships the file-IS-the-post release-post boilerplate. Edited that index
  to point the exemplar link at crashtest's conventions index +
  announcing-v1.0.0 per the amended convention (the prestruct link was the
  older shape issue #1 says to skip). File-body edits only; receipt
  discipline: no MANIFEST rows rewired, changes logged here.
- Gates run on the unpacked rig: `npm run check` PASS (all five gate
  scripts compile), `npm run lint:docs` PASS (frontmatter 2 pages, links
  2 files, style 2 files, fiction 26 files/4 signatures, Jekyll filters).
  `npm install --prefix web && prestruct build`: **1/1 pages rendered,
  exit 0** (this genericized cut ships one route - N/N is the healthy
  signal; the source repo's 6/6 bullet is crashtest-specific).
- Observed, not bent: one dev-mode JSX warning from the extracted
  react-router UMD build ("Invalid value for prop `className` on <a>")
  during prerender. Engine files are byte-exact copies (MANIFEST web/;
  copy once, never edit), so nothing was touched for it - logged for the
  next bump review instead.- Unpack audit dot (same session, still 2026-10-25): the docs-deploy freestruct step discovers its config from repo root (`docs/freestruct.config.yml`, legacy `ssr-config.yml`) and the crashtest cut shipped NEITHER - the layer would have been dropped - so added `docs/freestruct.config.yml` (placeholder identity mirroring `docs/_config.yml`). While wiring it, checked the pinned freestruct substitution table (seo.js @ dfb30aa498): `{{siteAuthor}}` in `_freestruct/inject-brand.html` was never a supported placeholder and would have shipped literally into the JSON-LD; the author block now rides the supported `{{siteName}}`/`{{siteUrl}}` (Organization). Both receipts landed as new rows in [../MANIFEST.md](../MANIFEST.md).
- First docs-deploy run on main red-lit at pagefind: `_site` had ZERO .html files. Root cause: both sample pages carried `.md`-suffixed permalinks (`permalink: index.md` / `discussions/index.md`) - Jekyll preserves the permalink extension verbatim in output, so the site emitted `_site/index.md` / `_site/discussions/index.md` (HTML inside .md filenames). It exited 0 and looked healthy locally; only the hard-failing pagefind caught it. Fixed to the gate-shaped permalinks (`/` for the docs home, `discussions/` for the release-posts index). FICTION CLASS logged (first catch, so no new gate per house law - second catch mints one): "a permalink that exits every gate but ends in .md renders zero html; only the search-index step refuses".
- Second docs-deploy run: GREEN (build + deploy, run 40161588398). Site live at https://docs.creadev.org/flowforge/ (HTTP 200 + HTTPS 200; Pages API reports no repo-level CNAME, the docs.* domain resolves family-side). With the real deploy home now observable from the deployment URL, swapped the `/project` + `your-site.example.com` placeholders for the computed truth: `docs/_config.yml` (url `https://docs.creadev.org`, baseurl `/flowforge`), `scripts/check-docs-links.cjs` `SITE_PREFIX` = `/flowforge` (the mirror DEPLOY.md asks for), and `docs/freestruct.config.yml` `site.url` (freestruct canonical/OG truth). `web/ssr.config.js` stays placeholder - that surface belongs to the web host, whose URL lands when the CF-Pages deploy names it.
- Same-session placeholder round (also 2026-10-25): the live docs head still carried placeholder identity and the sidebar nav was still pasted from the `/project` era, so: `_data/nav.yml` URLs moved onto the deployed baseurl (`/flowforge/`, `/flowforge/discussions/` - the layout emits `item.url` verbatim, active-state strip only), `freestruct.config.yml` identity set to flowforge truth, `og.image` REMOVED until the PNG set lands (og-image.png stays documented adopter homework; an og:image pointing at a 404 is worse than none, and the pinned freestruct dropped the tag accordingly).
- Open asks (carry forward until landed): wire the estate per issue #2 step 3 - docs-deploy.yml the real Pages lane, the web host per
  DEPLOY.md (CF-Pages shape), and the OIDC release template when there is
  an artifact to release.

### 2026-10-25 - web surface round (CF Pages live at flowforge.creadev.org)

- CF Pages first build: green (9 assets uploaded, 5 header rules parsed, 0
  redirect rules). From the deploy log + the user's screenshots, six unpack
  -audit items: leaked raw text on the 404, missing favicon/PNG wiring,
  TWO different 404 experiences, a doubled brand logo, missing syntax-tint
  class usage, unstyled CTAs, and a dead About nav route.

- 404 root cause (items 1/2/4 of the audit in one): prestruct's engine
  `generate404()` uses FUNCTION replacers whose return strings still carry
  literal `$1/$2`. A string replacer expands those group references; a
  function replacer inserts them LITERALLY - so the description/og:title/
  twitter:title/canonical tags get consumed and ship as leaked text that
  the browser hoists into the body (visibly, above the styled page).
  Verified live on crashtest.creadev.org's 404 and reproduced from the npm
  1.1.0 source - still unfixed upstream at crashtest main. Flowforge-side
  fix: `web/scripts/repair-404.cjs` rebuilds the four tags from
  ssr.config truth, then ASSERTS the repair (any leftover `$1`/`$2`, a
  missing description, or a canonical not on the configured origin exits
  1). Wired after `prestruct build` in web package.json so CF runs it too
  (CF's command is `npm run build` in web/). Also added the `notFound`
  block to ssr.config (heading/body/CTA = the SPA NotFound copy) and
  rebuilt pages/NotFound with the matching `.nf` + `.btn` shape, so the
  host-served 404 and the hydrate-rendered 404 read as ONE page, not two
  "types".
- favicon/PNG set: the 404 render keeps the build-time-injected shell head,
  so the favicon links were already there - the missing piece was the PNG
  files themselves (icon-192/512, favicon-32, apple-touch-icon, og-image
  were all 404ing). Generated from our own placeholder `icon.svg`,
  deterministically, out-of-tree (no rasterizer dep committed). NOTHING
  copied from crashtest's PNGs - their mark is brand data and stays
  per-repo. Receipts in [../MANIFEST.md](../MANIFEST.md).
- doubled logo (item 2): the genericizing cut pasted TWO
  `<img className="brand-logo">` rows into Nav.jsx; back to one. Brand text
  to `<accent>flow</accent>forge`, GitHub href to `dhaupin/flowforge`.
- CTA + syntax classes (items 3+4): styles.css never lacked `.btn`/`.code`
  rules - the cut pages had the WRONG class names (`.hero-actions` div +
  bare `.btn-primary` modifiers). Home went to crashtest's fixed shape:
  `.hero`/`.cta-row` and COMPOSED classes (`.btn` + `.btn-primary/-ghost`;
  the base class carries the geometry, ours rendered as default links),
  and the `.code` pre uses `.k` spans on commands like the docs Rouge
  output. Repo/docs CTAs point at the real dhaupin/flowforge +
  docs.creadev.org/flowforge/ surfaces (the old /docs/ href 404ed).
- terms/privacy pages (item 5): blank h1 placeholders at /terms + /privacy
  (filled-in family examples live in crashtest web/pages), routes in
  AppLayout + ssr.config entries (0.3 priority, yearly changefreq), head
  metas via usePageMeta.
- About removed from navItems (item 6) - the route led nowhere.
- React #321 receipt from crashtest, transcribed: the head-tag hook must
  live in the component BODY (hook-in-effect was an invalid hook call and
  tore the tree down on their live site); Terms/Privacy/Home call
  usePageMeta in-body now.
- CF-log warnings fixed: the `Invalid value for prop className on <a>`
  prerender warning came from the sidebar LEGAL links - plain `<Link>`
  spreads className straight onto the `<a>` and a function className there
  warns (NavLink handles function classNames, Link does not, react-router
  -dom v6.23) - those links carry no className now; plus the canonical
  placeholder (`your-site.example.com`) died with the ssr.config identity
  swap (siteUrl https://flowforge.creadev.org), and web/package.json got
  its real name (flowforge-site, version 0.9.0 = the version protocol).
- Open asks (carry forward): upstream prestruct#33 (generate404 function
  replacers emit literal $1/$2, opened 2026-10-23, root-fix proposal in
  prestruct#42) - RETIRE the repair script at the pin bump that carries
  that fix, per MANIFEST. Filed the adjacent freestruct latent as
  freestruct#24 (config-carried values riding string-form replace() in
  purge commands + head/body insertions; template core itself is split/join
  safe) - tag along a retire-note there too when both upstream fixes land.

---

### 2026-10-24 - 0.9.0 scaffold cut (the shell extracted from crashtest @ 905aa91)

- The rig was extracted, not written from memory: every file is either a
  byte-exact copy or a small genericization of a deployed, verified surface
  - the per-file receipts live in [../MANIFEST.md](../MANIFEST.md)
  (extraction SHA: dhaupin/crashtest@905aa91, which itself carried the
  theme-port + highlight work verified same-day: suite green, web prerender
  6/6 pages, docs deploy live).
- What landed: `web/` landing shell (light/dark switch, tokens-only palette,
  one nav vocabulary, islands engine), `docs/` Jekyll rig (pagefind search,
  shared Rouge token colors, freestruct SEO layer), five `scripts/` gates,
  two workflows (docs deploy with the hardened pagefind scrape + PINNED
  freestruct; npm OIDC release template), plus this log,
  [../CHANGELOG.md](../CHANGELOG.md) 0.9.0, the
  [../packs/README.md](../packs/README.md) contract, and the three
  crosslinked core docs ([../README.md](../README.md) /
  [../AGENTS.md](../AGENTS.md) / [../DEPLOY.md](../DEPLOY.md)).
- Verification receipts (run on the extracted rig, not the source): all five
  docs gates PASS against the generic `docs/` (1 sample page), fresh
  `npm install` + `prestruct build` prerendered the shell clean (1/1
  pages, zero JSX warnings), `web/public/icon.svg` and `docs/icon.svg`
  verified byte-equal (the two-surface brand contract).
- Deliberately left for adopters (documented, not shipped): PNG icon slots +
  `og-image.png` (referenced in `site.webmanifest`), the docs sidebar data
  (`docs/_data/nav.yml` - one group/`items` shape, see the sample page),
  and any pack content (`packs/public/` stays empty in the shell).
- First release path (manual, per [../DEPLOY.md](../DEPLOY.md)): bump check
  -> `v0.9.0` tag -> OIDC publish -> GitHub release from the tag with the
  changelog entry as its body.
