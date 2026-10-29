# labs/TASKS.md - the rolling work log

One file, appended per landing/session, newest last, with receipts (files, gates, SHAs). The house law this file serves: **the log is the memory** - the next agent should never guess what happened. Conventions live in [../AGENTS.md](../AGENTS.md); versioned product changes also get a [CHANGELOG.md](../CHANGELOG.md) entry in the same commit.

## Open asks (carry forward until landed)

- _none yet - the 0.9.0 scaffold cut is the first entry below._

---

### 2026-10-25 - family reqs round: filed upstream, two blocked on repo access

- User asked for any issues/reqs we hold to go upstream. Duplicate-checked
  all five trackers first, hard-verified the two candidate bugs before
  filing (one candidate DIED on verification: freestruct's audit exit
  code is CORRECT - exit 1 on ok:false, my earlier misread was pipe
  contamination through `head`; and /terms is fully prerendered with
  proper head tags, so no prestruct ask either). Filed:

- **freestruct#28** (new): audit per-page config-gated warns collapse -
  og:image/twitter:image-absent lines are identical on every page
  (verified: 2 pages = 2x2 lines, 4 pages = 4x2), config-shaped not
  page-shaped; ask = one `(config): ... - N page(s) affected` line,
  keep per-page for genuinely page-shaped classes (title/description
  length). Precedent cited: prestruct's validateConfig/formatDiagnostics
  collapse. Filed with the full terminal receipts.

- **crashtest#37** (new): proposal for an opt-in vacuous-green
  (`--allow-vacuous`) so shells in the pre-handler lifecycle state can
  keep the pinned install + CI row LIVE instead of hashFiles-parked
  (exit 2 stays the default; flag prints one honest "0 handlers, 0
  attacks" line). flowforge is first adopter on ship - deletes our two
  `if:` lines + the workflow comment.

- **packstruct#13 comment: BLOCKED** - the Freebuff GitHub App gets
  `Resource not accessible by integration (addComment)` on dhaupin/
  packstruct; this is the known access gap, documented as crashtest#18
  ("reconnect poststruct + packstruct to the Freebuff GitHub App (both
  403; blocker is repo access only)"). Content banked below until access
  lands: our CI run 40236634491 is the second live instance of the
  confusing-root-message class (packs//public/ double slash + the real
  fix being a packs/public/.gitkeep commit since git does not track
  empty dirs) - add as a #13 comment + message-improvement note.

- **poststruct / eyestruct: filed NOTHING, honestly** - poststruct has a
  live queue but nothing flowforge-shaped to add (its check-profile CLI
  doesn't exist; our TBA wake-conditions already cite it); eyestruct is
  an empty README stub. eyestruct also blocked by the same App access
  gap, so even convention pulls would 403. Revisit both when they ship a
  surface.

- Housekeeping for whoever next holds the keys: when packstruct/
  poststruct/eyestruct are granted to the App, this entry's banked
  packstruct#13 comment is the only outstanding delivery.

---

### 2026-10-25 - docs branding + token reconciliation round (parity with web)

- The user spotted the asymmetric branding: web got the flowforge identity
  in its first rounds while docs still carried placeholder everywhere.
  Parity audit found and closed, in docs/_layouts/default.html +
  docs/index.md:

- Identity (5): header brand text `your`site -> `flow`forge; header +
  footer GitHub hrefs your-org/your-project -> dhaupin/flowforge;
  the doc-footer four-link placeholder row -> "flowforge is open source
  - site flowforge.creadev.org - terms - privacy - part of the Creadev
  family" (family-shape, credit to freestruct's footer for the
  conventions-index wording); layout title line "Your Site Docs" /
  "Your Site" -> `{{ page.title | default: "flowforge docs" }} |
  flowforge` (the `Your Site / Your Site | flowforge` og:title that the
  head trim started exposing into search results dies here - the open
  ask logged in the issue #3 precursor entry CLOSES); index.md
  identity -> title `flowforge docs` + real description while KEEPING
  all three instructional body sections (highlight sample, build
  commands, sidebar-nav doc) intact - a first overwrite dropped them,
  caught in the diff before commit and restored.

- Token reconciliation (the drift the audit found beyond identity):
  docs-layout `--surface` dark #0d1017 -> #161b24 and `--accent-deep`
  -> dark #5166c7 / light #33449e, both aligned to the WEB styles.css
  sheet as the one brand truth. Family receipt first (adopt honestly,
  not from vibes): freestruct's adapted default.html carries ITS
  palette's values (#4055c5/#2f44b8, what our last round transcribed)
  and crashtest's own docs layout has the same UNDECLARED accent-deep
  its web half declares - so the value is adopter brand data, not
  engine data, and flowforge's web sheet is the adopter truth here.
  Docs keeps its --ink-light alias + layout dims (header-height/
  sidebar-width) and web keeps --nav-bg/--accent-contrast - surface
  roles differ, values now don't.

- Verified: lint:docs PASS (frontmatter 2 pages, links, style, fiction
  now scanning 29 files, filters). The Jekyll + engine build is proven
  by the CI docs-deploy + test battery on this push (no local Ruby);
  live-check after deploy: header brand, footer links, layout title, and
  og:title = "flowforge docs | flowforge".

- Note (unchanged, documented homework): docs og.image still deliberately
  absent (the PNG set is web-side truth; an og:image pointing at a 404
  is worse than none until the docs PNG set lands).

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

---

### 2026-10-29 - two-bucket round on `staging` (Buckets A + B)

Branch `staging` off `main` @ df86464 (2026-10-25 "Family reqs round"), clean tree, shallow clone. Version stays 0.9.0 (no tag yet - the census leg holds every surface honest meanwhile). All 29 open issues read via the GitHub REST API (gh CLI unauthenticated -> GITHUB_TOKEN + REST). Receipts gathered from dhaupin/{eyestruct,prestruct,crashtest,freestruct}.

**Bucket A - adopt the fixes the newest family repos already paid for**

- A1 (#16): `web/public/robots.txt` - flowforge crawler policy + sitemap pointer (`https://flowforge.creadev.org/sitemap.xml`).
- A2 (#7): Rouge/code token parity - `docs/_layouts/default.html` Rouge block expanded (`.cs/.ch` comment rules, `--err` token) and a matching `.code` syntax-token block added to `web/src/styles.css` (same class vocabulary + palette).
- A3 (#13): mobile table guard - `docs/_layouts/default.html` `.main { min-width: 0 }`; `web/src/styles.css` `table:not(.attacks)` display/overflow guard + `.table-wrap` (transcribed from eyestruct).
- A4 (#15): `docs/_layouts/default.html` header brand link now `{{ site.baseurl }}/`; `docs/_data/nav.yml` gained a Reference group ("Release posts"); `docs/discussions/index.md` leaned + a flowing-prose note.
- A5 (#6): `web/src/islands.js` observer guard (`mounted`/`observers`/`observing` WeakSets; `mount()` disconnects its observer) - transcribed from prestruct `engine/src/islands.js`.

**Bucket B - bring the process surfaces up to the family standard**

- B1 (#25): flowing prose. `scripts/unwrap-prose.cjs` transcribed from eyestruct; ran it over README/AGENTS/CHANGELOG/DEPLOY/MANIFEST/labs/docs (no re-wrap); gates green after.
- B2/B7 (#23/#29): the publish ladder. `package.json` gained `test` + `prepublishOnly` (`npm test && npm run check && npm run lint:docs`); `release.yml` gained a gate refusing 0.x and a tag that disagrees with the packaged version (every github context value reaches the script through env, never inline interpolation).
- B3 (#22): root `.gitignore` (docs-preview block) + a `DEPLOY.md` out-of-tree local-preview recipe (unpacked Ruby in `$HOME`, shimmed binstubs, `BUNDLE_PATH` outside the repo, build from a scratch copy of `docs/`).
- B4 (#24): `scripts/ship-from-download.cjs` + `tests/ship-from-download.test.cjs` (21 pass; renamed `.cjs` - the root package is ESM).
- B5 (#17): `web/scripts/adopt-icons.mjs` (sharp + potrace + resvg -> traced SVG + icon set + authored `brand-mark.json`) and `web/scripts/og-image.mjs` (1200x630 card consuming the mark + `ssr.config.js` identity). Both smoke-tested on synthetic art; generated output reverted (the pipeline is the deliverable, not new icons for the shell).
- B6 (#10/#11): `docs/_freestruct/inject-brand.html` upgraded to the engine-edition JSON-LD (Organization + WebSite pair, `{{authorJson}}` founder seam, `{{searchActionJson}}` seam); `docs/freestruct.config.yml` gained `author` + `jsonLd` identity. Verified LIVE against the pinned freestruct 1.1.0 engine on a scratch build - the injected head carries the founder Person, the maintainer Person, and the WebSite block.
- B8 (#12): `scripts/lint-packs.cjs` + `npm run lint:packs` (wrapper verb); `test.yml` routed through it. Verified both paths: exit 2 naming the exact-devDep fix with no install, exit 0 with packstruct 1.0.0 installed.
- B9 (#5): `scripts/check-birth-gate.cjs` (five checks: workflow YAML parse + duplicate-key refusal, mount independence, gc-safe serde, determinism note, and the pins-never-float rule - every `uses:` must be a 40-hex SHA), wired into `npm run check`; consumes the root `js-yaml` devDep + a committed lockfile.
- B10 (#6): every action SHA-pinned across `test.yml`, `docs-deploy.yml`, `release.yml` (checkout v7, setup-node v7, ruby/setup-ruby v1.335.0, upload-pages-artifact v5, deploy-pages v5) - the comment names the human tag, the birth-gate's fifth check enforces the 40-hex form, and each SHA was verified to map to its claimed tag via the API.
- B11 (#28): `tests/census.test.cjs` - the version-truth census leg (root `package.json` is THE version source; `web/package.json` + the README Status line cannot drift). README gained the Status line the leg pins.

**Gates (all run on the branch)**

- `npm ci` -> clean (one root devDep: js-yaml).
- `npm test` -> 22 pass / 0 fail (census + 21 ship-lane behavior tests).
- `npm run check` -> PASS (five gate compile checks + birth-gate lane: 3 workflows parsed, 4 checks incl. 9 action refs all SHA-pinned).
- `npm run lint:docs` -> PASS (frontmatter, links, style, fiction signatures, jekyll filters).
- `npm run lint:packs` -> PASS (packstruct 1.0.0 over packs/, 0 packs checked).
- `npm install --prefix web && npm run build --prefix web` -> 3/3 pages rendered, REPAIR-404 PASS.
- freestruct engine smoke test (pinned 1.1.0) -> injected head carries founder + maintainer + WebSite JSON-LD.

**Receipts / SHAs**

- Extraction source receipts (real SHAs, verified via the API at extraction time): dhaupin/eyestruct `scripts/unwrap-prose.cjs` @ 3adda1dc, `scripts/ship-from-download.cjs` @ 9744c768 (+ `tests/ship-from-download.test.js`), `lib/lint-packs.js` @ cd135a91, `web/scripts/make-icons.mjs` @ e4a73ac (introduced 6556225) + `web/scripts/og-image.mjs` @ 33a7c19, `tests/census.test.js` @ 3d8a822 (introduced); the local docs-preview recipe @ 8a194ad + its gitignore block @ ca2f62a; prestruct `engine/src/islands.js` @ 59cb0469; the Rouge full-vocabulary block @ prestruct c915760 and the mobile table guard @ eyestruct 138fda9.
- Action pins: checkout `3d3c42e5aac5ba805825da76410c181273ba90b1` (v7), setup-node `949feb2413d6458794dcd2491c4babbbce0c15c1` (v7), ruby/setup-ruby `7f797815d8adceb1c412e7abefdd1ab4abc47a5f` (v1.335.0), upload-pages-artifact `fc324d3547104276b827a68afc52ff2a11cc49c9` (v5), deploy-pages `368f82528645a54fb793d4d04e342629a3f51346` (v5).

**Left open (next round candidates)**

- #27 / #29 remainder: poststruct + eyestruct CI slots stay TBA (both are README/horcrux stubs - no CLI to pin yet).
- #4: the deterministic-pack / pack-twice byte-compare step is noted by the birth-gate but not exercised (the shell ships no packer).

## 2026-10-29 (later) - logo round: the icon pipeline runs on real art (issue #17)

The user supplied brand art at `web/public/brand/flowforge-logo.jpg` (203301 bytes, 2048x2048, moved off the `public/` root into `public/brand/` to match the family convention - eyestruct ships `web/public/brand/`, and the script's own example is `--art public/brand/logo.png`). Ran the pipeline on it and found a real bug inherited from the extraction source.

**The bug: the icon shipped as a photographic negative.**

- `web/scripts/adopt-icons.mjs` builds `inkMask` by setting ink pixels to **255 (white)** on a 0 (black) field, then calls potrace with `blackOnWhite: true`. potrace's `blackOnWhite` means "the input is dark-on-light, trace the DARK pixels" - so it traced the **background frame**, not the mark. The script then fills that frame with the light ink color, and the icon renders as a light tile with a dark mark: the negative of the art.
- Receipt: upstream `dhaupin/eyestruct` `web/scripts/make-icons.mjs` @ e4a73ac carries the exact same line (`potrace.trace(inkPng, { ..., blackOnWhite: true }, ...)` over the same ink=255 mask), so the class is inherited, not introduced.
- Proof, not a guess: correlate the traced fill against the ground-truth ink mask. `blackOnWhite: true` -> **-0.999** (perfectly inverted); `blackOnWhite: false` -> **+0.999**. End-to-end, the rendered `icon.svg` correlates with the source art at **-0.648** before and **+0.658** after the fix.
- Fix: `blackOnWhite: false` (trace the white pixels the mask actually wrote), plus an in-script **polarity guard** - it compares the traced-path bbox to the ink-mask bbox and throws if the paths span the full frame while the mask is inset (exactly the inverted case), so the class cannot return silently. Negative-tested: forcing `true` makes the script exit 1 with the named error.
- Regenerated the whole set from the real art: `icon.svg` (both faces, byte-equal), `icon-192/512.png`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.png`. Verified orientation (dark tile, transparent rounded corners, light mark, accent ring + horizontal strike) and byte-parity `web/public/icon.svg` == `docs/icon.svg`.

**Also fixed**

- `MANIFEST.md` - the `icon.svg` row had merged with the `index.md` row (a stray `||`); split, and the icon rows now say REAL BRAND ART instead of "placeholder", with the brand-master row and the adoption-fix note on the `adopt-icons.mjs` row.
- `CHANGELOG.md` - Added entry for the brand master + regenerated set; Fixed entry for the polarity adoption fix.

**Gates (all green on the branch)**

- `npm test` -> 22 pass / 0 fail.
- `npm run check` -> PASS (five compile checks + birth-gate: 3 workflows, 4 checks incl. 9 SHA-pinned action refs).
- `npm run lint:docs` -> PASS (frontmatter, links, style, fiction signatures, jekyll filters).
- `npm run build --prefix web` -> 3/3 pages rendered, REPAIR-404 PASS; `dist/brand/flowforge-logo.jpg` ships (adopter brand data, the eyestruct convention).

Version stays 0.9.0 (no bump, no OIDC - the user's manual push comes first).

---

### 2026-10-29 - session: staging branch in CI (c), paint-scheme axis + picker (e), repair-404 blocked (d)

The user asked for all three carry-forward options this session. Two landed; one is honestly blocked on an unpublished upstream fix.

**c - the permanent `staging` branch (issue #30)**

- `.github/workflows/test.yml` - the push trigger is now `branches: [main, staging]`, so the integration branch runs the whole battery (gates, web build, docs build, packstruct, crashtest row), not just `main`. Before this, work could pile up on `staging` with zero CI signal.
- `.github/workflows/docs-deploy.yml` - push now also fires on `staging` (docs-build validation on the integration branch), and the `deploy` job carries `if: github.ref == 'refs/heads/main'`. This is the #30 point-3 trap: once `staging` is a trigger, the trigger itself no longer keeps staging's content out of production - the job guard does. Without the guard, a push to `staging` would publish.
- `DEPLOY.md` - new "## 3. The staging branch (issue #30)" section; the following sections renumbered to 4/5/6 (a duplicate `## 4` died in the process).
- Receipt: the birth-gate re-ran clean after the edits - "BIRTH-GATE: PASS (3 workflow(s) parsed, 4 checks clean)" - so the new trigger/gate survive the YAML-parse + SHA-pin checks.

**e - the paint-scheme axis + palette picker (issues #18 petrol, #19 jade, #20 picker, #21 golden hour)**

- `web/src/styles.css` - a second, orthogonal axis beside light/dark: `html[data-scheme="petrol|golden|jade"]` token blocks that override only the identity tokens (iris stays the default - it IS the base `:root`). Each preset is a FULL palette with a `html[data-scheme=...][data-theme="light"]` half, so light mode always wins inside every scheme. golden/jade share one warm-graphite cast and differ only in the accent trio. No layout class branches - house rule 1 holds.
- `web/src/theme.js` (new) - the two axes as data: `THEME_KEY`, `SCHEME_KEY`, `SCHEMES`, and `paperFor(scheme, theme)` (the per-scheme paper map the theme-color meta reads). One source for the switch, the picker, the bootstrap, and the gate.
- `web/src/components/SchemeSwitch.jsx` (new) - a native `<select class="scheme-switch">` beside the light/dark switch; writes `<html data-scheme>`, persists `flowforge-paint-scheme`, re-sets theme-color via `paperFor`. Hydration-safe: the first client render is the deterministic default (matching prerender), and an effect adopts the persisted scheme after mount.
- `web/src/components/ThemeSwitch.jsx` - now scheme-aware (reads `THEME_KEY`/`paperFor` from `theme.js`).
- `web/src/components/Nav.jsx` - renders `<SchemeSwitch />` before `<ThemeSwitch />`.
- `web/index.html` - the no-flash bootstrap applies BOTH axes pre-paint (theme + scheme), so a persisted scheme never flashes the wrong palette.
- `docs/_layouts/default.html` - the docs rig mirrors the whole axis: the same three `[data-scheme]` token blocks (both halves, `--accent-deep` set in each), the `.scheme-switch` picker + CSS, the two-axis bootstrap, and the change handler persisting the same key. The landing shell and the docs now agree on the palette in every scheme.
- `scripts/check-theme-parity.cjs` (new) + `tests/theme-parity.test.cjs` (new) - the parity gate (house rule 3: a bug caught twice becomes a gate). It reads `SCHEMES` from `web/src/theme.js` and refuses: a scheme present in only one surface (web styles.css vs docs layout), a scheme missing its light half or `--accent`/`--accent-deep` (the missing-accent-deep bug from #18/#19/#21), or an orphan `[data-scheme]` block the picker does not offer. Names file:line. Wired into `npm run check` and `npm run lint:docs`.
- Negative-tested, not assumed: deleting jade's light half makes the gate exit 1 naming the file; adding a `bogus` scheme block trips the orphan check; a scheme name inside a CSS comment does NOT (comments are stripped first). The seven behavior tests cover each class, green on the live tree.
- Browser-verified end to end: served `web/dist`, switched the picker to petrol, confirmed `localStorage["flowforge-paint-scheme"]="petrol"`, reloaded, and sampled the rendered page background - iris dark paper `#10131a` -> petrol dark paper `#0a1113`. The no-flash bootstrap was also unit-simulated: with `{scheme: petrol, theme: light}` it sets `data-scheme=petrol`, `data-theme=light`, and `theme-color=#edf3f2` (petrol's light paper).
- `web/scripts/adopt-icons.mjs` - documented the #20 art ruling at the source: the mark's accent is baked at generation time and stays the STATIONARY iris default (option a), so dau art never mismatches a runtime scheme switch.

**d - retire `repair-404` (BLOCKED, honestly)**

- The root fix for the literal-`$1`/`$2` 404 leak (prestruct#33, root-fix proposal prestruct#42 - generate the 404 through the injection pipeline so function replacers expand) is on prestruct `main` as **1.2.0** but is **NOT on npm**: `npm view prestruct version` = **1.1.0**, and the 1.1.0 tarball still ships the bug (`init/scripts/prerender.js` lines 426-438: `() => `$1...$2`` function replacers whose returns carry literal `$1`/`$2`). Confirmed on `main` (raw `engine/scripts/prerender.js`): the four 404 text tags now go through the injection pipeline, and the canonical uses a function replacer with a literal-result guarantee.
- Decision: `repair-404.cjs` STAYS until the pin bump that carries 1.2.0. Retiring it now would ship the leak. No code change; the blocker is recorded in `CHANGELOG.md` under "### Blocked".

**Gates (all green on the branch)**

- `npm test` -> **29 pass / 0 fail** (was 22; +7 parity tests).
- `npm run check` -> PASS (six compile checks + birth-gate 3 workflows/4 checks + theme-parity PASS).
- `npm run lint:docs` -> PASS (frontmatter, links, style, fiction signatures, jekyll filters, theme-parity).
- `npm run build --prefix web` -> "[prerender] Done. 3/3 pages rendered."; built CSS carries `[data-scheme=petrol|golden|jade]` plus their `[data-theme=light]` halves.

**House rules**

- No version bump (per the user): `package.json` = `web/package.json` = 0.9.0, still equal.
- `MANIFEST.md` - rows updated/added for `theme.js`, `SchemeSwitch.jsx`, the styles.css scheme axis, the two-axis `index.html` bootstrap, the docs-layout scheme row, `check-theme-parity.cjs`, `tests/theme-parity.test.cjs`, and the two workflow rows (also fixed a pre-existing merged `docs-deploy.yml`/`release.yml` row).
- `CHANGELOG.md` - Added entries for the theme files + presets + gate; a Changed entry for the `staging` branch; a Blocked entry for `repair-404`.

---

### 2026-10-29 - session: issue #9, the docs lane promoted to a reusable workflow

`docs-deploy.yml` was a per-repo one-off and the runbook it encoded had been hand-copied three times (flowforge / gistory / eyestruct) - and the copies had already drifted (Ruby 3.2 vs 3.4, upload-pages-artifact v3 vs v5, a pagefind scrape vs an npm pin). The issue asked to promote the lane to `on: workflow_call`.

- `.github/workflows/docs-build.yml` (new) - the reusable lane. `on: workflow_call` with inputs `docs-path` (default `docs`), `ruby-version` (3.2), `node-version` (22), `pagefind-version` (`latest` scrapes the newest release; any other value installs verbatim - the npm-pin shape the drifted copies wanted), `freestruct-version` (`^1.1.0`); output `pagefind-version`. Carries the whole runbook once: checkout, Setup Ruby, Jekyll build, the token-auth pagefind scrape (the rate-limit receipt), the search index, Setup Node, the PINNED freestruct install + post-build SEO layer, and the Pages artifact upload. Actions stay SHA-pinned; a fresh `setup-node` pin joins the set.
- `.github/workflows/docs-deploy.yml` - now a THIN CALLER (197 -> 55 lines): trigger, permissions (`contents: read` + `pages: write` + `id-token: write` - the caller grants the ceiling; the reusable half declares `contents: read` for itself), concurrency group, `build: uses: ./.github/workflows/docs-build.yml`, and the `deploy` job still gated to `main` (issue #30). The `paths:` filter gains `docs-build.yml` so a lane edit re-validates.
- `scripts/check-birth-gate.cjs` - new **check 6**, the reusable-workflow contract (house rule 3): a local `uses: ./...` must point at a file that exists AND declares `on: workflow_call`, and a `workflow_call` file must be called by someone. Both directions, so a thin-caller refactor cannot half-land. The re-parse is guarded - an unparseable file is named by check 1 and skipped here (found by the new test, not by inspection).
- `tests/birth-gate.test.cjs` (new) - 7 behavior tests: green on the live tree; caller -> `workflow_call` file (pass); caller -> non-`workflow_call` file (fail); caller -> missing file (fail); a `workflow_call` file nobody calls (fail, dead lane); a floating action pin (fail); the duplicate-YAML-key class (fail). Fixtures copy the gate into a temp tree and point `NODE_PATH` at the real `node_modules` so `js-yaml` resolves.
- Negative-tested by hand too: each of the four contract failures exits 1 naming the file, and the restored tree exits 0.

**Docs / receipts**

- `DEPLOY.md` - section 2 now describes the thin-caller + reusable-lane split and the sibling call shape (`uses: dhaupin/flowforge/.github/workflows/docs-build.yml@<ref>`).
- `MANIFEST.md` - new `docs-build.yml` row; `docs-deploy.yml` row rewritten as the thin caller; `check-birth-gate.cjs` row gains check 6; new `tests/birth-gate.test.cjs` row.
- `README.md` + `AGENTS.md` - workflow lines updated.
- `CHANGELOG.md` - Added entries (the reusable lane, the birth-gate test) + a Changed entry (the thin-caller refactor).

**Gates (all green on the branch)**

- `npm test` -> **36 pass / 0 fail** (was 29; +7 birth-gate tests).
- `npm run check` -> PASS (six compile checks + birth-gate 4 workflows/5 checks incl. the new reusable contract + theme-parity PASS).
- `npm run lint:docs` -> PASS.

**House rules**

- No version bump (per the user): `package.json` = `web/package.json` = 0.9.0, still equal.
- This closes issue #9 - the rig's docs lane is a versioned call, not a fourth drifted copy.
